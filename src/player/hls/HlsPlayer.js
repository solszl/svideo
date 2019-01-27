import Hls from './hls';
import Model from '../../core/Model';

/**
 *
 *
 * @export
 * @class HlsPlayer
 * @extends {Hls}
 * @author zhenliang.sun
 */
export default class HlsPlayer extends Hls {
  constructor(config = {}) {
    super(config);
  }

  getDownloadSize() {
    super.getDownloadSize();
    return Model.OBJ.downloadSize;
  }
}