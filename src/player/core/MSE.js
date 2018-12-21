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
    this.codecs = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
    // 以防不经过判断支持， 直接使用
    if (!MSE.isSupported(codecs)) {
      Log.OBJ.error('unsupported MSE');
      return;
    }

    EventEmitter(this);
    this.codecs = codecs;
    this.queue = [];
    this.mediaSource = new window.MediaSource();
    this.url = window.URL.createObjectURL(this.mediaSource);


    console.log('调用构造函数');

    this.mediaSource.addEventListener('sourceopen', this._mediaSourceOpen.bind(this));
    this.mediaSource.addEventListener('sourceclose', this._mediaSourceClose.bind(this));
  }

  /**
   * 给sourceBuffer 中添加新的 buffer
   *
   * @param {*} buffer
   * @returns 将buffer 添加到source 中是否成功，true:添加成功
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
      this.mediaSource.endOfStream();
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

    self.sourceBuffer = this.mediaSource.addSourceBuffer(self.codecs);
    self.sourceBuffer.addEventListener(MSEEvents.ERROR, self.__error.bind(self));

    self.sourceBuffer.addEventListener(MSEEvents.UPDATE_END, self.__updateEnd.bind(self));

    self.sourceBuffer.addEventListener('updatestart', e => {
      // console.log('update start: ', e);
    });

    self.sourceBuffer.addEventListener('update', e => {
      // console.log('update ', e);
    });

    self.sourceBuffer.addEventListener('abort', e => {
      // console.log('abort', e);
    });

    self.emit(MSEEvents.SOURCE_OPEN);
  }

  __error(e) {
    console.error(e);
  }

  __updateEnd(e) {
    this.emit(MSEEvents.UPDATE_END);
    // console.log('updateend', e);
    // let b = this.queue.shift();
    // if (b) {
    //   this.sourceBuffer.appendBuffer(b);
    // }
  }

  _mediaSourceClose() {
    console.log('MSE close');
    this.emit(MSEEvents.SOURCE_CLOSE);
  }

  /**
   * 获取当前MSE的状态
   *
   * @readonly
   * @memberof MSE
   */
  get state() {
    if (!this.mediaSource) {
      Log.OBJ.warn('uninitialized MSE');
      return 'closed';
    }

    return this.mediaSource.readyState;
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
    // return window.MediaSource;
  }
}