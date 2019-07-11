import AbstractScheduler from './AbstractScheduler'
import Token from './Token'
import qs from 'qs'

/**
 *
 * Created Date: 2019-05-30, 13:59:51 (zhenliang.sun)
 * Last Modified: 2019-05-31, 14:33:18 (zhenliang.sun)
 * Email: zhenliang.sun@gmail.com
 *
 * Distributed under the MIT license. See LICENSE file for details.
 * Copyright (c) 2019 vhall
 */

const VOD_API = 'api/dispatch_replay'

/**
 * 回放调度策略
 *
 * @export
 * @class VodScheduler
 * @extends {AbstractScheduler}
 * @author zhenliang.sun
 */
export default class VodScheduler extends AbstractScheduler {
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
    obj.rand = this.getRandom()
    obj.uid = this.option['uid']
    obj.uri = this.uri
    obj.bu = this.option['bu']
    let qualities = this.option['quality'] || ['same']
    let str = qualities.length === 0 ? '["same"]' : `["${qualities.join('","')}"]`
    obj.quality = str // 拼接的数据为 &quality=["same",360p",480p"]
    let queryString = qs.stringify(obj)
    let p = window.location.protocol
    let domain = this.option['url']
    let url = `${p}${domain}/${VOD_API}?${queryString}`
    if (domain.startsWith('http')) {
      url = `${domain}/${VOD_API}?${queryString}`
    }
    this.info('info', `Vod scheduler url:${url}`)
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
    case 'native':
      obj = data['data']['mp4_domainnames']
      key = 'mp4_domainname'
      break
    case 'hls':
      obj = data['data']['hls_domainnames']
      key = 'hls_domainname'
      break
    default:
      this.info('warn', `暂时不支持${this.type}类型的点播`)
      return
    }

    if (!obj) {
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
        let def = {
          idx: index,
          // url: 'http://127.0.0.1:9090/videos/1.mp4', // subItem[key],
          url: subItem[key],
          line: subItem['line'],
          def: item
        }
        defs[index].push(def)
      })
    })

    this.info('info', `整理点播清晰度完成,有${defs.length}条线路, ${defs.length > 0 ? defs[0].length : 0}个清晰度`)

    this._defineProperty(defs)
  }
}
