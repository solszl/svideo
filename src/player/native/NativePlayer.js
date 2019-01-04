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

  getDownloadSize() {
    super.getDownloadSize();
    if (Model.OBJ.fileSize === -1) {
      return -1;
    }
    let duration = this.duration;
    let ranges = this.buffered;
    let totalRangeTime = 0;
    let fileSize = Model.OBJ.fileSize;

    for (let i = 0; i < ranges.length; i += 1) {
      totalRangeTime += ranges.end(i) - ranges.start(i);
    }

    return fileSize / duration * totalRangeTime;
  }
}