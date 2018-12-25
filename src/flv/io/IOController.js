import Exception from '../../error/Exception';
import Component from './../core/Component';
import {
  LoaderEvent
} from './BaseLoader';
import LoaderFetch from './LoaderFetch';
import LoaderXHR from './LoaderXHR';
/**
 *
 *
 * @export
 * @class IOController
 * @extends {Component}
 * @author  zhenliang.sun
 */
export default class IOController extends Component {
  constructor(dataSource, config, extraData) {
    super();

    this._paused = false;

    this._config = config;
    this._loader = null;
    this._loaderClass = null;
    this.seekHandler = null;
    this._selectLoader();
    this._createLoader();
  }

  open(from) {
    this._currentRange = {
      from: from ? from : 0,
      to: -1
    };

    this._loader.open();
  }

  abort() {
    this._loader.abort();
  }

  _selectLoader() {
    if (LoaderFetch.isSupported()) {
      this._loaderClass = LoaderFetch;
    } else if (LoaderXHR.isSupported()) {
      this._loaderClass = LoaderXHR;
    } else {
      throw new Exception('unsupported xhr with arraybuffer responseType');
    }
  }

  _createLoader() {
    this._loader = new this._loaderClass();
    this._loader.option = this._config;
    this._loader.url = this._config.url;

    this._loader.on(LoaderEvent.CONTENT_LENGTH, this._contentLengthKnown.bind(this));
    this._loader.on(LoaderEvent.PROGRESS, this._onProgress.bind(this));
    this._loader.on(LoaderEvent.COMPLETE, this._onComplete.bind(this));
    this._loader.on(LoaderEvent.ERROR, this._onError.bind(this));
  }

  _contentLengthKnown(len) {}
  _onComplete(e) {}
  _onError(e) {}
  _onProgress(msg) {
    let {
      chunk,
      byteStart,
      receivedLength
    } = msg;

    if (this._paused) {
      return;
    }

  }

}