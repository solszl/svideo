/** 
 * 所有内置插件的集合
 * @author zhenliang.sun
 */

import Log from '../utils/Log';
import Capture from './Capture';
import Fullscreen from './Fullscreen';
import I18N from './I18n';
import Keyboard from './Keyboard';
import Lag from './Lag';
import Play from './Play';
import Reporter from './Reporter';
import Scheduler from './Scheduler';
import Switcher from './Switcher';

let PluginMap = new Map();

PluginMap.set(I18N.type, I18N);
PluginMap.set(Keyboard.type, Keyboard);
PluginMap.set(Play.type, Play);
PluginMap.set(Fullscreen.type, Fullscreen);
PluginMap.set(Capture.type, Capture);

if (process.env.PF === 'vhall') {
  Log.OBJ.info(`注册插件：${Lag.type},${Reporter.type},${Scheduler.type},${Switcher.type}`);
  PluginMap.set(Lag.type, Lag);
  PluginMap.set(Reporter.type, Reporter);
  PluginMap.set(Scheduler.type, Scheduler);
  PluginMap.set(Switcher.type, Switcher);
}

export default PluginMap;