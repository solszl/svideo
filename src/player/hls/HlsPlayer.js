import Hls from './hls';
import Model from '../../core/Model';

/**
 *
 *
 * @export
 * @class HlsPlayer
 * @extends {Hls}
 * @author zhenliang.sun
 */
export default class HlsPlayer extends Hls {
  constructor(config = {}) {
    super(config);
  }

  get downloadSize() {
    return Model.OBJ.downloadSize;
  }

  get estimateNetSpeed() {
    return this.abrController.estimateNetSpeed;
  }

  set src(val) {
    super.src = val;
    this.loadSource(val);
    this.attachMedia(this.video);
    this.on(Hls.Events.MEDIA_ATTACHED, () => {
      // this.play();
    });
  }

  get src() {
    return super.src;
  }
}