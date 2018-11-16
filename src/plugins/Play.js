import Plugin from '../core/Plugin';

/**
 * 播放、暂停插件
 *
 * @class Play
 * @extends {Plugin}
 * @author zhenliang.sun
 */
export default class Play extends Plugin {
  constructor() {
    super();
    this._type = 'plugin_play';
  }

  init(opts = {}) {
    super.init(opts);
    // let a = new Object();
  }

  static get type() {
    return 'plugin_play';
  }
}