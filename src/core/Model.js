const private_data_model = Symbol('private_data_model')

/**
 * 数据中心
 *
 * @export
 * @class Model
 */
export default class Model {
  constructor () {
    if (this[private_data_model]) {
      throw new Error('DataStore should be a singleton Class')
    }
    this[private_data_model] = this

    this._initData()
  }

  static get OBJ () {
    if (!this[private_data_model]) {
      this[private_data_model] = new Model()
    }

    return this[private_data_model]
  }

  reset () {
    this._fileSize = 0
    this._downloadSize = 0
    this._url = ''
  }

  _initData () {
    // 点播视频中， MP4 和 flv 文件的文件总按大小，基本上，用来计算流量用的
    // hls 因为分片，导致无法准确获取总大小
    // filesize / 1024 / 1024 = M
    this._fileSize = 0
    this._downloadSize = 0
    this._url = ''
  }

  get url () {
    return this._url
  }

  set url (val) {
    this._url = val
  }

  get fileSize () {
    return this._fileSize
  }

  set fileSize (val) {
    this._fileSize = val
  }

  get downloadSize () {
    return this._downloadSize
  }

  set downloadSize (val) {
    this._downloadSize = val
  }
}
