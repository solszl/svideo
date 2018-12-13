import Remixer from '../Remixer';
import DataStore from './../../demux/flv/DataStore';
import Browser from './../../../utils/Browser';
import Buffer from './../../fmp4/Buffer';
import {
  MediaSegmentList,
  MediaSegment,
  MediaSample
} from './MediaSegmentInfo';
import FLVMp4 from './FLVMp4';

/**
 * 声音混流器 
 *
 * @export
 * @class FlvAudioRemixer
 * @extends {Remixer}
 * @author zhenliang.sun
 */
export default class FlvAudioRemixer extends Remixer {
  constructor() {
    super();
    this._dtsTimeBase = 0;
    this._audioNextDts = null;
    this._audioSegmentList = new MediaSegmentList('audio');
    this._videoSegmentList = null;

    this.handleMediaFragment = () => {};
  }

  set dtsTimeBase(val) {
    this._dtsTimeBase = val;
  }

  get dtsTimeBase() {
    return this._dtsTimeBase;
  }

  set videoSegmentList(val) {
    this._videoSegmentList = val;
  }

  remix(track) {
    let {
      audioMetaData
    } = DataStore.OBJ;

    if (!audioMetaData) {
      this.info('error', 'lost necessary audio meta data!');
      return;
    }

    let {
      samples
    } = track; // audioTrack

    let dtsCorrection; // 修正dts， gap

    let firstDts = -1;
    let lastDts = -1;

    let silentDuration;
    let mp4Samples = [];

    if (!samples || !samples.length) {
      this.info('warn', 'not exist samples data in AudioTrack');
      return;
    }
    const mdatBox = {
      samples: []
    };

    let isFirstDtsInitialed = false;
    while (samples.length) {
      // 从头开始， 一个一个的解析
      let sample = samples.shift();
      // sample structure: uint, length, dts, pts
      const {
        unit
      } = sample;

      let dts = sample.dts - this.dtsTimeBase;
      let needSilentFrame = false; // 是否需要添加静音帧标识
      if (dtsCorrection === undefined) {
        if (!this._audioNextDts) {
          if (this._audioSegmentList.isEmpty()) {
            dtsCorrection = 0;
          } else {
            // TODO: 找 segment 计算 dtsCorrection， 卧槽。 这代码干的。真蛋疼
            const lastSegment = this._audioSegmentList.getLastSegmentBefore(dts);
            if (lastSegment) {
              // debugger;
            } else {
              needSilentFrame = Browser.browserName === 'ie' && !!(this._videoSegmentList && this._videoSegmentList.isEmpty());
              dtsCorrection = 0;
            }
          }
        } else {
          dtsCorrection = dts - this._audioNextDts >= 1000 ? 0 : dts - this._audioNextDts;
        }
      }

      const originDts = dts;
      dts -= dtsCorrection;

      // 需要补静音帧的话  需要计算静音多久
      if (needSilentFrame && this._videoSegmentList) {
        const videoSegment = this._videoSegmentList.getLastSampleBefore(originDts);
        if (videoSegment && videoSegment.startDts < dts) {
          silentDuration = dts - videoSegment.startDts;
          dts = videoSegment.startDts;
        } else {
          needSilentFrame = false;
        }
      }

      if (!isFirstDtsInitialed) {
        firstDts = dts;
        isFirstDtsInitialed = true;
      }

      if (needSilentFrame) {
        samples.unshift(sample); // 把刚才取出来获取各种参数的sample再扔回去
        let {
          mdatSample,
          mp4Sample
        } = this._makeSilentFrameSample(dts, silentDuration);
        mp4Samples.push(mp4Sample);
        mdatBox.samples.push(mdatSample);
        continue;
      }

      let sampleDuration = 0;
      if (samples.length >= 1) {
        const nextDts = samples[0].dts - this.dtsTimeBase - dtsCorrection;
        sampleDuration = nextDts - dts;
      } else {
        if (mp4Samples.length >= 1) { // use second last sample duration
          sampleDuration = mp4Samples[mp4Samples.length - 1].duration;
        } else { // the only one sample, use reference sample duration
          sampleDuration = audioMetaData.refSampleDuration;
        }
      }

      let {
        mdatSample,
        mp4Sample
      } = this._makeNormalFrameSample(dts, unit, sampleDuration, originDts);
      mdatBox.samples.push(mdatSample);
      mp4Samples.push(mp4Sample);
    }

    const last = mp4Samples[mp4Samples.length - 1];
    lastDts = last.dts + last.duration;

    this._audioNextDts = lastDts;

    const audioSegment = new MediaSegment();
    audioSegment.startDts = firstDts;
    audioSegment.endDts = lastDts;
    audioSegment.startPts = firstDts;
    audioSegment.endPts = lastDts;
    audioSegment.originDts = mp4Samples[0].originDts;
    audioSegment.originEndDts = last.originDts + last.duration;
    audioSegment.gap = dtsCorrection;

    let firstSample = new MediaSample();
    firstSample.dts = mp4Samples[0].dts;
    firstSample.pts = mp4Samples[0].pts;
    firstSample.duration = mp4Samples[0].duration;
    firstSample.originDts = mp4Samples[0].originDts;
    audioSegment.firstSample = firstSample;

    let lastSample = new MediaSample();
    lastSample.dts = last.dts;
    lastSample.pts = last.pts;
    lastSample.duration = last.duration;
    lastSample.originDts = last.originDts;
    audioSegment.lastSample = lastSample;

    track.samples = mp4Samples;
    const moofMdat = new Buffer();
    track.time = firstDts;
    const moof = FLVMp4.moof(track);
    const mdat = FLVMp4.mdat(mdatBox);
    moofMdat.write(moof, mdat);

    if (!DataStore.OBJ.isLive) {
      this._audioSegmentList.append(audioSegment);
    }

    track.samples = [];
    track.length = 0;

    this.handleMediaFragment({
      type: 'audio',
      data: moofMdat.buffer.buffer,
      sampleCount: mp4Samples.length,
      fragment: audioSegment
    });
  }

  _makeNormalFrameSample(dts, unit, duration, originDts) {
    const mp4Sample = {
      dts,
      pts: dts,
      cts: 0,
      size: unit.byteLength,
      duration,
      originDts
    };

    let mdatSample = {
      buffer: [],
      size: 0
    };

    mdatSample.buffer.push({
      data: unit
    });
    mdatSample.size += unit.byteLength;

    return {
      mdatSample,
      mp4Sample
    };
  }


  _makeSilentFrameSample(dts, duration) {
    let {
      channelCount
    } = DataStore.OBJ.audioMetaData;

    const unit = this.__AACFrame(channelCount);
    const mp4Sample = {
      dts,
      pts: dts,
      cts: 0,
      size: unit.byteLength,
      duration,
      originDts: dts
    };

    let mdatSample = {
      buffer: [],
      size: 0
    };

    mdatSample.buffer.push({
      data: unit
    });
    mdatSample.size += unit.byteLength;

    return {
      mdatSample,
      mp4Sample
    };
  }

  __AACFrame(channelCount) {
    if (channelCount === 1) {
      return new Uint8Array([0x00, 0xc8, 0x00, 0x80, 0x23, 0x80]);
    } else if (channelCount === 2) {
      return new Uint8Array([0x21, 0x00, 0x49, 0x90, 0x02, 0x19, 0x00, 0x23, 0x80]);
    } else if (channelCount === 3) {
      return new Uint8Array([0x00, 0xc8, 0x00, 0x80, 0x20, 0x84, 0x01, 0x26, 0x40, 0x08, 0x64, 0x00, 0x8e]);
    } else if (channelCount === 4) {
      return new Uint8Array([0x00, 0xc8, 0x00, 0x80, 0x20, 0x84, 0x01, 0x26, 0x40, 0x08, 0x64, 0x00, 0x80, 0x2c, 0x80, 0x08, 0x02, 0x38]);
    } else if (channelCount === 5) {
      return new Uint8Array([0x00, 0xc8, 0x00, 0x80, 0x20, 0x84, 0x01, 0x26, 0x40, 0x08, 0x64, 0x00, 0x82, 0x30, 0x04, 0x99, 0x00, 0x21, 0x90, 0x02, 0x38]);
    } else if (channelCount === 6) {
      return new Uint8Array([0x00, 0xc8, 0x00, 0x80, 0x20, 0x84, 0x01, 0x26, 0x40, 0x08, 0x64, 0x00, 0x82, 0x30, 0x04, 0x99, 0x00, 0x21, 0x90, 0x02, 0x00, 0xb2, 0x00, 0x20, 0x08, 0xe0]);
    }
    return null;
  }
}