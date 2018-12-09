import IllegalStateException from '../../../error/IllegalStateException';
import MediaInfo from './MediaInfo';

const private_data_store = Symbol('private_data_store');

/**
 * 数据中心，加载进来的chunk 存入相对应的tag中，存储一些公共数据
 *
 * @export
 * @class DataStore
 * @author zhenliang.sun
 */
export default class DataStore {
  constructor() {
    if (this[private_data_store]) {
      throw new IllegalStateException('DataStore should be a singleton Class');
    }
    this[private_data_store] = this;

    this._initData();
  }

  static get OBJ() {
    if (!this[private_data_store]) {
      this[private_data_store] = new DataStore();
    }

    return this[private_data_store];
  }

  clearTags() {
    this._tags = [];
  }

  /**
   * 判断当前系统的LittleEndian 还是 BigEndian
   *
   * @readonly
   * @memberof DataStore
   * @returns 返回系统是否是LittleEndian
   */
  get isLe() {
    return this._isLe;
  }

  /**
   * 是否是直播
   *
   * @readonly
   * @memberof DataStore
   * @returns 是否是直播
   */
  get isLive() {
    return this._isLive;
  }

  set isLive(val) {
    this._isLive = val;
  }

  set videoTrack(val) {
    this._videoTrack = val;
  }

  get videoTrack() {
    return this._videoTrack;
  }

  set audioTrack(val) {
    this._audioTrack = val;
  }

  get audioTrack() {
    return this._audioTrack;
  }

  get tags() {
    return this._tags;
  }

  get hasAudio() {
    return this._hasAudio;
  }

  set hasAudio(val) {
    this._hasAudio = val;
  }

  get hasVideo() {
    return this._hasVideo;
  }

  set hasVideo(val) {
    this._hasVideo = val;
  }

  get timestampBase() {
    return this._timestampBase;
  }

  set timestampBase(val) {
    this._timestampBase = val;
  }

  get metaData() {
    return this._metaData;
  }

  set metaData(val) {
    this._metaData = val;
  }

  get hasMetaData() {
    return this._metaData !== null;
  }

  get mediaInfo() {
    return this._mediaInfo;
  }

  set audioMetaData(val) {
    this._audioMetaData = val;
  }

  get audioMetaData() {
    return this._audioMetaData;
  }

  set videoMetaData(val) {
    this._videoMetaData = val;
  }

  get videoMetaData() {
    return this._videoMetaData;
  }

  get timeScale() {
    return this._timeScale;
  }

  set timeScale(val) {
    this._timeScale = val;
  }

  get duration() {
    return this._duration;
  }

  set duration(val) {
    this._duration = val;
  }

  get metaEndPosition() {
    return this._metaEndPosition;
  }

  set metaEndPosition(val) {
    this._metaEndPosition = val;
  }

  get naluLengthSize() {
    return this._naluLengthSize;
  }

  set naluLengthSize(val) {
    this._naluLengthSize = val;
  }

  get referFrameRate() {
    return this._referFrameRate;
  }

  set referFrameRate(val) {
    this._referFrameRate = val;
  }

  set audioInitialMetadataDispatched(val) {
    this._audioInitialMetadataDispatched = val;
  }

  set videoInitialMetadataDispatched(val) {
    this._videoInitialMetadataDispatched = val;
  }

  get hasInitialMetaDispatched() {
    // const {_hasAudio, _hasVideo, _hasAudioOverrode, _hasVideoOverrode}
    if (this._hasAudio && this._hasVideo) {
      return this._audioInitialMetadataDispatched && this._videoInitialMetadataDispatched;
    }

    if (this._hasAudio && !this._hasVideo) {
      return this._audioInitialMetadataDispatched;
    }

    if (!this._hasAudio && this.hasVideo) {
      return this._videoInitialMetadataDispatched;
    }

    return false;
  }

  _initData() {
    this._isLe = (function () {
      const buf = new ArrayBuffer(2);
      (new DataView(buf)).setInt16(0, 256, true); // little-endian write
      return (new Int16Array(buf))[0] === 256; // platform-spec read, if equal then LE
    })();

    this._isLive = false;

    this._hasAudio = false; // 是否有音频
    this._hasVideo = true; // 是否有视频
    this._hasAudioOverrode = false; // 是否强制解析音频包
    this._hasVideoOverrode = false; // 是否强制解析视频包，例如，当一个视频文件，该属性设置为false后，跳过视频包解析，当作音频来播放

    this._timestampBase = 0;

    this._tags = []; // 所有的tags 集合

    this._videoTrack = {
      id: 1,
      type: 'video',
      samples: [],
      length: 0
    };
    this._audioTrack = {
      id: 2,
      type: 'audio',
      samples: [],
      length: 0
    };

    this._videoMetaData = null; // 视频源数据
    this._audioMetaData = null; // 音频源数据
    this._metaData = null; // 是否有元标签数据 如：onMetaData
    this._hasMetaData = false;
    this._referFrameRate = {
      fixed: true,
      fps: 23.976,
      fpsNum: 23976,
      fpsDen: 1000
    },

    this._metaEndPosition = -1;

    this._timeScale = 1000;
    this._duration = 0;

    this._mediaInfo = new MediaInfo();

    this._naluLengthSize = 4;

    this._audioInitialMetadataDispatched = false;
    this._videoInitialMetadataDispatched = false;
  }
}