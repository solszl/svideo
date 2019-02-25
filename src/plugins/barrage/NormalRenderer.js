import BaseRenderer from './BaseRenderer';

const POSITION = {
  0: {
    offsetYPercent: 0.1,
    fillPercent: 0.4
  },
  1: {
    offsetYPercent: 0.3,
    fillPercent: 0.4
  },
  2: {
    offsetYPercent: 0.5,
    fillPercent: 0.4
  },
  3: {
    offsetYPercent: 0.1,
    fillPercent: 0.8
  }
};
/**
 * 基础文本渲染器
 *      用于渲染纯文字
 * @export
 * @class NormalRenderer
 * @extends {BaseRenderer}
 * @author zhenliang.sun
 */
export default class NormalRenderer extends BaseRenderer {
  constructor(cvs, opt = {}) {
    super(cvs, opt);
    this.type = 'NORMAL-RENDERER';
    this.itemPool = [];
    this.tweenType = 'quad';
    this.tweenMethod = this.tween.Linear;
    this.duration = opt.duration * 1000 || 8000;
    this.globalChanged = false;

    this.changeStyle(opt);
    this.initStyle();
    this.position = opt.position;
  }

  changeStyle(opts = {}) {
    // 文本属性保存
    this.fontsize = opts.fontsize || this.fontsize || 18;
    this.font = opts.font || this.font || 'Microsoft YaHei';
    this.color = opts.color || this.color || '#ffffff';
    this.alpha = opts.alpha || this.alpha || 1;
    this.gap = 3;
    this.globalChanged = true;
  }

  initStyle() {
    super.initStyle();
    this.globalChanged = false;
    // 合并font属性
    this.globalFont = `${this.fontsize}px bold ${this.font}`;
    // 更新全局样式
    this.ctx.font = this.globalFont;
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = this.color;
    this.ctx.globalAlpha = this.alpha;
  }

  update(w, h, t) {
    super.update(w, h, t);

    if (this.globalChanged) {
      this.initStyle();
    }
    // 暂停状态不进行任何渲染
    if (this._pause) {
      return;
    }

    this.ctx.clearRect(0, 0, w, h);
    this.ctx.save();

    // 先构建出活着的数组
    this._data = this.data.filter(item => item.live);
    // fill text
    let len = this.data.length;
    // 去掉死掉的弹幕
    for (let i = 0; i < len; i += 1) {
      let item = this.data[i];
      if (!item) {
        continue;
      }
      // 更新item数据
      item.elapsedTime += t;
      // elapsedTime,start,dist,duration
      item.x = this.tween[this.tweenType](this.tweenMethod, item.elapsedTime, w, -item.width - w, item.duration);
      this.ctx.font = this.globalFont;
      this.ctx.fillStyle = this.color;
      // 边界检查、回收, 预留2倍长度像素空间
      if (item.x < -item.width * 2) {
        this._recycle(item);
        continue;
      }
      // 绘制
      this.ctx.fillText(item.data, item.x, item.y);
    }

    this.ctx.restore();
  }

  add(content) {
    super.add(content);
    let itemData = this.itemPool.length > 0 ? this.itemPool.shift() : {};
    itemData.live = true;
    // 计算宽度
    if (this.ctx) {
      itemData.width = this.ctx.measureText(content).width || 200;
    }
    itemData.elapsedTime = 0;
    itemData.data = content;
    itemData.height = this.fontsize;
    itemData.duration = this.duration + Math.pow(-1, Math.random() > 0.5 ? 1 : 0) * (Math.random() * this.duration / 3) >> 0;
    itemData.fillStyle = this.color;
    // 计算轨道
    itemData.y = this._randomRow();
    this._data.push(itemData);
  }

  destroy() {
    super.destory();
    this.itemPool = [];
    this._data = [];
  }

  resize(w, h) {
    super.resize(w, h);
    this._calcRow();
  }

  _recycle(item) {
    item.elapsedTime = 0;
    item.width = 0;
    item.height = 0;
    item.data = '';
    item.x = 0;
    item.y = 0;
    item.row = -1;
    item.duration = 0;
    item.fillStyle = '';
    item.live = false;
    this.itemPool.push(item);
  }

  _calcRow() {
    // this.offsetYPercent // 距离上边距百分比
    // this.height // 当前显示区域的高度
    // this.fillPercent // 填充多少
    // this.gap // 行间距
    // this.fontsize // 行高
    /*
    ------------------------
    |  | offsetYPercent
    |       ---------------
    |       |
    |       | fillPercent
    |       ---------------
    |
    ----------------------------
    */
    let fillHeight = this.height * this.fillPercent;
    this.totalRows = Math.floor(fillHeight / (this.fontsize + this.gap));
  }

  _randomRow() {
    let rowId = Math.floor(Math.random() * this.totalRows);
    let offsetY = this.height * this.offsetYPercent;
    let yPos = rowId * (this.fontsize + this.gap);
    return offsetY + yPos;
  }

  get position() {
    return this._position;
  }

  set position(val) {
    let pos = POSITION[val] || POSITION[0];
    this._position = val;
    const {
      offsetYPercent,
      fillPercent
    } = pos;
    this.offsetYPercent = offsetYPercent || 0.1;
    this.fillPercent = fillPercent || 0.8;
    this._calcRow();
  }

  get alpha() {
    return this._alpha;
  }
  set alpha(val) {
    this._alpha = val;
    this.globalChanged = true;
  }

  get color() {
    return this._color;
  }
  set color(val) {
    this._color = val;
    this.globalChanged = true;
  }

  get fontsize() {
    return this._fontsize;
  }
  set fontsize(val) {
    this._fontsize = val;
    this.globalChanged = true;
  }
}