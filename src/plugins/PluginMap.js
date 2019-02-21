/** 
 * 所有内置插件的集合
 * @author zhenliang.sun
 */

import Log from '../utils/Log';
import Barrage from './Barrage';
import Capture from './Capture';
import Fullscreen from './Fullscreen';
import I18N from './I18n';
import Keyboard from './Keyboard';
import Lag from './Lag';
import PlaybackRate from './PlaybackRate';
import Reporter from './Reporter';
import Scheduler from './Scheduler';
import Switcher from './Switcher';
import Watermark from './Watermark';

let PluginMap = new Map();

PluginMap.set(I18N.type, I18N);
PluginMap.set(Keyboard.type, Keyboard);
PluginMap.set(Fullscreen.type, Fullscreen);
PluginMap.set(Capture.type, Capture);
PluginMap.set(PlaybackRate.type, PlaybackRate);
// PluginMap.set(Keyboard.type, Keyboard);
PluginMap.set(Watermark.type, Watermark);
PluginMap.set(Barrage.type, Barrage);

if (process.env.PF === 'vhall') {
  Log.OBJ.info(`注册Vhall平台插件：${Lag.type},${Reporter.type},${Scheduler.type},${Switcher.type}`);
  PluginMap.set(Lag.type, Lag);
  PluginMap.set(Reporter.type, Reporter);
  PluginMap.set(Scheduler.type, Scheduler);
  PluginMap.set(Switcher.type, Switcher);
}

export default PluginMap;