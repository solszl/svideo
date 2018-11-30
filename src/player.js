import PluginMap from './common/constant/PluginMap';
import PlayerProxy from './PlayerProxy';
import Log from './utils/Log';
import LoaderFetch from './player/loader/LoaderFetch';
import LoaderXHR from './player/loader/LoaderXHR';

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
    root.appendChild(this.video);

    this.pluginCall();

    var url = opts['url'];
    this.src = url;

    // this.play();

    // http://alrtmplive02.e.vhall.com/vhall/904633281.flv?token=alibaba
    var loader = new LoaderXHR();
    // var loader = new LoaderFetch();
    loader.option = {
      from: 0,
      to: -1
    };

    // loader.url = this.src;
    // loader.url = 'http://alrtmplive02.e.vhall.com/vhall/904633281.flv?token=alibaba';
    loader.url = 'https://sjflvlivepc02.e.vhall.com/vhall/904633281.flv?token=alibaba';
    loader.on('progress', e => {
      console.log(loader.currentKBps);
    });

    loader.on('complete', e => {
      console.log(loader.averageKBps);
    });
    loader.open();
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
}