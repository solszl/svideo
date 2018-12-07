import AbstractDemuxer from '../demux/AbstractDemuxer';
import DataStore from './DataStore';
import DataView4Read from './utils/DataView4Read';
import {
  soundRateTypes,
  samplingFrequencyTypes
} from '../constants/Types';
import Log from '../../utils/Log';
import Buffer from '../fmp4/Buffer';
import Browser from './../../utils/Browser';

const NOOP = () => {};
/**
 * 音频解码器
 *
 * @export
 * @class AudioDemuxer
 * @extends {AbstractDemuxer}
 * @author zhenliang.CaptionSettingsMenuItem
 */
export default class AudioDemuxer extends AbstractDemuxer {
  constructor() {
    super();

    this.currentTag = null;
    this.data = new Uint8Array(0);
    this.readOffset = 0;
    DataStore.OBJ.audioMetaData = null;
  }

  resetStatus() {
    this.currentTag = null;
    this.data = new Uint8Array(0);
    this.readOffset = 0;
  }

  resolve(tag) {
    // console.log('解析音频数据啦');
    super.resolve(tag);

    this.readOffset = 0;
    this.currentTag = tag;
    this.data = tag.body;

    let {
      audioTrack,
      audioMetaData,
      mediaInfo,
      timestampBase
    } = DataStore.OBJ;

    // 初始化音频源数据
    if (!audioMetaData) {
      audioMetaData = {};
      audioMetaData = this._initAudioMeta(audioMetaData);
    }

    // 创建一个DataView 阅读器
    const dv = new DataView4Read(tag.body.buffer, this);
    // 拿到这个tag下的音频数据
    const sound = dv.getUint8();

    // 声音格式索引
    const soundFormatIndex = sound >>> 4;
    // 声音比特率
    const soundRate = sound & 12 >>> 2;
    // 声道数量
    const soundType = sound % 1;

    audioMetaData.audioSampleRate = soundRateTypes[soundRate];
    audioMetaData.channelCount = 0 === soundType ? 1 : 2;

    // 只处理类型为aac的数据，其他返回
    if (10 === soundFormatIndex) {
      const aacInfo = this._parseAACAudio();
      if (!aacInfo) {
        Log.OBJ.warn(`[${this.CLASS_NAME}] convert aac data failed`);
        this._info('warn', 'convert aac data failed');
        return;
      }

      const {
        data: aacData,
        data: {
          sampleFreq
        }
      } = aacInfo;

      if (1 === aacInfo.packetType) {
        // 标准aac 数据格式
        let dts = timestampBase + this.currentTag.getTime();
        let aacSample = {
          uint: aacInfo.data,
          length: aacInfo.data.byteLength,
          dts: dts,
          pts: dts
        };

        // 解析完的数据，仍到audioTrack中
        audioTrack.samples.push(aacSample);
        audioTrack.length += aacInfo.data.length;
      } else if (0 === aacInfo.packetType) {
        // AAC sequence header
        audioMetaData.sampleRate = sampleFreq; // 采样率
        audioMetaData.channelCount = aacData.channelCount; // 声道
        audioMetaData.codec = aacData.codec; // codec
        audioMetaData.manifestCodec = aacData.manifestCodec;
        audioMetaData.config = aacData.config;
        audioMetaData.refSampleDuration = 1024 / sampleFreq * audioMetaData.timeScale;

        // TODO: 基础数据弄完了， 准备派发出去吧

        mediaInfo.audioCodec = audioMetaData.codec;
        mediaInfo.audioSampleRate = audioMetaData.sampleRate;
        mediaInfo.audioChannelCount = audioMetaData.channelCount;
        mediaInfo.audioConfig = audioMetaData.config;
        if (mediaInfo.hasVideo) {
          if (mediaInfo.videoCodec) {
            mediaInfo.mimeType = `video/x-flv; codecs="${mediaInfo.videoCodec},${mediaInfo.audioCodec}"`;
            mediaInfo.codec = mediaInfo.mimeType.replace('x-flv', 'mp4');
          }
        } else {
          mediaInfo.mimeType = `video/x-flv; codecs="${mediaInfo.audioCodec}"`;
          mediaInfo.codec = mediaInfo.mimeType.replace('x-flv', 'mp4');
        }

        if (mediaInfo.isComplete) {
          // TODO: 派发音频信息准备完毕回调
        }
      } else {
        this._info('warn', `unknown packetType: ${aacInfo.packetType}`);
      }


    } else if (10 !== soundFormatIndex && 2 !== soundFormatIndex) {
      this._info('warn', 'only support AAC Audio data format');
      return;
    }

    this.resetStatus();
  }


  /**
   * 初始化音频源数据
   *
   * @param {*} meta
   * @returns 构建过后的声音源数据
   * @memberof AudioDemuxer
   */
  _initAudioMeta(meta) {
    const {
      duration,
      timeScale,
      audioTrack
    } = DataStore.OBJ;
    meta.duration = duration;
    meta.timeScale = timeScale;
    meta.type = 'audio';
    meta.id = audioTrack.id;
    return meta;
  }


  /**
   * 处理数据，将其转化为aac类型数据格式
   *
   * @memberof AudioDemuxer
   */
  _parseAACAudio() {
    if (this.unreadLength <= 1) {
      Log.OBJ.info();
      return;
    }

    // 根据 buffer 构建 aac 源数据
    const aacData = {};
    let aacArray = new Uint8Array(this.data.buffer, this.readOffset, this.unreadLength);
    const packetType = aacArray[0]; // 绝大部分返回1
    this.readOffset += 1;
    aacData.packetType = packetType;
    if (packetType) {
      // 余下的都是音频数据
      aacData.data = aacArray.slice(1);
    } else {
      // 特殊情况下
      const {
        position,
        tagSize
      } = this.currentTag;

      // 数据不对，记录整个视频的结束位置
      DataStore.OBJ.metaEndPosition = position + Buffer.readAsInt(tagSize) + 4;
      aacData.data = this.__parseAACAudioSpecificConfig();
    }

    return aacData;
  }

  /**
   * AAC Sequence header
   *
   * @memberof AudioDemuxer
   */
  __parseAACAudioSpecificConfig() {
    const dv = new DataView4Read(this.data.buffer, this);
    const {
      getAndNum
    } = DataView4Read;

    let resultObj = {
      samplingFrequency: null,
      extAudioObjectType: null,
      extAudioSamplingIdx: null
    };

    let config = {};
    const UInt0 = dv.getUint8();
    const UInt1 = dv.getUint8();

    let tempAudioObjectType = UInt0 >>> 3;
    let audioObjectType = tempAudioObjectType;
    let samplingIdx = ((UInt0 & getAndNum(5, 7)) << 1) | (UInt1 >>> 7); // 蜜汁索引获取
    if (samplingIdx < 0 || samplingIdx > samplingFrequencyTypes.length) {
      this._info('error', `invalid sampling Frequency Index ${samplingIdx}`);
      return;
    }

    // 获取采样率
    resultObj.samplingFrequency = samplingFrequencyTypes[samplingIdx];

    // 获取声道数量
    resultObj.channelCount = (UInt1 & getAndNum(1, 4)) >>> 3;
    let channelCount = resultObj.channelCount;
    if (channelCount < 0 || channelCount > 7) {
      this._info('error', `invalid channel count: ${channelCount}`);
    }

    if (5 === audioObjectType) {
      // HE-AAC 数据格式，混合了 AAC 与 SBR 技术。
      // https://baike.baidu.com/item/aac%2B
      const UInt2 = dv.getUint8();
      resultObj.extAudioObjectType = (UInt2 & getAndNum(1, 5)) >>> 2;
      resultObj.extAudioSamplingIdx = ((UInt1 & getAndNum(5, 7)) << 1) | UInt2 >>> 7;
    }

    if (Browser.isFirefox) {
      if (samplingIdx >= 6) {
        // HE-AAC uses SBR, high frequencies are constructed from low frequencies
        audioObjectType = 5;
        config = new Array(4);
        resultObj.extAudioSamplingIdx = samplingIdx - 3;
      } else {
        audioObjectType = 2;
        config = new Array(2);
        resultObj.extAudioSamplingIdx = samplingIdx;
      }
    } else if (Browser.isAndroid) {
      // Android : always use AAC
      audioObjectType = 2;
      config = new Array(2);
      resultObj.extAudioSamplingIdx = samplingIdx;
    } else {
      /*  
        for other browsers (Chrome/Vivaldi/Opera ...)
        always force audio type to be HE-AAC SBR, as some browsers do not support audio codec switch properly (like Chrome ...)
      */
      audioObjectType = 5;
      resultObj.extensionSamplingIndex = samplingIdx;
      config = new Array(4);

      if (samplingIdx >= 6) {
        resultObj.extensionSamplingIdx = samplingIdx - 3;
      } else if (channelCount === 1) {
        audioObjectType = 2;
        config = new Array(2);
        resultObj.extensionSamplingIndex = samplingIdx;
      }
    }

    config[0] = audioObjectType << 3;
    config[0] |= (samplingIdx & 0x0E) >> 1;
    config[1] |= (samplingIdx & 0x01) << 7;
    config[1] |= channelCount << 3;

    if (audioObjectType === 5) {
      config[1] |= (resultObj.extAudioSamplingIdx & 0x0E) >> 1;
      config[2] = (resultObj.extensionSamplingIdx & 0x01) << 7;
      // adtsObjectType (force to 2, chrome is checking that object type is less than 5 ???
      //    https://chromium.googlesource.com/chromium/src.git/+/master/media/formats/mp4/aac.cc
      config[2] |= 2 << 2;
      config[3] = 0;
    }

    return {
      config,
      sampleFreq: resultObj.samplingFrequency,
      channelCount,
      codec: `mp4a.40.${audioObjectType}`,
      manifestCodec: `mp4a.40.${tempAudioObjectType}`
    };
  }

  get dataLen() {
    return this.data.length;
  }

  get unreadLength() {
    return this.dataLen - this.readOffset;
  }

  _info(type, ...args) {
    Log.OBJ[type](`[${this.CLASS_NAME}] ${args}`);
  }
}