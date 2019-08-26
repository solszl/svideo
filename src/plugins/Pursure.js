import Plugin from '../core/Plugin'
import TencentInject from './lag/TencentInject'
import { PlayerEvent } from './../PlayerEvents'

/**
 *
 * Created Date: 2019-08-22, 15:57:34 (zhenliang.sun)
 * Last Modified: 2019-08-26, 19:09:31 (zhenliang.sun)
 * Email: zhenliang.sun@gmail.com
 *
 * Distributed under the MIT license. See LICENSE file for details.
 * Copyright (c) 2019 vhall
 */

/**
 * 追播插件
 *
 * @export
 * @class Pursue
 * @author zhenliang.sun
 */
export default class Pursue extends Plugin {
  constructor() {
    super()

    this.bufferMax = -1
    this.remain = 2
    this.speed = 1.2

    this._isPursuing = false
  }

  init(opts = {}) {
    super.init(opts)
    this._allConfig = opts
    this.pursueConfig = JSON.parse(opts[Pursue.type])

    if (!this.pursueConfig['enable']) {
      this.info('info', '未启用追播功能')
      return
    }

    this._isLive = opts['isLive']

    // 点播活动不进行追播
    if (!this._isLive) {
      this.info('info', '点播活动不进行追播策略')
      return
    }

    // 腾讯安卓系列, 追播模式为倍速播放。不进行追播
    if (TencentInject.isSupported() && this.pursueConfig['mode'] === 'pursue') {
      this.info('info', '腾讯安卓系列不进行追播,x5内核不支持')
      return
    }

    this.bufferMax = this.pursueConfig['bufferMax']
    this.remain = this.pursueConfig['remain']
    this.speed = this.pursueConfig['pursueSpeed']

    this.info('info', `Buffer最大缓冲时长:${this.bufferMax}s, 以${this.speed}倍速追到剩${this.remain}s结束.`)
    this._handleEvents()
  }

  _handleEvents() {
    this.player.on(PlayerEvent.TIMEUPDATE, this.__onTimeupdate.bind(this))
    this.player.on(PlayerEvent.BUFFER_EMPTY, this.__onBufferEmpty.bind(this))
  }

  __onTimeupdate(e) {
    // 判断是否需要进行追播
    // 1: 判断buffer最大值， 2：判断当前倍速，3:判断当前时间与buffer差值时间
    const player = this.player
    const buffered = player.getBuffered()
    const bufferedLen = buffered.length
    let buffer = bufferedLen >= 1 ? buffered.end(bufferedLen - 1) : 0
    // 计算时差
    let elapsed = buffer - player.getCurrentTime()
    // 如果超过最大值 或者 追播过程中但是还没追到
    if (elapsed > this.bufferMax || (this.isPursuing && elapsed > this.remain)) {
      // 根据追播模式，选择追播还是跳播
      const mode = this.pursueConfig['mode']
      switch (mode) {
      case 'pursue':
        this.run()
        break
      case 'seek':
        this.jumpTo(buffer - this.remain)
        break
      default:
        this.info('warn', `位置追播类型${mode}`)
        break
      }
    } else {
      this.walk()
    }

    this.info('info', `当前${player.getCurrentTime()},剩余${buffer},差值${elapsed},是否正在追${this.isPursuing}`)
  }

  __onBufferEmpty(e) {
    this.walk()
  }

  /**
   * 开始追博
   *
   * @memberof Pursue
   */
  run() {
    if (this.isPursuing) {
      return
    }

    this._isPursuing = true
    this.player.setPlaybackRate(this.speed)
  }

  /**
   * 停止追播，正常播放
   *
   * @memberof Pursue
   */
  walk() {
    if (!this.isPursuing) {
      return
    }

    this._isPursuing = false
    this.player.setPlaybackRate(1)
  }

  /**
   * seek 类型追播
   *
   * @memberof Pursue
   */
  jumpTo(t) {
    if (this.isPursuing) {
      return
    }

    if (t <= 0) {
      t = 0
    }

    this.player.setCurrentTime(t)
  }

  destroy() {
    super.destroy()
    this.bufferMax = -1
    this.remain = 2
    this.speed = 1.2
    this._isPursuing = false

    // 清理事件监听
    this.player.off(PlayerEvent.TIMEUPDATE, this.__onTimeupdate)
    this.player.off(PlayerEvent.BUFFER_EMPTY, this.__onBufferEmpty)
    this.player = null
  }

  /**
   * 是否正在处于追播状态
   *
   * @readonly
   * @memberof Pursue
   */
  get isPursuing() {
    return this._isPursuing
  }

  static get type() {
    return 'plugin_pursue'
  }
}
