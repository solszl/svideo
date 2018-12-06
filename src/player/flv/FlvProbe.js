import EventEmitter from 'event-emitter';

/**
 * FLV 数据解析器
 *
 * @export
 * @class FlvProbe
 * @author zhenliang.sun
 */
export default class FlvProbe {
  constructor() {
    EventEmitter(this);
  }

  /**
   * 判断数据是否是FLV 数据流
   *
   * @static
   * @param {*} data
   * @returns 返回数据的前三个字符组成的是否是 'FLV'
   * @memberof FlvProbe
   */
  static isFlvHead(data) {
    let header = [data[0], data[1], data[2]];
    return String.fromCharCode.apply(String, header) === 'FLV';
  }
}