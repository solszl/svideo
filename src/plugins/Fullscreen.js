import Plugin from '../core/Plugin';

/**
 * 全屏插件插件
 *
 * @class Fullscreen
 * @extends {Plugin}
 * @author zhenliang.sun
 */
export default class Fullscreen extends Plugin {
  constructor() {
    super();
  }

  init(opts = {}) {
    super.init(opts);
  }

  static get type() {
    return 'plugin_fullscreen';
  }
}