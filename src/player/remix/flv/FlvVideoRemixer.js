import DataStore from '../../demux/flv/DataStore';
import Remixer from '../Remixer';
import Buffer from './../../fmp4/Buffer';
import {
  MediaSample,
  MediaSegment,
  MediaSegmentList
} from './MediaSegmentInfo';
import FLVMp4 from './FLVMp4';
// import FMP4 from './../../../xg/parse/remux/Fmp4';

/**
 * 视频混合器
 *
 * @export
 * @class FlvVideoRemixer
 * @extends {Remixer}
 * @author zhenliang.sun
 */
export default class FlvVideoRemixer extends Remixer {
  constructor() {
    super();
    this._dtsTimeBase = 0;
    this._videoNextDts = null;
    this._videoSegmentList = new MediaSegmentList('video');

    this.handleMediaFragment = () => {};
  }

  set dtsTimeBase(val) {
    this._dtsTimeBase = val;
  }

  get dtsTimeBase() {
    return this._dtsTimeBase;
  }

  remix(track) {
    let {
      videoMetaData
    } = DataStore.OBJ;

    if (!videoMetaData) {
      this.info('error', 'lost necessary video meta data!');
      return;
    }

    let {
      samples
    } = track;

    let dtsCorrection;
    let firstDts = -1;
    let lastDts = -1;
    let firstPts = -1;
    let lastPts = -1;

    if (!samples || !samples.length) {
      this.info('warn', 'not exist samples data in VideoTrack');
      return;
    }

    const mp4Samples = [];
    const mdatBox = {
      samples: []
    };

    const videoSegment = new MediaSegment();

    while (samples.length) {
      // 从头开始， 一个一个的解析
      let sample = samples.shift();
      const {
        isKeyframe,
        cps
      } = sample;
      sample.dts = this.dtsTimeBase;
      let dts = this.dtsTimeBase;

      if (dtsCorrection === undefined) {
        if (!this._videoNextDts) {
          if (this._videoSegmentList.isEmpty()) {
            dtsCorrection = 0;
          } else {
            const lastSegment = this._videoSegmentList.getLastSegmentBefore(dts);
            if (lastSegment) {
              // debugger;
            } else {
              dtsCorrection = 0;
            }
          }
        } else {
          dtsCorrection = dts - this._videoNextDts >= 1000 ? 0 : dts - this._videoNextDts;
        }
      }
      const originDts = dts;
      dts -= dtsCorrection;
      const pts = dts + cps;

      if (firstDts === -1) {
        firstDts = dts;
        firstPts = pts;
      }

      let _units = [];
      while (sample.units.length) {
        let mdatSample = {
          buffer: [],
          size: 0
        };

        const unit = sample.units.shift();
        _units.push(unit);
        mdatSample.buffer.push(unit);
        mdatSample.size += unit.data.byteLength;

        mdatBox.samples.push(mdatSample);
      }

      let sampleDuration = 0;
      if (samples.length) {
        const nextDts = samples[0].dts - this.dtsTimeBase - dtsCorrection;
        sampleDuration = nextDts - dts;
      } else {
        if (mp4Samples.length >= 1) {
          sampleDuration = mp4Samples[mp4Samples.length - 1].duration;
        } else {
          sampleDuration = videoMetaData.refSampleDuration;
        }
      }

      if (isKeyframe) {
        const rap = new MediaSample();
        rap.dts = dts;
        rap.pts = pts;
        rap.duration = sampleDuration;
        rap.originDts = sample.dts;
        rap.position = sample.position;
        rap.isRAP = true;

        videoSegment.addRAP(rap);
      }

      mp4Samples.push({
        dts,
        cps,
        pts,
        units: _units,
        size: sample.length,
        isKeyframe,
        duration: sampleDuration,
        originDts
      });
    }

    const first = mp4Samples[0];
    const last = mp4Samples[mp4Samples.length - 1];
    lastDts = last.dts + last.duration;
    lastPts = last.pts + last.duration;

    this._videoNextDts = lastDts;

    videoSegment.startDts = firstDts;
    videoSegment.endDts = lastDts;
    videoSegment.startPts = firstPts;
    videoSegment.endPts = lastPts;
    videoSegment.originStartDts = first.originDts;
    videoSegment.ori = last.originDts + last.duration;
    videoSegment.gap = dtsCorrection;

    const firstSample = new MediaSample();
    firstSample.dts = first.dts;
    firstSample.pts = first.pts;
    firstSample.duration = first.duration;
    firstSample.isKeyframe = first.isKeyframe;
    firstSample.originDts = first.originDts;

    const lastSample = new MediaSample();
    lastSample.dts = last.dts;
    lastSample.pts = last.pts;
    lastSample.duration = last.duration;
    lastSample.isKeyframe = last.isKeyframe;
    lastSample.originDts = last.originDts;

    videoSegment.firstSample = firstSample;
    videoSegment.lastSample = lastSample;

    let moofMdat = new Buffer();
    track.samples = mp4Samples;
    track.time = firstDts;

    // const moof = FMP4.moof(track);
    // const mdat = FMP4.mdat(mdatBox);
    const moof = FLVMp4.moof(track);
    const mdat = FLVMp4.mdat(mdatBox);
    moofMdat.write(moof, mdat);

    if (!DataStore.OBJ.isLive) {
      this._videoSegmentList.append(videoSegment);
    }

    track.samples = [];
    track.length = 0;

    this.handleMediaFragment({
      type: 'video',
      data: moofMdat.buffer.buffer,
      sampleCount: mp4Samples.length,
      fragment: videoSegment
    });
  }
}