import Plugin from '../core/Plugin';

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
  }

  init(opts = {}) {
    super.init(opts);
    this._allConfig = opts;
    let watermarkCfg = this._allConfig.watermark;
    /* {
      url:'http://abc.com/1.jpg',
      align:'tl | rl | bl | br',
      position: ['10px','10px'],
      size: ['48px','48px']
    }*/
  }
}