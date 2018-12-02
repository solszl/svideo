import Log from './../../utils/Log';
import {
  BaseLoader,
  LoaderEvent,
  LoaderStatus
} from './BaseLoader';
import SeekableHandler from './SeekableHandler';

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
    this._type = 'xhr';

    this._xhr = null;
    this._xhr = new XMLHttpRequest();

    this._totalLengthReceived = false; // 是否已经获取到全部数据的长度
    this._waitForTotalLength = true; // 是否等待获取所有数据长度
    this._totalLength = 0; // 数据总长度
    this._contentLength = 0; // 当前请求的数据内容长度
    this._receivedLength = 0; // 已经收到数据长度
    this._lastTimeLoaded = 0;
    this._currentChunkSizeKB = 384;
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

    this._totalLengthReceived = false;
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

    // if (this._xhr) {
    //   this.destroy();
    // }

    super.open();
    this.emit(LoaderEvent.OPEN);
    this._status = LoaderStatus.CONNECTING;

    this._range = this.option.range || {
      from: 0,
      to: -1
    };
    if (!this._totalLengthReceived) {
      this._waitForTotalLength = true;
      this._innerOpen(this._range);
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
    if (this._status === LoaderStatus.ERROR) {
      return;
    }

    // 如果还没收到完整的数据长度
    if (this._contentLength === 0) {
      let openNextRange = false;
      if (this._waitForTotalLength) {
        this._waitForTotalLength = false;
        this._totalLengthReceived = true;
        openNextRange = true;

        let total = e.total;
        this._innerAbort();
        if (total !== null && total !== 0) {
          this._totalLength = total;
        }
      }

      if (this._range.to === -1) {
        this._contentLength = this._totalLength - this._range.from;
      } else {
        this._contentLength = this._range.to - this._range.from - 1;
      }

      if (openNextRange) {
        this._openSubRange();
        return;
      }

      this.emit(LoaderEvent.CONTENT_LENGTH, this._contentLength);
      this.onContentLength && this.onContentLength(this._contentLength);
    }

    let delta = e.loaded - this._lastTimeLoaded;
    this._lastTimeLoaded = e.loaded;
    this._sampler.addBytes(delta);
  }

  _onLoad(e) {
    if (this._status === LoaderStatus.ERROR) {
      return;
    }

    if (this._waitForTotalLength) {
      this._waitForTotalLength = false;
      return;
    }

    this._lastTimeLoaded = 0;

    let KBps = this._sampler.currentKBps;
    if (KBps !== 0) {
      let normalized = this._normalizeSpeed(KBps);
      this._currentChunkSizeKB = normalized;
    }

    let chunk = e.target.response;
    let byteStart = this._range.from + this._receivedLength;
    this._receivedLength += chunk.byteLength;

    let reportComplete = false;

    if (this._contentLength !== 0 && this._receivedLength < this._contentLength) {
      // load next chunk
      this._openSubRange();
    } else {
      reportComplete = true;
    }

    let msg = {
      chunk: chunk,
      byteStart: byteStart,
      receivedLength: this._receivedLength
    };
    this.emit(LoaderEvent.PROGRESS, msg);
    this.onProgress && this.onProgress(msg);

    if (reportComplete) {
      this._status = LoaderStatus.COMPLETE;
      this._content = this._xhr.response;
      this.emit(LoaderEvent.COMPLETE, this);
      this.onComplete && this.onComplete(this);
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
    this._lastTimeLoaded = 0;
    this._xhr = new XMLHttpRequest();
    let xhr = this._xhr;
    xhr.open('GET', this.url, true);
    xhr.responseType = this.option.responseType || 'arraybuffer';
    xhr.onreadystatechange = this._onReadyStateChange.bind(this);
    xhr.onprogress = this._onXHRProgress.bind(this);
    xhr.onload = this._onLoad.bind(this);
    xhr.onerror = this._onXHRError.bind(this);

    let type = this.option.seekType || 'range';
    let cfg = SeekableHandler.getConfig(this.url, range, type);
    if (typeof cfg.headers === 'object') {
      let headers = cfg.headers;
      for (let key in headers) {
        xhr.setRequestHeader(key, headers[key]);
      }
    }

    xhr.send();
  }

  _openSubRange() {
    let chunkSize = this._currentChunkSizeKB * 1024;
    let from = this._range.from + this._receivedLength;
    let to = from + chunkSize;

    if (this._contentLength !== 0) {
      if (to - this._range.from >= this._contentLength) {
        to = this._range.from + this._contentLength - 1;
      }
    }

    this._currentRequestRange = {
      from,
      to
    };
    this._innerOpen(this._currentRequestRange);
  }

  _innerAbort() {
    if (this._xhr) {
      this._xhr.onreadystatechange = null;
      this._xhr.onprogress = null;
      this._xhr.onload = null;
      this._xhr.onerror = null;
      this._xhr.abort();
      this._xhr = null;
    }
  }

  // 根据速度找到表内对应的匹配速度 二分查找
  _normalizeSpeed(input) {
    let list = chunkSizeKBList;
    let last = list.length - 1;
    let mid = 0;
    let lbound = 0;
    let ubound = last;
    if (input < list[0]) {
      return list[0];
    }

    while (lbound <= ubound) {
      mid = lbound + Math.floor((ubound - lbound) / 2);
      if (mid === last || (input >= list[mid] && input < list[mid + 1])) {
        return list[mid];
      } else if (list[mid] < input) {
        lbound = mid + 1;
      } else {
        ubound = mid - 1;
      }
    }
  }
}