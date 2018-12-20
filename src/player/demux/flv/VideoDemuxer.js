import AbstractDemuxer from '../AbstractDemuxer';
import DataStore from './DataStore';
import DataView4Read from './utils/DataView4Read';
import SPSParser from './SPSParser';
import Buffer from '../../fmp4/Buffer';

const NOOP = () => {};
/**
 * 视频数据解析器
 *
 * @export
 * @class VideoDemuxer
 * @extends {AbstractDemuxer}
 * @author zhenliang.sun
 */
export default class VideoDemuxer extends AbstractDemuxer {
  constructor() {
    super();

    this.currentTag = null;
    this.data = new Uint8Array(0);
    this.readOffset = 0;

    DataStore.OBJ.videoMetaData = null;

    this.handleMediaInfoReady = NOOP;
    this.handleDataReady = NOOP;
    this.handleMetaDataReady = NOOP;
  }

  reset() {
    this.currentTag = null;
    this.data = new Uint8Array(0);
    this.readOffset = 0;
  }

  resolve(tag) {
    super.resolve(tag);

    this.data = tag.body;
    this.currentTag = tag;

    const firstUI8 = this.readData(1)[0];
    const frameType = (firstUI8 & 0xF0) >>> 4;
    const codecId = firstUI8 & 0x0F;

    /** 1: JPEG 2: H263 3: Screen video  5: On2 VP6  6: Screen videoversion 2  7: AVC */
    if (7 !== codecId) {
      this.info('warn', `unsupported codecId ${codecId}`);
      return;
    }

    // 解析AVC 数据包
    this._parseAVCPacket(frameType);

    this.reset();
  }

  readData(num) {
    const {
      data,
      readOffset
    } = this;

    if (this.dataLength > readOffset + num) {
      this.readOffset += num;
      return data.slice(readOffset, num);
    }

    return [];
  }

  /**
   * tag body 长度
   *
   * @readonly
   * @memberof VideoDemuxer
   * @returns tag.body.length
   */
  get dataLength() {
    return this.data.length;
  }

  /**
   * 返回该tag中，未读取的长度
   *
   * @readonly
   * @memberof VideoDemuxer
   * @returns tag.body.length - readOffset
   */
  get unreadLength() {
    return this.data.length - this.readOffset;
  }


  // #region private methods
  _parseAVCPacket(frameType) {
    if (4 > this.unreadLength) {
      this.info('error', `Invalid Avc Tag, unreadLength: ${this.unreadLength}`);
    }

    const {
      buffer
    } = this.data;

    const dv = new DataView(buffer, this.readOffset, this.unreadLength);
    const packetType = dv.getUint8(0);

    let cpsTime = dv.getUint32(0, !this.isLE) & 0x00FFFFFF;
    cpsTime = (cpsTime << 8) >> 8;
    this.readOffset += 4;
    switch (packetType) {
    case 0:
    {
      const {
        position,
        tagSize
      } = this.currentTag;
      DataStore.OBJ.metaEndPosition = position + Buffer.readAsInt(tagSize) + 4;
      this.__parseAVCDecoderConfigurationRecord();
      break;
    }
    case 1:
      this.__parseAVCVideoData(frameType, cpsTime);
      break;
    case 2:
      break;
    default:
      this.info('warn', `unknown packetType: ${packetType}`);
      break;
    }
  }

  __parseAVCDecoderConfigurationRecord() {
    if (this.unreadLength < 7) {
      this.info('error', `not enough data for parse avc decoder configuration record, unreadLength:${this.unreadLength}`);
      return;
    }

    let {
      mediaInfo,
      videoMetaData,
      videoTrack,
      audioTrack,
      timeScale,
      duration,
      naluLengthSize
    } = DataStore.OBJ;

    const dv = new DataView4Read(this.data.buffer, this);
    if (videoMetaData) {
      if (videoMetaData.avcc !== undefined) {
        this.info('error', 'more than one AVCDecoderConfigurationRecord');
        return;
      }
    } else {
      // 需要处理覆盖写入 是否有视频的情况
      DataStore.OBJ.hasVideo = true;
      mediaInfo.hasVideo = true;
      videoMetaData = {};
      videoMetaData.type = 'video';
      videoMetaData.id = videoTrack.id;
      videoMetaData.timeScale = timeScale;
      videoMetaData.duration = duration;
      mediaInfo.timeScale = timeScale;
    }

    const version = dv.getUint8();
    const avcProfile = dv.getUint8();
    dv.getUint8();
    dv.getUint8();

    if (1 !== version || 0 === avcProfile) {
      this.info('error', `invalid version or avcProfile. ver:${version} avcProfile:${avcProfile}`);
      return;
    }

    naluLengthSize = dv.getUint(2, this.readOffset, false) + 1;
    if (3 !== naluLengthSize && 4 !== naluLengthSize) {
      this.info('error', `invalid naluLengthSize, size:${naluLengthSize}`);
      return;
    }

    // 获取sps长度
    const spsLength = dv.getUint(5, null, false);
    if (0 === spsLength) {
      this.info('error', 'no sps');
      return;
    }

    if (spsLength > 1) {
      this.info('warn', `sps count bigger than 1. count:${spsLength}`);
    }

    let sps;
    for (let i = 0; i < spsLength; i += 1) {
      const len = dv.getUint16();
      if (0 === len)
        continue;
      sps = new Uint8Array(this.data.buffer, this.readOffset, len);
      this.readOffset += len;

      const spsConfig = SPSParser.parseSPS(sps);

      if (0 !== i) {
        continue;
      }

      const {
        codecSize,
        presentSize,
        profileString,
        levelString,
        chromaFormat,
        pixelRatio,
        frameRate,
        refFrames,
        bitDepth
      } = spsConfig;

      videoMetaData.width = codecSize.width;
      videoMetaData.height = codecSize.height;
      videoMetaData.presentWidth = presentSize.width;
      videoMetaData.presentHeight = presentSize.height;

      videoMetaData.profile = profileString;
      videoMetaData.level = levelString;

      videoMetaData.bitDepth = bitDepth;
      videoMetaData.chromaFormat = chromaFormat;
      videoMetaData.pixelRatio = pixelRatio;
      videoMetaData.frameRate = frameRate;

      if (!frameRate.fixed || frameRate.fpsNum === 0 || frameRate.fpsDen === 0) {
        videoMetaData.frameRate = DataStore.OBJ.referFrameRate;
      }

      let {
        fpsDen,
        fpsNum
      } = videoMetaData.frameRate;
      videoMetaData.refSampleDuration = videoMetaData.timeScale * fpsDen / fpsNum;

      let codecArr = sps.subarray(1, 4);
      let codecStr = 'avc1.';

      for (let i = 0; i < 3; i += 1) {
        let hex = codecArr[i].toString(16).padStart(2, '0');
        codecStr += hex;
      }

      videoMetaData.codec = codecStr;

      mediaInfo.width = videoMetaData.width;
      mediaInfo.height = videoMetaData.height;
      mediaInfo.fps = videoMetaData.frameRate.fps;
      mediaInfo.profile = videoMetaData.profile;
      mediaInfo.level = videoMetaData.level;
      mediaInfo.refFrames = refFrames;
      mediaInfo.pixelRatio = pixelRatio;
      mediaInfo.videoCodec = codecStr;
      mediaInfo.chromaFormat = chromaFormat;
      if (mediaInfo.hasAudio) {
        if (mediaInfo.audioCodec) {
          mediaInfo.mimeType = `video/x-flv; codecs="${mediaInfo.videoCodec},${mediaInfo.audioCodec}"`;
          mediaInfo.codec = mediaInfo.mimeType.replace('x-flv', 'mp4');
        }
      } else {
        mediaInfo.mimeType = `video/x-flv; codecs="${mediaInfo.videoCodec}"`;
        mediaInfo.codec = mediaInfo.mimeType.replace('x-flv', 'mp4');
      }
    }

    // PPS
    const ppsCount = dv.getUint8();
    if (!ppsCount) {
      this.info('error', 'no pps exist in video');
      return;
    } else if (ppsCount > 1) {
      this.info('warn', ` pps count more than 1, count:${ppsCount}`);
    }

    let pps;
    for (let i = 0; i < ppsCount; i += 1) {
      let ppsSize = dv.getUint16();
      if (!ppsSize)
        continue;

      pps = new Uint8Array(this.data.buffer, this.readOffset, ppsSize);
      this.readOffset += ppsSize;
    }

    videoMetaData.sps = sps;
    videoMetaData.pps = pps;
    mediaInfo.sps = sps;
    mediaInfo.pps = pps;

    if (mediaInfo.isComplete) {
      this.handleMediaInfoReady(mediaInfo);
    }

    if (DataStore.OBJ.hasInitialMetaDispatched) {
      if (videoTrack.length || audioTrack.length) {
        this.handleDataReady(videoTrack, audioTrack);
      }
    } else {
      DataStore.OBJ.videoInitialMetadataDispatched = true;
    }

    this.handleMetaDataReady('video', videoMetaData);
  }

  /**
   * 解析tag数据，将其扔到 DataStore 中的videoTrack中，后续在 MP4Remixer 中对其进行编码
   *
   * @param {*} type
   * @param {*} cpsTime
   * @memberof VideoDemuxer
   */
  __parseAVCVideoData(frameType, cpsTime) {
    let dv = new DataView4Read(this.data.buffer, this);

    let naluLengthSize = DataStore.OBJ.naluLengthSize;
    let naluList = [];
    let dataLen = 0;
    let ts = DataStore.OBJ.timestampBase + this.currentTag.getTime();
    let isKeyframe = 1 === frameType;
    while (this.unreadLength > 0) {
      if (this.unreadLength < 4) {
        this.info('error', `not enough data for parsing AVC, left data: ${this.unreadLength}`);
        break;
      }
      const tempReadOffset = this.readOffset;
      let naluSize = naluLengthSize === 4 ? dv.getUint32() : dv.getUint24();
      if (naluSize > this.unreadLength) {
        // this.info('warn', `naluSize(${naluSize}) bigger than unreadLength(${this.unreadLength})`);
        break;
      }

      let unitType = dv.getUint(5, this.readOffset, false);
      if (5 === unitType) {
        isKeyframe = true;
      }

      // 不停的往naluList 中塞数据
      let data = new Uint8Array(this.data.buffer, tempReadOffset, naluSize + naluLengthSize);
      this.readOffset = tempReadOffset + naluLengthSize + naluSize;
      const naluUnit = {
        type: unitType,
        data
      };

      naluList.push(naluUnit);
      dataLen += data.byteLength;
    }

    dv = null;
    // 如果有数据的话，开始构建数据塞到videoTrack中
    if (naluList.length) {
      let videoTrack = DataStore.OBJ.videoTrack;
      const videoSample = {
        units: naluList,
        length: dataLen,
        dts: ts,
        cps: cpsTime,
        pts: (ts + cpsTime),
        isKeyframe,
        position: isKeyframe ? this.currentTag.position : undefined
      };

      videoTrack.samples.push(videoSample);
      videoTrack.length += dataLen;
    }
  }
  // #endregion
}