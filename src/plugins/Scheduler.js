import crc32 from 'crc-32';
import qs from 'qs';
import Plugin from '../core/Plugin';

const LIVE_API = 'api/dispatch_play';
const VOD_API = 'api/dispatch_replay';

/**
 * 点直播播放调度
 *
 * @export
 * @class Scheduler
 * @extends {Plugin}
 * @author zhenliang.sun
 */
export default class Scheduler extends Plugin {
  constructor() {
    super();
    this._schedulerCfg = null;
    this._resetStatus();
  }

  init(opts = '') {
    super.init(opts);
    this._allConfig = opts;
    this._config = opts[Scheduler.type];
    // 是否是直播
    this._isLive = opts.isLive;
    let isLive = this._isLive;
    // 调度配置
    this._schedulerCfg = JSON.parse(this._config);
    let schedulerCfg = this._schedulerCfg;
    this._domain = schedulerCfg.url;
    this._webinar_id = schedulerCfg.webinar_id;
    this._uid = schedulerCfg.uid;
    this._bu = schedulerCfg.bu;
    this._rand = this._getRandom();
    let originURL = document.createElement('a');
    originURL.href = this._allConfig.url;
    this._uri = isLive ? '' : originURL.pathname;
    this._qualities = schedulerCfg.quality || ['same'];
    this._defaultDef = schedulerCfg.defaultDef || 'same';

    let queryString = '';
    let api = '';
    if (isLive) {
      let liveQS = {};
      liveQS.webinar_id = this._webinar_id;
      liveQS.rand = this._getRandom();
      liveQS.uid = this._uid;
      liveQS.bu = this._bu;
      queryString = qs.stringify(liveQS);
      api = LIVE_API;
    } else {
      let vodQS = {};
      vodQS.webinar_id = this._webinar_id;
      vodQS.rand = this._getRandom();
      vodQS.uid = this._uid;
      vodQS.uri = this._uri;
      vodQS.bu = this._bu;
      vodQS.quality = `["${this._qualities.join('","')}"]`; // 拼接的数据为 &quality=["same",360p",480p"]
      queryString = qs.stringify(vodQS);
      api = VOD_API;
    }

    // http://gslb.e.vhall.com//api/dispatch_replay?webinar_id=439466233&rand=770724169&uid=162647881&uri=//vhallrecord/439466233/20190105120210/record.m3u8&quality=[%22same%22,%22a%22]
    let p = window.location.protocol;
    let fetchURL = `${p}${this._domain}/${api}?${queryString}`;

    this.info('info', `isLive: ${isLive}, url: ${fetchURL}`);

    this._fetchURLs(fetchURL);
  }

  destroy() {
    super.destroy();
    this._resetStatus();
    this.__innerXHRDestroy();
  }

  static get type() {
    return 'plugin_scheduler';
  }

  _resetStatus() {
    this._allConfig = null;
    this._config = null;
    this._domain = '';
    this._webinar_id = '';
    this._rand = this._getRandom();
    this._uri = '';
    this._bu = 0;
    this._uid = '';
    this._qualities = ['same'];
    this._isLive = false;
    this._currentDefListIndex = -1;
    this._defaultDef = null;
  }

  _getRandom() {
    return ((Math.random() * 899999999) >> 0) + 100000000;
  }

  _fetchURLs(url) {
    this.xhr = new XMLHttpRequest();
    let xhr = this.xhr;
    xhr.responseType = 'json';
    xhr.timeout = 5000; // 5秒超时
    xhr.onerror = e =>
      this.info('error', `fetch error. code: ${e.code}, msg: ${e.message}`);

    xhr.ontimeout = e => this.info('error', `fetch timeout. code: ${e.code}`);

    xhr.onload = e => {
      let data = xhr.response;
      this._isLive ? this._resolveLiveData(data) : this._resolveVodData(data);
    };

    xhr.onloadend = e => this.__innerXHRDestroy();

    xhr.open('GET', url);
    xhr.send();
  }

  __innerXHRDestroy() {
    if (!this.xhr) return;

    this.info('info', '调度流程完成，进行内部销毁');
    this.xhr.onerror = null;
    this.xhr.ontimeout = null;
    this.xhr.onload = null;
    this.xhr.onloadend = null;
    this.xhr = null;
  }

  _resolveLiveData(data) {
    if (+data.code !== 200) {
      this.info('error', `获取直播状态码不为200，状态码为:${data.code}`);
      return;
    }
    let obj = null;
    let key = '';
    let type = this._allConfig.type;
    switch (type) {
      case 'flv':
        obj = data['data']['httpflv_urls'];
        key = 'httpflv_url';
        break;
      case 'hls':
        obj = data['data']['hls_urls'];
        key = 'hls_url';
        break;
      default:
        this.info('warn', `暂时不支持${type}类型的直播`);
        this._defineProperty([], data['data']['token']);
        return;
    }

    let lineCount = obj['same'].length;
    // let defs = new Array(lineCount).fill([], 0);
    let defs = [];
    while (lineCount) {
      defs.push([]);
      lineCount -= 1;
    }
    Object.keys(obj).forEach(item => {
      Object.values(obj[item]).forEach((subItem, index) => {
        let subDef = {
          idx: index,
          line: subItem['line'],
          url: subItem[key],
          def: item
        };
        defs[index].push(subDef);
      });
    });

    this.info('info', `整理直播清晰度完成,共有${defs.length}条线路，每条线路有${defs.length > 0 ? defs[0].length : 0}个清晰度`);
    let oToken = data['data']['token'];
    this._defineProperty(defs, oToken);
  }

  _resolveVodData(data) {
    if (+data.code !== 200) {
      this.info('error', `获取回放状态码不为200，状态码为:${data.code}`);
      return;
    }
    let error = false;
    let obj = null;
    let key = '';
    let type = this._allConfig.type;
    switch (type) {
      case 'native':
        obj = data['data']['mp4_domainnames'];
        key = 'mp4_domainname';
        break;
      case 'hls':
        obj = data['data']['hls_domainnames'];
        key = 'hls_domainname';
        break;
      default:
        this.info('warn', `暂时不支持${type}类型的点播`);
        this._defineProperty([], data['data']['token']);
        error = true;
        return;
    }

    // 因为不支持flv点播，直接return
    if (error || !obj) {
      return;
    }

    // 先获取有多少个线路, 因为原画肯定是有的， 所以用原画获取
    let lineCount = obj['same'].length;
    // let defs = new Array(lineCount).fill([], 0);
    let defs = [];
    while (lineCount) {
      defs.push([]);
      lineCount -= 1;
    }

    Object.keys(obj).forEach(item => {
      Object.values(obj[item]).forEach((subItem, index) => {
        let def = {
          idx: index,
          // url: 'http://127.0.0.1:9090/videos/1.mp4', // subItem[key],
          url: subItem[key],
          line: subItem['line'],
          def: item
        };
        defs[index].push(def);
      });
    });

    this.info('info', `整理点播清晰度完成,有${defs.length}条线路, ${defs.length > 0 ? defs[0].length : 0}个清晰度`);
    let oToken = data['data']['token'];
    this._defineProperty(defs, oToken);
  }

  _createToken(originToken) {
    let pre = originToken.split('_')[0];
    let last = originToken.split('_')[1];

    // 短token 翻转
    let reverseToken = pre.split('').reverse().join('');
    let n = (crc32.str(reverseToken) >>> 0).toString(16).toUpperCase(); // >>>0 的原因是 crc32 库做完的数据可能会有负数的情况
    let newToken = `${n}_${last}`;
    this.info('info', `origin token: ${originToken}`);
    this.info('info', `new token: ${newToken}`);
    return newToken;
  }

  _defineProperty(defs, token) {
    let nToken = this._createToken(token);

    this._currentDefListIndex = 0; // 默认选中列表中第一个
    this._currentDefList = defs[this._currentDefListIndex] || []; // 当前清晰度列表

    let sameDef = null; // 如果预设画质没找到，返回原画
    let defaultDefList = this._currentDefList.filter(item => {
      if (item.def === 'same') {
        sameDef = item; // 记录一下原画实体
      }
      return item.def === this._defaultDef;
    });
    this._currentDef = defaultDefList.length ? defaultDefList[0] : sameDef;

    // Object.defineProperties(this.player, {
    //   allDefinitionList: {
    //     value: defs // 调度获取的全部清晰度列表， 可能有若干线路， 每条线路有若干个清晰度
    //   },
    //   currentDefinition: {
    //     value: this._currentDef // 当前清晰度实体
    //   },
    //   currentDefinitionList: {
    //     value: this._currentDefList // 当前清晰度列表
    //   },
    //   currentDefinitionListIndex: {
    //     value: this._currentDefListIndex // 当前清晰度列表在全部清晰度列表中的索引
    //   },
    //   originToken: {
    //     value: token // 原始token, 从调度获取的
    //   },
    //   newToken: {
    //     value: nToken // 计算过后的token
    //   }
    // });

    // defineProperty 的getter 和setter的优先级要高于 defineProperties中的getter 与 setter
    // https://www.imooc.com/wenda/detail/401551

    let currentDefinition = this._currentDef;
    let allDefinitionList = defs;
    let currentDefinitionList = this._currentDefList;
    let currentDefinitionListIndex = this._currentDefListIndex;
    let originToken = token;
    let newToken = nToken;
    var properties = {
      currentDefinition,
      allDefinitionList,
      currentDefinitionList,
      currentDefinitionListIndex,
      originToken,
      newToken
    };

    for (const key in properties) {
      Object.defineProperty(this.player, key, {
        get: function () {
          return properties[key];
        },
        set: function (newValue) {
          properties[key] = newValue;
        }
      });
    }

    this.player.emit('schedulerCompleted');
  }
}