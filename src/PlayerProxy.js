import Component from './core/Component';
import {
  createElement
} from './utils/Dom';
import Log from './utils/Log';

const requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;
// 私有函数更新
const updateDisplayList = Symbol('component-display-update');

/**
 * 播放器的基类
 *
 * @class PlayerProxy
 * @extends {Component}
 * @author zhenliang.sun
 */
class PlayerProxy extends Component {
  constructor(opts = {}) {
    super();
    this._volume = 0.5;
    this._src = '';
    this._isLive = false;
    this._started = false;
    this.video = createElement('video', {}, {
      width: '100%',
      height: '100%'
    });

    // requestAnimationFrame(() => this[updateDisplayList]());
  }

  /**
   * 开始播放
   *
   * @memberof PlayerProxy
   */
  play() {
    this.video.focus();
    this.video.play();
    this._started = true;
    this.emit('play');
  }

  /**
   * 暂停当前正在播放的视频
   *
   * @memberof PlayerProxy
   */
  pause() {
    this.video.pause();
    this._started = false;
    this.emit('pause');
  }

  /**
   * 查看当前视频正在处于暂停状态
   *
   * @readonly
   * @memberof PlayerProxy
   */
  get isPaused() {
    // return this.video.paused;
    return this._started === false;
  }

  /**
   * 设置自动播放，移动端实现自动播放同时需要将 muted 属性设置为true
   *
   * @memberof PlayerProxy
   */
  set autoplay(v) {
    this.video.autoplay = v;
  }

  get autoplay() {
    return this.video.autoplay;
  }

  /**
   * Gets a collection of buffered time ranges.
   * 获取当前 video 的buffered ranges
   *
   * @readonly
   * @memberof PlayerProxy
   */
  get buffered() {
    return this.video.buffered;
  }

  /**
   * 设置视频是否允许跨域播放
   *
   * @memberof PlayerProxy
   */
  get crossOrigin() {
    return this.video.crossOrigin;
  }

  set crossOrigin(v) {
    this.video.crossOrigin = v;
  }

  /**
   * 获取当前视频播放的时间，单位：秒
   *
   * @memberof PlayerProxy
   */
  get currentTime() {
    return this.video.currentTime;
  }

  /**
   * 设置当前视频的播放时间，单位：秒
   *
   * @memberof PlayerProxy
   */
  set currentTime(t) {
    this.video.currentTime = t;
    this.emit('currentTimeChanged', t);
  }

  /**
   * 设置默认是否为静音
   *
   * @memberof PlayerProxy
   */
  set defaultMuted(v) {
    this.video.defaultMuted = v;
  }

  get defaultMuted() {
    return this.video.defaultMuted;
  }

  /**
   * 点播服务中，获取视频的总时长
   *
   * @readonly
   * @memberof PlayerProxy
   */
  get duration() {
    return this.video.duration;
  }

  /**
   * 是否播放完毕
   *
   * @readonly
   * @memberof PlayerProxy
   */
  get ended() {
    return this.video.ended;
  }

  /**
   * 点播服务中，当视频播放完毕后是否进行循环播放
   *
   * @memberof PlayerProxy
   */
  set loop(v) {
    if (this.video.loop !== v) {
      this.video.loop = v;
      this.emit('loopChanged', v);
    }
  }

  get loop() {
    return this.video.loop;
  }

  /**
   * 获取当前视频播放器是否静音
   *
   * @memberof PlayerProxy
   */
  get muted() {
    return this.video.muted;
  }

  /**
   * 设置当前video播放源是否为静音
   *
   * @memberof PlayerProxy
   */
  set muted(b) {
    if (this.video.muted !== b) {
      this.video.muted = b;
      this.emit('mutedChanged', b);
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
    return this.video.networkState;
  }

  /**
   * 点播服务中设置倍速
   *
   * @memberof PlayerProxy
   */
  set playbackRate(v) {
    if (this.video.playbackRate !== v) {
      this.video.playbackRate = v;
      this.emit('playbackRateChanged', v);
    }
  }

  /**
   * 获取当前视频的倍速值
   *
   * @memberof PlayerProxy
   */
  get playbackRate() {
    return this.video.playbackRate;
  }

  /**
   * Gets TimeRanges for the current media resource that has been played.
   *
   * @readonly
   * @memberof PlayerProxy
   */
  get played() {
    return this.video.played;
  }

  /**
   * 返回以秒为单位的预加载数据长度
   * Gets or sets the current playback position, in seconds.
   *
   * @readonly
   * @memberof PlayerProxy
   */
  get preload() {
    return this.video.preload;
  }

  set preload(t) {
    this.video.preload = t;
  }

  /**
   * 获取当前视频播放器的准备状态值
   *
   * @readonly
   * @memberof PlayerProxy
   * @returns [0,1,2,3,4] // 0:没有任何信息，1：拥有元数据，2：当前位置播放数据可用，但是下一帧数据不够用，3：当前及下一帧数据可用，4，数据足够多，可以播放了
   */
  get readyState() {
    return this.video.readyState;
  }

  get src() {
    return this._src;
  }
  set src(url) {
    if (this._src !== url) {
      let oldSrc = this._src;
      this._src = url;
      this.emit('srcChanged', {
        oldUrl: oldSrc,
        newUrl: this._src
      });
    }
  }

  /**
   * 设置音量
   *
   * @memberof PlayerProxy
   */
  get volume() {
    return this._volume;
  }

  set volume(v) {
    if (typeof v === 'string') {
      Log.OBJ.warn('volume param should be number');
      v = parseFloat(v);
    }

    if (v > 1 || v < 0) {
      Log.OBJ.warn('volume value range should be between 0 to 1');
      v = Math.min(Math.max(0, v), 1);
    }

    if (this._volume !== v) {
      let oldVolume = this._volume;
      this._volume = v;
      this.video.volume = this._volume;

      this.emit('volumeChanged', {
        oldVolume: oldVolume,
        newVolume: this._volume
      });
    }

    this.muted = this._volume === 0;
  }

  /**
   * 获取当前seek状态，是否跳转中
   *
   * @readonly
   * @memberof PlayerProxy
   * @returns true跳转中， false 跳转完成
   */
  get seeking() {
    return this.video.seeking;
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
    return this.video.seekable;
  }

  /**
   * 是否是直播状态
   *
   * @readonly
   * @memberof PlayerProxy
   * @returns 直播 true, 其他：false
   */
  get isLive() {
    return this._isLive;
  }


  [updateDisplayList]() {

  }
}

export default PlayerProxy;