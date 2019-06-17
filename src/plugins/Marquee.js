/**
 *
 * Created Date: 2019-06-05, 15:21:04 (zhenliang.sun)
 * Last Modified: 2019-06-05, 17:48:32 (zhenliang.sun)
 * Email: zhenliang.sun@gmail.com
 *
 * Distributed under the MIT license. See LICENSE file for details.
 * Copyright (c) 2019 vhall
 */

import { VHVideoConfig } from './../config'
import Plugin from './../core/Plugin'
import { appendChild, createElement } from './../utils/Dom'

/**
 *
 *
 * @export
 * @class Marquee
 * @extends {Plugin}
 */
export default class Marquee extends Plugin {
  constructor() {
    super()
  }

  destroy() {
    super.destroy()
  }

  static type() {
    return 'plugin_marquee'
  }

  init(opts = {}) {
    super.init(opts)
    this._allConfig = opts
    this.marqueeConfig = opts['marqueeConfig'] || VHVideoConfig.plugin_marquee
    if (this.marqueeConfig.enable === false) {
      return
    }

    this._createMarquee()
  }

  _createMarquee() {
    this.cvs = createElement('canvas', {
      id: 'vh-marquee'
    })

    this.cvs.style.position = 'absolute'
    const parent = this.player._root
    this.cvs.setAttribute('width', parent.clientWidth)
    this.cvs.setAttribute('height', parent.clientHeight)
    this.cvs.style.pointerEvents = 'none'
    this.cvs.style.left = 0
    this.cvs.style.top = 0
    appendChild(this._allConfig['id'], this.cvs)
  }
}
