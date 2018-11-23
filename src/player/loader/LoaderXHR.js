import Log from './../../utils/Log';
import {
  BaseLoader
} from './BaseLoader';

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
}