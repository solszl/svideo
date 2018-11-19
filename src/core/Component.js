import EventEmitter from 'event-emitter';

/**
 * 万物之源
 *
 * @export
 * @class Component
 * @author zhenliang.sun
 */
export default class Component {
  constructor() {
    EventEmitter(this);
  }
}