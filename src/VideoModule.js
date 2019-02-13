import {
  VHVideoConfig
} from './config';
import Component from './core/Component';
import FlvPlayer from './player/flv/FlvPlayer';
import HlsPlayer from './player/hls/HlsPlayer';
import NativePlayer from './player/native/NativePlayer';
import PluginMap from './plugins/PluginMap';


/**
 * 播放器模块
 *
 * @export
 * @class VideoModule
 * @extends {Component}
 */
export default class VideoModule extends Component {
  constructor() {
    super();
    this.player = {};
    this._config = {};
    this.pluginInstance = [];
    // super();

    // 插件模型核心， 利用proxy， 将业务功能进行分拆， 自身执行一部分， 代理的player执行一部分
    return new Proxy(this, {
      get: function (target, prop, receiver) {
        const targetProp = target[prop];
        const playerProp = target.player[prop];
        if (targetProp !== undefined) {
          return targetProp;
        } else if (playerProp !== undefined) {
          return playerProp;
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
    this._pluginCall();
    this._createPlayer();
  }

  _configMapping(option = {}) {
    let config = {};
    // this.info('info', `config: ${JSON.stringify(config)}`);
    // this.info('info', `config: ${JSON.stringify(VHVideoConfig)}`);
    // this.info('info', `config: ${JSON.stringify(option)}`);
    Object.assign(VHVideoConfig, option);
    Object.assign(config, VHVideoConfig);
    switch (config.type) {
    case 'flv':
      config.url = option.flvurl;
      config.lazyLoadMaxDuration = VHVideoConfig.maxBufferTime;
      break;
    case 'hls':
      config.url = option.hlsurl;
      if (!HlsPlayer.isSupported()) {
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
        this.info('error', '不支持mse');
        break;
      }
      if (!this._config.isLive) {
        this.info('warn', '不支持flv格式点播');
        break;
      }
      this._createFLVPlayer();
      break;
    case 'hls':
      if (!HlsPlayer.isSupported()) {
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
    this.player = new HlsPlayer(this._config);
    let player = this.player;
    player.initVideo(this._config);
    Object.assign(this, player);
    this.initEvents();
    // player.loadSource(this._config.url);
    // player.attachMedia(player.video);
    // player.on(Hls.Events.MEDIA_ATTACHED, () => {
    //   // this.play();
    // });
    this.player.src = this._config.url;
  }

  _createNativePlayer() {

    this.player = new NativePlayer();
    let player = this.player;
    player.initVideo(this._config);
    this.initEvents();
    player.src = this._config.url;
    // this.play();
  }

  _pluginCall() {
    PluginMap.forEach(value => {
      let cl = new value();
      cl.player = this;
      cl.init(this._config);
      this.pluginInstance.push(cl);
    });
  }

  destroy() {
    super.destroy();

    // 清理插件
    this.pluginInstance.forEach(plugin => {
      plugin.destroy();
    });
    this.pluginInstance = null;
    this.player.destroy();
    this.player = null;
  }
}