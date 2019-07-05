import Component from './core/Component'
import { KV } from './core/Constant'
import Store from './core/Store'
import { PlayerEvent } from './PlayerEvents'
import { createElement, removeFromParent } from './utils/Dom'

/**
 * 播放器的基类
 *
 * @class PlayerProxy
 * @extends {Component}
 * @author zhenliang.sun
 */
class PlayerProxy extends Component {
  constructor() {
    super()

    this._volume = 0.5
    this._src = ''
    this._isLive = false
    this._isPlaying = false
    this.video = null
    this.store = new Store()
    this.reset()
  }

  initVideo(config = {}) {
    let x5cfg = {}
    if (config['x5']) {
      x5cfg['webkit-playsinline'] = true
      x5cfg['playsinline'] = true
      x5cfg['x5-playsinline'] = true
      // x5cfg['x5-video-player-type'] = 'h5';
      // x5cfg['x5-video-player-fullscreen'] = true;
      // x5cfg['x5-video-orientation'] = 'portraint';
    }

    let poster = config['poster']
      ? {
        poster: config['poster']
      }
      : {}

    this.video = createElement(
      'video',
      {
        id: 'vh-video',
        controls: false
        // muted: true,
      },
      Object.assign(
        {
          width: '100%',
          height: '100%',
          crossOrigin: 'anonymous',
          'z-index': 0
        },
        x5cfg,
        poster
      )
    )

    this._root = document.getElementById(config['id'])
    const parent = this._root
    parent.appendChild(this.video)
    parent.style.position = 'relative'

    this.autoplay = config.autoplay || true
    this._isLive = config['isLive']
  }

  initEvents() {
    this._initOriginalEvents()
  }

  /**
   * 开始播放
   *
   * @memberof PlayerProxy
   */
  play() {
    this.video.focus()
    this.video.play()
    this._isPlaying = true
  }

  /**
   * 暂停当前正在播放的视频
   *
   * @memberof PlayerProxy
   */
  pause() {
    this.video.pause()
    this._isPlaying = false
  }

  /**
   * 判断某个时间是否已经缓存了
   *
   * @param {*} time 秒为单位
   * @returns 返回是否已经缓存该时刻
   * @memberof PlayerProxy
   */
  timeInBuffer(time) {
    let result = false
    if (this.buffered.length === 0) {
      return result
    }

    time = +time
    let len = this.buffered.length
    for (let i = 0; i < len; i += 1) {
      if (time > this.buffered.end(i)) {
        continue
      }

      if (time > this.buffered.start(i)) {
        result = true
      }
    }
    return result
  }

  /**
   * 获取下载大小，指的是不论seek还是自然下载的总和
   * 针对于HLS，仅统计了TS大小
   * 针对于FLV, 统计flv流文件大小
   * 针对于原生MP4模拟计算出来的，如：一个MP4文件大小为100M，总时长为100分钟，则认为每分钟大小约为1M。
   *       通过video 的buffer 计算时间缓冲区间，然后累加获取
   *
   * @returns
   * @memberof PlayerProxy
   */
  get downloadSize() {
    return this.store.getKV(KV.DownloadSize) || -1
  }

  /**
   * 查看当前视频正在处于暂停状态
   *
   * @readonly
   * @memberof PlayerProxy
   */
  get isPaused() {
    return this.video.paused && this._isPlaying === false
  }

  /**
   * 设置自动播放，移动端实现自动播放同时需要将 muted 属性设置为true
   *
   * @memberof PlayerProxy
   */
  set autoplay(v) {
    this.video.autoplay = v
  }

  get autoplay() {
    return this.video.autoplay
  }

  /**
   * Gets a collection of buffered time ranges.
   * 获取当前 video 的buffered ranges
   *
   * @readonly
   * @memberof PlayerProxy
   */
  get buffered() {
    return this.video.buffered
  }

  /**
   * 设置视频是否允许跨域播放
   *
   * @memberof PlayerProxy
   */
  get crossOrigin() {
    return this.video.crossOrigin
  }

  set crossOrigin(v) {
    this.video.crossOrigin = v
  }

  /**
   * 获取当前视频播放的时间，单位：秒
   *
   * @memberof PlayerProxy
   */
  get currentTime() {
    return this.video.currentTime
  }

  /**
   * 设置当前视频的播放时间，单位：秒
   *
   * @memberof PlayerProxy
   */
  set currentTime(t) {
    this.video.currentTime = t
    if (this.owner) {
      this.owner.emit(PlayerEvent.CURRENT_TIME_CHANGED, t)
    }
  }

  /**
   * 设置默认是否为静音
   *
   * @memberof PlayerProxy
   */
  set defaultMuted(v) {
    this.video.defaultMuted = v
  }

  get defaultMuted() {
    return this.video.defaultMuted
  }

  /**
   * 点播服务中，获取视频的总时长
   *
   * @readonly
   * @memberof PlayerProxy
   */
  get duration() {
    return this.video.duration
  }

  /**
   * 是否播放完毕
   *
   * @readonly
   * @memberof PlayerProxy
   */
  get ended() {
    return this.video.ended
  }

  /**
   * 点播服务中，当视频播放完毕后是否进行循环播放
   *
   * @memberof PlayerProxy
   */
  set loop(v) {
    let oldValue = this.video.loop
    this.video.loop = v
    let newValue = v
    const e = { oldValue, newValue }
    if (this.owner) {
      this.owner.emit(PlayerEvent.LOOP_CHANGED, e)
    }
  }

  get loop() {
    return this.video.loop
  }

  /**
   * 获取当前视频播放器是否静音
   *
   * @memberof PlayerProxy
   */
  get muted() {
    return this.video.muted || this.volume === 0
  }

  /**
   * 设置当前video播放源是否为静音
   *
   * @memberof PlayerProxy
   */
  set muted(b) {
    let oldValue = this.video.muted
    this.video.muted = b
    let newValue = b
    const e = { oldValue, newValue }
    if (this.owner) {
      this.owner.emit(PlayerEvent.MUTED_CHANGED, e)
    }
  }

  /**
   * 获取当前元素网络状态
   * Gets the current network activity for the element.
   *
   * @readonly
   * @memberof PlayerProxy
   */
  get networkState() {
    return this.video.networkState
  }

  /**
   * 点播服务中设置倍速
   *
   * @memberof PlayerProxy
   */
  set playbackRate(v) {
    v = +v
    if (this.video.playbackRate !== v) {
      this.video.playbackRate = v
    }
  }

  /**
   * 获取当前视频的倍速值
   *
   * @memberof PlayerProxy
   */
  get playbackRate() {
    return this.video.playbackRate
  }

  /**
   * Gets TimeRanges for the current media resource that has been played.
   *
   * @readonly
   * @memberof PlayerProxy
   */
  get played() {
    return this.video.played
  }

  /**
   * 返回以秒为单位的预加载数据长度
   * Gets or sets the current playback position, in seconds.
   *
   * @readonly
   * @memberof PlayerProxy
   */
  get preload() {
    return this.video.preload
  }

  set preload(t) {
    this.video.preload = t
  }

  /**
   * 获取当前视频播放器的准备状态值
   *
   * @readonly
   * @memberof PlayerProxy
   * @returns [0,1,2,3,4] // 0:没有任何信息，1：拥有元数据，2：当前位置播放数据可用，但是下一帧数据不够用，3：当前及下一帧数据可用，4，数据足够多，可以播放了
   */
  get readyState() {
    return this.video.readyState
  }

  get src() {
    return this._src
  }
  set src(url) {
    const e = {
      oldValue: this._src,
      newValue: url
    }
    this.emit2All(PlayerEvent.SRC_CHANGED, e)

    this.video.src = url // this.beforeSetSrcHook(url);
    this.store.setKV(KV.URL, url)
  }

  /**
   * 设置音量
   *
   * @memberof PlayerProxy
   */
  get volume() {
    return this._volume
  }

  set volume(v) {
    v = +v

    if (v > 1 || v < 0) {
      this.info(
        'warn',
        `volume value range should be between 0 to 1, now you set ${v}`
      )
      v = Math.min(Math.max(0, v), 1)
    }

    if (this._volume !== v) {
      let oldVolume = this._volume
      this._volume = v
      this.video.volume = this._volume
    }

    this.muted = this._volume === 0
  }

  get controls() {
    return this.video.controls
  }

  set controls(val) {
    this.video.controls = val
  }

  /**
   * 获取当前seek状态，是否跳转中
   *
   * @readonly
   * @memberof PlayerProxy
   * @returns true跳转中， false 跳转完成
   */
  get seeking() {
    return this.video.seeking
  }

  /**
   * 返回一个TimeRanges, 当前可跳转的时间区域
   * Returns a TimeRanges object that represents the ranges of the current media resource that can be seeked.
   *
   * @readonly
   * @memberof PlayerProxy
   * @returns 返回一个TimeRanges
   */
  get seekable() {
    return this.video.seekable
  }

  /**
   * 是否是直播状态
   *
   * @readonly
   * @memberof PlayerProxy
   * @returns 直播 true, 其他：false
   */
  get isLive() {
    return this._isLive
  }

  /**
   * 获取预估网速
   *
   * @readonly
   * @memberof PlayerProxy
   */
  get estimateNetSpeed() {
    return 0
  }

  get root() {
    return this._root
  }

  get owner() {
    return this._owner
  }

  _initOriginalEvents() {
    const e = {
      /** 开始播放 */
      play: this.__play.bind(this),
      /** 暂停 */
      pause: this.__pause.bind(this),
      /** 开始加载新的数据，每加载一次，执行一次 */
      progress: this.__progress.bind(this),
      /** 播放出错 */
      error: this.__error.bind(this),
      /** 视频时间戳更新触发事件 */
      timeupdate: this.__timeupdate.bind(this),
      /** 视频设置src后，加载元数据后，派发的事件 */
      loadedmetadata: this.__loadedmetadata.bind(this),
      /** seek完成后，触发的事件 */
      seeked: this.__seeked.bind(this),
      /** 当没有buffer开始播放的时候，派发waiting事件，也就是说，卡顿了 */
      waiting: this.__waiting.bind(this),
      /** 播放速率发生变更的时候，派发的事件 */
      ratechange: this.__ratechange.bind(this),
      /** 声音发生改变的时候，派发的事件 */
      volumechange: this.__volumechange.bind(this)
      // loadstart: this.__loadstart.bind(this),
      // canplaythrough: this.__canplaythrough.bind(this)
    }

    if (!this.isLive) {
      Object.assign(e, {
        /** 播放完毕执行的事件 */
        ended: this.__ended.bind(this)
      })
    }

    // 添加监听
    Object.keys(e).forEach(item => {
      this.video.addEventListener(item, e[item])
    })
  }

  emit2All(act, data) {
    // this.emit(act, data)
    this.owner && this.owner.emit(act, data)
  }

  __play() {
    this.emit2All(PlayerEvent.PLAY)
  }
  __pause() {
    this.emit2All(PlayerEvent.PAUSE)
  }
  __progress(e) {
    this.emit2All(PlayerEvent.PROGRESS, e)
  }
  __error(e) {
    this.emit2All(PlayerEvent.ERROR, e)
  }
  __timeupdate(e) {
    // 每大于500ms 派发一次事件
    let now = Date.now()
    if (!this._lastEmitTimeupdate) {
      this._lastEmitTimeupdate = Date.now()
    }

    if (now - this._lastEmitTimeupdate > 200 && !isNaN(this.duration)) {
      this._lastEmitTimeupdate = now
      this.emit2All(PlayerEvent.TIMEUPDATE, e)
    }
  }
  __ended() {
    this.emit2All(PlayerEvent.PLAY_END)
  }

  __loadedmetadata(e) {
    this.emit2All(PlayerEvent.LOADEDMETADATA, e)
  }

  __seeked(e) {
    this.emit2All(PlayerEvent.SEEKED, e)
  }

  __waiting(e) {
    this.emit2All(PlayerEvent.WAITING, e)
  }

  __ratechange(e) {
    let rate = this.video.playbackRate
    this.emit2All(PlayerEvent.PLAYBACKRATE_CHANGED, rate)
  }

  __volumechange(e) {
    this.emit2All(PlayerEvent.VOLUME_CHANGE, e)
  }

  // __loadstart(e) {
  //   this._e(PlayerEvent.LOADSTART, e);
  // }

  // __canplaythrough(e) {
  //   this._e(PlayerEvent.CANPLAYTHROUGH, e);
  // }

  reset() {
    this._lastEmitTimeupdate = Date.now()
  }

  destroy() {
    super.destroy()
    this._volume = 0.5
    this._src = ''
    this._isLive = false
    this._isPlaying = false
    this.store.reset()
    this.reset()

    if (this.video) {
      this.video.removeEventListener('play', this.__play)
      this.video.removeEventListener('pause', this.__pause)
      this.video.removeEventListener('progress', this.__progress)
      this.video.removeEventListener('error', this.__error)
      this.video.removeEventListener('timeupdate', this.__timeupdate)
      this.video.removeEventListener('ended', this.__ended)
      this.video.removeEventListener('loadedmetadata', this.__loadedmetadata)
      this.video.removeEventListener('seeked', this.__seeked)
      this.video.removeEventListener('waiting', this.__waiting)
      this.video.removeEventListener('ratechange', this.__ratechange)
      this.video.removeEventListener('volumechange', this.__volumechange)
      removeFromParent(this.video)
      this.video = null
    }
  }
}

export default PlayerProxy
