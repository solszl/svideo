import AbstractDemuxer from './../demux/AbstractDemuxer';
import MetaDemuxer from './MetaDemuxer';
import VideoDemuxer from './VideoDemuxer';
import AudioDemuxer from './AudioDemuxer';
import Log from '../../utils/Log';
import DataStore from './DataStore';
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
  }

  destroy() {
    super.destroy();
    this._metaDemuxer = null;
    this._videoDemuxer = null;
    this._audioDemuxer = null;
  }

  resolveTags() {
    // 从数据中心中，拿到未解析的所有的tag
    let tags = DataStore.OBJ.tags;
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
    this._metaDemuxer.resolve(tag);
  }
}