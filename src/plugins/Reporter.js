import qs from 'qs';
import Model from '../core/Model';
import Plugin from '../core/Plugin';

const LIVE_CODE = {
  Start: 102001,
  Info: 102002,
  HeartBeat: 102003,
  Error: 104001
};
const VOD_CODE = {
  /** 初始化完成 */
  Start: 92001,
  Pause: 92002,
  /** 心跳 */
  HeartBeat: 92003,
  Resume: 92004,
  Info: 92005,
  /** 卡顿 */
  Lag: 94001
};

const INFO_PACK_INTERVAL = 30 * 1000;

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
    this._infoPackInterval = 0;
    this._lagCount = 0;
    this.el = null; // 用来记录各种url的
    this._bt = 0; // 卡顿时长
    this.basicInfo = {};
    this.enable = true;
    this._xhr = new XMLHttpRequest();
    this._infoPackCount = 0; // 24小时直播需要发 60*60*24/30
    this._lastDownloadSize = 0;

    this._lastPlayTimeInfo = Date.now();
    this._lastPlayTimeHeartbeat = Date.now();
    this._playInfoDuration = 0;
    this._playHeartbeatDuration = 0;
  }

  init(opts = {}) {
    super.init(opts);
    this._allConfig = opts;
    this._config = opts[Reporter.type];
    let reporterCfg = JSON.parse(this._config);
    this._domain = reporterCfg.url;
    // 竟然需要这么多数据，还只是基础数据 真是醉了
    this.basicInfo = {};
    this.basicInfo.pf = 7,
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
    this.basicInfo.ver = this.player.version;
    this.basicInfo.tf = 0;

    this.enable = reporterCfg.enable === undefined ? true : reporterCfg.enable;

    // 创建xhr 以及绑定超时和错误事件
    this._buildRocket();
    this._handleCareEvent();
    // this.start();
  }

  destroy() {
    super.destroy();
    clearInterval(this._infoPackInterval);
    this._lagCount = 0;
    this._infoPackCount = 0;
    this._lastDownloadSize = 0;
    this._infoPackCount = 0;
    this._lastPlayTimeInfo = 0;
    this._lastPlayTimeHeartbeat = 0;
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
    this.player.off('ready', this.__ready);
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
    this._lastPlayTimeInfo = Date.now();
    this._lastPlayTimeHeartbeat = Date.now();
    clearInterval(this._infoPackInterval);
    this._infoPackInterval = setInterval(this._infoPack.bind(this), INFO_PACK_INTERVAL);
  }

  stop() {
    this.info('info', '停止日志上报');
    clearInterval(this._infoPackInterval);
    this.running = false;
  }

  fire(code, obj) {
    if (!this._xhr) {
      this._buildRocket();
    }
    let url = '';
    let p = window.location.protocol;

    // 下载量
    this.basicInfo.tf = this.player.downloadSize - this._lastDownloadSize;
    this._lastDownloadSize = this.player.downloadSize;
    // 播放地址
    this.basicInfo.sd = this.getURLInfo().hostname;
    this.basicInfo.fd = this.getURLInfo().pathname;
    // 卡顿时长
    this.basicInfo.bt = this._bt;
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
    url = `${p}${this._domain}?${queryString}`;
    let xhr = this._xhr;
    xhr.open('GET', url);
    if (this.enable) {
      this.info('info', '日志参数列表:' + JSON.stringify(param));
      this.info('info', '日志url:' + url);
      xhr.send();
      this.player.emit('report', url);
    } else {
      this.info('info', `日志上报配置文件[enable:false],不进行日志上报, code:${code}`);
      this.info('info', `${JSON.stringify(obj)}`)
    }

    this.basicInfo.bt = 0;
    this._bt = 0;
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
    this.player.once('ready', this.__ready.bind(this));
  }

  _infoPack() {
    let obj = {
      bc: this._lagCount,
      bt: this._bt
    };

    // 信息报每隔30秒派发一个
    // 心跳包每分钟派发一个
    if (this._infoPackCount & 1) {
      obj.tt = this._playHeartbeatDuration + Date.now() - this._lastPlayTimeHeartbeat;
      if (this.isLive) {
        this.fire(LIVE_CODE.HeartBeat, obj);
      } else {
        this.fire(VOD_CODE.HeartBeat, obj);
        // 如果有卡顿次数， 发送卡顿汇报
        if (this._lagCount > 0) {
          this.fire(VOD_CODE.Lag, obj);
          this._lagCount = 0;
        }
      }
    }

    if (this.isLive) {
      obj.si = '';
      // 根据直播状态， 如果当前可播放， 那么上报2002 否则上报4001
      obj.errCode = this.player.readyState == 4 ? 2002 : 4001;
      obj.tt = this._playInfoDuration + Date.now() - this._lastPlayTimeHeartbeat;
      this.fire(LIVE_CODE.Info, obj);
    } else {
      obj.tt = this._playInfoDuration + Date.now() - this._lastPlayTimeHeartbeat;
      this.fire(VOD_CODE.Info, obj);
    }

    this._infoPackCount += 1;
    this._playHeartbeatDuration = 0;
    this._playInfoDuration = 0;
    this._lastPlayTimeHeartbeat = Date.now();
    this._lastPlayTimeInfo = Date.now();
  }

  __play(e) {
    if (!this.running) {
      this.start();
    }

    this._playInfoDuration += Date.now() - this._lastPlayTimeInfo;
    this._playHeartbeatDuration += Date.now() - this._lastPlayTimeHeartbeat;
    if (!this.isLive) {
      this.fire(VOD_CODE.Resume, {});
    }
  }

  __pause(e) {
    this._playInfoDuration += Date.now() - this._lastPlayTimeInfo;
    this._playHeartbeatDuration += Date.now() - this._lastPlayTimeHeartbeat;
    this._lastPlayTimeInfo = Date.now();
    this._lastPlayTimeHeartbeat = Date.now();

    if (!this.isLive) {
      this.fire(VOD_CODE.Pause, obj);
    }

    if (this.running) {
      this.stop();
    }
  }

  __waiting(e) {
    this._lastPlayTimeInfo = Date.now();
    this._lastPlayTimeHeartbeat = Date.now();
  }

  __ended(e) {
    // 播放完毕的时候，就不在进行心跳了
    this.stop();
  }

  __lag(e) {
    this._lagCount += 1;
    this._lastPlayTimeInfo = Date.now();
    this._lastPlayTimeHeartbeat = Date.now();
    this.info('info', `接收到卡顿时间，开始计数，当前卡顿数量${this._lagCount}`);
  }

  __lagRecover(t) {
    this.info('info', `卡顿恢复了，消耗了${t}ms`);
    this._bt = t;
    this._lastPlayTimeInfo = Date.now();
    this._lastPlayTimeHeartbeat = Date.now();
  }

  __ready() {
    // 播放器初始化完成
    let code = this.isLive ? LIVE_CODE.Start : VOD_CODE.Start;
    this.fire(code, {});
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

  get isLive() {
    return this._allConfig.isLive;
  }
}