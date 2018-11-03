/**
 * UUID生成器
 *
 * @export
 * @class UUID
 * @author zhenliang.sun
 */
export default class UUID {
  static[S4]() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  }

  static create() {
    return (S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4());
  }
}

const S4 = Symbol('S4');