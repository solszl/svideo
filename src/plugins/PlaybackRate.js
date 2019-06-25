import Plugin from '../core/Plugin'
import { PlayerEvent } from './../PlayerEvents'

/**
 * 倍速播放插件
 *
 * @export
 * @class PlaybackRate
 * @extends {Plugin}
 * @author zhenliang.sun
 */
export default class PlaybackRate extends Plugin {
  constructor() {
    super()
    this._allConfig = null
  }

  destroy() {
    super.destroy()
    if (this.player.playbackRateList) {
      delete this.player.playbackRateList
    }
  }

  init(opts = {}) {
    super.init(opts)
    this._allConfig = opts
    let rateList = this._allConfig.rateList || [0.5, 1, 1.5, 2]
    let p = this.player
    Object.defineProperty(this.player, 'playbackRateList', {
      configurable: true,
      get: function() {
        return rateList
      },
      set: function(newValue) {
        rateList = newValue
        p.emit2All(PlayerEvent.PLAYBACKRATE_LIST_CHANGED)
      }
    })
  }

  static get type() {
    return 'plugin_playbackrate'
  }
}
