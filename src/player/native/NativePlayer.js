import PlayerProxy from '../../PlayerProxy';
import FetchSize from './utils/fetchSize';
import Model from '../../core/Model';

/**
 * 原生播放器封装
 *
 * @export
 * @class NativePlayer
 * @extends {PlayerProxy}
 * @author zhenliang.sun
 */
export default class NativePlayer extends PlayerProxy {
  constructor(opt = {}) {
    super(opt);
  }

  initVideo(option = {}) {
    super.initVideo(option);
    let fileSize = new FetchSize();
    fileSize.start(option.url);
  }

  get downloadSize() {
    if (Model.OBJ.fileSize === -1) {
      return -1;
    }

    /* 计算思路为：
      根据视频时长以及视频文件大小，估算出每秒平均大小
      获取当前video 的buffered 缓冲时间区域，计算总缓冲时长
      用平均每秒大小乘以缓冲时长估算出下载总量
    */
    let duration = this.duration;
    let ranges = this.buffered;
    let totalRangeTime = 0;
    let fileSize = Model.OBJ.fileSize;

    for (let i = 0; i < ranges.length; i += 1) {
      totalRangeTime += ranges.end(i) - ranges.start(i);
    }

    return fileSize / duration * totalRangeTime;
  }

  get estimateNetSpeed() {
    // TODO: 实现默认网速预估算法
    this.info('warn', 'unrealized get native player estimate net speed, return default speed 500KBps');
    return 500;
  }
}