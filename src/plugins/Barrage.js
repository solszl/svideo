import Plugin from '../core/Plugin';
import {
  removeFromParent,
  createElement,
  appendChild
} from '../utils/Dom';
import BarrageCore from './barrage/BarrageCore';

/**
 * 弹幕插件
 *
 * @export
 * @class Barrage
 * @extends {Plugin}
 * @author zhenliang.sun
 */
export default class Barrage extends Plugin {
  constructor() {
    super();
    this._allConfig = null;
    this._core = null;
    this._isOpen = false;
    this.cvs = null;
  }

  init(opts = {}) {
    super.init(opts);
    this._allConfig = opts;
    this._barrageCfg = JSON.parse(opts[Barrage.type]);
    let barrageCfg = this._barrageCfg;
    if (barrageCfg.enable === false) {
      return;
    }

    this._createBarrage(barrageCfg);
    this._defineMethods();
    this._initPlayerEvents();
  }

  static get type() {
    return 'plugin_barrage';
  }

  destroy() {
    super.destroy();
    // 取消函数监听
    this.player.off('play', this._play);
    this.player.off('pause', this._pause);
    this.player.off('ended', this._ended);

    this._core.destroy();
    this._core = null;
    removeFromParent(this.cvs);
    this.cvs = null;
  }

  /**
   * 创建弹幕容器
   *
   * @param {*} [cfg=null]
   * @memberof Barrage
   */
  _createBarrage(cfg = null) {
    this.cvs = createElement('canvas', {
      id: 'vh-barrage',
    });

    this.cvs.style.position = 'absolute';
    const parent = document.getElementById(this._allConfig['id']);
    this.cvs.setAttribute('width', parent.clientWidth);
    this.cvs.setAttribute('height', parent.clientHeight);
    this.cvs.style.pointerEvents = 'none';
    appendChild(this._allConfig['id'], this.cvs);

    this._core = new BarrageCore();
    this._core.regRenderer('normal', this.cvs, cfg);
  }

  /**
   * 定义公共接口
   *
   * @memberof Barrage
   */
  _defineMethods() {
    this.player.__proto__.addBarrage = this._addBarrage.bind(this);
    this.player.__proto__.clearBarrage = this._clearBarrage.bind(this);
    this.player.__proto__.openBarrage = this._openBarrage.bind(this);
    this.player.__proto__.closeBarrage = this._closeBarrage.bind(this);
    let core = this._core;
    // Object.defineProperty(this.player, 'barrageFPS', {
    //   get() {
    //     return core.fps;
    //   },
    //   configurable: true
    // });

    // Object.defineProperty(this.player, 'barragePosition', {
    //   writable: true,
    //   configurable: true,
    //   enumerable: true,
    //   value: core.position
    // });
    // Object.defineProperty(this.player, 'barrageAlpha', {

    // });
    // Object.defineProperty(this.player, 'barrageFontSize', {

    // });
    // Object.defineProperty(this.player, 'barrageColor', {

    // });

    // let self = this;
    // const defProperty = (propertyName, value, readOnly = false) => {
    //   Object.defineProperty(self.player, propertyName, {
    //     configurable: true,
    //     enumerable: true,
    //     writable: !readOnly,
    //     value: value
    //   });
    // };

    // defProperty('barrageFPS', core.fps, true);
    // defProperty('barragePosition', core.position);
    // defProperty('barrageAlpha', core.alpha);
    // defProperty('barrageFontSize', core.fontsize);
    // defProperty('barrageColor', core.color);

    let barrageFPS = core.fps;
    let barragePosition = core.position;
    let barrageAlpha = core.alpha;
    let barrageFontsize = core.fontsize;
    let barrageColor = core.color;
    const properties = {
      barrageFPS,
      barragePosition,
      barrageAlpha,
      barrageFontsize,
      barrageColor
    };
    for (const key in properties) {
      Object.defineProperty(this.player, key, {
        get: function () {
          return properties[key];
        },
        set: function (newValue) {
          properties[key] = newValue;
          const prop = key.toLocaleLowerCase().replace('barrage', '');
          core[prop] = newValue;
        }
      });
    }
  }

  /**
   * 监听播放器事件，播放，暂停，结束等
   *
   * @memberof Barrage
   */
  _initPlayerEvents() {
    this.player.on('play', this._play.bind(this));
    this.player.on('pause', this._pause.bind(this));
    this.player.on('ended', this._ended.bind(this));
  }


  _addBarrage(content, type = 'normal') {
    if (this._isOpen === false) {
      this.info('info', '尚未启动弹幕');
      return false;
    }
    // this.info('info', content);
    this._core.add(content, type);
    return true;
  }

  _openBarrage() {
    this.info('info', '启动弹幕');
    this._isOpen = true;
    this._core.start();
  }
  _closeBarrage() {
    this.info('info', '关闭弹幕');
    this._isOpen = false;
    let core = this._core;
    core.stop();
    core.clear();
  }

  _clearBarrage() {
    this.info('info', '清空弹幕');
    this._core.clear();
  }

  _play() {
    let core = this._core;
    if (core.isRunning) {
      core.resume();
    } else {
      core.start();
    }
  }
  _pause() {
    this._core.pause();
  }
  _ended() {
    let core = this._core;
    core.stop();
    core.clear();
  }
}