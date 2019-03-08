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
    // 停止当前的加载工作。准备切换线路
    this.networkControllers.forEach(component => {
      component.stopLoad();
    });
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