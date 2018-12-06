import IllegalStateException from '../../error/IllegalStateException';
import Log from '../../utils/Log';

/**
 * 流
 *
 * @export
 * @class Stream
 * @author zhenliang.sun
 */
export default class Stream {
  constructor(buffer) {
    if (buffer instanceof ArrayBuffer) {
      this.buffer = buffer;
      this.dv = new DataView(buffer);
      this.dv.position = 0;
    } else {
      Log.OBJ.error('data is invalid');
    }
  }

  get length() {
    return this.buffer.byteLength;
  }

  set position(p) {
    this.dv.position = p;
  }

  get position() {
    return this.dv.position;
  }

  fill(c) {
    for (let i = 0; i < c; i += 1) {
      this.writeUint8(0);
    }
  }

  writeUint8(val) {
    Stream.writeByte(this.dv, val, 1);
  }
  writeInt8(val) {
    Stream.writeByte(this.dv, val, 1, true);
  }
  writeUint16(val) {
    Stream.writeByte(this.dv, val, 2);
  }
  writeInt16(val) {
    Stream.writeByte(this.dv, val, 2, true);
  }
  writeUint24(val) {
    Stream.writeByte(this.dv, val, 3);
  }
  writeInt24(val) {
    Stream.writeByte(this.dv, val, 3, true);
  }
  writeUint32(val) {
    Stream.writeByte(this.dv, val, 4);
  }
  writeInt32(val) {
    Stream.writeByte(this.dv, val, 4, true);
  }
  writeUint64(val) {
    Stream.writeByte(this.dv, (val & 0xFFFFFFFF00000000) >> 32, 4);
    Stream.writeByte(this.dv, (val & 0x00000000FFFFFFFF), 4);
  }
  writeStr(val) {
    val = val.toString();
    let length = val.length;
    for (let i = 0; i < length; i += 1) {
      this.writeUint8(val.charCodeAt(i));
    }
  }


  static writeByte(buffer, val, size, sign) {
    switch (size) {
    case 1:
      var fn1 = sign ? buffer.setInt8 : buffer.setUint8;
      fn1(buffer.position, val);
      break;
    case 2:
      var fn2 = sign ? buffer.setInt16 : buffer.setUint16;
      fn2(buffer.position, val);
      break;
    case 3:
      var fn3 = sign ? buffer.setInt8 : buffer.setUint8;
      for (let i = 0; i < 3; i += 1) {
        fn3(buffer.position + i, val >> (16 - i * 8) & 0xff);
      }
      break;
    case 4:
      var fn4 = sign ? buffer.setInt8 : buffer.setUint8;
      fn4(buffer.position, val);
      break;
    default:
      throw `not support ${size} write`;
    }
    buffer.position += size;
  }


  back(c) {
    this.position -= c;
  }

  skip(c) {
    let loop = Math.floor(c / 4);
    let last = c % 4;
    for (let i = 0; i < loop; i += 1) {
      Stream.readByte(this.dv, 4);
    }
    if (last > 0) {
      Stream.readByte(this.dv, last);
    }
  }

  static readByte(buffer, size, sign) {
    let res = '';
    switch (size) {
    case 1:
      var fn1 = sign ? buffer.getInt8 : buffer.getUint8;
      res = fn1(buffer.position);
      break;
    case 2:
      var fn2 = sign ? buffer.getInt16 : buffer.getUint16;
      res = fn2(buffer.position);
      break;
    case 3:
      if (sign) {
        Log.OBJ.warn('unsupported for readByte 3');
        throw new IllegalStateException('unsupported for readByte 3');
      } else {
        res = buffer.getUint8(buffer.position) << 16;
        res |= buffer.getUint8(buffer.position + 1) << 8;
        res |= buffer.getUint8(buffer.position + 2);
      }
      break;
    case 4:
      var fn3 = sign ? buffer.getInt32 : buffer.getUint32;
      res = fn3(buffer.position);
      break;
    case 8:
      if (sign) {
        Log.OBJ.warn('unsupported for readByte 8');
        throw new IllegalStateException('unsupported for readByte 8');
      } else {
        res = buffer.getUint32(buffer.position) << 32;
        res |= buffer.getUint32(buffer.position + 4);
      }
      break;
    default:
      res = '';
      break;
    }
    buffer.position += size;
    return res;
  }

  readUint8() {
    return Stream.readByte(this.dv, 1);
  }

  readUint16() {
    return Stream.readByte(this.dv, 2);
  }

  readUint24() {
    return Stream.readByte(this.dv, 3);
  }

  readUint32() {
    return Stream.readByte(this.dv, 4);
  }

  readUint64() {
    return Stream.readByte(this.dv, 8);
  }

  readInt8() {
    return Stream.readByte(this.dv, 1, true);
  }
  readInt16() {
    return Stream.readByte(this.dv, 2, true);
  }
  readInt32() {
    return Stream.readByte(this.dv, 4, true);
  }
  writeUint32_2(value) {
    return new Uint8Array([
      value >>> 24 & 0xff,
      value >>> 16 & 0xff,
      value >>> 8 & 0xff,
      value & 0xff,
    ]);
  }
}