import Log from './../../utils/Log';
import {
  BaseLoader
} from './BaseLoader';

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
  }

  static isSupported() {
    try {
      // 默认系统版本>15048的EDGE 及 其他所有浏览器（非IE）
      return (self.fetch && self.ReadableStream);
    } catch (e) {
      Log.OBJ.warn('unsupported Fetch Loader');
      return false;
    }
  }

  destroy() {
    if (this.isLoading()) {
      this.abort();
    }
    super.destroy();
  }
}