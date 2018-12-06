import Concat from 'concat-typed-array';
import Log from '../../utils/Log';

/**
 * Buffer 实现
 *
 * @export
 * @class Buffer
 * @author zhenliang.sun
 */
export default class Buffer {
  constructor() {
    this.buffer = new Uint8Array(0);
  }

  write(...buffer) {
    let self = this;

    buffer.forEach(item => {
      if (item) {
        self.buffer = Concat(Uint8Array, self.buffer, item);
      } else {
        Log.OBJ.error('could not write buffer, input buffer is null');
      }
    });
  }

  static writeUint32(val) {
    return new Uint8Array([val >> 24, val >> 16 & 0xFF, val >> 8 & 0xFF, val & 0xFF]);
  }

  static readAsInt(arr) {
    let temp = '';
    let padStart4Hex = hexNum => {
      return hexNum.toString(16).padStart(2, '0');
    };

    arr.forEach(num => {
      temp += padStart4Hex(num);
    });

    return parseInt(temp, 16);
  }
}