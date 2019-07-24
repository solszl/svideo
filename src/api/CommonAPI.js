/**
 *
 * Created Date: 2019-07-23, 15:08:25 (zhenliang.sun)
 * Last Modified: 2019-07-24, 11:12:43 (zhenliang.sun)
 * Email: zhenliang.sun@gmail.com
 *
 * Distributed under the MIT license. See LICENSE file for details.
 * Copyright (c) 2019 vhall
 */

/**
 * 普通api
 *
 * @export
 * @class CommonAPI
 * @author zhenliang.sun
 */
export default class CommonAPI {
  constructor(store) {
    this.store = store
    this._isOver = false
  }

  setIsOver(val) {
    this._isOver = val
    this.emit2All('over', val)
  }

  getIsOver() {
    return this._isOver
  }
}
