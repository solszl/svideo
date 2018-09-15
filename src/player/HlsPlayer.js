import BasePlayer from "./BasePlayer";

/**
 *
 * HLS 流 播放器
 * @export
 * @class HlsPlayer
 * @extends {BasePlayer}
 * @author zhenliang.sun
 */
export default class HlsPlayer extends BasePlayer {
  constructor() {
    super();
    this._type = "hls";
  }
}