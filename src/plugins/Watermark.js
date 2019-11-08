import Plugin from '../core/Plugin'
import { removeFromParent, createElement, appendChild } from '../utils/Dom'

/**
 * 水印组件
 *
 * @export
 * @class Watermark
 * @extends {Plugin}
 * @author zhenliang.sun
 */
export default class Watermark extends Plugin {
  constructor() {
    super()
    this.elImage = null
  }

  init(opts = {}) {
    super.init(opts)
    this._allConfig = opts
    this._watermarkCfg = JSON.parse(opts[Watermark.type]) // JSON.parse(this._allConfig.watermark);
    let watermarkCfg = this._watermarkCfg
    if (watermarkCfg.enable === false) {
      return
    }
    this._createWatermark(watermarkCfg)
  }

  static get type() {
    return 'plugin_watermark'
  }

  destroy() {
    super.destroy()
    if (this.elImage) {
      this.elImage.src = ''
      this.elImage.onerror = null
      removeFromParent(this.elImage)
      this.elImage = null
    }

    this.player = null
  }

  /**
   * 根据配置生成水印
   *
   * @param {*} [cfg=null]
   * @memberof Watermark
   */
  _createWatermark(cfg = null) {
    const { url, align, position, size } = cfg

    const p = this._analysisPosition(align, position)

    this.elContainer = createElement('div', {
      id: 'vh-watermark-container'
    })
    this.elContainer.style.position = 'absolute'
    this.elContainer.style.userSelect = 'none'
    this.elContainer.style.display = 'flex'
    this.elContainer.style.flexDirection = 'column'

    appendChild(this._allConfig['id'], this.elContainer)
    Object.assign(this.elContainer.style, p)
    Object.assign(this.elContainer.style, {
      width: size[0],
      height: size[1]
    })

    this.elImage = createElement('img', {
      id: 'vh-watermark',
      src: url
    })

    this.elImage.style.objectFit = 'contain'

    appendChild('vh-watermark-container', this.elImage)

    this.elImage.onerror = this._imgOnError.bind(this)
    this.elImage.onload = e => {
      if (this.elImage.width < this.elImage.height) {
        this.elImage.style.height = '100%'
      } else {
        this.elImage.style.width = '100%'
      }
    }
  }

  _analysisPosition(a, p) {
    let xPos = '10px'
    let yPos = '10px'
    if (!Array.isArray(p)) {
      this.info('warn', `could not resolve position paramter, ${p}`)
      return {
        left: xPos,
        top: yPos
      }
    } else {
      xPos = p[0]
      yPos = p[1]
    }

    let result = {}
    const alphabets = a.toLowerCase().split('')
    alphabets.forEach(ab => {
      switch (ab) {
      case 't':
        result.top = yPos
        result.justifyContent = 'flex-start'
        break
      case 'b':
        result.bottom = yPos
        result.justifyContent = 'flex-end'
        break
      case 'l':
        result.left = xPos
        result.alignItems = 'flex-start'
        break
      case 'r':
        result.right = xPos
        result.alignItems = 'flex-end'
        break
      default:
        result.left = xPos
        result.top = yPos
        break
      }
    })
    return result
  }

  _imgOnError(e) {
    let evt = {
      type: 'error',
      details: 'Watermark load failed.'
    }
    this.player.emit(evt.type, evt)
    this.info('error', 'Watermark load failed.')
  }
}
