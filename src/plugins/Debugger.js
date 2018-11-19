import Plugin from '../core/Plugin';

/**
 * debugger 插件
 *
 * @class Debugger
 * @extends {Plugin}
 * @author zhenliang.sun
 */
export default class Debugger extends Plugin {
  constructor() {
    super();
    this._show = false;
  }

  init(opts = {}) {
    super.init(opts);
    let self = this;
    let video = self.player;

    self.player.__proto__.toggleDebugger = this.toggleDebugger.bind(this);
    self.player.__proto__.showDebugger = this.showDebugger.bind(this);
    self.player.__proto__.hideDebugger = this.hideDebugger.bind(this);

    // 根据配置信息，构建UI
    this.buildUI();
    this.on('debuggerStateChanged', state => {
      console.log(state);
    });
  }

  buildUI() {

  }

  /**
   * 设置显隐 debugger 弹窗
   *
   * @memberof Debugger
   */
  toggleDebugger() {
    this._show = !this._show;
    this.emit('debuggerStateChanged', this._show);
  }

  /**
   * 显示弹窗
   *
   * @memberof Debugger
   */
  showDebugger() {
    this._show = true;
    this.emit('debuggerStateChanged', this._show);
  }

  /**
   * 隐藏弹窗
   *
   * @memberof Debugger
   */
  hideDebugger() {
    this._show = false;
    this.emit('debuggerStateChanged', this._show);
  }

  static get type() {
    return 'plugin_debugger';
  }
}