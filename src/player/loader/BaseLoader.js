import Component from '../../core/Component';

export const LoaderStatus = {
  IDLE: 0,
  CONNECTING: 1,
  BUFFERING: 2,
  ERROR: 3,
  COMPLETE: 4
};

export const LoaderEvent = {

};

/**
 * 加载类基类
 *
 * @export
 * @class BaseLoader
 * @extends {Component}
 * @author zhenliang.sun
 */
export class BaseLoader extends Component {
  constructor() {
    super();
    this._status = LoaderStatus.IDLE;
  }

  /**
   * 加载器销毁
   *
   * @memberof BaseLoader
   */
  destroy() {
    super.destroy();
    this._status = LoaderStatus.IDLE;
  }
}