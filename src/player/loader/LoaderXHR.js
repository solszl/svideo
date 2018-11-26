import Log from './../../utils/Log';
import {
  BaseLoader,
  LoaderEvent,
  LoaderStatus
} from './BaseLoader';

const chunkSizeKBList = [128, 256, 384, 512, 768, 1024, 1536, 2048, 3072, 4096, 5120, 6144, 7168, 8192];
/**
 * LoaderXHR
 *
 * @export
 * @class LoaderXHR
 * @extends {BaseLoader}
 * @author zhenliang.sun
 */
export default class LoaderXHR extends BaseLoader {
  constructor() {
    super();
    this._xhr = null;
    this._xhr = new XMLHttpRequest();

    this._totalLengthReceived = false; // 是否已经获取到全部数据的长度
    this._waitForTotalLength = true; // 是否等待获取所有数据长度
    this._totalLength = 0; // 数据总长度
    this._contentLength = 0; // 当前请求的数据内容长度
    this._receivedLength = 0; // 已经收到数据长度
    this._lastTimeLoaded = 0;

  }

  static isSupported() {
    try {
      let xhr = new XMLHttpRequest();
      xhr.open('GET', 'https://example.com', true);
      xhr.responseType = 'arraybuffer';
      return xhr.responseType === 'arraybuffer';
    } catch (e) {
      Log.OBJ.warn('unsupported XHR Loader');
      return false;
    }
  }

  destroy() {
    if (this.isLoading()) {
      this.abort();
    }

    super.destroy();

    if (this._xhr) {
      this._xhr.onreadystatechange = null;
      this._xhr.onprogress = null;
      this._xhr.onload = null;
      this._xhr.onloadstart = null;
      this._xhr.onerror = null;
      this._xhr.ontimeout = null;
      this._xhr = null;
    }
  }

  open() {
    if (this.url === '' || this.option === undefined || this.option === null) {
      let msg = {
        code: LoaderEvent.ERROR,
        msg: 'url or option is null'
      };
      this.emit(LoaderEvent.ERROR, msg);
      this.onError && this.onError(msg);
      Log.OBJ.error(`[XHR] uninitialized necessary params, url:${this.url}, option:${this.option}`);
      return;
    }

    if (this._xhr) {
      this.destroy();
    }

    super.open();
    this.emit(LoaderEvent.OPEN);
    this._status = LoaderStatus.CONNECTING;

    if (!this._totalLengthReceived) {
      this._waitForTotalLength = true;
      this._innerOpen({
        from: 0,
        to: -1
      });
    } else {
      this._openSubRange();
    }

  }

  _onReadyStateChange(e) {
    let xhr = e.target;

    if (xhr.readyState !== XMLHttpRequest.HEADERS_RECEIVED) {
      return;
    }

    if (xhr.status >= 200 && xhr.status <= 299) {
      this._status = LoaderStatus.BUFFERING;
    } else {
      this._status = LoaderStatus.ERROR;
      let msg = {
        code: xhr.status,
        msg: xhr.statusText
      };
      this.emit(LoaderEvent.ERROR, msg);
      this.onError && this.onError(msg);
      Log.OBJ.error(`[XHR] http code invalid, code:${xhr.status}, msg:${xhr.statusTexts}`);
    }
  }

  _onXHRProgress(e) {
    console.log(e);
  }

  _onLoad(e) {
    console.log(e);
    if (this._status === LoaderStatus.ERROR) {
      return;
    }

    if (this._waitForTotalLength) {
      this._waitForTotalLength = true;
      return;
    }

  }

  _onXHRError(e) {
    console.log(e);
    this._status = LoaderStatus.ERROR;
    let msg = {
      code: LoaderEvent.ERROR,
      msg: e.constructor.name + ' ' + e.type
    };
    this.emit(msg);
    this.onError && this.onError(msg);
  }

  _innerOpen(range) {
    this._xhr = new XMLHttpRequest();
    let xhr = this._xhr;
    xhr.open('GET', this.url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onreadystatechange = this._onReadyStateChange.bind(this);
    xhr.onprogress = this._onXHRProgress.bind(this);
    xhr.onload = this._onLoad.bind(this);
    xhr.onerror = this._onXHRError.bind(this);
    xhr.send();
  }
}