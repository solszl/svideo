import {
  EventEmitter
} from 'events';

const emitter = new EventEmitter();

/**
 *
 *
 * @export
 * @class Event
 * @author zhenliang.sun
 */
export default class Event {
  constructor() {}

  static dispatch(type, data) {
    emitter.emit(type, data);
  }

  /**
   * 添加一个函数处理，注册到EventEmitter实例中
   *
   * @static
   * @param {*} type
   * @param {*} handler
   * @param {boolean} [once=false]
   * @memberof Event
   */
  static addEventListener(type, handler, once = false) {
    if (once) {
      emitter.once(type, handler);
    } else {
      emitter.on(type, handler);
    }
  }

  /**
   * 从EventEmitter中移除一个消息处理函数
   *
   * @static
   * @param {*} type
   * @param {*} handler
   * @memberof Event
   */
  static removeEventListener(type, handler) {
    emitter.removeListener(type, handler);
  }

  /**
   * 清空所有所注册的函数处理
   *
   * @static
   * @param {*} [type=null]
   * @memberof Event
   */
  static removeAllListeners(type = null) {
    emitter.removeAllListeners(type);
  }
}