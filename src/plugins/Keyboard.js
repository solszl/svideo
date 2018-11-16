import Plugin from '../core/Plugin';

/**
 * 键盘控制插件
 *
 * @export
 * @class Keyboard
 * @extends {Plugin}
 * @author zhenliang.sun
 */
export default class Keyboard extends Plugin {
  constructor() {
    super();
  }

  static get type() {
    return 'plugin_keyboard';
  }
}