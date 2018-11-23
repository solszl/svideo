import Plugin from '../core/Plugin';
import {
  debounce
} from '../utils/util';
import Log from './../utils/Log';

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

  init(opts = {}) {
    super.init(opts);
    let self = this;
    let p = this.player;
    document.addEventListener('keydown', debounce(evt => {
      let keys = [32, 37, 38, 39, 40]; // 空格，左，上，右，下
      let e = evt || window.event;
      if (!e && e.target !== this.player) {
        return;
      }

      // 接收键盘事件，派发获取焦点事件
      if (!keys.includes(e.keyCode)) {
        return;
      }
      self.emit('focus');
      switch (e.keyCode) {
      case 32:
        // 播放、暂停
        p.isPaused ? p.play() : p.pause();
        console.log(p.isPaused);
        break;
      case 37:
        // 按左 减10秒
        p.currentTime -= 10;
        break;
      case 39:
        // 按右 增加10秒
        p.currentTime += 10;
        break;
      case 38:
        // 按上 声音增加5%
        p.volume += 0.05;
        break;
      case 40:
        // 按下 声音减少5%
        p.volume -= 0.05;
        break;
      default:
        Log.OBJ.error(`unrecognized keyCode: ${e.keyCode}`);
        break;
      }
    }, 500));
  }

  static get type() {
    return 'plugin_keyboard';
  }
}