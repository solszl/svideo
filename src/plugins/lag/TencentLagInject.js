/**
import { isSupported } from "./../../player/hls/is-supported";
 * 腾讯内核 卡顿注入器
 *  限定于安卓
 * @export
 * @class TencentLagInject
 * @author zhenliang.sun
 */
export default class TencentLagInject {
  constructor(lagThreshold) {
    this._lagThreshold = lagThreshold
    this._lastTime = 0
  }

  /**
   * 如果是安卓浏览器下的腾讯系软件
   *
   * @static
   * @returns
   * @memberof TencentLagInject
   */
  static isSupported() {
    let ua = navigator.userAgent.toLowerCase()
    let isAndroid = ua.match(/android|adr/i)
    let isTencent = ua.match(/mqqbrowser|qzone|qqbrowser|qq/i)

    return isAndroid && isTencent
  }

  destroy() {
    this._lastTime = 0
    this._timeCount = 0
    this._lagThreshold = 0
  }

  isLag(t) {
    let currentTime = t >>> 0
    if (this._lastTime !== currentTime) {
      this._lastTime = currentTime
      this._timeCount = 0
    } else {
      this._timeCount += 1
    }

    // 每400毫秒检查一次
    if (this._timeCount * 0.4 > this._lagThreshold) {
      this._lastTime = currentTime
      this._timeCount = 0
      return true
    }
    return false
  }
}
