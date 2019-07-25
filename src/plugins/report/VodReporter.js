import AbstractReporter from './AbstractReporter'

/**
 *
 * Created Date: 2019-07-24, 16:35:45 (zhenliang.sun)
 * Last Modified: 2019-07-25, 13:38:28 (zhenliang.sun)
 * Email: zhenliang.sun@gmail.com
 *
 * Distributed under the MIT license. See LICENSE file for details.
 * Copyright (c) 2019 vhall
 */

const VOD_CODE = {
  /** 初始化完成 */
  Start: 92001,
  Pause: 92002,
  /** 心跳 */
  HeartBeat: 92003,
  Resume: 92004,
  Info: 92005,
  /** 卡顿 */
  Lag: 94001
}

/**
 * 点播日志上报
 *
 * @export
 * @class LiveReporter
 * @extends {AbstractReporter}
 * @author zhenliang.sun
 */
export default class VodReporter extends AbstractReporter {
  constructor() {
    super()
    this._lastInfoBt = 0
  }

  destroy() {
    super.destroy()
    this._lastInfoBt = 0
  }

  __play(e) {
    super.__play(e)
    this.fire(VOD_CODE.Resume)
  }

  __pause(e) {
    this.fire(VOD_CODE.Pause)
    super.__pause(e)
  }

  __ready() {
    super.__ready()
    this.fire(VOD_CODE.Start)
  }

  infoPack() {
    let obj = {}
    obj.tt = this._playInfoDuration
    obj.bc = this._lagCount
    obj.bt = this._bt

    let downloadSize = this.player.getDownloadSize()
    obj.tf = downloadSize - this._lastInfoDownloadSize
    // 记录上一个信息包的下载量
    this._lastInfoDownloadSize = downloadSize

    this.fire(VOD_CODE.Info, obj)
    this._lastInfoBt = this._bt
    super.infoPack()
  }

  heartBeatPack() {
    let obj = {}
    obj.tt = this._playHeartbeatDuration
    obj.bc = this._lagCount
    obj.bt = this._bt

    let downloadSize = this.player.getDownloadSize()
    obj.tf = downloadSize - this._lastHeartbeatDownloadSize
    // 记录上一个心跳包的下载量
    this._lastHeartbeatDownloadSize = downloadSize

    this.fire(VOD_CODE.HeartBeat, obj)

    if (this._lagCount > 0) {
      obj.bc = this._lagCount
      obj.bt = this._bt + this._lastInfoBt
      this.fire(VOD_CODE.Lag, obj)
    }

    this._lagCount = 0
    this._lastInfoBt = 0
    super.heartBeatPack()
  }
}
