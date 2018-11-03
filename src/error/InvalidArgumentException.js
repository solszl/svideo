import Exception from './Exception';

/**
 * 无效参数异常
 *
 * @export
 * @class InvalidArgumentException
 * @extends {Exception}
 * @author zhenliang.sun
 */
export default class InvalidArgumentException extends Exception {
  constructor(msg) {
    super(msg);
    this._type = 'InvalidArgumentException';
  }
}