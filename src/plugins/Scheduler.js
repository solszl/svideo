import Plugin from '../core/Plugin'
import LiveScheduler from './scheduler/LiveScheduler'
import VodScheduler from './scheduler/VodScheduler'

/**
 *
 * Created Date: 2019-05-30, 14:25:21 (zhenliang.sun)
 * Last Modified: 2019-05-30, 14:58:20 (zhenliang.sun)
 * Email: zhenliang.sun@gmail.com
 *
 * Distributed under the MIT license. See LICENSE file for details.
 * Copyright (c) 2019 vhall
 */

export default class Scheduler extends Plugin {
  constructor() {
    super()
    this._schedulerCfg = null
    this._scheduler = null
  }

  init(opts = '') {
    super.init(opts)
    this._allConfig = opts
    this._config = opts[Scheduler.type]
    this._schedulerCfg = JSON.parse(this._config)
    this._isLive = opts['isLive']
    this._scheduler = this._isLive ? new LiveScheduler() : new VodScheduler()
    let originURL = document.createElement('a')
    originURL.href = this._allConfig.url
    this._scheduler.uri = this._isLive ? '' : originURL.pathname
    this._scheduler.type = this._allConfig.type
    this._scheduler.player = this.player
    this._scheduler.option = this._schedulerCfg
    this._scheduler.fetch()
  }

  static get type() {
    return 'plugin_scheduler'
  }
}
