import Plugin from '../core/Plugin';

/**
 * 日志上报插件
 *
 * @export
 * @class LogReporter
 * @extends {Plugin}
 * @author zhenliang.sun
 */
export default class Reporter extends Plugin {
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
    return 'plugin_reporter';
  }
}