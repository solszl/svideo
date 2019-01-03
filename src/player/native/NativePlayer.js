import PlayerProxy from '../../PlayerProxy';

/**
 * 原生播放器封装
 *
 * @export
 * @class NativePlayer
 * @extends {PlayerProxy}
 * @author zhenliang.sun
 */
export default class NativePlayer extends PlayerProxy {
  constructor(opt = {}) {
    super(opt);
  }
}