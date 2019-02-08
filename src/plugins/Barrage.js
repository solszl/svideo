import Plugin from '../core/Plugin';

/**
 * 弹幕插件
 *
 * @export
 * @class Barrage
 * @extends {Plugin}
 * @author zhenliang.sun
 */
export default class Barrage extends Plugin {
  constructor() {
    super();
    this._allConfig = null;
  }

  init(opts = {}) {
    super.init(opts);
    this._allConfig = opts;
  }

  static get type() {
    return 'plugin_barrage';
  }

  destroy() {
    super.destroy();
  }
}