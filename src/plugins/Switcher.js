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
 * @author zhenliang.sun
 */
export default class Switcher extends Plugin {
  constructor() {
    super();
    this._allDefList = null;
    // 当前清晰度
    this._currentDef = null;
    // 当前清晰度列表
    this._currentDefList = null;
    this._currentDefListIndex = -1;

    this._changeLineTimeout = 0;
    this._lagChain = null; // 卡顿切换责任链
    this._pollingDefs = [];
  }

  init(opts = {}) {
    super.init(opts);
    this._allConfig = opts;

    this._handleCareEvent();
  }

  destroy() {
    super.destroy();
    this.player.off('lagreport', this.__lag);
    this.player.off('lagrecover', this.__lagRecover);
    this.player.off('connectError', this.__connectError);
    this.player.off('schedulerCompleted', this.__schedulerCompleted);
    clearTimeout(this._changeLineTimeout);
    this._allDefList = null;
    this._currentDef = null;
    this._currentDefList = null;
    this._currentDefListIndex = -1;
    this._pollingDefs = [];
  }

  static get type() {
    return 'plugin_switcher';
  }

  _handleCareEvent() {
    // 调度完成
    this.player.on('schedulerCompleted', this.__schedulerCompleted.bind(this));
    // 卡顿
    this.player.on('lagreport', this.__lag.bind(this));
    // 卡顿恢复
    this.player.on('lagrecover', this.__lagRecover.bind(this));
    // 连接失败
    this.player.on('connectError', this.__connectError.bind(this));
  }

  __lag(e) {
    // 卡顿后开始计时，超过多久过后启动换线流程
    this.info('info', '开始卡了, 开始计时，准备卡顿切线');
    this._changeLineTimeout = clearTimeout(this._changeLineTimeout);
    const threshold = this._allConfig.switchLineThreshold * 1000;
    setTimeout(this.__changeLine.bind(this), threshold);
  }

  __lagRecover(e) {
    this._changeLineTimeout = clearTimeout(this._changeLineTimeout);
  }

  __connectError(e) {
    this._changeLineTimeout = clearTimeout(this._changeLineTimeout);
    const threshold = this._allConfig.switchLineThreshold * 1000;
    setTimeout(this.__changeLine.bind(this), threshold);
  }

  __schedulerCompleted() {
    this.info('info', '卡顿切换策略--->build');
    this._allDefList = this.player.allDefinitionList;
    this._currentDef = this.player.currentDefinition;
    this._currentDefList = this.player.currentDefinitionList;
    this._currentDefListIndex = this.player.currentDefinitionListIndex;

    this._lagChain = new ChainSame(this.player);

    let nodeSame = this._lagChain;
    let node720p = new Chain720p(this.player);
    let node480p = new Chain480p(this.player);
    let node360p = new Chain360p(this.player, () => {
      this._pollingDefs = [];
    });

    nodeSame.setNext(node720p).setNext(node480p).setNext(node360p).setNext(nodeSame);
    this.info('info', '卡顿切换策略--->build complete');
  }

  __changeLine() {
    // 如果清晰度列表为空的话，玩蛋去！
    if (this._currentDefList === null || this._currentDefList.length === 0) {
      this.info('error', 'no available definition list');
      return;
    }

    // change def
    let def = this._changeDef();
    if (!def) {
      this.info('error', 'no available definition');
      return;
    }

    const token = this.player.newToken;
    this.info('info', `当前播放${def.def},已经轮询了：${this._pollingDefs}`);
    this.info('info', `URL: ${def.url}`);
    this.info('info', `Token: ${token}`);
    let url = `${def.url}?token=${token}`;
    this.player.src = url;
    this.player.play();
  }

  _changeDef() {
    // def = {idx:index, url: "", line:"线路1", def:'same'}
    // 如果默认清晰度开始卡了，通过卡顿责任链，以原画，720，480，360的顺序进行找，如果找到360了，还是不行，就换线，如果没线了，就从原画重新轮询
    this.info('info', '卡顿， 开始换清晰度');
    return this._lagChain.execute(this._pollingDefs);
  }
}