import Component from '../../core/Component';

export const LoaderStatus = {
  IDLE: 0,
  CONNECTING: 1,
  BUFFERING: 2,
  ERROR: 3,
  COMPLETE: 4
};

export const LoaderEvent = {
  OPEN: 'open',
  ERROR: 'error',
  CONTENT_LENGTH: 'content_length',
  COMPLETE: 'complete',
  PROGRESS: 'progress'
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
    this._url = '';
    this._option = null;
    this._onComplete = null;
    this._onProgress = null;
    this._onError = null;
    this._onTimeout = null;
    this._onContentLength = null;
  }

  /**
   * 加载器销毁
   *
   * @memberof BaseLoader
   */
  destroy() {
    super.destroy();
    this._status = LoaderStatus.IDLE;
    this._url = '';
    this._option = null;
    this._onComplete = null;
    this._onProgress = null;
    this._onError = null;
    this._onTimeout = null;
    this._onContentLength = null;
  }

  open() {

  }

  abort() {

  }

  /**
   * 加载器当前是否正处于工作状态
   *
   * @returns
   * @memberof BaseLoader
   * @returns 加载器是否正在工作
   */
  isLoading() {
    return this.status === LoaderStatus.CONNECTING || this.status === LoaderStatus.BUFFERING;
  }

  set url(v) {
    this._url = v;
  }

  get url() {
    return this._url;
  }

  set option(opt) {
    this._option = opt;
  }

  get option() {
    return this._option;
  }

  /**
   * 加载器当前状态
   *
   * @readonly
   * @memberof BaseLoader
   * @returns 返回当前网络状态
   */
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

  set onContentLength(cbk) {
    this._onContentLength = cbk;
  }

  get onContentLength() {
    return this._onContentLength;
  }
}