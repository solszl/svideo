import Plugin from '../core/Plugin';

/**
 * 播放倍速插件
 *
 * @class PlaybackRate
 * @extends {Plugin}
 * @author zhenliang.sun
 */
export default class PlaybackRate extends Plugin {
  constructor() {
    super();
  }

  init(opts = {}) {
    super.init(opts);

    let self = this;

    // 给player 添加倍速播放属性
    Object.defineProperty(this.player, 'playbackRate', {
      configurable: true,
      get() {
        return self.player.video.playbackRate || 1;
      },
      set(v) {
        self.player.video.playbackRate = v;
      }
    });
  }

  destroy() {
    super.destroy();
    delete this.player.playbackRate;
  }

  static get type() {
    return 'plugin_playbackRate';
  }
}