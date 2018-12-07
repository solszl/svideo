/**
 * 媒体信息
 *
 * @export
 * @class MediaInfo
 * @author zhenliang.sun
 */
export default class MediaInfo {
  constructor() {
    this.mimeType = null;
    this.codec = '';
    this.duration = null;
    this.hasAudio = false;
    this.hasVideo = false;
    this.audioCodec = null;
    this.videoCodec = null;

    this.videoDataRate = null;
    this.audioDataRate = null;
    this.audioSampleRate = null;
    this.audioChannelCount = null;
    this.audioConfig = null;

    this.width = null;
    this.height = null;
    this.fps = null;
    this.profile = null;
    this.level = null;
    this.chromaFormat = null;

    this.pixelRatio = [];

    this._metaData = null;
    this.segments = [];
    this.hasKeyframes = null;
    this.keyframes = [];
  }

  get isComplete() {
    const {
      mimeType,
      duration,
      hasKeyframes
    } = this;

    return mimeType !== null &&
      duration !== null &&
      hasKeyframes !== null &&
      this.isVideoInfoFilled &&
      this.isAudioInfoFilled;
  }

  get isAudioInfoFilled() {
    const {
      hasAudio,
      audioCodec,
      audioSampleRate,
      audioChannelCount,
    } = this;

    return !!(!hasAudio || (hasAudio && audioCodec && audioSampleRate && audioChannelCount));
  }

  get isVideoInfoFilled() {
    const notNullFields = [
      'videoCodec',
      'width',
      'height',
      'fps',
      'profile',
      'level',
      'chromaFormat',
    ];
    for (let i = 0, len = notNullFields.length; i < len; i++) {
      if (this[notNullFields[i]] === null) {
        return false;
      }
    }

    return this.hasVideo;
  }
}