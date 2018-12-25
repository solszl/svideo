import PlayerProxy from './../PlayerProxy';
import MSE from './core/MSE';
import {
  MSEEvents
} from './common/MSEConstants';

/**
 *
 *
 * @export
 * @class FlvPlayer
 * @extends {PlayerProxy}
 * @author zhenliang.sun
 */
export default class FlvPlayer extends PlayerProxy {
  constructor(config) {
    super(config);
    this._config = config;
    this._mediaElement = null;
  }

  /**
   *
   *
   * @param {*} mediaElement
   * @memberof FlvPlayer
   */
  attachMediaElement(mediaElement) {
    this._mediaElement = mediaElement;
    // 添加内置事件监听
    // http://www.w3school.com.cn/tags/av_event_loadedmetadata.asp
    mediaElement.addEventListener('loadedmetadata', this._onLoadedMetaData.bind(this)); // video 或者audio 获取元数据后会触发这个事件
    mediaElement.addEventListener('seeking', this._onSeeking.bind(this)); // seeking 属性返回用户目前是否在音频/视频中寻址。寻址中（Seeking）指的是用户在音频/视频中移动/跳跃到新的位置。
    mediaElement.addEventListener('canplay', this._onCanPlay.bind(this)); // 当浏览器能够开始播放指定的音频/视频时，发生 canplay 事件。
    mediaElement.addEventListener('stalled', this._onStalled.bind(this)); // 当浏览器尝试获取媒体数据，但数据不可用时
    mediaElement.addEventListener('progress', this._onProgress.bind(this)); // 当浏览器正在下载指定的音频/视频时，会发生 progress 事件。

    this._mseController = new MSE(this._config);
    this._mseController.on(MSEEvents.UPDATE_END, this._onMseUpdateEnd.bind(this));
    this._mseController.on(MSEEvents.BUFFER_FULL, this._onMseBufferFull.bind(this));
    this._mseController.on(MSEEvents.SOURCE_OPEN, this._onMseSourceOpen.bind(this));
    this._mseController.on(MSEEvents.ERROR, this._onMseError.bind(this));
    this._mseController.attachMediaElement(mediaElement);
  }

  detachMediaElement() {
    let mediaElement = this._mediaElement;
    if (mediaElement) {
      this._mseController && this._mseController.detachMediaElement();
      mediaElement.removeEventListener('loadedmetadata', this._onLoadedMetaData);
      mediaElement.removeEventListener('seeking', this._onSeeking);
      mediaElement.removeEventListener('canplay', this._onCanPlay);
      mediaElement.removeEventListener('stalled', this._onStalled);
      mediaElement.removeEventListener('progress', this._onProgress);
      this._mediaElement = null;
    }

    if (this._mseController) {
      this._mseController.destroy();
      this._mseController = null;
    }
  }

  _onLoadedMetaData(e) {}
  _onSeeking(e) {}
  _onCanPlay(e) {}
  _onStalled(e) {}
  _onProgress(e) {}
  _onMseUpdateEnd(e) {}
  _onMseBufferFull(e) {}
  _onMseSourceOpen(e) {}
  _onMseError(e) {}
}