/** 
 * 所有内置插件的集合
 * @author zhenliang.sun
 */

import Fullscreen from './../../plugins/Fullscreen';
import I18N from './../../plugins/I18n';
import Keyboard from './../../plugins/Keyboard';
import Play from './../../plugins/Play';

let PluginMap = new Map();

PluginMap.set(I18N.type, I18N);
PluginMap.set(Keyboard.type, Keyboard);
PluginMap.set(Play.type, Play);
PluginMap.set(Fullscreen.type, Fullscreen);

export default PluginMap;