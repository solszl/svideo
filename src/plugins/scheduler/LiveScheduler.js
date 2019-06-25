import AbstractScheduler from './AbstractScheduler'
import qs from 'qs'
import Token from './Token'

/**
 *
 * Created Date: 2019-05-30, 13:58:54 (zhenliang.sun)
 * Last Modified: 2019-05-30, 16:30:58 (zhenliang.sun)
 * Email: zhenliang.sun@gmail.com
 *
 * Distributed under the MIT license. See LICENSE file for details.
 * Copyright (c) 2019 vhall
 */

const LIVE_API = 'api/dispatch_play'

/**
 * 直播调度策略
 *
 * @export
 * @class LiveScheduler
 * @extends {AbstractScheduler}
 * @author zhenliang.sun
 */
export default class LiveScheduler extends AbstractScheduler {
  constructor() {
    super()
  }

  buildURL() {
    super.buildURL()
    if (!this.option) {
      return ''
    }

    let obj = {}
    obj.webinar_id = this.option['webinar_id']
    obj.uid = this.option['uid']
    obj.bu = this.option['bu']
    obj.rand = this.getRandom()
    let queryString = qs.stringify(obj)
    let p = window.location.protocol
    let domain = this.option['url']
    let url = `${p}${domain}/${LIVE_API}?${queryString}`
    this.info('info', `Live scheduler url:${url}`)
    return url
  }

  resolveData(data) {
    super.resolveData(data)
    if (+data.code !== 200) {
      this.info('error', `获取直播状态码不为200，状态码为:${data.code}`)
      return
    }

    // 创建token
    let token = new Token()
    token.player = this.player
    token.create(data['data']['token'])

    let obj = null
    let key = ''
    switch (this.type) {
    case 'flv':
      obj = data['data']['httpflv_urls']
      key = 'httpflv_url'
      break
    case 'hls':
      obj = data['data']['hls_urls']
      key = 'hls_url'
      break
    default:
      this.info('warn', `暂时不支持${this.type}类型的直播`)
      return
    }
    let allSupportDef = Object.keys(obj)
    if (allSupportDef.length < 1) {
      this.info('error', '无清晰度可用')
      return
    }
    let lineCount = obj[allSupportDef[0]].length
    let defs = []
    while (lineCount) {
      defs.push([])
      lineCount -= 1
    }
    Object.keys(obj).forEach(item => {
      Object.values(obj[item]).forEach((subItem, index) => {
        let subDef = {
          idx: index,
          line: subItem['line'],
          url: subItem[key],
          def: item
        }
        defs[index].push(subDef)
      })
    })

    this.info(
      'info',
      `整理直播清晰度完成,共有${defs.length}条线路，每条线路有${
        defs.length > 0 ? defs[0].length : 0
      }个清晰度`
    )

    this._defineProperty(defs)
  }
}
