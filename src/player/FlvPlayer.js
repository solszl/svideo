import BasePlayer from "./BasePlayer";

/**
 * 直播低延迟播放器 采用http-flv
 *
 * @export
 * @class FlvPlayer
 * @extends {BasePlayer}
 * @author zhenliang.sun
 */
export default class FlvPlayer extends BasePlayer {
  constructor() {
    super();
    this._type = "flv";
  }
}