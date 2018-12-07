/**
 * Flv 数据Tag 描述文件
 *
 * @export
 * @class Tag
 * @author zhenliang.sun
 */
export default class Tag {
  constructor() {
    this.tagType = -1;
    this.bodySize = -1;
    this.tagSize = -1;
    this.position = -1;
    this.timestamp = -1;
    this.streamID = -1;
    this.body = -1;
    this.time = -1;
    this.arr = [];
  }

  /**
   * 把16进制数据转换成为10进制
   *
   * @memberof Tag
   */
  getTime() {
    this.arr = [];
    for (let i = 0; i < this.timestamp.length; i += 1) {
      this.arr.push(this.timestamp[i].toString(16).padStart(2, 0));
    }
    this.arr.pop();
    const time = this.arr.join('');
    this.time = parseInt(time, 16);
    return this.time;
  }
}