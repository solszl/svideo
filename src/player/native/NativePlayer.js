import PlayerProxy from '../../PlayerProxy'
import { KV } from './../../core/Constant'
import FetchSize from './utils/fetchSize'

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
    super(opt)
    this.fetchSize = null
    this.playedTime = 0
  }

  initVideo(option = {}) {
    super.initVideo(option)

    if (option.store) {
      const { store } = option
      this.fetchSize = new FetchSize(store)
    }
  }

  getDownloadSize() {
    if (!this.getStore().getKV(KV.FileSize)) {
      return -1
    }

    /* 计算思路为：
      根据视频时长以及视频文件大小，估算出每秒平均大小
      获取当前video 的buffered 缓冲时间区域，计算总缓冲时长
      用平均每秒大小乘以缓冲时长估算出下载总量
    */
    let duration = this.getDuration()
    let ranges = this.getBuffered()
    let totalRangeTime = 0
    let fileSize = this.getStore().getKV(KV.FileSize)

    for (let i = 0; i < ranges.length; i += 1) {
      totalRangeTime += ranges.end(i) - ranges.start(i)
    }

    return (fileSize / duration) * totalRangeTime
  }

  getEstimateNetSpeed() {
    // TODO: 实现默认网速预估算法
    this.info('warn', 'unrealized get native player estimate net speed, return default speed 500KBps')
    return 500
  }

  setSrc(val) {
    // 阿里cdn 支持range， 使用range减少不必要的计算
    // 因为点播每次请求的mp4需要添加start参数， 故导致每次请求的文件大小均不同
    // let url = 'http://t-alioss01.e.vhall.com/vhallcoop/demand/e983faee411fcc98617cd0eeff0920b2/945218473/e983faee411fcc98617cd0eeff0920b2_360p.mp4?token=alibaba'
    this.playedTime = this.getCurrentTime()
    this.fetchSize.start(val)
    super.setSrc(val)

    // 切线过后，设置当前播放时间
    this.setCurrentTime(this.playedTime)
  }
}
