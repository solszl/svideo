import PlayerProxy from './PlayerProxy';
import {
  createElement
} from './utils/Dom';

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
    this._createPlayer();
  }

  _configMapping(option = {}) {
    let config = {};
    config.type = option.type.toLowerCase();

    return option;
  }

  _createPlayer() {
    let type = this._config.type;
    let player = null;
    switch (type) {
    case 'flv':
    {

      this._config.url = this._config.flvurl;
      const FlvPlayer = require('./flv/FlvPlayer').default;
      if (!FlvPlayer.isSupported()) {
        alert('不支持mse');
        break;
      }
      player = new FlvPlayer(this._config, this._config);
      player.initVideo(this._config);
      this.video = player.video;
      player.attachMediaElement(this.video);
      player.load();
      Object.assign(this, player);
      break;
    }
    case 'hls':
    {
      this._config.url = this._config.hlsurl;
      const Hls = require('./hls/hls').default;
      if (!Hls.isSupported()) {
        this._createNativePlayer();
        break;
      }
      player = new Hls(this._config);
      player.initVideo(this._config);
      this.video = player.video;
      player.loadSource(this._config.url);
      player.attachMedia(this.video);
      player.on(Hls.Events.MEDIA_ATTACHED, () => {
        this.video.play();
      });
      Object.assign(this, player);
      break;
    }
    }
  }
}