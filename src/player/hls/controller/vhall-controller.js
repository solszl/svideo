import Log from '../../../utils/Log'
import EventHandler from '../event-handler'
import Event from '../events'
import { KV } from './../../../core/Constant'
import { PlayerEvent } from './../../../PlayerEvents'

/**
 *
 *
 * @class VhallController
 * @extends {EventHandler}
 * @author zhenliang.sun
 */
class VhallController extends EventHandler {
  constructor(hls) {
    super(hls, Event.FRAG_LOADED, Event.ERROR)

    this.CLASS_NAME = this.constructor.name
    this.store = null
    this._timeout = 0
    this.info('info', '注册vhall controller')
  }

  /**
   * TS 加载完成
   *
   * @param {*} data
   * @memberof VhallController
   */
  onFragLoaded(data) {
    const frag = data.frag
    if (!frag) {
      return
    }
    this.info(
      'info',
      `编号：${frag.sn}加载完成,url:${frag.relurl},size:${
        frag.loaded
      }, duration:${frag.duration}`
    )
    if (!this.store.getKV(KV.DownloadSize)) {
      this.store.setKV(KV.DownloadSize, 0)
    }

    let size = this.store.getKV(KV.DownloadSize)
    size += frag.loaded
    this.store.setKV(KV.DownloadSize, size)
  }

  /**
   * 统一错误消息捕获
   *
   * @param {*} e {type:'', details:'', fatal:'', reason:'', frag:null}
   * @memberof VhallController
   */
  onError(e) {
    let { type, details } = e

    this.info(
      'error',
      JSON.stringify({
        type,
        details
      })
    )

    // m3u8文件加载失败的话，需要进行切线处理
    if (e.details === 'manifestLoadError') {
      clearTimeout(this._timeout)
      this._timeout = setTimeout(() => {
        this.hls.emit2All(PlayerEvent.CHANGE_LINE)
      }, 2000)
    }
    this.hls.emit2All('error', e)
  }

  destroy() {
    EventHandler.prototype.destroy.call(this)
  }

  info(type, ...args) {
    Log.OBJ[type](`[${this.CLASS_NAME}] ${args}`)
  }
}

export default VhallController
