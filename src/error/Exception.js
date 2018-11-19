/**
 * 异常基类
 *
 * @export
 * @class Exception
 * @author zhenliang.sun
 */
export default class Exception {
  constructor(msg) {
    this._msg = msg;
    this._type = 'RuntimeException';
  }

  get type() {
    return this._type;
  }

  toString() {
    return `[${this.type}] ${this._msg}`;
  }
}