import BasePlayer from "./BasePlayer";

/**
 * 基础播放器，用于播放常见的MP4、MP3等
 *
 * @export
 * @class NativePlayer
 * @extends {BasePlayer}
 * @author zhenliang.sun
 */
export default class NativePlayer extends BasePlayer {
  constructor() {
    super();
    this._type = "normal";
  }
}