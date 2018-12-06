import EventEmitter from 'event-emitter';

/**
 * 转码基类
 *
 * @export
 * @class TransCoder
 * @author zhenliang.sun
 */
export default class TransCoder {
  constructor() {
    EventEmitter(this);
  }
}