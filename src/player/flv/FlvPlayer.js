import Flv from './flv';
import Model from '../../core/Model';

/**
 *
 *
 * @export
 * @class FlvPlayer
 * @extends {Flv}
 * @author zhenliang.sun
 */
export default class FlvPlayer extends Flv {
  constructor(mediaDataSource, config) {
    super(mediaDataSource, config);
  }

  get mediaDataSource() {
    return this._mediaDataSource;
  }

  updateMediaDataSource() {
    this.detachMediaElement(this.video);
    this.unload()
    this.attachMediaElement(this.video);
    this.load();
  }

  get estimateNetSpeed() {
    let speed = this.statisticsInfo ? this.statisticsInfo.speed : 500;
    return speed;
  }

  get downloadSize() {
    return Model.OBJ.downloadSize;
  }

  set src(val) {
    super.src = val;
    this.mediaDataSource.url = val;
    this.updateMediaDataSource();
  }

  get src() {
    return super.src;
  }

  destroy() {
    super.destroy();
    this.unload();
    this.detachMediaElement();
  }
}