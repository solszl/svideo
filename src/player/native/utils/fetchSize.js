import Model from '../../../core/Model';
import Log from '../../../utils/Log';

/**
 * 利用xhr的头 ，去碰一下文件大小，针对于 flv,mp4文件生效，HLS文件可用
 *
 * @export
 * @class FetchSize
 * @author zhenliang.sun
 */
export default class FetchSize {
  constructor() {
    this._url = '';
    this._xhr;
  }

  destroy() {
    this._url = '';
    if (this._xhr) {
      this._xhr.onreadystatechange = null;
      this._xhr = null;
    }
  }

  /**
   * 利用xhr的头 ，去碰一下文件大小，针对于 flv,mp4文件生效，HLS文件可用
   *
   * @param {*} url
   * @memberof FetchSize
   */
  start(url) {
    // M3U8 不处理
    if (String(url).toLowerCase().match(/.m3u8/)) {
      Model.OBJ.fileSize = -1;
      return;
    }

    this._url = url;
    this._xhr = new XMLHttpRequest();
    let xhr = this._xhr;
    xhr.open('HEAD', this._url);
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        // TODO: 运维更新oss，添加请求头的支持 Access-Control-Expose-Headers : Content-Length
        let size = xhr.getResponseHeader('Content-Length');
        Model.OBJ.fileSize = size;
        Log.OBJ.info(`fetch file size: ${(size / 1024 / 1024).toFixed(2)}Mb`);
        this.destroy();
        return size;
      }
    };

    xhr.send();
  }
}