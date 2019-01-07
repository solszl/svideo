import PlayerProxy from './PlayerProxy';
import FlvPlayer from './player/flv/FlvPlayer';
import Hls from './player/hls/hls';
import NativePlayer from './player/native/NativePlayer';
import PluginMap from './plugins/PluginMap';
import {
  VHVideoConfig
} from './config';

import Mixin from './utils/Mixin';
import Component from './core/Component';

/**
 * 播放器模块
 *
 * @export
 * @class VideoModule
 * @extends {PlayerProxy}
 */
export default class VideoModule extends Component {
  constructor() {
    super();
    this.player = {};
    this._config = {};
    // super();
    return new Proxy(this, {
      get: function (target, prop, receiver) {
        if (target[prop] !== undefined) {
          return target[prop];
        } else if (target.player[prop] !== undefined) {
          return target.player[prop];
        } else {
          target.info('error', `undefined Method or Property: ${prop}`);
          return undefined;
        }
      },
      set: function (target, prop, value) {
        if (target[prop] !== undefined) {
          target[prop] = value;
          return true;
        } else if (target.player[prop] !== undefined) {
          target.player[prop] = value;
          return true;
        } else {
          target.info('error', `undefined Method or Property: ${prop}, value:${value}`);
          return false;
        }
      }
    });
  }

  init(option = {}) {
    let config = this._configMapping(option);
    this._config = config;
    this.pluginCall();
    this._createPlayer();
  }

  _configMapping(option = {}) {
    let config = {};
    console.log(config, VHVideoConfig, option);
    Object.assign(VHVideoConfig, option);
    Object.assign(config, VHVideoConfig);
    switch (config.type) {
    case 'flv':
      config.url = option.flvurl;
      config.lazyLoadMaxDuration = VHVideoConfig.maxBufferTime;
      break;
    case 'hls':
      config.url = option.hlsurl;
      if (!Hls.isSupported()) {
        config.url = this._config.hlsurl;
      }
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
    this.player = new FlvPlayer(this._config, this._config);
    let player = this.player;
    player.initVideo(this._config);
    Object.assign(this, player);
    this.initEvents();
    player.attachMediaElement(player.video);
    player.load();
    // this.play();
  }

  _createHLSPlayer() {
    this.player = new Hls(this._config);
    let player = this.player;
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

    this.player = new NativePlayer();
    let player = this.player;
    player.initVideo(this._config);
    this.initEvents();
    player.src = this._config.url;
    // this.play();
  }

  pluginCall() {
    PluginMap.forEach((value, key) => {
      let cl = new value();
      cl.player = this;
      cl.init(this._config);
    });
  }
}