import DataStore from '../DataStore';

/**
 * DataView 读取工具类
 *
 * @export
 * @class DataView4Read
 * @author zhenliang.sun
 */
export default class DataView4Read {
  constructor(buffer, context) {
    this.dv = new DataView(buffer);
    this._context = context;
    this.setupFunctions();
  }

  setupFunctions() {
    const sizeArr = [8, 16, 32];
    const self = this;
    const isLE = DataStore.OBJ.isLe;

    sizeArr.forEach(size => {
      this[`getUint${size}`] = function (offset) {
        if (!offset) {
          offset = self._context.readOffset;
        }

        if (offset === self._context.readOffset) {
          self._context.readOffset += size / 8;
        }

        return self.dv[`getUint${size}`](offset, !isLE);
      };
    });

    this.getUint24 = function (offset) {
      const result = this.getUint(24, offset, false);
      self._context.readOffset -= 1;
      return result;
    };

    this.getUint = function (size, offset, isHigh = true) {
      if (size > 32) {
        throw `unsupported size ${size}`;
      }

      let readSize = 32;
      if (!this[`Uint${size}`]) {
        for (let i = 0, len = sizeArr.length; i < len; i += 1) {
          if (size < sizeArr[i]) {
            readSize = sizeArr[i];
            break;
          }
        }
        const numToAnd = isHigh ? DataView4Read.getAndNum(0, size - 1, readSize) : DataView4Read.getAndNum(readSize - size, readSize - 1, readSize);
        return self[`getUint${readSize}`](offset, !isLE) & numToAnd;
      } else {
        return self[`getUint${readSize}`](offset, !isLE);
      }
    };
  }

  static getAndNum(begin, end, size = 8) {
    let result = 0;
    size -= 1;
    let index = size;
    while (index > 0) {
      if (index > end || index < begin) {
        index -= 1;
        continue;
      } else {
        result += Math.pow(2, size - index);
        index -= 1;
      }
    }
    return result;
  }
}