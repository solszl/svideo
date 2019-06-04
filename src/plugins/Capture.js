import Plugin from '../core/Plugin'

/**
 * 截图接口
 *
 * @export
 * @class Capture
 * @extends {Plugin}
 * @author zhenliang.sun
 */
export default class Capture extends Plugin {
  constructor() {
    super()
  }

  init(opts = {}) {
    super.init(opts)

    this.player.capture = this.capture.bind(this)
    this._cvsCapture = document.createElement('canvas')
  }

  destroy() {
    super.destroy()
  }

  capture(width, height) {
    if (!this.player.video) {
      return
    }

    if (!width) {
      width = this.player.video.videoWidth
    }

    if (!height) {
      height = this.player.video.videoHeight
    }

    let cvs = this._cvsCapture
    cvs.width = width
    cvs.height = height
    let ctx = cvs.getContext('2d')

    ctx.drawImage(this.player.video, 0, 0)
    return cvs.toDataURL('images/png')
  }

  static get type() {
    return 'plugin_capture'
  }
}
