import Component from './Component'

/**
 * 插件基类，所有的功能插件均继承自Plugin
 *
 * @export
 * @class Plugin
 * @extends {Component}
 * @author zhenliang.sun
 */
export default class Plugin extends Component {
  constructor() {
    super()
    this._player = null
  }

  /**
   * 根据配置进行初始化
   *
   * @param {*} [opts={}]
   * @memberof Plugin
   */
  async init(opts = {}) {}

  setSize(w, h) {}

  get player() {
    return this._player
  }

  set player(p) {
    this._player = p
  }

  async initComplete() {}

  static get type() {
    return 'BASE_PLUGIN'
  }
}
