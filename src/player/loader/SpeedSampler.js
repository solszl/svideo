/**
 * 参考B站代码实现
 *
 * @export
 * @class SpeedSampler
 * @author zhenliang.sun
 */
export default class SpeedSampler {
  constructor() {
    this._firstCheckpoint = 0;
    this._lastCheckpoint = 0;
    this._intervalBytes = 0;
    this._totalBytes = 0;
  }

  /**
   * 添加数据
   *
   * @param {*} bytes
   * @memberof SpeedSampler
   */
  addBytes(bytes) {
    if (this._firstCheckpoint === 0) {
      // 尚未创建检测点
      this._firstCheckpoint = Date.now();
      this._lastCheckpoint = this._firstCheckpoint;
      this._intervalBytes += bytes;
      this._totalBytes += bytes;
    } else if (Date.now() - this._lastCheckpoint < 1000) {
      // 1秒之内的多次添加数据
      this._intervalBytes += bytes;
      this._totalBytes += bytes;
    } else {
      // 大于1秒后的添加数据
      this._intervalBytes = bytes;
      this._totalBytes += bytes;
      this._lastCheckpoint = Date.now();
    }
  }

  /**
   * 重设各种参数
   *
   * @memberof SpeedSampler
   */
  reset() {
    this._firstCheckpoint = 0;
    this._lastCheckpoint = 0;
    this._intervalBytes = 0;
    this._totalBytes = 0;
  }

  /**
   * 获取当前实时网络速度
   *
   * @readonly
   * @memberof SpeedSampler
   * @returns 获取实时速度，单位：KBps
   */
  get currentKBps() {
    this.addBytes(0);
    let duration = (Date.now() - this._lastCheckpoint) / 1000;

    if (duration <= 0) {
      duration = 1;
    }

    return this._intervalBytes / duration >> 10;
  }

  /**
   * 获取自上一次 reset 或 初始化之后的平均网络速度
   *
   * @readonly
   * @memberof SpeedSampler
   * @returns 获取平均速度，单位：KBps
   */
  get averageKBps() {
    let duration = (Date.now() - this._firstCheckpoint) / 1000;
    return this._totalBytes / duration >> 10;
  }
}