import Plugin from '../core/Plugin';
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
    let video = self.player;

    ['video', 'controls'].forEach(item => {
      let keys = [32, 37, 38, 39, 40]; // 空格，左，上，右，下
      video[item].onkeydown = evt => {
        let e = evt || window.event;
        if (!e) {
          return;
        }

        // 接收键盘事件，派发获取焦点事件
        if (keys.includes(e.keyCode)) {
          video.emit('focus');
        }

        switch (e.keyCode) {
        case 32:
          // 播放、暂停
          video.isPaused() ? video.play() : video.pause();
          break;
        case 37:
          // 按左 减10秒
          video.currentTime -= 10;
          break;
        case 39:
          // 按右 增加10秒
          video.currentTime += 10;
          break;
        case 38:
          // 按上 声音增加10%
          video.volume += 0.1;
          break;
        case 40:
          // 按下 声音减少10%
          video.volume -= 0.1;
          break;
        default:
          Log.OBJ.error(`unrecognized keyCode: ${e.keyCode}`);
          break;
        }
      };
    });
  }

  static get type() {
    return 'plugin_keyboard';
  }
}