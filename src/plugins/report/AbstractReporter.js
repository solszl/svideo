/**
 *
 * Created Date: 2019-07-24, 16:27:13 (zhenliang.sun)
 * Last Modified: 2019-11-14, 10:36:22 (zhenliang.sun)
 * Email: zhenliang.sun@gmail.com
 *
 * Distributed under the MIT license. See LICENSE file for details.
 * Copyright (c) 2019 vhall
 */
import Log from '../../utils/Log'
import Component from './../../core/Component'
import { KV } from './../../core/Constant'
import { PlayerEvent } from './../../PlayerEvents'
import Http from './Http'

const CALC_PLAY_TIME_INTERVAL = 200
/**
 * 抽象日志发送类
 *
 * @export
 * @class AbstractReporter
 * @author zhenliang.sun
 */
export default class AbstractReporter extends Component {
  constructor() {
    super()
    this.url = ''
    this.body = {}
    this.enable = false
    this.allConfig = null
    this._config = null
    this._player = null
    this.running = false

    /** 心跳计时器 */
    this._infoPackInterval = 0
    // 播放时长计时器
    this._playTimeInterval = 0
    /** 信息包个数 */
    this._infoPackCount = 0 // 24小时直播需要发 60*60*24/30

    this._playHeartbeatDuration = 0
    this._playInfoDuration = 0

    /** 卡顿次数 */
    this._lagCount = 0
    /** 卡顿时长 */
    this._bt = 0
    /** 上一个信息包下载量 */
    this._lastInfoDownloadSize = 0
    /** 上一个心跳包下载量 */
    this._lastHeartbeatDownloadSize = 0

    this._lastCalcPlayTime = Date.now()

    this.reportInterval = 30 * 1000
  }

  set reportConfig(val) {
    if (typeof val === 'string') {
      val = JSON.parse(val)
    }

    this._config = val
    let cfg = this._config
    this.url = cfg.url
    this.enable = cfg.enable === undefined ? true : cfg.enable
    let pf = 7
    if (this.player) {
      let context = this.player.context
      pf = context.platform === 'pc' ? 7 : 10
    }
    this.body.pf = pf
    this.body.ua = navigator.userAgent
    this.body.p = cfg.webinar_id || ''
    this.body.aid = cfg.webinar_id || ''
    this.body.uid = cfg.uid || ''
    this.body.s = cfg.session_id || ''
    this.body.vid = cfg.vid || ''
    this.body.vfid = cfg.vfid || ''
    this.body.ndi = cfg.ndi || ''
    this.body.guid = cfg.guid || ''
    this.body.vtype = cfg.vtype || ''
    this.body.topic = cfg.topic || ''
    this.body.app_id = cfg.app_id || ''
    this.body.biz_role = cfg.biz_role || ''
    this.body.flow_type = cfg.flow_type || ''
    this.body.biz_id = cfg.biz_id || ''
    this.body.biz_des01 = cfg.biz_des01 || ''
    this.body.biz_des02 = cfg.biz_des02 || ''
    this.body.bu = cfg.bu

    let interval = parseInt(cfg.interval) <= 0 ? 1 : +cfg.interval
    this.reportInterval = interval * 1000 || 30 * 1000
  }

  set player(p) {
    this._player = p
    this._handleCareEvent()
  }

  get player() {
    return this._player
  }

  _handleCareEvent() {
    this.player.on(PlayerEvent.PLAY, this.__play.bind(this))
    this.player.on(PlayerEvent.PAUSE, this.__pause.bind(this))
    this.player.on(PlayerEvent.PLAY_END, this.__ended.bind(this))
    this.player.on('lagreport', this.__lag.bind(this))
    this.player.on('lagrecover', this.__lagRecover.bind(this))
    this.player.on('bufferempty', this.__bufferEmpty.bind(this))
    this.player.on('bufferfull', this.__bufferFull.bind(this))
    this.player.on('error', this.__error.bind(this))
    this.player.on(PlayerEvent.SRC_CHANGED, this.__srcChange.bind(this))
    this.player.once(PlayerEvent.READY, this.__ready.bind(this))
    this.player.on(PlayerEvent.OVER, this.__over.bind(this))
  }

  __play(e) {
    if (!this.running) {
      this.start()
    }
  }

  __pause(e) {
    if (this.running) {
      this.stop()
    }
  }

  __ended(e) {
    // 播放完毕的时候，就不在进行心跳了
    this.stop()
  }

  __over(b) {
    if (b) {
      this.stop()
    }
  }

  __lag(e) {
    this._lagCount += 1
    // 一次卡顿 增加 4秒卡顿时长
    this._bt += +this.allConfig.lagThreshold * 1000
    clearInterval(this._playTimeInterval)
  }

  __lagRecover(t) {
    this.info('info', `卡顿恢复了，消耗了${t}ms`)
    this._bt += t
    clearInterval(this._playTimeInterval)
    this._lastCalcPlayTime = Date.now()
    this._playTimeInterval = setInterval(this.calcPlayTime.bind(this), CALC_PLAY_TIME_INTERVAL)
  }

  __bufferEmpty() {
    clearInterval(this._playTimeInterval)
  }

  __bufferFull(e) {
    clearInterval(this._playTimeInterval)
    this._lastCalcPlayTime = Date.now()
    this._playTimeInterval = setInterval(this.calcPlayTime.bind(this), CALC_PLAY_TIME_INTERVAL)
  }

  __ready() {}

  __error(e) {}

  __srcChange(e) {
    if (e.oldValue === '') {
      return
    }
    this.info('info', `换线了，${e}`)
    clearInterval(this._infoPackInterval)
    clearInterval(this._playTimeInterval)
    this.running = false
    // 发送信息报、重置一些状态、记录时间点
    this._infoPackCount = 0
    this.infoPack()
    this._lagCount = 0
    this._infoPackCount = 0
    this._playHeartbeatDuration = 0
    this._playInfoDuration = 0
    this._lastInfoDownloadSize = 0
  }

  start() {
    if (this.running) {
      return
    }

    this.info('info', '启动日志上报')
    this.running = true
    this._playHeartbeatDuration = 0
    this._playInfoDuration = 0
    clearInterval(this._infoPackInterval)
    clearInterval(this._playTimeInterval)

    this._infoPackInterval = setInterval(this.infoPack.bind(this), this.reportInterval)
    this._playTimeInterval = setInterval(this.calcPlayTime.bind(this), CALC_PLAY_TIME_INTERVAL)
    this._lastCalcPlayTime = Date.now()
  }

  stop() {
    this.info('info', '停止日志上报')
    this.running = false
    this._playInfoDuration = 0
    this._playHeartbeatDuration = 0
    clearInterval(this._infoPackInterval)
    clearInterval(this._playTimeInterval)
  }

  /**
   * 销毁
   *
   * @memberof AbstractReporter
   */
  destroy() {
    super.destroy()
    this._playInfoDuration = 0
    this._playHeartbeatDuration = 0
    clearInterval(this._infoPackInterval)
    clearInterval(this._playTimeInterval)

    this._infoPackCount = 0
    this._lagCount = 0
    this.Info = 0

    this._lastInfoDownloadSize = 0
    this._lastHeartbeatDownloadSize = 0

    this._lastCalcPlayTime = Date.now()
  }

  /**
   * 信息包
   *
   * @memberof AbstractReporter
   */
  infoPack() {
    if (this._infoPackCount & 1) {
      this.heartBeatPack()
    }

    this._infoPackCount += 1
    this._playInfoDuration = 0
  }

  /**
   * 心跳包
   *
   * @memberof AbstractReporter
   */
  heartBeatPack() {
    this._playHeartbeatDuration = 0
  }

  calcPlayTime() {
    const elapsedTime = Date.now() - this._lastCalcPlayTime
    this._playInfoDuration += elapsedTime
    this._playHeartbeatDuration += elapsedTime
    this._lastCalcPlayTime = Date.now()
  }

  fire(code, obj = {}) {
    if (this.url === '') {
      this.info('error', 'report domain is null')
      return
    }

    if (!this.url.startsWith('http')) {
      let p = window.location.protocol
      this.url = `${p}${this.url}`
    }

    this.body.ver = this.player.version
    // 播放地址
    let el = this.getURLInfo()
    this.body.sd = el.host
    this.body.fd = el.pathname
    Object.assign(obj, this.body)

    let param = {
      k: code,
      id: Date.now(),
      s: this.body.s,
      bu: this.body.bu,
      token: btoa(JSON.stringify(obj))
    }

    if (this.enable) {
      let http = new Http()
      // http.onError = e => this.info('error', 'could not report')
      http.onTimeout = e => this.info('error', 'report timeout')
      http.fire(this.url, param)
      this.info('info', '日志参数列表')
    } else {
      this.info('info', `日志上报配置文件[enable:false],不进行日志上报, code:${code}`)
    }

    Log.OBJ.table(obj)
  }

  /**
   * 返回Location对象
   *
   * @memberof Reporter
   * @returns Location 对象
   */
  getURLInfo() {
    const { store } = this.player
    let url = store.getKV(KV.URL)
    if (!this.el) {
      this.el = document.createElement('a')
    }
    let el = this.el
    el.href = url
    return el
  }
}
