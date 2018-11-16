import Plugin from '../core/Plugin';

/**
 * 多语言
 *
 * @class I18N
 * @extends {Plugin}
 * @author zhenliang.sun
 */
export default class I18N extends Plugin {
  constructor() {
    super();
    this.lang = {};
  }

  init(opts = {}) {
    super.init(opts);

    this.language = 'en';

    // 如果不是英文，load 远端

    Object.defineProperty(this, 'i18n', {
      get: () => {
        return this.lang[this.language] || this.lang['en'];
      },
      set: (v) => {
        if (typeof v === 'object') {
          Object.keys(v).forEach(key => {
            this.lang[key] = v[key];
          });
        }
      }
    });
  }

  static get type() {
    return 'plugin_i18n';
  }
}