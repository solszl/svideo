import Plugin from '../core/Plugin';
import {
  createElement,
  appendChild
} from '../utils/Dom';

/**
 * 水印组件
 *
 * @export
 * @class Watermark
 * @extends {Plugin}
 * @author zhenliang.sun
 */
export default class Watermark extends Plugin {
  constructor() {
    super();
    this.elImage = null;
  }

  init(opts = {}) {
    super.init(opts);
    this._allConfig = opts;
    this._watermarkCfg = JSON.parse(opts[Watermark.type]); // JSON.parse(this._allConfig.watermark);
    let watermarkCfg = this._watermarkCfg;
    if (watermarkCfg.enable === false) {
      return;
    }
    this._createWatermark(watermarkCfg);

    /* {
      url:'http://abc.com/1.jpg',
      align:'tl | rl | bl | br',
      position: ['10px','10px'],
      size: ['48px','48px']
    }*/
  }

  static get type() {
    return 'plugin_watermark';
  }

  destroy() {
    super.destroy();
  }

  /**
   * 根据配置生成水印
   *
   * @param {*} [cfg=null]
   * @memberof Watermark
   */
  _createWatermark(cfg = null) {
    const {
      url,
      align,
      position,
      size
    } = cfg;

    const p = this._analysisPosition(align, position);
    this.elImage = createElement('img', {
      id: 'vh-watermark',
      src: url,
    });
    appendChild(this._allConfig['id'], this.elImage);

    this.elImage.style.position = 'absolute';
    Object.assign(this.elImage.style, p);
    Object.assign(this.elImage.style, {
      width: size[0],
      height: size[1]
    });
  }

  _analysisPosition(a, p) {
    let xpos = '10px';
    let ypos = '10px';
    if (!Array.isArray(p)) {
      this.info('warn', `could not resolve position paramter, ${p}`);
      return {
        left: xpos,
        top: ypos
      };
    } else {
      xpos = p[0];
      ypos = p[1];
    }

    let result = {};
    const alphabets = a.toLowerCase().split('');
    alphabets.forEach(ab => {
      switch (ab) {
      case 't':
        result.top = ypos;
        break;
      case 'b':
        result.bottom = ypos;
        break;
      case 'l':
        result.left = xpos;
        break;
      case 'r':
        result.right = xpos;
        break;
      default:
        result.left = xpos;
        result.top = ypos;
        break;
      }
    });
    return result;
  }
}