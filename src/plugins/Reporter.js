import qs from 'qs';
import Model from '../core/Model';
import Plugin from '../core/Plugin';

const Code = {
  /** 开始 */
  Start: 92001,
  /** 停止 */
  End: 92002,
  /** 心跳 */
  HeartBeat: 92003,
  /** 卡顿 */
  Lag: 94001
};

const HEARTBEAT_INTERVAL = 60 * 1000;

const API = 'login';

/**
 * 日志上报插件
 *
 * @export
 * @class Reporter
 * @extends {Plugin}
 * @author zhenliang.sun
 */
export default class Reporter extends Plugin {
  constructor() {
    super();
    /** 心跳计时器 */
    this._heartbeatInterval = 0;
    this._lagCount = 0;
    this.el = null; // 用来记录各种url的
    this._tt = Date.now();
    this.basicInfo = {};
    this.enable = true;
    this._xhr = new XMLHttpRequest();
  }

  init(opts = {}) {
    super.init(opts);
    this._allConfig = opts;
    this._config = opts[Reporter.type];
    let reporterCfg = JSON.parse(this._config);
    this._domain = reporterCfg.url;
    // 竟然需要这么多数据，还只是基础数据 真是醉了
    this.basicInfo = {};
    this.basicInfo.pf = 3,
    this.basicInfo.ua = navigator.userAgent;
    this.basicInfo.p = reporterCfg.webinar_id;
    this.basicInfo.aid = reporterCfg.webinar_id;
    this.basicInfo.uid = reporterCfg.uid;
    this.basicInfo.s = reporterCfg.session_id;
    this.basicInfo.vid = reporterCfg.vid;
    this.basicInfo.vfid = reporterCfg.vfid;
    this.basicInfo.ndi = reporterCfg.ndi;
    this.basicInfo.guid = reporterCfg.guid;
    this.basicInfo.vtype = reporterCfg.vtype;
    this.basicInfo.topic = reporterCfg.topic;
    this.basicInfo.app_id = reporterCfg.app_id;
    this.basicInfo.biz_role = reporterCfg.biz_role;
    this.basicInfo.flow_type = reporterCfg.flow_type;
    this.basicInfo.biz_id = reporterCfg.biz_id;
    this.basicInfo.biz_des01 = reporterCfg.biz_des01;
    this.basicInfo.bu = reporterCfg.bu;

    this.enable = reporterCfg.enable === undefined ? true : reporterCfg.enable;

    // 创建xhr 以及绑定超时和错误事件
    this._buildRocket();
    this._handleCareEvent();
    this.start();
  }

  destroy() {
    super.destroy();
    clearInterval(this._heartbeatInterval);
    this._lagCount = 0;
    this.el = null;
    if (this._xhr) {
      this._xhr.ontimeout = null;
      this._xhr.onerror = null;
      this._xhr = null;
    }

    this.player.off('play', this.__play);
    this.player.off('pause', this.__pause);
    this.player.off('waiting', this.__waiting);
    this.player.off('ended', this.__ended);
    this.player.off('lagreport', this.__lag);
    this.player.off('lagrecover', this.__lagRecover);
  }

  static get type() {
    return 'plugin_reporter';
  }

  start() {
    if (this.running) {
      return;
    }
    this.info('info', '启动日志上报');
    this.running = true;
    clearInterval(this._heartbeatInterval);
    this._heartbeatInterval = setInterval(this._heartbeat.bind(this), HEARTBEAT_INTERVAL);
  }

  stop() {
    this.info('info', '停止日志上报');
    clearInterval(this._heartbeatInterval);
    this.running = false;
  }

  fire(code, obj) {
    let url = '';
    let p = window.location.protocol;
    Object.assign(obj, this.basicInfo);
    let token = btoa(JSON.stringify(obj));
    let param = {
      k: code,
      id: Date.now(),
      s: this.basicInfo.s,
      bu: this.basicInfo.bu,
      token: token
    };

    let queryString = qs.stringify(param);
    url = `${p}${this._domain}/${API}?${queryString}`;
    let xhr = this._xhr;
    xhr.open('GET', url);
    if (this.enable) {
      // xhr.send();
    }

    this.info('info', JSON.stringify(param));
    this.info('info', url);
  }

  _buildRocket() {
    if (!this._xhr) {
      this._xhr = new XMLHttpRequest();
    }

    let xhr = this._xhr;
    xhr.timeout = 5000;
    xhr.onerror = e =>
      this.info('error', `could not report, code:${e.code}, msg: ${e.message}`);
    xhr.ontimeout = e =>
      this.info('error', `report timeout, code:${e.code}`);
  }

  _handleCareEvent() {
    this.player.on('play', this.__play.bind(this));
    this.player.on('pause', this.__pause.bind(this));
    this.player.on('waiting', this.__waiting.bind(this));
    this.player.on('ended', this.__ended.bind(this));
    this.player.on('lagreport', this.__lag.bind(this));
    this.player.on('lagrecover', this.__lagRecover.bind(this));
  }

  _heartbeat() {
    let obj = {
      tt: 0,
      _bc: this._lagCount,
      _bt: 0,
      sd: this.getURLInfo().hostname
    };
    // 派发心跳汇报
    this.fire(Code.HeartBeat, obj);
    // 如果有卡顿次数， 发送卡顿汇报
    if (this._lagCount > 0) {
      this.fire(Code.Lag, obj);
      this._lagCount = 0;
    }
  }

  __play(e) {
    console.log('from reporter, play');
    if (!this.running) {
      this.start();
    }
    this._tt = Date.now();
    let obj = {
      sd: this.getURLInfo().hostname
    };
    this.fire(Code.Start, obj);
  }

  __pause(e) {
    console.log('from reporter, pause');
    let obj = {
      sd: this.getURLInfo().hostname,
      tt: Date.now() - this._tt,
      _bc: this._lagCount
    };
    this.fire(Code.End, obj);
  }

  __waiting(e) {

  }

  __ended(e) {
    // 播放完毕的时候，就不在进行心跳了
    this.stop();
  }

  __lag(e) {
    this._lagCount += 1;

    this.info('info', `接收到卡顿时间，开始计数，当前卡顿数量${this._lagCount}`);
  }

  __lagRecover(t) {
    this.info('info', `卡顿恢复了，消耗了${t}ms`);
  }

  /**
   * 返回Location对象
   *
   * @memberof Reporter
   * @returns Location 对象
   */
  getURLInfo() {
    let url = Model.OBJ.url;
    if (!this.el) {
      this.el = document.createElement('a');
    }
    let el = this.el;
    el.href = url;
    return el;
  }
}