import AbstractDemuxer from './../demux/AbstractDemuxer';
import MetaDemuxer from './MetaDemuxer';
import VideoDemuxer from './VideoDemuxer';
import AudioDemuxer from './AudioDemuxer';
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
}