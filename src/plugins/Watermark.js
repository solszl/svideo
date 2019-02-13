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
    let xPos = '10px';
    let yPos = '10px';
    if (!Array.isArray(p)) {
      this.info('warn', `could not resolve position paramter, ${p}`);
      return {
        left: xPos,
        top: yPos
      };
    } else {
      xPos = p[0];
      yPos = p[1];
    }

    let result = {};
    const alphabets = a.toLowerCase().split('');
    alphabets.forEach(ab => {
      switch (ab) {
      case 't':
        result.top = yPos;
        break;
      case 'b':
        result.bottom = yPos;
        break;
      case 'l':
        result.left = xPos;
        break;
      case 'r':
        result.right = xPos;
        break;
      default:
        result.left = xPos;
        result.top = yPos;
        break;
      }
    });
    return result;
  }
}