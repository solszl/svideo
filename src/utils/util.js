import { UAParser } from 'ua-parser-js'
import semver from 'semver'

export function debounce(func, wait) {
  let lastTime = null
  let timeout
  return function() {
    let context = this
    let now = new Date()
    // 判定不是一次抖动
    if (now - lastTime - wait > 0) {
      setTimeout(() => {
        func.apply(context, arguments)
      }, wait)
    } else {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      timeout = setTimeout(() => {
        func.apply(context, arguments)
      }, wait)
    }
    // 注意这里lastTime是上次的触发时间
    lastTime = now
  }
}

export function throttle(func, wait) {
  let lastTime = null
  let timeout
  return function() {
    let context = this
    let now = new Date()
    // 如果上次执行的时间和这次触发的时间大于一个执行周期，则执行
    if (now - lastTime - wait > 0) {
      // 如果之前有了定时任务则清除
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      func.apply(context, arguments)
      lastTime = now
    } else if (!timeout) {
      timeout = setTimeout(() => {
        // 改变执行上下文环境
        func.apply(context, arguments)
      }, wait)
    }
  }
}

/**
 * 方法混入
 *
 * @export
 * @param {*} target 混入目标
 * @param {*} Constructor 被混入的构造函数
 * @param {*} args 被混入的构造函数参数
 */
export function mixin(target, Constructor, ...args) {
  let source = new Constructor(...args)
  let names = Object.getOwnPropertyNames(Constructor.prototype)
  for (let name of names) {
    let val = source[name]
    if (typeof val === 'function' && name !== 'constructor') {
      target[name] = val.bind(source)
    }
  }
}

export const systemProbe = function() {
  let result = Object.create(null)
  let uaResult = new UAParser().getResult()
  result.isTencent = (uaResult.ua.match(/mqqbrowser|qzone|qqbrowser|qq|micromessenger/i) || []).length > 0
  result.browser = uaResult.browser.name.toLowerCase()
  result.browserVersion = uaResult.browser.version
  result.os = uaResult.os.name.toLowerCase()
  result.osVersion = uaResult.os.version
  const platform =
    (
      uaResult.ua.match(
        /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i
      ) || []
    ).length > 0
      ? 'mobile'
      : 'pc'
  result.platform = platform
  // cv short for convert version.
  const cv = ov => semver.coerce(ov)

  // 基于 https://caniuse.com/#search=mediasource 2019-08-23日结果
  const judgeMSE = () => {
    window.semver = semver

    // iOS safari 完全不支持
    if (result.os === 'ios' && result.browser.indexOf('safari')) {
      return false
    }

    // chrome 小于23 完全不支持
    if (result.browser === 'chrome' && semver.lt(cv(result.browserVersion), cv(23))) {
      return false
    }

    // firefox 42以下不支持
    if (result.browser === 'firefox' && semver.lt(cv(result.browserVersion), cv(42))) {
      return false
    }

    // ie不支持
    if (result.browser === 'ie') {
      return false
    }

    // 安卓4.4以下不支持
    if (result.os === 'android' && semver.lt(cv(result.osVersion), cv(4.4))) {
      return false
    }

    // opera 15以下不支持
    if (result.browser === 'opera' && semver.lt(cv(result.browserVersion), cv(15))) {
      return false
    }

    // opera mobile46以下不支持
    if (result.browser === 'opera mobile' && semver.lt(cv(result.browserVersion), cv(46))) {
      return false
    }

    // opera mini 不支持
    if (result.browser === 'opera mini') {
      return false
    }

    // 三星不支持
    if (result.browser.indexOf('samsung') >= 0) {
      return false
    }

    // 如果window上都没有MediaSource不存在，不支持MSE
    if (typeof window !== 'undefined') {
      // 判断是否有mediaSource
      const existMediaSource = window.MediaSource || window.WebKitMediaSource
      // 判断是否有SourceBuffer
      const sourceBuffer = window.SourceBuffer || window.WebKitSourceBuffer
      // 判断sourceBuffer 是否有appendBuffer
      const validSourceBufferApi =
        (sourceBuffer &&
          sourceBuffer.prototype &&
          typeof sourceBuffer.prototype.appendBuffer === 'function' &&
          typeof sourceBuffer.prototype.remove === 'function') ||
        false

      return existMediaSource && validSourceBufferApi
    }

    return true
  }
  result.supportMSE = judgeMSE()
  return result
}
