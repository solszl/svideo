import Log from '../utils/Log'
import FlvPlayer from './flv/FlvPlayer'
import HlsPlayer from './hls/HlsPlayer'
import NativePlayer from './native/NativePlayer'
import { mixin } from '../utils/util'
import PlayerAPI from '../api/PlayerAPI'
import CommonAPI from '../api/CommonAPI'

/**
 *
 * Created Date: 2019-08-23, 17:37:36 (zhenliang.sun)
 * Last Modified: 2019-08-26, 18:43:09 (zhenliang.sun)
 * Email: zhenliang.sun@gmail.com
 *
 * Distributed under the MIT license. See LICENSE file for details.
 * Copyright (c) 2019 vhall
 */

/**
 * 抽象初始化器
 *
 * @class AbstractInitial
 * @author zhenliang.sun
 */
class AbstractInitial {
  constructor(app) {
    this._context = null
    this._option = null
    this.app = app
  }

  init(context, option = {}) {
    this._context = context
    this._option = option
  }

  /**
   * 创建flv播放器
   *
   * @returns
   * @memberof AbstractInitial
   */
  createFlvPlayer() {
    if (!this.isLive) {
      this.info('warn', '不支持flv格式点播')
      return null
    }

    if (!this.supportMSE) {
      this.info('warn', '不支持MSE')
      return null
    }

    this.option.type = 'flv'
    this.option.store = this.app.store
    let player = new FlvPlayer(this.option, this.option)
    player.initVideo(this.option)
    player._owner = this.app
    player.setStore(this.app.store)
    mixin(this.app, PlayerAPI, player)
    mixin(this.app, CommonAPI, this.store)
    player.initEvents()
    player.attachMediaElement(player.video)
    return player
  }

  /**
   * 创建hls播放器
   *
   * @returns
   * @memberof AbstractInitial
   */
  createHlsPlayer() {
    if (!this.supportMSE) {
      let player = this.createNativePlayer()
      return player
    }

    this.option.store = this.app.store
    let player = new HlsPlayer(this.option)
    player.initVideo(this.option)
    player._owner = this.app
    player.setStore(this.app.store)
    mixin(this.app, PlayerAPI, player)
    mixin(this.app, CommonAPI, this.store)
    player.initEvents()
    return player
  }

  /**
   * 创建本地原生播放器
   *
   * @returns
   * @memberof AbstractInitial
   */
  createNativePlayer() {
    this.option.store = this.app.store
    let player = new NativePlayer()
    player.initVideo(this.option)
    player._owner = this.app
    player.setStore(this.app.store)
    mixin(this.app, PlayerAPI, player)
    mixin(this.app, CommonAPI, this.store)
    player.initEvents()
    return player
  }

  info(type, ...args) {
    Log.OBJ[type](`${args}`)
  }

  get context() {
    return this._context || {}
  }

  get supportMSE() {
    return this.context['supportMSE']
  }

  get option() {
    return this._option
  }

  get isLive() {
    return this._option['isLive']
  }
}

/**
 * 自动判断初始化，根据支持情况进行初始化
 * 点播不支持flv，基本上自动判断初始化规则只用在直播上
 *
 * @export
 * @class AutoDetectInitial
 * @extends {AbstractInitial}
 * @author zhenliang.sun
 */
export class AutoDetectInitial extends AbstractInitial {
  constructor(app) {
    super(app)
  }

  init(context, option = {}) {
    super.init(context, option)
    // 支持mse的 直接就初始化flv播放器, 否则初始化原生播放器
    let player = null
    if (this.supportMSE) {
      player = this.createFlvPlayer()
    } else {
      this.option.type = 'hls'
      player = this.createNativePlayer()
    }

    return player
  }
}

/**
 * 用户自定义初始化器
 *
 * @export
 * @class UserCustomInitial
 * @extends {AbstractInitial}
 * @author zhenliang.sun
 */
export class UserCustomInitial extends AbstractInitial {
  constructor(app) {
    super(app)
  }

  init(context, option = {}) {
    super.init(context, option)
    let player = null
    switch (option['type']) {
    case 'flv':
      player = this.createFlvPlayer()
      break
    case 'hls':
      player = this.createHlsPlayer()
      break
    case 'native':
      player = this.createNativePlayer()
      break
    default:
      break
    }
    return player
  }
}
