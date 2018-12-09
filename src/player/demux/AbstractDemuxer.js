import TransCoder from '../core/TransCoder';
import Log from '../../utils/Log';
import DataStore from './flv/DataStore';

const NOOP = () => {};
/**
 * 抽象分流器
 *
 * @export
 * @class AbstractDemuxer
 * @extends {TransCoder}
 * @author zhenliang.sun
 */
export default class AbstractDemuxer extends TransCoder {
  constructor() {
    super();
    this.CLASS_NAME = this.constructor.name;
  }

  /**
   * 销毁
   *
   * @memberof AbstractDemuxer
   */
  destroy() {

  }

  /**
   * 解析tag
   *
   * @param {*} tag
   * @memberof AbstractDemuxer
   */
  resolve(tag) {

  }

  info(type, ...args) {
    Log.OBJ[type](`[${this.CLASS_NAME}] ${args}`);
  }

  get isLE() {
    return DataStore.OBJ.isLe;
  }
}