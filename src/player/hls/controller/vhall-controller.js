import Log from '../../../utils/Log'
import EventHandler from '../event-handler'
import Event from '../events'
import { KV } from './../../../core/Constant'

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

    this.hls.owner.emit('error', e)
  }

  destroy() {
    EventHandler.prototype.destroy.call(this)
  }

  info(type, ...args) {
    Log.OBJ[type](`[${this.CLASS_NAME}] ${args}`)
  }
}

export default VhallController
