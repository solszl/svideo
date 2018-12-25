import {
  BaseLoader,
  LoaderEvent,
  LoaderStatus
} from './BaseLoader';
import SeekableHandler from './SeekableHandler';

/**
 * 默认加载器
 *
 * @export
 * @class LoaderFetch
 * @extends {BaseLoader}
 * @author zhenliang.sun
 */
export default class LoaderFetch extends BaseLoader {
  constructor() {
    super();
    this._type = 'fetch';
    this._contentLength = 0;
    this._receivedLength = 0;
  }

  static isSupported() {
    try {
      // 默认系统版本>15048的EDGE 及 其他所有浏览器（非IE）
      return (self.fetch && self.ReadableStream);
    } catch (e) {
      this.info('warn', 'unsupported Fetch Loader');
      return false;
    }
  }

  destroy() {
    if (this.isLoading()) {
      this.abort();
    }
    super.destroy();
    this._contentLength = 0;
    this._receivedLength = 0;
  }

  set option(opt) {
    super.option = opt;
    this._range = opt.range || {
      from: 0,
      to: -1
    };
    let headers = new Headers();

    // 点播才加range
    if (!opt.isLive || false) {
      let cfg = SeekableHandler.getConfig(this.url, this._range, 'range');
      if (typeof cfg.headers === 'object') {
        let configHeaders = cfg.headers;
        for (let key in configHeaders) {
          headers.append(key, configHeaders[key]);
        }
      }
    }

    this.params = {
      method: 'GET',
      headers: headers,
      mode: 'cors',
      cache: 'default',
      referrerPolicy: 'no-referrer-when-downgrade'
    };
  }

  get option() {
    return super.option;
  }

  open() {
    if (this.url === '' || this.option === undefined || this.option === null) {
      let msg = {
        code: LoaderEvent.ERROR,
        msg: 'url or option is null'
      };
      this.emit(LoaderEvent.ERROR, msg);
      this.onError && this.onError(msg);
      this.info('error', ` uninitialized necessary params, url:${this.url}, option:${this.option}`);
      return;
    }
    super.open();
    this.emit(LoaderEvent.OPEN);
    this._status = LoaderStatus.CONNECTING;
    // 开始加载
    fetch(this.url, this.params).then(res => {
      if (res.ok && res.status >= 200 && res.status <= 299) {
        // URL 跳转
        if (this.url !== res.url) {
          this.info('info', `URL had been redirected old: ${this.url}, new: ${res.url}`);
        }

        // fetch 是否可以获取到数据长度
        let lengthFromHeader = res.headers.get('Content-Length');
        if (lengthFromHeader) {
          this._contentLength = parseInt(lengthFromHeader);
          if (this._contentLength !== 0) {
            this.emit(LoaderEvent.CONTENT_LENGTH, this._contentLength);
            this.onContentLength && this.onContentLength(this._contentLength);
          }
        }

        // 开始解析数据流 res.body.getReader()
        return this._pump.call(this, res.body.getReader());

      } else {
        this._status = LoaderStatus.ERROR;
        let msg = {
          code: res.status,
          msg: res.statusText
        };
        this.emit(LoaderEvent.ERROR, msg);
        this.onError && this.onError(msg);
      }
    }).catch(e => {
      this._status = LoaderStatus.ERROR;
      let msg = {
        code: -1,
        msg: e.message
      };
      this.emit(LoaderEvent.ERROR, msg);
      this.onError && this.onError(msg);
    });
  }

  _pump(reader) {
    return reader.read().then(res => {
      if (res.done) {
        this._status = LoaderStatus.COMPLETE;
        this.emit(LoaderEvent.COMPLETE, this);
        this.onComplete && this.onComplete(this);
      } else {
        this._status = LoaderStatus.BUFFERING;
        let chunk = res.value.buffer;
        let byteStart = this._range.from + this._receivedLength;
        this._receivedLength += chunk.byteLength;

        let msg = {
          chunk: chunk,
          byteStart: byteStart,
          receivedLength: this._receivedLength
        };

        // this._content += String.fromCharCode.apply(null, new Uint8Array(chunk));

        this._sampler.addBytes(chunk.byteLength);
        this.emit(LoaderEvent.PROGRESS, msg);
        this.onProgress && this.onProgress(msg);
        this._pump(reader);
      }
    }).catch(e => {
      this._status = LoaderStatus.ERROR;
      let msg = {
        code: e.code,
        msg: e.message
      };
      this.emit(LoaderEvent.ERROR, msg);
      this.onError && this.onError(msg);
    });
  }
}