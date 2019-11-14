import Plugin from '../core/Plugin'
import LiveReporter from './report/LiveReporter'
import VodReporter from './report/VodReporter'

/**
 *
 * Created Date: 2019-07-24, 16:58:38 (zhenliang.sun)
 * Last Modified: 2019-11-14, 10:36:15 (zhenliang.sun)
 * Email: zhenliang.sun@gmail.com
 *
 * Distributed under the MIT license. See LICENSE file for details.
 * Copyright (c) 2019 vhall
 */

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
  }

  init(opts = {}) {
    super.init(opts)
    this._allConfig = opts
    let isLive = this._allConfig.isLive
    this.r = isLive ? new LiveReporter() : new VodReporter()
    this.r.allConfig = opts
    this.r.player = this.player
    this.r.reportConfig = opts[Reporter.type]
  }

  destroy() {
    super.destroy()
    this.r.destroy()
  }

  static get type() {
    return 'plugin_reporter'
  }
}
