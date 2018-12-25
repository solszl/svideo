import IOController from './flv/io/IOController';
import PlayerProxy from './PlayerProxy';

export default class Player extends PlayerProxy {
  constructor(opts = {}) {
    super(opts);
  }

  init(opts = {}) {
    this.config = opts;
    var ioctrl = new IOController(null, this.config);
    ioctrl.open();
  }
}