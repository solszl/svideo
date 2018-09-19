import {
  EventEmitter
} from "events";

/**
 * 万物之源
 *
 * @export
 * @class Component
 * @author zhenliang.sun
 */
export default class Component {
  constructor() {
    // 采用内部消息进行解耦
    this.emitter = new EventEmitter();
  }
}