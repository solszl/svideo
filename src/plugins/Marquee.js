/**
 *
 * Created Date: 2019-06-05, 15:21:04 (zhenliang.sun)
 * Last Modified: 2019-07-01, 00:42:13 (zhenliang.sun)
 * Email: zhenliang.sun@gmail.com
 *
 * Distributed under the MIT license. See LICENSE file for details.
 * Copyright (c) 2019 vhall
 */

import { VHVideoConfig } from './../config'
import Plugin from './../core/Plugin'
import { appendChild, createElement, addClass } from './../utils/Dom'

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
    this.intervalStep = 0
    this.timeoutStart = 0
    this._currentRight = 0
  }

  destroy() {
    super.destroy()
  }

  static get type() {
    return 'plugin_marquee'
  }

  init(opts = {}) {
    super.init(opts)
    this._allConfig = opts
    this.marqueeConfig = JSON.parse(opts['marqueeConfig'] || VHVideoConfig.plugin_marquee)
    if (this.marqueeConfig.enable === false) {
      return
    }

    this._createMarquee()
  }

  _createMarquee() {
    // alpha 透明度
    // color 文字颜色
    // interval 一波完事儿，等多久。 以秒为单位
    // position 位置，1，2，3，4
    // size 文字大小
    // speed 速度， 后台传过来的是3000，6000，10000， 对应的是快，中，慢
    // text 要显示的文字
    const { alpha, color, interval, position, size, speed, text } = this.marqueeConfig

    // create style node
    let style = document.createElement('style')
    style.type = 'text/css'
    style.innerHTML = `.marquee { opacity: ${alpha /
      100}; font-size: ${size}px; color: ${color}; display: inline-block;position: absolute; overflow: hidden;width:auto; text-overflow: ellipsis; white-space: nowrap;}`
    document
      .getElementsByTagName('HEAD')
      .item(0)
      .appendChild(style)

    // create label node
    this.label = createElement('label', {
      id: 'vh-marquee',
      innerHTML: text
    })

    appendChild(this._allConfig['id'], this.label)
    addClass(this.label, 'marquee')

    this._start()
  }

  _start() {
    const { interval, position, speed } = this.marqueeConfig

    // 计算位置
    let top = positionMap[position] === 1 ? Math.random() * 60 + 20 + '%' : positionMap[position]
    this.label.style.top = top
    this.label.style.right = 0
    this._currentRight = 0

    let step = STEP[speed]

    clearInterval(this.intervalStep)
    this.intervalStep = setInterval(() => {
      this._move(step)
    }, 30)
  }

  _move(step) {
    this._currentRight += step
    this.label.style.right = this._currentRight + '%'

    if (this._currentRight >= 100) {
      clearInterval(this.intervalStep)
      clearTimeout(this.timeoutStart)

      const { interval } = this.marqueeConfig
      this.timeoutStart = setTimeout(() => {
        this._start()
      }, interval * 1000)
    }
  }
}

const positionMap = {
  1: 1,
  2: '20%',
  3: '50%',
  4: '80%'
}

const STEP = {
  3000: 1.5,
  6000: 1,
  10000: 0.5
}
