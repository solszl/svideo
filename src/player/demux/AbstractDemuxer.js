import TransCoder from '../core/TransCoder';

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
  }

  /**
   * 销毁
   *
   * @memberof AbstractDemuxer
   */
  destroy() {

  }
}