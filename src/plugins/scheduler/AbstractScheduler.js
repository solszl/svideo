import Log from '../../utils/Log'
import { PlayerEvent } from './../../PlayerEvents'

/**
 *
 * Created Date: 2019-05-30, 13:58:05 (zhenliang.sun)
 * Last Modified: 2019-08-19, 14:23:39 (zhenliang.sun)
 * Email: zhenliang.sun@gmail.com
 *
 * Distributed under the MIT license. See LICENSE file for details.
 * Copyright (c) 2019 vhall
 */

/**
 * 抽象调度器， 子类实现直播调度以及回放调度
 *
 * @export
 * @class AbstractScheduler
 */
export default class AbstractScheduler {
  constructor() {
    this.CLASS_NAME = this.constructor.name
    this.xhr = null
    this.player = null
    this.option = null
    this.uri = ''
    this.type = ''
  }

  destroy() {}

  fetch() {
    this.xhr = new XMLHttpRequest()
    let xhr = this.xhr
    xhr.responseType = 'json'
    xhr.timeout = 5000 // 5秒超时
    xhr.onerror = e => {
      this.info('error', `fetch error. url: ${url}`)
      this.emit('error', {
        details: 'schedulerLoadError',
        type: 'error'
      })
    }

    xhr.ontimeout = e => {
      this.info('error', `fetch timeout. code: ${e.code}`)
      this.emit('error', {
        details: 'schedulerFetchTimeout',
        type: 'error'
      })
    }

    xhr.onload = e => {
      let data = xhr.response
      this.resolveData(data)
    }

    xhr.onloadend = e => this.__innerXHRDestroy()

    let url = this.buildURL()
    xhr.open('GET', url)
    xhr.send()
  }

  resetStatus() {}

  /**
   * 获取一个9位随机数
   *
   * @returns
   * @memberof VodScheduler
   */
  getRandom() {
    return ((Math.random() * 899999999) >> 0) + 100000000
  }

  buildURL() {}

  resolveData(data) {}

  /**
   * 直播的调度，请求过后，直接返回所有可用的清晰度列表， 与入参quality无关。
   * 点播的调度，请求是根据入参quality进行拼接的。
   * ヾ(。￣□￣)ﾂ゜゜゜
   *
   * @param {*} defs
   * @memberof AbstractScheduler
   */
  _defineProperty(defs) {
    let allDefinitionList = defs
    let currentDefinitionListIndex = 0 // 默认选中列表中第一个
    let currentDefinitionList = defs[currentDefinitionListIndex] || [] // 当前清晰度列表
    if (!this.option) {
      return
    }

    let defaultDef = this.option['defaultDef']
    // 备选方案, 设置的默认画质可能为480p， 但是清晰度列表中可能不存在480p， 找到一个备选清晰度。
    let alternatives = currentDefinitionList.filter(item => {
      return item.def !== 'a'
    })
    let alternativeDef = alternatives.length > 0 ? alternatives[0] : null

    if (currentDefinitionList.length === 1) {
      alternativeDef = currentDefinitionList[0]
    }

    // 找到默认清晰度
    let defaultDefList = currentDefinitionList.filter(item => {
      return item.def === defaultDef
    })

    let currentDefinition = defaultDefList.length ? defaultDefList[0] : alternativeDef

    let properties = {
      currentDefinitionListIndex,
      currentDefinitionList,
      allDefinitionList
    }

    for (const key in properties) {
      Object.defineProperty(this.player, key, {
        configurable: true,
        get: function() {
          return properties[key]
        },
        set: function(newValue) {
          properties[key] = newValue
        }
      })
    }

    // 因为这个要派发事件，所以单独拿出来
    Object.defineProperty(this.player, 'currentDefinition', {
      configurable: true,
      get: function() {
        return currentDefinition
      },
      set: function(newValue) {
        const e = {
          oldValue: currentDefinition,
          newValue
        }
        let { url: oldURL } = currentDefinition
        let { url: newURL } = newValue
        if (oldURL === newURL) {
          this.info('info', '新旧清晰度相同')
          return
        }
        this.info('info', '切换清晰度')
        this.info('info', `old: ${currentDefinition.url}`)
        this.info('info', `new: ${newValue.url}`)
        currentDefinition = newValue
        let token = this.newToken
        let url = `${newValue.url}?token=${token}`
        this.player.setSrc(url)
        this.player.emit2All(PlayerEvent.DEFINITION_CHANGED, e)
      }
    })

    this.player.emit2All(PlayerEvent.SCHEDULER_COMPLETE)
    this.player.emit2All(PlayerEvent.READY)
  }

  __innerXHRDestroy() {
    if (!this.xhr) return

    this.info('info', '调度流程完成，进行内部销毁')
    this.xhr.onerror = null
    this.xhr.ontimeout = null
    this.xhr.onload = null
    this.xhr.onloadend = null
    this.xhr = null
  }

  info(type, ...args) {
    Log.OBJ[type](`[${this.CLASS_NAME}] ${args}`)
  }
}
