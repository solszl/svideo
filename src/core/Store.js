/**
 *
 * Created Date: 2019-05-27, 11:35:41 (zhenliang.sun)
 * Last Modified: 2019-05-27, 11:36:32 (zhenliang.sun)
 * Email: zhenliang.sun@gmail.com
 *
 * Distributed under the MIT license. See LICENSE file for details.
 * Copyright (c) 2019 vhall
 */

/**
 * 因为存在多实例的情况，静态属性会挂在到原型上，导致多实例的时候，会对属性进行共享
 * 现将其设置为实例属性，达到实现多实例目的
 *
 * @export
 * @class Store
 * @author zhenliang.sun
 */
export default class Store {
  constructor() {
    this.info = {}
  }

  /**
   * 根据KV价值对进行存储
   *
   * @param {*} key
   * @param {*} value
   * @memberof Store
   */
  setKV(key, value) {
    this.info[key] = value
  }

  /**
   * 根据key获取
   *
   * @param {*} key
   * @returns
   * @memberof Store
   */
  getKV(key) {
    return this.info[key]
  }

  /**
   * 根据key删除键值对
   *
   * @param {*} key
   * @memberof Store
   */
  deleteKey(key) {
    if (this.info.hasOwnProperty(key)) {
      delete this.info[key]
    }
  }

  /**
   * 重置键值对
   *
   * @memberof Store
   */
  reset() {
    this.info = {}
  }

  toString() {
    let keys = Object.keys(this.info)
    let tmp = ''
    keys.forEach(key => {
      tmp += `${key}:${this.info[key]} `
    })
    return tmp
  }
}
