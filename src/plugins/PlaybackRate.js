import Plugin from '../core/Plugin';

/**
 * 倍速播放插件
 *
 * @export
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
    this._allConfig = opts;
    let rateList = this._allConfig.rateList || [0.5, 1, 1.5, 2];
    let p = this.player;
    Object.defineProperty(this.player, 'playbackRateList', {
      get: function () {
        return rateList;
      },
      set: function (newValue) {
        rateList = newValue;
        p.emit('playbackratelistchange');
      }
    });
  }

  static get type() {
    return 'plugin_playbackrate';
  }
}