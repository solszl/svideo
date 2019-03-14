import EventEmitter from 'event-emitter'

import Log from '../utils/Log'

const allOff = require('event-emitter/all-off')

/**
 * 万物之源
 *
 * @export
 * @class Component
 * @author zhenliang.sun
 */
export default class Component {
  constructor() {
    EventEmitter(this)
    this.CLASS_NAME = this.constructor.name
  }

  /**
   * 销毁操作
   *
   * @memberof Component
   */
  destroy() {}

  info(type, ...args) {
    Log.OBJ[type](`[${this.CLASS_NAME}] ${args}`)
  }

  removeAllEvents() {
    allOff(this)
  }
}
