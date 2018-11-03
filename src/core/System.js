/**
 * 系统函数
 *
 * @export
 * @class System
 * @author zhenliang.sun
 */
export default class System {

  /**
   * 是否支持H5播放器
   *
   * @static
   * @returns
   * @memberof System
   */
  static isSupportMSEH264() {
    return window.MediaSource && window.MediaSource.isTypeSupported('video/mp4; codecs="avc1.42E01E,mp4a.40.2"');
  }


  /**
   *
   * 是否支持本地播放器
   * @static
   * @param {string} [mimeType='']
   * @returns
   * @memberof System
   */
  static isSupportNativeMedia(mimeType = '') {
    mimeType = mimeType === '' ? 'video/mp4; codecs="avc1.42001E, mp4a.40.2"' : '';
    let v = window.document.createElement('video');
    let canPlay = v.canPlayType(mimeType);
    return canPlay === 'probably' || canPlay === 'maybe';
  }
}