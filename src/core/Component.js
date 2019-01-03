import EventEmitter from 'event-emitter';
import Log from '../utils/Log';

/**
 * 万物之源
 *
 * @export
 * @class Component
 * @author zhenliang.sun
 */
export default class Component {
  constructor() {
    this.CLASS_NAME = this.constructor.name;
    EventEmitter(this);
  }

  destroy() {

  }

  info(type, ...args) {
    Log.OBJ[type](`[${this.CLASS_NAME}] ${args}`);
  }
}