/**
 * 浏览器相关参数接口
 *
 * @export
 * @class Browser
 * @author zhenliang.sun
 */
export default class Browser {
  static get ua() {
    return (window.navigator.userAgent && window.navigator.userAgent) || ''
  }

  /** *****************  FOR IOS START ************************/

  static get isIPad() {
    return /iPad/i.test(this.ua)
  }

  static get isIPhone() {
    return /iPhone/i.test(this.ua) && !this.isIPad
  }

  static get isIPod() {
    return /iPod/i.test(this.ua)
  }

  static get isIOS() {
    return this.isIPad || this.isIPhone || this.isIPod
  }

  static get IOSVersion() {
    const match = this.ua.match(/OS (\d+)_/i)

    if (match && match[1]) {
      return match[1]
    }
    return null
  }

  /** *****************  FOR IOS END ************************/

  /** *****************  FOR ANDROID START ************************/
  static get isAndroid() {
    return /Android/i.test(this.ua)
  }

  static get androidVersion() {
    const match = this.ua.match(/Android (\d+)(?:\.(\d+))?(?:\.(\d+))*/i)

    if (!match) {
      return null
    }

    const major = match[1] && parseFloat(match[1])
    const minor = match[2] && parseFloat(match[2])

    if (major && minor) {
      return parseFloat(match[1] + '.' + match[2])
    } else if (major) {
      return major
    }
    return null
  }

  /** *****************  FOR ANDROID END ************************/

  /** *****************  FOR PC START ************************/

  static get browserName() {
    let reg = {
      ie: /rv:([\d.]+)\) like gecko/,
      firefox: /firefox\/([\d.]+)/,
      chrome: /chrome\/([\d.]+)/,
      opera: /opera.([\d.]+)/,
      safari: /version\/([\d.]+).*safari/
    }
    return [].concat(Object.keys(reg).filter(key => reg[key].test(this.ua)))[0]
  }

  static get isFirefox() {
    return /(?:Firefox)/.test(this.ua)
  }

  static get isEdge() {
    return /Edge/i.test(this.ua)
  }
  static get isChrome() {
    return !this.isEdge && (/Chrome/i.test(this.ua) || /CriOS/i.test(this.ua))
  }

  static get isSafari() {
    return /Safari/i.test(this.ua) && !this.isChrome && !this.isAndroid && !this.isEdge
  }

  static get chromeVersion() {
    const match = this.ua.match(/(Chrome|CriOS)\/(\d+)/)

    if (match && match[2]) {
      return parseFloat(match[2])
    }
    return null
  }

  static get IEVersion() {
    const result = /MSIE\s(\d+)\.\d/.exec(this.ua)
    let version = result && parseFloat(result[1])

    if (!version && /Trident\/7.0/i.test(this.ua) && /rv:11.0/.test(this.ua)) {
      // IE 11 has a different user agent string than other IE versions
      version = 11.0
    }

    return version
  }
  /** *****************  FOR PC END ************************/
}
