/**
 *
 * Created Date: 2019-06-03, 17:17:30 (zhenliang.sun)
 * Last Modified: 2019-07-24, 16:46:43 (zhenliang.sun)
 * Email: zhenliang.sun@gmail.com
 *
 * Distributed under the MIT license. See LICENSE file for details.
 * Copyright (c) 2019 vhall
 */
import qs from 'qs'

/**
 * 简单封装
 *
 * @export
 * @class Http
 * @author zhenliang.sun
 */
export default class Http {
  constructor(store) {
    this.store = store
    this.e = {
      error: this._onError.bind(this),
      timeout: this._onTimeout.bind(this),
      onload: this._onLoad.bind(this),
      onLoadend: this._onLoadend.bind(this)
    }

    this.xhr = new XMLHttpRequest()
    this.xhr.responseType = 'json'
    this.xhr.timeout = 5000
    this.xhr.onerror = this.e.error
    this.xhr.timeout = this.e.timeout
    this.xhr.onload = this.e.onload
    this.xhr.onloadend = this.e.onLoadend

    this.onError = null
    this.onLoad = null
    this.onLoadend = null
    this.onTimeout = null
  }

  /**
   * inner method
   *
   * @param {*} e
   * @memberof Http
   */
  _onError(e) {
    this.onError && this.onError(e.target.response)
    this.onError = null
  }

  /**
   * inner method
   *
   * @param {*} e
   * @memberof Http
   */
  _onLoad(e) {
    if (!e.target) {
      this._onError(e)
      return
    }

    if (!e.target.response) {
      this._onError(e)
      return
    }

    let { code, data, msg } = e.target.response
    if (+code !== 200) {
      this._onError(e)
      return
    }

    this.onLoad && this.onLoad(data)
    this.onLoad = null
  }

  /**
   * inner method
   *
   * @param {*} e
   * @memberof Http
   */
  _onLoadend(e) {
    this.onLoadend && this.onLoadend(e.target)
    this.onLoadend = null
  }

  /**
   * inner method
   *
   * @param {*} e
   * @memberof Http
   */
  _onTimeout(e) {
    this.onTimeout && this.onTimeout(e.target)
    this.onTimeout = null
  }

  /**
   * 发送请求
   *
   * @param {*} url API的URL
   * @param {*} data FormData
   * @param {string} [method='POST']
   * @memberof Http
   */
  fire(url, data = {}, method = 'GET') {
    if (!this.xhr) {
      return
    }

    // 构建formData数据
    let formData = new FormData()

    Object.keys(data).forEach(keys => {
      formData.set(keys, data[keys])
    })

    if (method === 'POST') {
      this.xhr.open(method, url)
      this.xhr.send(formData)
    } else if (method === 'GET') {
      let obj = {}
      formData.forEach((value, key) => {
        obj[key] = value
      })
      url += `?${qs.stringify(obj)}`
      this.xhr.open(method, url)
      this.xhr.send()
    }
  }

  /**
   * HTTP模块销毁
   *
   * @memberof Http
   */
  destroy() {
    if (!this.xhr) {
      return
    }

    this.xhr.onerror = null
    this.xhr.onload = null
    this.xhr.onloadend = null
    this.xhr.ontimeout = null
    this.xhr = null

    this.onLoad = null
    this.onLoadend = null
    this.onTimeout = null
    this.onError = null
  }
}
