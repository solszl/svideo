/**
 * 播放器基类
 *
 * @export
 * @class BasePlayer
 * @author zhenliang.sun
 */
export default class BasePlayer {

  constructor() {
    this._type = "base";
    this[create_default_config]();
  }

  create_default_config() {
    let cfg = {};
    cfg.isLive = false;
    return cfg;
  }

  /**
   *
   * 是否是直播
   * @readonly
   * @memberof BasePlayer
   */
  get isLive() {
    return this._isLive;
  }

  get type() {
    return this._type;
  }
}

const create_default_config = Symbol("create_default_config");