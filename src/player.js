import PluginMap from './common/constant/PluginMap';
import PlayerProxy from './PlayerProxy';
import Log from './utils/Log';
import LoaderFetch from './player/loader/LoaderFetch';

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

    let loader = new LoaderFetch();
    // loader.url = 'http://alrtmplive02.e.vhall.com/vhall/904633281.flv?token=alibaba';
    loader.url = url;
    loader.option = {
      range: {
        from: 0,
        to: 100
      }
    };
    loader.on('progress', (a, b, c) => {
      console.log(a, b, c);
    });

    // loader.on('complete', () => {
    //   console.log('complete');
    // });

    // loader.onComplete = () => {
    //   console.log('complete2');
    // };
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