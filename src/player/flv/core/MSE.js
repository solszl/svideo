import Component from './Component'
import IllegalStateException from '../../error/IllegalStateException'
import Browser from './../../utils/Browser'
import { MSEEvents } from './../common/MSEConstants'

/**
 *
 *
 * @class MSE
 * @author zhenliang.sun
 */
class MSE extends Component {
  constructor(config) {
    super()

    this._config = config

    if (this._config.isLive && this._config.autoCleanupSourceBuffer === undefined) {
      this._config.autoCleanupSourceBuffer = true // 直播的时候。 默认自动清理
    }

    this._mediaSource = null
    this._mediaSourceObjectURL = null
    this._mediaElement = null

    this._pendingSourceBufferInit = []
    this._pendingSegments = {
      video: [],
      audio: []
    }

    this._lastInitSegments = {
      video: [],
      audio: []
    }

    this._mimeTypes = {
      video: null,
      audio: null
    }
    this._sourceBuffers = {
      video: null,
      audio: null
    }
    this._lastInitSegments = {
      video: null,
      audio: null
    }

    this._pendingRemoveRanges = {
      video: null,
      audio: null
    }

    this._isBufferFull = false
  }

  destroy() {
    super.destroy()
    if (this._mediaElement || this._mediaSource) {
      this.detachMediaElement()
    }
  }

  /**
   * 绑定MSE 到element上
   *
   * @param {*} element
   * @memberof MSE
   */
  attachMediaElement(element) {
    if (this._mediaSource) {
      throw new IllegalStateException('MediaSource has been attached to an HTMLMediaElement!')
    }

    this._mediaSource = new MediaSource()
    let ms = this._mediaSource
    ms.addEventListener(MSEEvents.SOURCE_OPEN, this._onSourceOpen.bind(this))
    ms.addEventListener(MSEEvents.SOURCE_ENDED, this._onSourceEnded.bind(this))
    ms.addEventListener(MSEEvents.SOURCE_CLOSE, this._onSourceClose.bind(this))

    this._mediaElement = element
    this._mediaSourceObjectURL = URL.createObjectURL(this._mediaSource)
    element.src = this._mediaSourceObjectURL
  }

  /**
   * 从element 上取消MSE绑定事件
   *
   * @memberof MSE
   */
  detachMediaElement() {
    if (this._mediaSource) {
      let ms = this._mediaSource
      for (let type in this._sourceBuffers) {
        let ps = this._pendingSegments[type]
        ps.splice(0, ps.length)
        this._pendingSegments[type] = null
        this._pendingRemoveRanges[type] = null
        this._lastInitSegments[type] = null

        let sb = this._sourceBuffers[type]
        if (sb) {
          if (ms.readyState !== 'closed') {
            try {
              ms.removeSourceBuffer(sb)
            } catch (e) {
              this.info('warn', e.message)
            }
            sb.removeEventListener(MSEEvents.ERROR, this._onSourceBufferError)
            sb.removeEventListener(MSEEvents.UPDATE_END, this._onSourceBufferUpdateEnd)
          }
          this._mimeTypes[type] = null
          this._sourceBuffers[type] = null
        }
      }

      if (ms.readyState === 'open') {
        try {
          ms.endOfStream()
        } catch (e) {
          this.info('error', e.message)
        }
      }

      ms.removeEventListener(MSEEvents.SOURCE_OPEN, this._onSourceOpen)
      ms.removeEventListener(MSEEvents.SOURCE_ENDED, this._onSourceEnded)
      ms.removeEventListener(MSEEvents.SOURCE_CLOSE, this._onSourceClose)

      this._pendingSourceBufferInit = []
      this.CLASS_NAME._isBufferFull = false
      this._mediaSource = null
    }

    if (this._mediaElement) {
      this._mediaElement.src = ''
      this._mediaElement.removeAttribute('src')
      this._mediaElement = null
    }

    if (this._mediaSourceObjectURL) {
      URL.revokeObjectURL(this._mediaSourceObjectURL)
      this._mediaSourceObjectURL = null
    }
  }

  _onSourceOpen() {
    this.info('info', 'MediaSource onSourceOpen')
    this._mediaSource.removeEventListener(MSEEvents.SOURCE_OPEN, this._onSourceOpen)

    if (this._pendingSourceBufferInit.length > 0) {
      let pendings = this._pendingSourceBufferInit
      while (pendings.length) {
        let segment = pendings.shift()
        this.appendInitSegment(segment, true)
      }
    }

    this.emit(MSEEvents.SOURCE_OPEN)
  }

  _onSourceEnded() {
    this.info('info', 'MediaSource onSourceEnded')
  }

  _onSourceClose() {
    this.info('info', 'MediaSource onSourceClose')
    if (this._mediaSource) {
      this._mediaSource.removeEventListener(MSEEvents.SOURCE_OPEN, this._onSourceOpen)
      this._mediaSource.removeEventListener(MSEEvents.SOURCE_ENDED, this._onSourceEnded)
      this._mediaSource.removeEventListener(MSEEvents.SOURCE_CLOSE, this._onSourceClose)
    }
  }

  _onSourceBufferError(e) {
    this.info('error', `SourceBuffer Error: ${e}`)
  }

  _onSourceBufferUpdateEnd() {
    this.emit(MSEEvents.UPDATE_END)
  }

  appendInitSegment(segment, deferred) {
    if (!this._mediaSource || this._mediaSource.readyState !== 'open') {
      // sourcebuffer 创建， 需要mediasource的状态为open
      this._pendingSourceBufferInit.push(segment)
      this._pendingSegments[segment.type].push(segment)
    }

    let seg = segment
    let mimeType = `${seg.container}`
    if (seg.codec && seg.codec.length > 0) {
      mimeType += `;codecs=${seg.codec}`
    }

    this.info('info', 'Received Initialization Segment, mimeType: ', mimeType)
    let firstInitSegment = false

    this._lastInitSegments[seg.type] = seg
    if (mimeType !== this._mimeType[seg.type]) {
      if (!this._mimeTypes[seg.type]) {
        // 创建 sourceBuffer
        firstInitSegment = true
        try {
          this._sourceBuffers[seg.type] = this._mediaSource.addSourceBuffer(mimeType)
          let sb = this._sourceBuffers[seg.type]
          sb.addEventListener(MSEEvents.ERROR, this._onSourceBufferError.bind(this))
          sb.addEventListener(MSEEvents.UPDATE_END, this._onSourceBufferUpdateEnd.bind(this))
        } catch (e) {
          this.info('error', e.message)
          this.emit(MSEEvents.ERROR, {
            code: e.code,
            msg: e.message
          })
        }
      } else {
        this.info(
          'info',
          `Notice: ${seg.type} mimeType changed, origin: ${this._mimeTypes[seg.type]}, target: ${mimeType}`
        )
      }

      this._mimeTypes[seg.type] = mimeType
    }

    if (!deferred) {
      this._pendingSegments[seg.type].push(seg)
    }

    if (!firstInitSegment) {
      if (this._sourceBuffers[seg.type] && !this._sourceBuffers[seg.type].updating) {
        this._doAppendSegments()
      }
    }
  }

  _doAppendSegments() {
    let pendingSegments = this._pendingSegments
    for (let type in pendingSegments) {
      if (!this._sourceBuffers[type] || this._sourceBuffers[type].updating) {
        continue
      }

      if (pendingSegments[type].length > 0) {
        let seg = pendingSegments.shift()
        if (seg.timestampOffset) {
          // For MPEG audio stream in MSE, if unbuffered-seeking occurred
          // We need explicitly set timestampOffset to the desired point in timeline for mpeg SourceBuffer.
          let currentOffset = this._sourceBuffers[type].timestampOffset
          let targetOffset = seg.timestampOffset / 1000 // in seconds

          let delta = Math.abs(currentOffset - targetOffset)
          if (delta > 0.1) {
            // If time delta > 100ms
            this.info('info', `Update MPEG audio timestampOffset from ${currentOffset} to ${targetOffset}`)
            this._sourceBuffers[type].timestampOffset = targetOffset
          }
          delete seg.timestampOffset
        }

        if (!seg.data || seg.data.byteLength === 0) {
          continue
        }

        try {
          this._sourceBuffers[type].appendBuffer(seg.data)
          this._isBufferFull = false
        } catch (e) {
          this._pendingSegments[type].unshift(seg)
          if (e.code === 22) {
            if (!this._isBufferFull) {
              this.emit(MSEEvents.BUFFER_FULL)
            }
            this._isBufferFull = true
          } else {
            this.info('error', e.message)
            this.emit(MSEEvents.ERROR, {
              code: e.code,
              msg: e.message
            })
          }
        }
      }
    }
  }
}

export default MSE
