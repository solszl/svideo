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
  }

  static get type() {
    return 'plugin_playbackRate';
  }
}