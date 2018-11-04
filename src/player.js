import Exception from './error/Exception';
import Log from './utils/Log';


/**
 * VIDEO播放器 函数类
 *
 * @export
 * @class Player
 * @author zhenliang.sun
 */
class Player {
  constructor() {
    throw new Exception('No need to initilized, all method mount on player instance');
  }

  static createPlayer() {
    // let player =
  }
}

Player.Log = Log;

export default Player;