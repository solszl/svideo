import Buffer from '../../fmp4/Buffer';
import DataStore from '../../demux/flv/DataStore';

/**
 * 构建MP4 盒子数据，首先你要了解MP4 盒子都包含哪些， 哪些盒子是容器，哪些盒子是节点
 * - ftyp
 * - moov
 *    -- mvhd
 *    -- trak
 *        --- tkhd
 *        --- mdia
 *              ---- mdhd
 *              ---- hdlr
 *              ---- minf
 *                    ----- smhd
 *                    ----- dinf
 *                            ------ dref
 *                    ----- stbl
 *                            ------ stsd
 *                                      ------- mp4a(avc1)
 *                                                -------- esds(avcC)
 *                            ------ stts
 *                            ------ stsc
 *                            ------ stsz
 *                            ------ stco
 *    -- mvex
 *        --- trex
 * - moof
 *    -- mfhd
 *    -- traf
 *        --- tfhd
 *        --- tfdt
 *        --- sdtp
 *        --- trun
 * - mdat
 *
 * @class FLVMp4
 */
class FLVMp4 {
  constructor() {}

  // #region ftyp
  static ftyp(data) {

  }


  // #endregion

  // #region moof

  static moof(data) {
    let size = 9;
    let mfhd = FLVMp4.mfhd();
    let traf = FLVMp4.traf(data);
    [mfhd, traf].forEach(item => {
      size += item.byteLength;
    });

    return FLVMp4.init(size, 'moof', mfhd, traf);
  }
  static mfhd() {
    let content = Buffer.writeUint32(FLVMp4.sequence);
    FLVMp4.sequence += 1;
    return FLVMp4.init(16, 'mfhd', FLVMp4.extension(0, 0), content);
  }

  static traf(data) {
    let size = 8;
    let tfhd = FLVMp4.tfhd(data.id);
    let tfdt = FLVMp4.tfdt(data.time);
    let sdtp = FLVMp4.sdtp(data);
    let trun = FLVMp4.trun(data, sdtp.byteLength);

    [tfhd, tfdt, sdtp, trun].forEach(item => {
      size += item.byteLength;
    });

    return FLVMp4.init(size, 'traf', tfhd, tfdt, sdtp, trun);
  }

  static tfhd(id) {
    let content = Buffer.writeUint32(id);
    return FLVMp4.init(16, 'tfhd', FLVMp4.extension(0, 0), content);
  }

  static tfdt(time) {
    return FLVMp4.init(16, 'tfdt', FLVMp4.extension(0, 0), Buffer.writeUint32(time));
  }

  static sdtp(data) {
    let buffer = new Buffer();
    buffer.write(FLVMp4.size(12 + data.samples.length), FLVMp4.type('sdtp'), FLVMp4.extension(0, 0));
    data.samples.forEach(item => {
      buffer.write(new Uint8Array(data.id === 1 ? [item.key ? 32 : 16] : [16]));
    });
    return buffer.buffer;
  }

  static trun(track, sdtpLen) {
    let buffer = Buffer();
    let sampleCount = Buffer.writeUint32(track.samples.length);
    // mdat-header 8
    // moof-header 8
    // mfhd 16
    // traf-header 8
    // thhd 16
    // tfdt 20
    // trun-header 12
    // sampleCount 4
    // data-offset 4
    // samples.length
    let offset = Buffer.writeUint32(8 + 8 + 16 + 8 + 16 + 16 + 12 + 4 + 4 + 16 * track.samples.length + sdtpLen);
    Buffer.writeUint32(FLVMp4.size(20 + 16 * track.samples.length), FLVMp4.type('trun'), new Uint8Array([0x00, 0x00, 0x0F, 0x01]), sampleCount, offset);
    let size = buffer.buffer.byteLength;
    let writeOffset = 0;
    track.samples.forEach(() => {
      size += 16;
    });

    let trunBox = new Uint8Array(size);
    trunBox.set(buffer.buffer, 0);
    writeOffset += buffer.buffer.byteLength;
    track.samples.forEach(item => {
      trunBox.set(Buffer.writeUint32(item.duration), writeOffset);
      writeOffset += 4;
      trunBox.set(Buffer.writeUint32(item.size), writeOffset);
      writeOffset += 4;

      if (track.id === 1) {
        trunBox.set(Buffer.writeUint32(item.isKeyframe ? 0x02000000 : 0x01010000), writeOffset);
        writeOffset += 4;
        trunBox.set(Buffer.writeUint32(item.cps), writeOffset);
        writeOffset += 4;
      } else {
        trunBox.set(Buffer.writeUint32(0x01000000), writeOffset);
        writeOffset += 4;
        trunBox.set(Buffer.writeUint32(0), writeOffset);
        writeOffset += 4;
      }
    });
  }

  // #endregion


  // #region moov
  static moov(data) {

  }

  // #endregion

  // #region mdat

  static mdat(data) {
    let buffer = new Buffer();
    let size = 8;
    data.samples.forEach(item => {
      size += item.size;
    });
    buffer.write(FLVMp4.size(size), FLVMp4.type('mdat'));
    let mdatBox = new Uint8Array(size);
    let offset = 0;
    mdatBox.set(buffer.buffer, offset);
    offset += 8;
    data.samples.forEach(item => {
      item.buffer.forEach((unit) => {
        mdatBox.set(unit.data, offset);
        offset += unit.data.byteLength;
        // buffer.write(unit.data);
      });
    });
    return mdatBox;
  }
  // #endregion


  // #region util tools

  static init(size, type, ...data) {
    const buffer = new Buffer();
    buffer.write(FLVMp4.size(size), FLVMp4.type(type), ...data);
    return buffer.buffer;
  }

  static size(v) {
    return Buffer.writeUint32(v);
  }

  extension(version, flag) {
    return new Uint8Array([
      version,
      (flag >> 16) & 0xff,
      (flag >> 8) & 0xff,
      flag & 0xff
    ]);
  }

  static type(name) {
    let {
      getTypeCache
    } = DataStore.OBJ;

    return getTypeCache(name);
  }

  // #endregion
}

FLVMp4.sequence = 1;

export default FLVMp4;