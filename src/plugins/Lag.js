import Plugin from '../core/Plugin';

/**
 * 卡顿上报插件
 *
 * @export
 * @class Lag
 * @extends {Plugin}
 * @author zhenliang.sun
 */
export default class Lag extends Plugin {
  constructor() {
    super();
  }

  init(opts = {}) {
    super.init(opts);
  }

  destroy() {
    super.destroy();
  }

  static get type() {
    return 'plugin_lag';
  }
}