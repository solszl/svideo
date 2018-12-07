import AbstractDemuxer from './../demux/AbstractDemuxer';
import MetaDemuxer from './MetaDemuxer';
import VideoDemuxer from './VideoDemuxer';
import AudioDemuxer from './AudioDemuxer';
import Log from '../../utils/Log';
import DataStore from './DataStore';
import fields from './../constants/MetaFields';

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
    this._videoDemuxer = new VideoDemuxer();
    this._audioDemuxer = new AudioDemuxer();

    this.handleMediaInfoReady = NOOP;
    this.handleDataReady = NOOP;
    this.handleMetaDataReady = NOOP;
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

    // TODO: 解析数据过后，把数据吐回去
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
      Log.OBJ.info(`ignore type:${tagType}`);
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
    this.__initMetaDta(metaObj);
  }

  __initMetaDta(metaData) {
    // {onMetaData:null}
    if (Object.prototype.hasOwnProperty.call(metaData, 'onMetaData')) {
      if (DataStore.OBJ.hasMetaData) {
        Log.OBJ.warn('exist another meta tag');
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
}