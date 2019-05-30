import Log from '../../utils/Log'
import crc32 from 'crc-32'

/**
 *
 * Created Date: 2019-05-30, 14:15:08 (zhenliang.sun)
 * Last Modified: 2019-05-30, 16:37:43 (zhenliang.sun)
 * Email: zhenliang.sun@gmail.com
 *
 * Distributed under the MIT license. See LICENSE file for details.
 * Copyright (c) 2019 vhall
 */

/**
 * 播放器 token 计算
 *
 * @export
 * @class Token
 * @author zhenliang.sun
 */
export default class Token {
  constructor(expireThreshold = 1000 * 60 * 60) {
    this.player = null
    this.oToken = ''
    this.newToken = ''
    this.expireThreshold = expireThreshold
    this.expireTime = 0
  }

  /**
   * 根据旧调度拿来的token计算出播放token
   *
   * @param {*} ot
   * @returns
   * @memberof Token
   */
  create(originToken) {
    this.oToken = originToken
    let pre = originToken.split('_')[0]
    let last = originToken.split('_')[1]

    // 短token 翻转
    let reverseToken = pre
      .split('')
      .reverse()
      .join('')
    let n = (crc32.str(reverseToken) >>> 0).toString(16).toUpperCase() // >>>0 的原因是 crc32 库做完的数据可能会有负数的情况
    let newToken = `${n}_${last}`
    Log.OBJ.info(`origin token: ${originToken}`)
    Log.OBJ.info(`new token: ${newToken}`)
    this.newToken = newToken
    this.expireTime = Date.now() + this.expireThreshold

    this._define()
    return newToken
  }

  isExpired() {
    return Date.now() > this.expireTime
  }

  _define() {
    if (!this.player) {
      Log.OBJ.error('没有播放器实例，无法挂载属性到player上')
      return
    }

    let originToken = this.oToken
    let newToken = this.newToken
    let tokenExpireTime = this.expireTime
    const properties = {
      originToken,
      newToken,
      tokenExpireTime
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

    this.player.tokenIsExpire = this.isExpired
  }
}
