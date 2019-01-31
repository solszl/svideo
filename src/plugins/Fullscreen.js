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
    let self = this;

    // 定义显示状态属性
    Object.defineProperty(this.player, 'displayState', {
      get() {
        return self._displayState || 'normal';
      },
      set(v) {
        self._displayState = v;
      },
      configurable: true
    });

    // 定义是否全屏属性
    Object.defineProperty(this.player, 'isFullscreen', {
      get() {
        return self.isFullscreen;
      },
      configurable: true
    });

    // 注册进入全屏功能
    this.player.__proto__.enterFullscreen = this.enterFullscreen.bind(this);
    // 注册离开全屏功能
    this.player.__proto__.exitFullscreen = this.exitFullscreen.bind(this);

    // 监听全屏变化
    ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(item => {
      document.addEventListener(item, e => {
        // console.log(document.webkitFullscreenElement, e.target);
        this._fullscreenTarget = e.target;
        self._displayState = this.isFullscreen === true ? 'fullscreen' : 'normal';
        self.player.emit('fullscreenchanged', self._displayState);
      });
    });
  }

  /**
   * 进入全屏
   *
   * @memberof Fullscreen
   */
  enterFullscreen() {
    // H5下 全屏 el 需要为video？
    let el = document.getElementById('video-wrapper');
    if (el.webkitEnterFullScreen) {
      el.webkitEnterFullScreen();
    } else if (el.mozRequestFullScreen) {
      el.mozRequestFullScreen();
    } else if (el.requestFullscreen) {
      el.requestFullscreen();
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    } else if (el.msRequestFullscreen) {
      el.msRequestFullscreen();
    } else {
      console.log('enter fullscreen???');
    }
    this.player.displayState = 'fullscreen';
  }

  /**
   * 离开全屏
   *
   * @memberof Fullscreen
   */
  exitFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    } else {
      console.log('exit fullscreen???');
    }
    this.player.displayState = 'normal';
  }

  destroy() {
    super.destroy();
    delete this.player.displayState;
    delete this.player.isFullscreen;
  }

  /**
   * 是否是全屏
   *
   * @readonly
   * @memberof Fullscreen
   * @returns 根据 document 的 fullscreen 属性判断当前是否处于全屏状态
   */
  get isFullscreen() {
    return document.fullscreen ||
      document.webkitIsFullScreen ||
      document.mozFullScreen ||
      false;
  }

  /**
   * 如果当前正全屏， 返回全屏元素
   *
   * @readonly
   * @memberof Fullscreen
   * @returns 返回全屏元素
   */
  get fullscreenElement() {
    return document.fullscreenElement ||
      document.webkitCurrentFullScreenElement ||
      document.mozFullScreenElement ||
      this._fullscreenTarget ||
      null;
  }

  static get type() {
    return 'plugin_fullscreen';
  }
}