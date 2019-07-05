import { VHVideoConfig } from './config'
import Component from './core/Component'
import FlvPlayer from './player/flv/FlvPlayer'
import HlsPlayer from './player/hls/HlsPlayer'
import NativePlayer from './player/native/NativePlayer'
import PlayerProxy from './PlayerProxy'
import PluginMap from './plugins/PluginMap'
import { PlayerEvent } from './PlayerEvents'
import Log from './utils/Log'

/**
 * 播放器模块
 *
 * @export
 * @class VideoModule
 * @extends {Component}
 */
export default class VideoModule extends PlayerProxy {
  constructor() {
    super()
    this.player = null
    this._config = {}
    this.pluginInstance = []
    Log.OBJ.level = process.env.LOG_LEVEL
    // 插件模型核心， 利用proxy， 将业务功能进行分拆， 自身执行一部分， 代理的player执行一部分
    // return new Proxy(this, {
    //   get: function (target, prop, receiver) {
    //     const targetProp = target[prop]
    //     const playerProp = target.player ? target.player[prop] : undefined
    //     if (targetProp !== undefined) {
    //       return targetProp
    //     } else if (playerProp !== undefined) {
    //       return playerProp
    //     } else {
    //       target.info('error', `undefined Method or Property: ${prop}`)
    //       return undefined
    //     }
    //   },
    //   set: function (target, prop, value) {
    //     if (target[prop] !== undefined) {
    //       target[prop] = value
    //       return true
    //     } else if (target.player[prop] !== undefined) {
    //       target.player[prop] = value
    //       return true
    //     } else {
    //       target.info('error', `undefined Method or Property: ${prop}, value:${value}`)
    //       return false
    //     }
    //   }
    // })
  }

  init(option = {}) {
    let config = this._configMapping(option)
    this._config = config
    this._createPlayer()
    this.initPluginListener()
    this._pluginCall()
    this.emit('ready')
  }

  _configMapping(option = {}) {
    let config = {}
    Object.assign(VHVideoConfig, option)
    Object.assign(config, VHVideoConfig)
    switch (config.type) {
    case 'flv':
      config.url = option.flvurl
      config.lazyLoadMaxDuration = VHVideoConfig.maxBufferTime
      break
    case 'hls':
      config.url = option.hlsurl
      if (!HlsPlayer.isSupported()) {
        config.url = this._config.hlsurl
      }
      break
    case 'native':
      config.url = option.nativeurl
      break
    default:
      break
    }
    return config
  }

  _createPlayer() {
    let type = this._config.type
    switch (type) {
    case 'flv':
      if (!FlvPlayer.isSupported()) {
        this.info('error', '不支持mse')
        break
      }
      if (!this._config.isLive) {
        this.info('warn', '不支持flv格式点播')
        break
      }
      this._createFLVPlayer()
      break
    case 'hls':
      if (!HlsPlayer.isSupported()) {
        this._config.url = this._config.hlsurl
        this._createNativePlayer()
        break
      }
      this._createHLSPlayer()
      break
    case 'native':
      this._createNativePlayer()
      break
    default:
      break
    }
  }

  _createFLVPlayer() {
    this.player = new FlvPlayer(this._config, this._config)
    let player = this.player
    player.initVideo(this._config)
    player._owner = this
    Object.assign(this, player)
    this.player.initEvents()
    player.attachMediaElement(player.video)
    // player.load();
    // this.play();
  }

  _createHLSPlayer() {
    this.player = new HlsPlayer(this._config)
    let player = this.player
    player.initVideo(this._config)
    player._owner = this
    Object.assign(this, player)
    this.player.initEvents()
    // player.loadSource(this._config.url);
    // player.attachMedia(player.video);
    // player.on(Hls.Events.MEDIA_ATTACHED, () => {
    //   // this.play();
    // });
    // this.player.src = this._config.url;
  }

  _createNativePlayer() {
    this.player = new NativePlayer()
    let player = this.player
    player.initVideo(this._config)
    player._owner = this
    Object.assign(this, player)
    this.player.initEvents()
    // player.src = this._config.url;
    // this.play();
  }

  _pluginCall() {
    if (!this.player) {
      this.info('warn', '播放器为空，无法初始化插件')
      return
    }
    PluginMap.forEach(value => {
      let cl = new value()
      cl.player = this
      cl.init(this._config)
      this.pluginInstance.push(cl)
    })
  }

  destroy() {
    super.destroy()

    this.removeAllEvents()
    // 清理插件
    this.pluginInstance.forEach(plugin => {
      plugin.destroy()
    })
    this.pluginInstance = []
    if (this.player) {
      this.player.destroy()
      this.player = null
    }
  }

  setSize(w, h) {
    const parent = this.player.root
    parent.style.width = w
    parent.style.height = h
    this.pluginInstance.forEach(plugin => {
      plugin.setSize(w, h)
    })
  }

  initPluginListener() {
    const self = this
    this.on(PlayerEvent.SCHEDULER_COMPLETE, () => {
      const def = self.currentDefinition
      const token = self.newToken
      let url = `${def.url}?token=${token}`
      // let url = `${def.url}?token=alibaba`;
      self._config.url = url
      this.player.src = url
    })
  }

  get version() {
    return process.env.VERSION
  }
}
