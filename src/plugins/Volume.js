import Plugin from '../core/Plugin';

/**
 * 声音插件
 *
 * @class Volume
 * @extends {Plugin}
 * @author zhenliang.sun
 */
export default class Volume extends Plugin {
  constructor() {
    super();
  }

  init(opts = {}) {
    super.init(opts);
  }

  static get type() {
    return 'plugin_volume';
  }
}