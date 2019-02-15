import Tween from './Tween';

/**
 * 基础渲染器
 *
 * @export
 * @class BaseRenderer
 * @author zhenliang.sun
 */
export default class BaseRenderer {
  constructor(cvs, opt = {}) {
    this.type = 'BASE-RENDERER';
    this.canvas = cvs;
    this.opt = opt;
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    // 渲染数据的对象池
    this.itemPool = [];
    this._data = [];
    this._pause = false;

    this.tween = new Proxy(new Tween(), {
      get: (target, key) => {
        if (typeof target[key] === 'function') {
          return target[key].bind(target);
        }
        return target[key];
      }
    });
  }

  update(w, h, t) {}

  initStyle() {

  }

  pause() {
    this._pause = true;
  }

  resume() {
    this._pause = false;
  }

  destory() {

  }

  add(content) {

  }

  clearRect() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  clearData() {
    this._data = [];
  }

  resize(w, h) {
    this.canvas.width = w;
    this.canvas.height = h;
    this.width = w;
    this.height = h;
  }

  invalidateSize() {
    this.globalChanged = true;
  }

  get data() {
    return this._data || [];
  }
}