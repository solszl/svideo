import PlayerProxy from './PlayerProxy';
import FlvPlayer from './player/flv/FlvPlayer';
import Hls from './player/hls/hls';
import NativePlayer from './player/native/NativePlayer';
import PluginMap from './plugins/PluginMap';

/**
 * 播放器模块
 *
 * @export
 * @class VideoModule
 * @extends {PlayerProxy}
 */
export default class VideoModule extends PlayerProxy {
  constructor() {
    super();
  }

  init(option = {}) {
    let config = this._configMapping(option);
    this._config = config;
    this.pluginCall();
    this._createPlayer();
  }

  _configMapping(option = {}) {
    let config = {};
    Object.assign(config, option);
    switch (config.type) {
    case 'flv':
      config.url = option.flvurl;
      break;
    case 'hls':
      config.url = option.hlsurl;
      break;
    case 'native':
      config.url = option.nativeurl;
      break;
    default:
      break;
    }
    return config;
  }

  _createPlayer() {
    let type = this._config.type;
    switch (type) {
    case 'flv':
      if (!FlvPlayer.isSupported()) {
        alert('不支持mse');
        break;
      }
      this._createFLVPlayer();
      break;
    case 'hls':
      if (!Hls.isSupported()) {
        this._config.url = this._config.hlsurl;
        this._createNativePlayer();
        break;
      }
      this._createHLSPlayer();
      break;
    case 'native':
      this._createNativePlayer();
      break;
    }
  }

  _createFLVPlayer() {
    let player = new FlvPlayer(this._config, this._config);
    player.initVideo(this._config);
    Object.assign(this, player);
    this.initEvents();
    player.attachMediaElement(player.video);
    player.load();
    // this.play();
  }

  _createHLSPlayer() {
    let player = new Hls(this._config);
    player.initVideo(this._config);
    Object.assign(this, player);
    this.initEvents();
    player.loadSource(this._config.url);
    player.attachMedia(player.video);
    player.on(Hls.Events.MEDIA_ATTACHED, () => {
      // this.play();
    });

  }

  _createNativePlayer() {
    let player = new NativePlayer();
    Object.assign(this._config, {
      preload: 'auto'
    });
    // this.video = player.video;
    player.initVideo(this._config);
    Object.assign(this, player);
    this.initEvents();
    this.src = this._config.url;
    // this.play();
  }

  pluginCall() {

    PluginMap.forEach((value, key) => {
      let cl = new value();
      cl.player = this;
      cl.init({});
    });
  }
}