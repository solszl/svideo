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

  get estimateNetSpeed() {
    let speed = this.statisticsInfo ? this.statisticsInfo.speed : 500;
    return speed;
  }

  get downloadSize() {
    return Model.OBJ.downloadSize;
  }

  set src(val) {
    super.src = val;
  }

  get src() {
    return super.src;
  }
}