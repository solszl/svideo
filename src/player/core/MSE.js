import EventEmitter from 'event-emitter';
import Log from '../../utils/Log';
import MSEEvents from '../../common/constant/MSEEvents';

/**
 * MSE 封装
 *
 * @class MSE
 * @author zhenliang.sun
 */
export default class MSE {
  constructor(codecs = 'video/mp4; codecs="avc1.64001E, mp4a.40.5"') {
    // 以防不经过判断支持， 直接使用
    if (!MSE.isSupported(codecs)) {
      Log.OBJ.error('unsupported MSE');
      return;
    }

    EventEmitter(this);
    this.codecs = codecs;
    this.queue = [];
    this.ms = new window.MediaSource();
    this.url = window.URL.createObjectURL(this.ms);
    this.ms.addEventListener(MSEEvents.SOURCE_OPEN, this._mediaSourceOpen);
    this.ms.addEventListener(MSEEvents.SOURCE_CLOSE, this._mediaSourceClose);
  }

  /**
   * 给sourceBuffer 中添加新的 buffer
   *
   * @param {*} buffer
   * @returns
   * @memberof MSE
   */
  appendBuffer(buffer) {
    let sb = this.sourceBuffer;
    if (sb.updating === false && this.state === 'open') {
      sb.appendBuffer(buffer);
      return true;
    } else {
      this.queue.push(buffer);
      return false;
    }
  }

  /**
   * 移除sourceBuffer 中指定的数据
   *
   * @param {*} start
   * @param {*} end
   * @memberof MSE
   */
  removeBuffer(start, end) {
    this.sourceBuffer.remove(start, end);
  }

  /**
   * 在数据请求完成后，我们需要调用 endOfStream()。它会改变 MediaSource.readyState 为 ended 并且触发 sourceended 事件
   *
   * @memberof MSE
   */
  endOfStream() {
    if (this.state === 'open') {
      this.sourceBuffer.endOfStream();
    }
  }

  /**
   * 销毁 MSE
   *
   * @memberof MSE
   */
  destroy() {
    this.endOfStream();
    this.queue = [];
    this.__ee__ = {};
  }

  _mediaSourceOpen() {
    const self = this;
    self.sourceBuffer = self.ms.addSourceBuffer(self.codecs);
    self.sourceBuffer.addEventListener(MSEEvents.ERROR, e => {});

    self.sourceBuffer.addEventListener(MSEEvents.UPDATE_END, e => {
      self.emit(MSEEvents.UPDATE_END);
      let b = self.queue.shift();
      if (b) {
        self.sourceBuffer.appendBuffer(b);
      }
    });

    self.emit(MSEEvents.SOURCE_OPEN);
  }

  _mediaSourceClose() {
    self.emit(MSEEvents.SOURCE_CLOSE);
  }

  /**
   * 获取当前MSE的状态
   *
   * @readonly
   * @memberof MSE
   */
  get state() {
    if (!this.ms) {
      Log.OBJ.warn('uninitialized MSE');
      return 'closed';
    }

    return this.ms.readyState;
  }

  /**
   * 是否支持 MSE
   *
   * @static
   * @param {*} codecs
   * @memberof MSE
   * @return 根据浏览器以及codecs 判断 当前环境是否支持MSE
   */
  static isSupported(codecs) {
    return window.MediaSource && MediaSource.isTypeSupported(codecs);
  }
}