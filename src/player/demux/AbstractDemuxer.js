import TransCoder from '../core/TransCoder';
import DataStore from './../flv/DataStore';

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

  get isLE() {
    return DataStore.OBJ.isLe;
  }
}