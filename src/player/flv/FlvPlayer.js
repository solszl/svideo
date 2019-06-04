import { KV } from './../../core/Constant'
import Flv from './flv'

/**
 *
 *
 * @export
 * @class FlvPlayer
 * @extends {Flv}
 * @author zhenliang.sun
 */
export default class FlvPlayer extends Flv {
  constructor(mediaDataSource, config) {
    super(mediaDataSource, config)
  }

  get mediaDataSource() {
    return this._mediaDataSource
  }

  updateMediaDataSource() {
    const video = this.video
    this.detachMediaElement(video)
    this.unload()
    this.attachMediaElement(video)
    this.load()
  }

  get estimateNetSpeed() {
    let speed = this.statisticsInfo ? this.statisticsInfo.speed : 500
    return speed
  }

  get downloadSize() {
    return this.store.getKV(KV.DownloadSize)
  }

  set src(val) {
    super.src = val
    // 清理segment 的url，使其使用新的url
    delete this.mediaDataSource.segments
    this.mediaDataSource.url = val
    this.updateMediaDataSource()
  }

  get src() {
    return super.src
  }

  destroy() {
    super.destroy()
    this.unload()
    this.detachMediaElement()
  }
}
