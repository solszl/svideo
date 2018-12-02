import PluginMap from './common/constant/PluginMap';
import PlayerProxy from './PlayerProxy';
import Log from './utils/Log';
import M3U8 from './player/hls/M3U8';

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
    // loader.url = 'http://txycdn.miaopai.com/stream/t~gB32Ha~0TyT3~Uju8bqQ___8.mp4?ssig=e146d547c9e5b92b22b99b74210ca4d2&time_stamp=1543601179371';
    // loader.url = 'http://flv-live-ws.xingxiu.panda.tv/panda-xingxiu/7c1785a9d66f6d05543e4d2ae4a3dd31.flv?0.601844992954284';
    // loader.url = 'http://59.49.89.64/hdl0901.plures.net/azblive/3142adeb5cc64967aecd7eaaac2be244.flv?wsSecret=d32f31cf39660d22db8f2614dc4169cb&wsTime=5c017bff&wshc_tag=0&wsts_tag=5c017bff&wsid_tag=1ca310b&wsiphost=ipdbm';
    // loader.url = 'http://alrtmplive02.e.vhall.com/vhall/904633281.flv?token=alibaba';
    // loader.url = 'https://sjflvlivepc02.e.vhall.com/vhall/904633281.flv?token=alibaba';
    let m3u8 = new M3U8();
    m3u8.fetch(url);
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