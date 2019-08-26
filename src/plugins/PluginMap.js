/**
 * 所有内置插件的集合
 * @author zhenliang.sun
 */

import Log from '../utils/Log'
import Barrage from './Barrage'
import Capture from './Capture'
import Fullscreen from './Fullscreen'
import I18N from './I18n'
import Lag from './Lag'
import Marquee from './Marquee'
import PlaybackRate from './PlaybackRate'
import Reporter from './Reporter'
import Scheduler from './Scheduler'
import Switcher from './Switcher'
import Watermark from './Watermark'
import Pursue from './Pursure'

let PluginMap = new Map()

PluginMap.set(I18N.type, I18N)
PluginMap.set(Fullscreen.type, Fullscreen)
PluginMap.set(Capture.type, Capture)
PluginMap.set(PlaybackRate.type, PlaybackRate)
PluginMap.set(Barrage.type, Barrage)

if (process.env.PF === 'vhall') {
  Log.OBJ.info('注册Vhall平台插件')
  Log.OBJ.info(`${Lag.type},${Reporter.type},${Scheduler.type}`)
  Log.OBJ.info(`${Switcher.type},${Marquee.type},${Watermark.type}`)
  Log.OBJ.info(`${Pursue.type}`)
  PluginMap.set(Lag.type, Lag)
  PluginMap.set(Reporter.type, Reporter)
  PluginMap.set(Scheduler.type, Scheduler)
  PluginMap.set(Switcher.type, Switcher)
  PluginMap.set(Marquee.type, Marquee)
  PluginMap.set(Watermark.type, Watermark)
  PluginMap.set(Pursue.type, Pursue)
}

export default PluginMap
