import Plugin from '../core/Plugin';

/**
 * 基础UI
 *
 * @export
 * @class UI
 * @extends {Plugin}
 * @author zhenliang.sun
 */
export default class UI extends Plugin {
  constructor() {
    super();
    this._allConfig = null;
  }

  init(opts = {}) {
    super.init(opts);
    this._allConfig = opts;
  }

  destroy() {
    super.destroy();
  }
}