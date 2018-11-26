import Log from '../../utils/Log';
import qs from 'qs';

/**
 * 
 *
 * @export
 * @class SeekableHandler
 * @author zhenliang.sun
 */
export default class SeekableHandler {

  /**
   * 
   *
   * @static
   * @param {*} baseURL
   * @param {*} range {from:x, to:y}
   * @param {*} type range, param, ???
   * @memberof SeekableHandler
   */
  static getConfig(baseURL, range, type) {
    let url = baseURL;
    let headers = {};

    if (type === 'range') {

      if (range.to === -1) {
        headers['Range'] = 'bytes=0-';
      } else {
        headers['Range'] = `bytes=${range.from.toString()}-${range.to.toString()}`;
      }

    } else if (type === 'param') {

      if (range.to === -1) {
        delete range.to;
      }

      let sign = url.indexOf('?') === -1 ? '?' : '&';
      url = `${url}${sign}${qs.stringify(range)}`;

    } else {
      Log.OBJ.error('unsupported custom type:${type}');
    }

    return {
      url: url,
      headers: headers
    };
  }

  /**
   * 移除URL 中 指定的参数列表
   *
   * @static
   * @param {*} seekedURL
   * @param {string} [keys=['from', 'to']]
   * @returns
   * @memberof SeekableHandler
   */
  static removeParameters(seekedURL, keys = ['from', 'to']) {
    if (seekedURL.indexOf('?') === -1 || keys.length === 0) {
      return seekedURL;
    }

    let baseURL = seekedURL.split('?')[0];
    let params = seekedURL.split('?')[1];
    let p = qs.parse(params);

    for (var k of keys) {
      delete p[k];
    }

    return `${baseURL}?${qs.stringify(p)}`;
  }
}