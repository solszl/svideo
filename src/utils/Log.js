import {
  IllegalStateException
} from '../player/flv/utils/exception'

const privateLog = Symbol('privateLog')
const privateInstance = Symbol('privateInstance')

/**
 * 日志
 *
 * @export
 * @class Log
 * @author zhenliang.sun
 */
export default class Log {
  constructor() {
    if (this[privateInstance]) {
      throw new IllegalStateException('Log should be a singleton Class')
    }

    this[privateInstance] = this
    this.logLevels = {
      all: 'debug|info|log|warn|error',
      off: '',
      debug: 'debug|info|log|warn|error',
      info: 'info|warn|error',
      warn: 'warn|error',
      error: 'error'
    }

    this.level = 'all' // 默认是all
  }

  static get OBJ() {
    if (!this[privateInstance]) {
      this[privateInstance] = new Log()
    }

    return this[privateInstance]
  }

  /**
   *
   * 设置日志错误输出等级，开发环境通常设置为 'all', 生产环境通常设置为 'warn', 'error' 或 'off'
   * @memberof Log
   * @default 'all'
   */
  set level(val) {
    if (typeof val !== 'string') {
      return this.level
    }

    if (!this.logLevels.hasOwnProperty(val)) {
      throw new IllegalStateException(`${val} is not a valid log level, should be in [all, off, debug, info, warn, error]`)
    }

    this._level = this.logLevels[val]
  }

  get level() {
    return this._level
  }

  info(...args) {
    this[privateLog]('info', args)
  }

  debug(...args) {
    this[privateLog]('debug', args)
  }

  warn(...args) {
    this[privateLog]('warn', args)
  }

  error(...args) {
    this[privateLog]('error', args)
  }

  [privateLog](type, args) {
    if (!window.console) {
      return
    }

    let fn = window.console[type]
    if (!fn && type === 'debug') {
      fn = window.console.info || window.console.log
    }

    if (!fn || this.level.split('|').indexOf(type) < 0) {
      return
    }

    fn[Array.isArray(args) ? 'apply' : 'call'](window.console, args)
  }
}
