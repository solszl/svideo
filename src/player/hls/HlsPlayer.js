import { KV } from '../../core/Constant'
import Hls from './hls'

/**
 *
 *
 * @export
 * @class HlsPlayer
 * @extends {Hls}
 * @author zhenliang.sun
 */
export default class HlsPlayer extends Hls {
  constructor(config = {}) {
    super(config)
    this.playedTime = 0
  }

  get downloadSize() {
    return this.store.getKV(KV.DownloadSize)
  }

  get estimateNetSpeed() {
    return this.abrController.estimateNetSpeed
  }

  set src(val) {
    this.playedTime = this.currentTime
    super.src = val
    // 停止当前的加载工作。准备切换线路
    this.networkControllers.forEach(component => {
      component.stopLoad()
    })
    this.detachMedia()
    this.loadSource(val)
    this.attachMedia(this.video)
    this.on(Hls.Events.MEDIA_ATTACHED, () => {
      // this.play();

      // 如果是点播的活动，卡顿切线，需要记录刚才播放到哪了。 然后再从刚才播放的时间继续播放
      if (!this.isLive) {
        this.currentTime = this.playedTime
      }
    })
  }

  get src() {
    return super.src
  }
}
