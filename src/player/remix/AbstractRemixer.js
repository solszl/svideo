import TransCoder from '../core/TransCoder';
import Log from '../../utils/Log';

/**
 * 抽象混流器
 *
 * @export
 * @class AbstractRemixer
 * @extends {TransCoder}
 * @author zhenliang.sun
 */
export default class AbstractRemixer extends TransCoder {
  constructor() {
    super();
    this.CLASS_NAME = this.constructor.name;
  }

  info(type, ...args) {
    Log.OBJ[type](`[${this.CLASS_NAME}] ${args}`);
  }
}