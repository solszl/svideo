import AbstractDemuxer from '../AbstractDemuxer';
import MetaDemuxer from './MetaDemuxer';
// import VideoDemuxer from './VideoDemuxer';
import VideoDemuxer from './VideoDemuxer2';
import AudioDemuxer from './AudioDemuxer';
import DataStore from './DataStore';
import fields from '../../constants/MetaFields';

const NOOP = () => {};
/**
 * FLV 数据中的标签解析器
 *
 * @export
 * @class TagDemuxer
 * @extends {AbstractDemuxer}
 * @author zhenliang.sun
 */
export default class TagDemuxer extends AbstractDemuxer {
  constructor() {
    super();

    this._metaDemuxer = new MetaDemuxer();
    // this._videoDemuxer = new VideoDemuxer();
    this._videoDemuxer = new VideoDemuxer();

    this._audioDemuxer = new AudioDemuxer();

    this.handleMediaInfoReady = NOOP;
    this.handleDataReady = NOOP;
    this.handleMetaDataReady = NOOP;
  }

  bindEvents() {
    this._videoDemuxer.handleMediaInfoReady = this.handleMediaInfoReady.bind(this);
    this._videoDemuxer.handleDataReady = this.handleDataReady.bind(this);
    this._videoDemuxer.handleMetaDataReady = this.handleMetaDataReady.bind(this);

    this._audioDemuxer.handleMediaInfoReady = this.handleMediaInfoReady.bind(this);
    this._audioDemuxer.handleDataReady = this.handleDataReady.bind(this);
    this._audioDemuxer.handleMetaDataReady = this.handleMetaDataReady.bind(this);
  }

  unbindEvents() {

  }

  destroy() {
    super.destroy();
    this._metaDemuxer = null;
    this._videoDemuxer = null;
    this._audioDemuxer = null;
  }

  resolveTags(tags) {
    // 未解析的所有的tag
    tags.forEach(tag => {
      this.resolveTag(tag);
    });

    let {
      hasInitialMetaDispatched,
      audioTrack,
      videoTrack
    } = DataStore.OBJ;

    if (hasInitialMetaDispatched) {
      if (audioTrack.length || videoTrack.length) {
        // let at = audioTrack.time;
        // let vt = videoTrack.time;
        // console.log({
        //   at,
        //   vt
        // });
        this.handleDataReady(audioTrack, videoTrack);
      }
    }

    DataStore.OBJ.clearTags();
  }

  resolveTag(tag) {
    let tagType = String(tag.tagType);
    switch (tagType) {
    case '8':
      this._resolveAudioTag(tag);
      break;
    case '9':
      this._resolveVideoTag(tag);
      break;
    case '18':
      this._resolveMetaTag(tag);
      break;
    default:
      this.info('info', `ignore type:${tagType}`);
      break;
    }
  }

  _resolveAudioTag(tag) {
    this._audioDemuxer.resolve(tag);
  }

  _resolveVideoTag(tag) {
    this._videoDemuxer.resolve(tag);
  }

  _resolveMetaTag(tag) {
    let {
      body
    } = tag;
    let metaObj = this._metaDemuxer.resolve(body, body.length);
    this.__initMetaData(metaObj);
  }

  __initMetaData(metaData) {
    // {onMetaData:null}
    if (Object.prototype.hasOwnProperty.call(metaData, 'onMetaData')) {
      if (DataStore.OBJ.hasMetaData) {
        this.info('warn', 'exist another meta tag');
      }

      DataStore.OBJ.metaData = metaData;
      // 解析onMetaData 函数
      const onMetaData = metaData.onMetaData;

      if (onMetaData) {
        fields.forEach(field => {
          const {
            name,
            type,
            parser,
            onTypeErr
          } = field;
          if (Object(onMetaData[name]) instanceof type) {
            parser.call(this, DataStore.OBJ, onMetaData);
          } else {
            if (onTypeErr && onTypeErr instanceof Function) {
              onTypeErr(DataStore.OBJ, onMetaData);
            }
          }
        });
      }

      let mediaInfo = DataStore.OBJ.mediaInfo;
      mediaInfo._metaData = metaData;

      if (mediaInfo.isComplete) {
        this.handleMediaInfoReady(mediaInfo);
      }
    }
  }

  __parseKeyframes(keyframes) {
    let times = [];
    let filePositions = [];
    const {
      timestampBase,
      timeScale
    } = DataStore.OBJ;
    for (let i = 0; i < keyframes.times.length; i += 1) {
      times[times.length] = timestampBase + Math.floor(keyframes.times[i] * timeScale);
      filePositions[filePositions.length] = keyframes.filepositions[i];
    }

    return {
      times,
      filePositions
    };
  }
}