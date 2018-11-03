import Exception from './Exception';

/**
 * 参数非法异常
 *
 * @export
 * @class IllegalStateException
 * @extends {Exception}
 * @author zhenliang.sun
 */
export default class IllegalStateException extends Exception {
  constructor(msg) {
    super(msg);
    this._type = 'IllegalStateException';
  }
}