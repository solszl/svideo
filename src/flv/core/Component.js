import EventEmitter from 'event-emitter';
import Log from '../../utils/Log';

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