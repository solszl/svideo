import NormalRenderer from './NormalRenderer';
import Component from '../../core/Component';

const requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame;
// 私有函数内部循环
const loop = Symbol('barrage-loop');
/**
 *  弹幕核心类
 *
 * @export
 * @class BarrageCore
 * @author zhenliang.sun
 */
export default class BarrageCore extends Component {
  constructor() {
    super();
    this._fps = 0;
    this.renderers = [];
    this.running = false;
    this[loop]();

    this.normalRenderer = null;
  }

  [loop](elapsed = new Date().getTime()) {
    let now = new Date().getTime();
    if (!this.running) {
      this.renderers.forEach(renderer => {
        let r = renderer.renderer;
        r.clearRect();
      });
      return;
    }
    let elapsedTime = now - elapsed;
    let w = this.width;
    let h = this.height;
    this.renderers.forEach(renderer => {
      let r = renderer.renderer;
      r.update(w, h, elapsedTime);
    });
    this._fps = 1000 / elapsedTime >> 0;
    requestAnimationFrame(() => this[loop](now));
  }

  /**
   * 注册渲染器
   *
   * @memberof Barrage
   */
  regRenderer(type, canvas, opt = {}) {
    let r;

    this.width = canvas.clientWidth;
    this.height = canvas.clientHeight;

    switch (type) {
    case 'normal':
      r = new NormalRenderer(canvas, opt);
      this.normalRenderer = r;
      break;
    default:
      break;
    }

    if (r === null) {
      return;
    }

    let renderer = {
      id: type + Math.random() * 100 >> 0,
      type: type,
      renderer: r
    };
    this.renderers.push(renderer);
  }

  add(content, type = 'normal') {
    this.renderers.forEach(renderer => {
      if (renderer.type === type) {
        let r = renderer.renderer;
        r.add(content);
      }
    });
  }

  /**
   *
   * 整体开始
   * @returns
   * @memberof Barrage
   */
  start() {
    if (this.running) {
      return;
    }

    this.running = true;
    this[loop]();
  }

  /**
   *
   * 整体停止
   * @memberof Barrage
   */
  stop() {
    this.running = false;
  }

  /**
   *
   * 整体暂停
   * @memberof Barrage
   */
  pause() {
    this.renderers.forEach(renderer => {
      let r = renderer.renderer;
      r.pause();
    });
  }

  /**
   *
   * 整体恢复
   * @memberof Barrage
   */
  resume() {
    this.renderers.forEach(renderer => {
      let r = renderer.renderer;
      r.resume();
    });
  }

  /**
   * 清空画布
   *
   * @memberof BarrageCore
   */
  clear() {
    this.renderers.forEach(renderer => {
      let r = renderer.renderer;
      r.clearData();
      r.clearRect();
    });
  }

  destroy() {
    this.renderers.forEach(renderer => {
      let r = renderer.renderer;
      r.clearData();
      r.clearRect();
      r.destroy();
    });

    this.renderers = [];
    this.running = false;
    this._fps = 0;
  }

  /**
   *
   * 获取当前弹幕的fps
   * @readonly
   * @memberof Barrage
   */
  get fps() {
    return this._fps;
  }

  get isRunning() {
    return this.running;
  }

  get position() {
    return this.normalRenderer.position;
  }

  set position(val) {
    this.normalRenderer.position = val;
  }

  get alpha() {
    return this.normalRenderer.alpha;
  }
  set alpha(val) {
    this.normalRenderer.alpha = val;
  }

  get color() {
    return this.normalRenderer.color;
  }
  set color(val) {
    this.normalRenderer.color = val;
  }

  get fontsize() {
    return this.normalRenderer.fontsize;
  }
  set fontsize(val) {
    this.normalRenderer.fontsize = val;
  }

}