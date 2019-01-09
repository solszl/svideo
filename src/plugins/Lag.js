import Plugin from '../core/Plugin';

/**
 * 卡顿上报插件
 *
 * @export
 * @class Lag
 * @extends {Plugin}
 * @author zhenliang.sun
 */
export default class Lag extends Plugin {
  constructor() {
    super();
    this._readyStateChecking = false;
    this._readyStateInterval = 0;
    this._lastLagTime = 0;
  }

  init(opts = {}) {
    super.init(opts);
    this._handleCareEvent();
  }

  destroy() {
    super.destroy();

    this._readyStateChecking = false;
    this._lastLagTime = 0;
    clearInterval(this._readyStateInterval);
    this.player.off('play', this.__play);
    this.player.off('pause', this.__pause);
    this.player.off('waiting', this.__waiting);
    this.player.off('ended', this.__ended);
    this.player.off('lag', this.__lag);
  }

  static get type() {
    return 'plugin_lag';
  }

  _handleCareEvent() {
    this.player.on('play', this.__play.bind(this));
    this.player.on('pause', this.__pause.bind(this));
    this.player.on('waiting', this.__waiting.bind(this));
    this.player.on('ended', this.__ended.bind(this));
    // 由各个播放模块内抛出来的lag事件
    this.player.on('lag', this.__lag.bind(this));
  }

  __play(e) {
    this.__checkReadyState();
  }
  __pause(e) {
    this.__stopCheckReadyState();
  }
  __waiting(e) {
    // waiting事件，据说在手机H5上不好使？！
    this.__checkReadyState();
  }
  __ended(e) {
    this.__stopCheckReadyState();
  }
  __lag(e) {
    this.__checkReadyState();
  }


  __checkReadyState() {
    if (this._readyStateChecking) {
      return;
    }

    this._readyStateChecking = true;
    let self = this;
    clearInterval(this._readyStateInterval);
    // 每400ms检测一下 状态，如果为2的持续时间超过4秒，汇报一次卡顿
    this._readyStateInterval = setInterval(() => {
      if (self.player.readyState === 2) {
        // 如果是不可播放状态且未记录时间，记录卡顿的开始时间
        if (this._lastLagTime === 0) {
          this._lastLagTime = Date.now();
        }

        // 如果大于4秒， 汇报卡顿， 重置卡顿开始时间
        let elapsed = Date.now() - this._lastLagTime;
        if (elapsed > 4000) {
          this.player.emit('lagreport');
          this._lastLagTime = 0;
        }

      } else if (self.player.readyState === 4) {

        // 如果当前播放状态可用且卡顿开始时间不为0，发送卡顿恢复
        if (this._lastLagTime !== 0) {
          let elapsed = Date.now() - this._lastLagTime;
          this._lastLagTime = 0;
          this.player.emit('lagrecover', elapsed);
        }

      } else {
        // doesn't care
      }
    }, 400);
  }

  __stopCheckReadyState() {
    this._readyStateChecking = false;
    clearInterval(this._readyStateInterval);
  }
}