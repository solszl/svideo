/** 
 * 所有内置插件的集合
 * @author zhenliang.sun
 */

import Fullscreen from './Fullscreen';
import I18N from './I18n';
import Keyboard from './Keyboard';
import Play from './Play';
import Capture from './Capture';

let PluginMap = new Map();

PluginMap.set(I18N.type, I18N);
PluginMap.set(Keyboard.type, Keyboard);
PluginMap.set(Play.type, Play);
PluginMap.set(Fullscreen.type, Fullscreen);
PluginMap.set(Capture.type, Capture);

export default PluginMap;