import Plugin from '../core/Plugin';
import {
  ChainSame,
  Chain720p,
  Chain480p,
  Chain360p
} from './switcher/Chain';
/**
 * 切线业务逻辑
 *
 * @export
 * @class Switcher
 * @extends {Plugin}
 */
export default class Switcher extends Plugin {
  constructor() {
    super();
    // 当前清晰度
    this._currentDef = null;
    // 当前清晰度列表
    this._currentDefList = null;
  }

  init(opts = {}) {
    super.init(opts);

    Object.defineProperties(this.player, {
      currentDefinition: {
        value: this._currentDef,
        writeable: false,
        enumerable: true
      },
      currentDefinitionList: {
        value: this._currentDefList,
        writeable: false,
        enumerable: true
      }
    });

    this._handleCareEvent();
  }

  destroy() {
    super.destroy();
    this.player.off('lagreport', this.__lag);
    this.player.off('lagrecover', this.__lagRecover);
  }

  static get type() {
    return 'plugin_switcher';
  }

  _handleCareEvent() {
    // 卡顿
    this.player.on('lagreport', this.__lag.bind(this));
    // 卡顿恢复
    this.player.on('lagrecover', this.__lagRecover.bind(this));
    // 连接失败
  }

  __lag(e) {
    // 卡顿后开始计时，超过多久过后启动换线流程
    console.log('开始卡了');

    let nodeSame = new ChainSame();
    let node720p = new Chain720p();
    let node480p = new Chain480p();
    let node360p = new Chain360p();
    nodeSame.setNext(node720p).setNext(node480p).setNext(node360p);

    nodeSame.execute(null);
  }

  __lagRecover(e) {

  }
}