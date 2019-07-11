import qs from 'qs'
import { KV } from '../core/Constant'
import Plugin from '../core/Plugin'

const LIVE_CODE = {
  Start: 102001,
  Info: 102002,
  HeartBeat: 102003,
  Error: 104001
}
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

const INFO_PACK_INTERVAL = 30 * 1000

const CALC_PLAY_TIME_INTERVAL = 200

/**
 * 日志上报插件
 *
 * @export
 * @class Reporter
 * @extends {Plugin}
 * @author zhenliang.sun
 */
export default class Reporter extends Plugin {
  constructor() {
    super()
    /** 心跳计时器 */
    this._infoPackInterval = 0
    // 播放时长计时器
    this._playTimeInterval = 0

    this._lagCount = 0
    this.el = null // 用来记录各种url的
    this._bt = 0 // 卡顿时长
    this.basicInfo = {}
    this.enable = true
    this._xhr = new XMLHttpRequest()
    this._infoPackCount = 0 // 24小时直播需要发 60*60*24/30
    this._lastDownloadSize = 0

    this._lastPlayTimeHeartbeat = Date.now()
    this._playInfoDuration = 0
    this._playHeartbeatDuration = 0

    this._lastInfoBt = 0
    this._lastCalcPlayTime = Date.now()
  }

  init(opts = {}) {
    super.init(opts)
    this._allConfig = opts
    this._config = opts[Reporter.type]
    let reporterCfg = JSON.parse(this._config)
    this._domain = reporterCfg.url
    // 竟然需要这么多数据，还只是基础数据 真是醉了
    this.basicInfo = {}
    this.basicInfo.pf = 7
    this.basicInfo.ua = navigator.userAgent
    this.basicInfo.p = reporterCfg.webinar_id || ''
    this.basicInfo.aid = reporterCfg.webinar_id || ''
    this.basicInfo.uid = reporterCfg.uid || ''
    this.basicInfo.s = reporterCfg.session_id || ''
    this.basicInfo.vid = reporterCfg.vid || ''
    this.basicInfo.vfid = reporterCfg.vfid || ''
    this.basicInfo.ndi = reporterCfg.ndi || ''
    this.basicInfo.guid = reporterCfg.guid || ''
    this.basicInfo.vtype = reporterCfg.vtype || ''
    this.basicInfo.topic = reporterCfg.topic || ''
    this.basicInfo.app_id = reporterCfg.app_id || ''
    this.basicInfo.biz_role = reporterCfg.biz_role || ''
    this.basicInfo.flow_type = reporterCfg.flow_type || ''
    this.basicInfo.biz_id = reporterCfg.biz_id || ''
    this.basicInfo.biz_des01 = reporterCfg.biz_des01 || ''
    this.basicInfo.biz_des02 = reporterCfg.biz_des02 || ''
    this.basicInfo.bu = reporterCfg.bu
    this.basicInfo.ver = this.player.version
    this.basicInfo.tf = 0

    this.enable = reporterCfg.enable === undefined ? true : reporterCfg.enable

    // 创建xhr 以及绑定超时和错误事件
    this._buildRocket()
    this._handleCareEvent()
    // this.start();
  }

  destroy() {
    super.destroy()
    clearInterval(this._infoPackInterval)
    clearInterval(this._playTimeInterval)
    this._lagCount = 0
    this._infoPackCount = 0
    this._lastDownloadSize = 0
    this._infoPackCount = 0
    this._lastPlayTimeHeartbeat = Date.now()
    this._lastCalcPlayTime = Date.now()
    this._lastInfoBt = 0
    this.el = null
    if (this._xhr) {
      this._xhr.ontimeout = null
      this._xhr.onerror = null
      this._xhr = null
    }

    this.player = null
  }

  static get type() {
    return 'plugin_reporter'
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
    this._infoPackInterval = setInterval(this._infoPack.bind(this), INFO_PACK_INTERVAL)

    clearInterval(this._playTimeInterval)
    this._lastCalcPlayTime = Date.now()
    this._playTimeInterval = setInterval(this._calcPlayTime.bind(this), CALC_PLAY_TIME_INTERVAL)
  }

  stop() {
    this.info('info', '停止日志上报')
    clearInterval(this._infoPackInterval)
    clearInterval(this._playTimeInterval)
    this.running = false
    this._playInfoDuration = 0
    this._playHeartbeatDuration = 0
  }

  fire(code, obj) {
    if (!this._xhr) {
      this._buildRocket()
    }
    let url = ''
    let p = window.location.protocol

    // 下载量
    this.basicInfo.tf = this.player.downloadSize - this._lastDownloadSize
    this._lastDownloadSize = this.player.downloadSize
    // 播放地址
    this.basicInfo.sd = this.getURLInfo().hostname
    this.basicInfo.fd = this.getURLInfo().pathname
    // 卡顿时长
    this.basicInfo.bt = this._bt
    Object.assign(obj, this.basicInfo)
    let token = btoa(JSON.stringify(obj))
    let param = {
      k: code,
      id: Date.now(),
      s: this.basicInfo.s,
      bu: this.basicInfo.bu,
      token: token
    }

    let queryString = qs.stringify(param)
    if (this._domain.startWith('http')) {
      url = `${this._domain}?${queryString}`
    } else {
      url = `${p}${this._domain}?${queryString}`
    }

    let xhr = this._xhr
    xhr.open('GET', url)
    if (this.enable) {
      this.info('info', '日志参数列表:' + JSON.stringify(param))
      this.info('info', '日志url:' + url)
      xhr.send()
      this.player.emit2All('report', url)
    } else {
      this.info('info', `日志上报配置文件[enable:false],不进行日志上报, code:${code}`)
      this.info('info', `${JSON.stringify(obj)}`)
    }
  }

  _buildRocket() {
    if (!this._xhr) {
      this._xhr = new XMLHttpRequest()
    }

    let xhr = this._xhr
    xhr.timeout = 5000
    xhr.onerror = e => this.info('error', `could not report, code:${e.code}, msg: ${e.message}`)
    xhr.ontimeout = e => this.info('error', `report timeout, code:${e.code}`)
  }

  _handleCareEvent() {
    this.player.on('play', this.__play.bind(this))
    this.player.on('pause', this.__pause.bind(this))
    this.player.on('ended', this.__ended.bind(this))
    this.player.on('lagreport', this.__lag.bind(this))
    this.player.on('lagrecover', this.__lagRecover.bind(this))
    this.player.on('bufferempty', this.__bufferEmpty.bind(this))
    this.player.on('bufferfull', this.__bufferFull.bind(this))
    this.player.on('error', this.__error.bind(this))
    this.player.on('srcchange', this.__srcChange.bind(this))
    this.player.once('ready', this.__ready.bind(this))
  }

  _infoPack() {
    let obj = {}
    // 信息报每隔30秒派发一个
    if (this.isLive) {
      obj.si = ''
      obj.bt = this._bt
      // 根据直播状态， 如果当前可播放， 那么上报2002 否则上报4001
      obj.errCode = this.player.readyState === 4 ? 2002 : 4001
      obj.tt = this._playInfoDuration
      obj.bc = this._lagCount

      this.fire(LIVE_CODE.Info, obj)
      this._bt = 0
    } else {
      obj.tt = this._playInfoDuration
      obj.bc = this._lagCount
      obj.bt = this._bt
      this.fire(VOD_CODE.Info, obj)
      this._lastInfoBt = this._bt
    }

    // 心跳包每分钟派发一个
    // xhr 如果同一时刻发送相同地址的请求，会主动cancel前一个，所以延迟发送消息
    if (this._infoPackCount & 1) {
      obj.tt = this._playHeartbeatDuration
      if (this.isLive) {
        delete obj.bt // 心跳包没有bt
        this.delayCall(LIVE_CODE.HeartBeat, obj)
        this._lagCount = 0
      } else {
        this.delayCall(VOD_CODE.HeartBeat, obj)
        // 如果有卡顿次数， 发送卡顿汇报
        if (this._lagCount > 0) {
          obj.bc = this._lagCount
          obj.bt = this._bt + this._lastInfoBt
          this.delayCall(VOD_CODE.Lag, obj)
        }
        this._lagCount = 0
        this._lastInfoBt = 0
        this._bt = 0
      }
      this._playHeartbeatDuration = 0
    }

    this._infoPackCount += 1
    this._playInfoDuration = 0
  }

  __play(e) {
    if (!this.running) {
      this.start()
    }

    if (!this.isLive) {
      this.fire(VOD_CODE.Resume, {})
    }
  }

  __pause(e) {
    if (!this.isLive) {
      this.fire(VOD_CODE.Pause, {})
    }

    if (this.running) {
      this.stop()
    }
  }

  __ended(e) {
    // 播放完毕的时候，就不在进行心跳了
    this.stop()
  }

  __lag(e) {
    this._lagCount += 1

    // 一次卡顿 增加 4秒卡顿时长
    this._bt += +this._allConfig.lagThreshold * 1000
    clearInterval(this._playTimeInterval)
  }

  __lagRecover(t) {
    this.info('info', `卡顿恢复了，消耗了${t}ms`)
    this._bt += t
    clearInterval(this._playTimeInterval)
    this._lastCalcPlayTime = Date.now()
    this._playTimeInterval = setInterval(this._calcPlayTime.bind(this), CALC_PLAY_TIME_INTERVAL)
  }

  __bufferEmpty() {
    clearInterval(this._playTimeInterval)
  }

  __bufferFull(t) {
    clearInterval(this._playTimeInterval)
    this._lastCalcPlayTime = Date.now()
    this._playTimeInterval = setInterval(this._calcPlayTime.bind(this), CALC_PLAY_TIME_INTERVAL)
  }

  __ready() {
    // 播放器初始化完成
    let code = this.isLive ? LIVE_CODE.Start : VOD_CODE.Start
    this.fire(code, {})
  }

  __error(e) {
    // 错误处理
    if (this.isLive && this.player.currentTime < 1) {
      this.fire(LIVE_CODE.Error, {
        si: '',
        errcode: '4001'
      })
    }
  }

  __srcChange(e) {
    if (e.oldUrl === '') {
      return
    }
    this.info('info', `换线了，${e}`)
    clearInterval(this._infoPackInterval)
    clearInterval(this._playTimeInterval)
    this.running = false
    // 发送信息报、重置一些状态、记录时间点
    this._infoPackCount = 0
    this._infoPack()
    this._lagCount = 0
    this._infoPackCount = 0
    this._playHeartbeatDuration = 0
    this._playInfoDuration = 0
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

  get isLive() {
    return this._allConfig.isLive
  }

  delayCall(code, obj) {
    setTimeout(() => {
      this.fire(code, obj)
    }, 50)
  }

  _calcPlayTime() {
    const elapsedTime = Date.now() - this._lastCalcPlayTime
    this._playInfoDuration += elapsedTime
    this._playHeartbeatDuration += elapsedTime
    this._lastCalcPlayTime = Date.now()
  }
}
