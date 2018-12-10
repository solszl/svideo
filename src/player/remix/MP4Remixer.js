import Remixer from './Remixer';
import {
  MediaSegmentList
} from './flv/MediaSegmentInfo';
import FlvVideoRemixer from './flv/FlvVideoRemixer';
import FlvAudioRemixer from './flv/FlvAudioRemixer';
/**
 * MP4 混流器
 *
 * @export
 * @class MP4Remixer
 * @extends {Remixer}
 */
export default class MP4Remixer extends Remixer {
  constructor() {
    super();

    this._dtsBase = 0;
    this._isDtsBaseInitialed = false;

    this._audioRemixer = new FlvAudioRemixer();
    this._audioMeta = null;
    this._audioNextDts = null;
    this._audioSegmentList = new MediaSegmentList('audio');

    this._videoRemixer = new FlvVideoRemixer();
    this._videoMeta = null;
    this._videoNextDts = null;
    this._videoSegmentList = new MediaSegmentList('video');

  }

  remix(audioTrack, videoTrack) {
    if (!this._isDtsBaseInitialed) {
      this._calcDtsBase(audioTrack, videoTrack);
      this._isDtsBaseInitialed = true;
    }

    this._videoRemixer.remix(videoTrack);
    this._audioRemixer.remix(audioTrack);
  }

  onMetaDataReady(type, meta) {
    this[`_${type}Meta`] = meta;
  }

  onMediaInfoReady(mediaInfo) {}
  /**
   * 计算基础DTS时间
   *
   * @param {*} audioTrack
   * @param {*} videoTrack
   * @memberof MP4Remixer
   */
  _calcDtsBase(audioTrack, videoTrack) {
    let audioBase = Infinity;
    let videoBase = Infinity;

    if (audioTrack.samples && audioTrack.samples.length) {
      audioBase = audioTrack.samples[0].dts;
    }

    if (videoTrack.samples && videoTrack.samples.length) {
      videoBase = videoTrack.samples[0].dts;
    }

    this._dtsBase = Math.min(audioBase, videoBase);
  }
}