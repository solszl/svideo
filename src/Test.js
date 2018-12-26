import PlayerProxy from './PlayerProxy';
import FlvPlayer from './flv/FlvPlayer';

export default class Player extends PlayerProxy {
  constructor(opts = {}) {
    super(opts);
  }

  init(opts = {}) {
    var flvplayer = new FlvPlayer(opts, opts);
    flvplayer.attachMediaElement(flvplayer.video);
    flvplayer.load();
  }


}