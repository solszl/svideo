import Plugin from '../core/Plugin';
import qs from 'qs';
import Log from '../utils/Log';
import crc32 from 'crc-32';

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
    this._resetStatus();
  }

  init(opts = '') {
    super.init(opts);
    this._allConfig = opts;
    this._config = opts[Scheduler.type];
    // 是否是直播
    this._isLive = opts.isLive;
    let isLive = this._isLive;
    let schedulerCfg = JSON.parse(this._config);
    this._domain = schedulerCfg.url;
    this._webinar_id = schedulerCfg.webinar_id;
    this._uid = schedulerCfg.uid;
    this._bu = schedulerCfg.bu;
    this._rand = this._getRandom();
    let originURL = document.createElement('a');
    originURL.href = this._allConfig.url;
    this._uri = isLive ? '' : originURL.pathname;
    this._qualities = schedulerCfg.quality;

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
      vodQS.quality = this._qualities;
      vodQS.rand = this._getRandom();
      vodQS.uid = this._uid;
      vodQS.uri = this._uri;
      vodQS.bu = this._bu;
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
      break;
    }

    /**
     * defs = [
     *    [
     *     {idx: 0, line: "线路1", url: "http://sjflvlivepc02.e.vhall.com/vhall/439466233.flv", def: "same"},
     *     {idx: 0, line: "线路1", url: "http://sjflvlivepc02.e.vhall.com/vhall/439466233_360p.flv", def: "360p"},
     *     {idx: 0, line: "线路1", url: "http://sjflvlivepc02.e.vhall.com/vhall/439466233_a.flv", def: "a"},
     *     {idx: 0, line: "线路1", url: "http://sjflvlivepc02.e.vhall.com/vhall/439466233_480p.flv", def: "480p"}
     *    ],
     *    [],
     *    []
     * ]
     */

    let defs = [
      [],
      [],
      []
    ];
    Object.keys(obj).forEach(item => {
      // console.log(item, index);
      Object.keys(obj[item]).forEach(subitem => {
        let m = obj[item][subitem];
        let subDef = {
          idx: +subitem,
          line: m['line'],
          url: m[key],
          def: item
        };
        defs[+subitem].push(subDef);
      });
    });

    this.info('info', '整理直播清晰度完成');
    let oToken = data['data']['token'];
    let nToken = this._createToken(oToken);
    Object.defineProperties(this.player, {
      allDefinitions: {
        value: defs,
        writeable: false,
        enumerable: true
      },
      originToken: {
        value: oToken,
        writeable: false,
        enumerable: true
      },
      newToken: {
        value: nToken,
        writeable: false,
        enumerable: true
      }
    });
  }

  _resolveVodData(data) {
    if (+data.code !== 200) {
      this.info('error', `获取回放状态码不为200，状态码为:${data.code}`);
      return;
    }
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
      this.info('warn', `暂时不支持${type}类型的直播`);
      break;
    }
  }

  _createToken(originToken) {
    let pre = originToken.split('_')[0];
    let last = originToken.split('_')[1];

    // 短token 翻转
    let reverseToken = pre.split('').reverse().join('');
    let n = crc32.str(reverseToken).toString(16);
    let newToken = `${n}_${last}`.toLocaleUpperCase();
    this.info('info', `origin token: ${originToken}`);
    this.info('info', `new token: ${newToken}`);
    this.info('info', 'token 计算完成');
    return newToken;
  }
}