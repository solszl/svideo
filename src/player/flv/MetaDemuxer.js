import AbstractDemuxer from './../demux/AbstractDemuxer';
import Log from '../../utils/Log';
import {
  MetaTypes
} from './../constants/Types';

/**
 * 标签数据解析器，用来解析源数据等
 *
 * @export
 * @class MetaDemuxer
 * @extends {AbstractDemuxer}
 * @author zhenliang.sun
 */
export default class MetaDemuxer extends AbstractDemuxer {
  constructor() {
    super();
    this.offset = 0;
    this.readOffset = this.offset;
  }

  resolve(meta, metaSize) {
    if (metaSize < 3) {
      Log.OBJ.error(`not enough data for metaInfo, input size: ${metaSize}`);
      return;
    }
    super.resolve(meta);

    const metaData = {};
    const name = this.parseValue(meta);
    const value = this.parseValue(meta, metaSize - name.bodySize);
    metaData[name.data] = value.data;
    this.resetStatus();
    return metaData;
  }

  resetStatus() {
    this.offset = 0;
    this.readOffset = this.offset;
  }

  /**
   * 解析meta中的数据
   *
   * @param {*} data 原数据
   * @param {*} size 数据长度
   * @memberof MetaDemuxer
   */
  parseValue(data, size) {
    let buffer = new ArrayBuffer();
    if (data instanceof ArrayBuffer) {
      buffer = data;
    } else {
      buffer = data.buffer;
    }

    const dv = new DataView(buffer, this.readOffset, size);
    let isObjEnd = false;
    const type = dv.getUint8(0);
    const isLe = this.isLE;
    let offset = 1;
    this.readOffset += 1;
    let value = null;

    // 0:number 1:boolean 2:string 3:object 4:movieClip 5:null 6 undefined 7:reference 8 ecma array 9:object end maker 10:strict array 11:date 12:long string
    switch (type) {
    case MetaTypes.NUMBER:
      value = dv.getFloat64(1, !isLe);
      this.readOffset += 8;
      offset += 8;
      break;
    case MetaTypes.BOOLEAN:
      value = !!dv.getUint8(1);
      this.offset += 1;
      offset += 1;
      break;
    case MetaTypes.STRING:
      var str = this._parseString(buffer);
      value = str.data;
      offset += str.bodySize;
      break;
    case MetaTypes.OBJECT:
    {
      value = {};
      let objEndSize = 0;
      if (dv.getUint32(size - 4, !isLe) & 0x00ffffff) {
        objEndSize = 3;
      }
      while (offset < size - 4) {
        const amfObj = this._parseObject(buffer, size - offset - objEndSize);
        if (amfObj.isObjEnd) {
          break;
        }
        value[amfObj.data.name] = amfObj.data.value;
        offset += amfObj.bodySize;
      }

      if (offset <= size - 3) {
        const mark = dv.getUint32(offset - 1, !isLe) & 0x00ffffff;
        if (mark === 9) {
          this.readOffset += 3;
          offset += 3;
        }
      }
      break;
    }
    case MetaTypes.MIX_ARRAY:
    {
      value = {};
      offset += 4;
      this.readOffset += 4;
      let objEndSize = 0;
      if (dv.getUint32(size - 4, !isLe) & (0x00ffffff === 9)) {
        objEndSize = 3;
      }

      while (offset < size - 8) {
        const amfVar = this._parseObject(buffer, size - offset - objEndSize);
        if (amfVar.isObjectEnd) {
          break;
        }
        value[amfVar.data.name] = amfVar.data.value;
        offset += amfVar.bodySize;
      }

      if (offset <= size - 3) {
        const mark = dv.getUint32(offset - 1, !isLe) & 0x00ffffff;
        if (mark === 9) {
          offset += 3;
          this.readOffset += 3;
        }
      }
      break;
    }
    case MetaTypes.OBJECT_END:
      value = null;
      isObjEnd = true;
      break;
    case MetaTypes.STRICT_ARRAY:
      value = [];
      var arrLen = dv.getUint32(1, !isLe);
      offset += 4;
      this.readOffset += 4;
      for (let i = 0; i < arrLen; i += 1) {
        const script = this.parseValue(buffer, size - offset);
        value.push(script.data);
        offset += script.bodySize;
      }
      break;
    case MetaTypes.DATE:
    {
      const date = this._parseDate(buffer, size - 1);
      value = date.data;
      offset += date.bodySize;
      break;
    }
    case MetaTypes.LONE_STRING:
    {
      const val = this._parseLongString(buffer, size - 1);
      value = val.data;
      offset += val.bodySize;
      break;
    }
    default:
      offset = size;
      break;
    }

    return {
      data: value,
      bodySize: offset,
      isObjEnd: isObjEnd
    };
  }

  _parseObject(buffer, size) {
    const name = this.parseString(buffer, size);
    const value = this.parseValue(buffer, size - name.bodySize);
    return {
      data: {
        name: name.data,
        value: value.data
      },
      bodySize: name.bodySize + value.bodySize,
      isObjEnd: value.isObjEnd
    };
  }

  _parseDate(buffer, size) {
    const dv = new DataView(buffer, this.readOffset, size);
    let ts = dv.getFloat64(0, !this.isLE);
    const timeOffset = dv.getInt16(8, !this.isLE);
    ts += timeOffset * 60 * 1000;
    this.readOffset += 10;
    return {
      data: new Date(ts),
      bodySize: 10
    };
  }

  _parseString(buffer) {
    const dv = new DataView(buffer, this.readOffset);
    const strLen = dv.getUint16(0, !this.isLE);
    let str =
      strLen > 0 ?
        this._decode(new Uint8Array(buffer, this.readOffset + 2, strLen)) :
        '';
    this.readOffset += strLen + 4;
    return {
      data: str,
      bodySize: strLen + 4
    };
  }

  _parseLongString(buffer) {
    const dv = new DataView(buffer, this.readOffset);
    const strLen = dv.getUint32(0, !this.isLE);
    let str =
      strLen > 0 ?
        this._decode(new Uint8Array(buffer, this.readOffset + 2, strLen)) :
        '';
    this.readOffset += strLen + 4;
    return {
      data: str,
      bodySize: strLen + 4
    };
  }

  /**
   * 把UINT
   *
   * @param {*} uint8array
   * @returns
   * @memberof MetaDemuxer
   */
  _decode(uint8array) {
    const out = [];
    const input = uint8array;
    let i = 0;
    const length = uint8array.length;

    while (i < length) {
      if (input[i] < 0x80) {
        out.push(String.fromCharCode(input[i]));
        ++i;
        continue;
      } else if (input[i] < 0xc0) {
        // fallthrough
      } else if (input[i] < 0xe0) {
        if (this._checkContinuation(input, i, 1)) {
          const ucs4 = ((input[i] & 0x1f) << 6) | (input[i + 1] & 0x3f);
          if (ucs4 >= 0x80) {
            out.push(String.fromCharCode(ucs4 & 0xffff));
            i += 2;
            continue;
          }
        }
      } else if (input[i] < 0xf0) {
        if (this._checkContinuation(input, i, 2)) {
          const ucs4 =
            ((input[i] & 0xf) << 12) |
            ((input[i + 1] & 0x3f) << 6) |
            (input[i + 2] & 0x3f);
          if (ucs4 >= 0x800 && (ucs4 & 0xf800) !== 0xd800) {
            out.push(String.fromCharCode(ucs4 & 0xffff));
            i += 3;
            continue;
          }
        }
      } else if (input[i] < 0xf8) {
        if (this._checkContinuation(input, i, 3)) {
          let ucs4 =
            ((input[i] & 0x7) << 18) |
            ((input[i + 1] & 0x3f) << 12) |
            ((input[i + 2] & 0x3f) << 6) |
            (input[i + 3] & 0x3f);
          if (ucs4 > 0x10000 && ucs4 < 0x110000) {
            ucs4 -= 0x10000;
            out.push(String.fromCharCode((ucs4 >>> 10) | 0xd800));
            out.push(String.fromCharCode((ucs4 & 0x3ff) | 0xdc00));
            i += 4;
            continue;
          }
        }
      }
      out.push(String.fromCharCode(0xfffd));
      ++i;
    }

    return out.join('');
  }

  _checkContinuation(uint8array, start, checkLength) {
    let array = uint8array;
    if (start + checkLength < array.length) {
      while (checkLength--) {
        if ((array[++start] & 0xc0) !== 0x80) return false;
      }
      return true;
    } else {
      return false;
    }
  }
}