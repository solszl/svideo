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
    this._onComplete = null;
    this._onProgress = null;
    this._onError = null;
    this._onTimeout = null;
  }

  /**
   * 加载器销毁
   *
   * @memberof BaseLoader
   */
  destroy() {
    super.destroy();
    this._status = LoaderStatus.IDLE;
    this._onComplete = null;
    this._onProgress = null;
    this._onError = null;
    this._onTimeout = null;
  }

  open() {

  }

  abort() {

  }

  isLoading() {
    return this.status === LoaderStatus.CONNECTING || this.status === LoaderStatus.BUFFERING;
  }

  get status() {
    return this._status;
  }

  set onProgress(cbk = null) {
    this._onProgress = cbk;
  }

  get onProgress() {
    return this._onProgress;
  }

  set onComplete(cbk = null) {
    this._onComplete = cbk;
  }

  get onComplete() {
    return this._onComplete;
  }

  set onError(cbk) {
    this._onError = cbk;
  }

  get onError() {
    return this._onError;
  }

  set onTimeout(cbk = null) {
    this._onTimeout = cbk;
  }

  get onTimeout() {
    return this._onTimeout;
  }

  get type() {
    return this._type || 'undefined';
  }
}