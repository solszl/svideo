import PluginMap from './common/constant/PluginMap';
import PlayerProxy from './PlayerProxy';
import {
  createElement
} from './utils/Dom';
import Log from './utils/Log';

/**
 * VIDEO播放器 函数类
 *
 * @export
 * @class Player
 * @author zhenliang.sun
 */
export default class Player extends PlayerProxy {
  constructor(opts = {}) {
    super(opts);
    Player.plugins = {};
    // throw new Exception('No need to initialized, all method mount on player instance');
  }

  init(opts = {}) {
    if (!opts.hasOwnProperty('id')) {
      Log.OBJ.error('doesn\'t exist \'id\' option node');
      return;
    }

    let root = document.getElementById(opts['id']);
    root.appendChild(createElement('video', {}, {}));

    this.pluginCall();
  }

  pluginCall() {
    if (!Player.plugins) {
      return;
    }

    PluginMap.forEach((value, key) => {
      let cl = new value();
      cl.player = this;
      cl.init({});
      Log.OBJ.info(cl, key);
    });
  }

  static install(name, clazz, mountNow = false) {
    if (!Player.plugins) {
      Player.plugins = {};
    }

    Player.plugins[name] = clazz;

    if (mountNow) {
      new clazz();
    }
  }
}