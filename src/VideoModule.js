import { VHVideoConfig } from './config'
import Component from './core/Component'
import Store from './core/Store'
import { AutoDetectInitial, UserCustomInitial } from './player/createPlayer'
import { PlayerEvent } from './PlayerEvents'
import PluginMap from './plugins/PluginMap'
import Log from './utils/Log'
import { systemProbe } from './utils/util'

/**
 * 播放器模块
 *
 * @export
 * @class VideoModule
 * @extends {Component}
 * @author zhenliang.sun
 */
export default class VideoModule extends Component {
  constructor() {
    super()
    this.player = null
    this._config = {}
    this.store = new Store()
    this.pluginInstance = []
    Log.OBJ.level = process.env.LOG_LEVEL
    // 探针判断系统环境
    this.context = systemProbe()
  }

  init(option = {}) {
    let initializer = null
    if (option['autoDetect'] && option['isLive']) {
      initializer = new AutoDetectInitial(this)
    } else {
      initializer = new UserCustomInitial(this)
    }

    let config = this._configMapping(option)
    this._config = config
    this.player = initializer.init(this.context, config)
    this.initPluginListener()
    this._pluginCall()
  }

  _configMapping(option = {}) {
    let config = {}
    Object.assign(config, VHVideoConfig, option)
    switch (config.type) {
      case 'flv':
        config.url = option.flvurl
        config.lazyLoadMaxDuration = VHVideoConfig.maxBufferTime
        break
      case 'hls':
        config.url = option.hlsurl
        break
      case 'native':
        config.url = option.nativeurl
        break
      default:
        break
    }
    return config
  }

  _pluginCall() {
    if (!this.player) {
      this.info('warn', '播放器为空，无法初始化插件')
      return
    }
    PluginMap.forEach(clazz => {
      // eslint-disable-next-line new-cap
      let cl = new clazz()
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
    const parent = this.player.getRoot()
    if (!parent) {
      Log.OBJ.warn('无法找到root元素')
      return
    }

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
      this.player.setSrc(url)
    })
  }

  get version() {
    return process.env.VERSION
  }
}
