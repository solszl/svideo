import AbstractReporter from './AbstractReporter'

/**
 *
 * Created Date: 2019-07-24, 16:33:29 (zhenliang.sun)
 * Last Modified: 2019-07-25, 13:38:00 (zhenliang.sun)
 * Email: zhenliang.sun@gmail.com
 *
 * Distributed under the MIT license. See LICENSE file for details.
 * Copyright (c) 2019 vhall
 */

const LIVE_CODE = {
  Start: 102001,
  Info: 102002,
  HeartBeat: 102003,
  Error: 104001
}

/**
 * 直播日志上报
 *
 * @export
 * @class LiveReporter
 * @extends {AbstractReporter}
 * @author zhenliang.sun
 */
export default class LiveReporter extends AbstractReporter {
  constructor() {
    super()
  }

  __ready() {
    super.__ready()
    this.fire(LIVE_CODE.Start)
  }

  __error(e) {
    super.__error(e)
    this.fire(LIVE_CODE.Error, {
      si: '',
      errcode: '4001'
    })
  }

  infoPack() {
    let obj = {}
    obj.si = ''
    obj.bt = this._bt
    obj.errCode = this.player.getReadyState() === 4 ? 2002 : 4001
    obj.tt = this._playInfoDuration
    obj.bc = this._lagCount

    let downloadSize = this.player.getDownloadSize()
    obj.tf = downloadSize - this._lastInfoDownloadSize
    // 记录上一个信息包的下载量
    this._lastInfoDownloadSize = downloadSize
    this.fire(LIVE_CODE.Info, obj)
    this._bt = 0
    super.infoPack()
  }

  heartBeatPack() {
    let obj = {}
    obj.si = ''
    obj.errCode = this.player.getReadyState() === 4 ? 2002 : 4001
    obj.tt = this._playHeartbeatDuration
    obj.bc = this._lagCount
    let downloadSize = this.player.getDownloadSize()
    obj.tf = downloadSize - this._lastHeartbeatDownloadSize
    // 记录上一个心跳包的下载量
    this._lastHeartbeatDownloadSize = downloadSize
    this.fire(LIVE_CODE.HeartBeat, obj)
    super.heartBeatPack()
  }
}
