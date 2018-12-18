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
  static ftyp() {
    return FLVMp4.init(24, 'ftyp', new Uint8Array([
      0x69, 0x73, 0x6F, 0x6D, // isom,
      0x0, 0x0, 0x00, 0x01, // minor_version: 0x01
      0x69, 0x73, 0x6F, 0x6D, // isom
      0x61, 0x76, 0x63, 0x31 // avc1
    ]));
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
    let buffer = new Buffer();
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

    return trunBox;
  }

  // #endregion


  // #region moov
  static moov(data) {
    let size = 8;
    let mvhd = FLVMp4.mvhd(data.duration, data.timeScale);
    let trak1 = FLVMp4.videoTrak(data);
    let trak2 = FLVMp4.audioTrak(data);
    let mvex = FLVMp4.mvex(data.duration, data.timeScale);
    [mvhd, trak1, trak2, mvex].forEach(item => {
      size += item.byteLength;
    });

    return FLVMp4.init(size, 'moov', mvhd, trak1, trak2, mvex);
  }

  static mvhd(duration, timeScale) {
    let timescale = timeScale || 1000;
    // duration *= timescale;
    let bytes = new Uint8Array([
      0x00, 0x00, 0x00, 0x00, // version(0) + flags     1位的box版本+3位flags   box版本，0或1，一般为0。（以下字节数均按version=0）
      0x00, 0x00, 0x00, 0x00, // creation_time    创建时间  （相对于UTC时间1904-01-01零点的秒数）
      0x00, 0x00, 0x00, 0x00, // modification_time   修改时间

      /**
       * timescale: 4 bytes文件媒体在1秒时间内的刻度值，可以理解为1秒长度
       */
      (timescale >>> 24) & 0xFF,
      (timescale >>> 16) & 0xFF,
      (timescale >>> 8) & 0xFF,
      (timescale) & 0xFF,

      /**
       * duration: 4 bytes该track的时间长度，用duration和time scale值可以计算track时长，比如audio track的time scale = 8000,
       * duration = 560128，时长为70.016，video track的time scale = 600, duration = 42000，时长为70
       */
      (duration >>> 24) & 0xFF,
      (duration >>> 16) & 0xFF,
      (duration >>> 8) & 0xFF,
      (duration) & 0xFF,
      0x00, 0x01, 0x00, 0x00, // Preferred rate: 1.0   推荐播放速率，高16位和低16位分别为小数点整数部分和小数部分，即[16.16] 格式，该值为1.0（0x00010000）表示正常前向播放
      /**
       * PreferredVolume(1.0, 2bytes) + reserved(2bytes)
       * 与rate类似，[8.8] 格式，1.0（0x0100）表示最大音量
       */
      0x01, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, //  reserved: 4 + 4 bytes保留位
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x01, 0x00, 0x00, // ----begin composition matrix----
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, // 视频变换矩阵   线性代数
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x01, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x40, 0x00, 0x00, 0x00, // ----end composition matrix----
      0x00, 0x00, 0x00, 0x00, // ----begin pre_defined 6 * 4 bytes----
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, // pre-defined 保留位
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, // ----end pre_defined 6 * 4 bytes----
      0xFF, 0xFF, 0xFF, 0xFF // next_track_ID 下一个track使用的id号
    ]);

    return FLVMp4.init(8 + bytes.length, 'mvhd', new Uint8Array(bytes));
  }

  static videoTrak(data) {
    let size = 8;
    let tkhd = FLVMp4.tkhd({
      id: 1,
      duration: data.duration,
      timescale: data.timeScale,
      width: data.width,
      height: data.height,
      type: 'video'
    });

    let mdia = FLVMp4.mdia({
      type: 'video',
      timescale: data.timeScale,
      duration: data.duration,
      sps: data.sps,
      pps: data.pps,
      pixelRatio: data.pixelRatio,
      width: data.width,
      height: data.height
    });

    [tkhd, mdia].forEach(item => {
      size += item.byteLength;
    });

    return FLVMp4.init(size, 'trak', tkhd, mdia);
  }

  static audioTrak(data) {
    let size = 8;
    let tkhd = FLVMp4.tkhd({
      id: 2,
      duration: data.duration,
      timescale: data.timeScale,
      width: 0,
      height: 0,
      type: 'audio'
    });

    let mdia = FLVMp4.mdia({
      type: 'audio',
      timescale: data.timeScale,
      duration: data.duration,
      channelCount: data.audioChannelCount,
      samplerate: data.audioSampleRate,
      config: data.audioConfig
    });

    [tkhd, mdia].forEach(item => {
      size += item.byteLength;
    });

    return FLVMp4.init(size, 'trak', tkhd, mdia);
  }

  static mvex(duration) {
    let buffer = new Buffer();
    let mehd = Buffer.writeUint32(duration);
    buffer.write(
      FLVMp4.size(88), FLVMp4.type('mvex'),
      FLVMp4.size(16), FLVMp4.type('mehd'), FLVMp4.extension(0, 0), mehd,
      FLVMp4.trex(1),
      FLVMp4.trex(2)
    );
    return buffer.buffer;
  }

  static tkhd(data) {
    let id = data.id;
    let duration = data.duration;
    let width = data.width;
    let height = data.height;
    let content = new Uint8Array([
      0x00, 0x00, 0x00, 0x07, // version(0) + flags 1位版本 box版本，0或1，一般为0。（以下字节数均按version=0）按位或操作结果值，预定义如下：
      // 0x000001 track_enabled，否则该track不被播放；
      // 0x000002 track_in_movie，表示该track在播放中被引用；
      // 0x000004 track_in_preview，表示该track在预览时被引用。
      // 一般该值为7，1+2+4 如果一个媒体所有track均未设置track_in_movie和track_in_preview，将被理解为所有track均设置了这两项；对于hint track，该值为0
      // hint track 这个特殊的track并不包含媒体数据，而是包含了一些将其他数据track打包成流媒体的指示信息。
      0x00, 0x00, 0x00, 0x00, // creation_time创建时间（相对于UTC时间1904-01-01零点的秒数）
      0x00, 0x00, 0x00, 0x00, // modification time 修改时间
      (id >>> 24) & 0xFF, // track_ID: 4 bytes id号，不能重复且不能为0
      (id >>> 16) & 0xFF,
      (id >>> 8) & 0xFF,
      (id) & 0xFF,
      0x00, 0x00, 0x00, 0x00, // reserved: 4 bytes    保留位
      (duration >>> 24) & 0xFF, // duration: 4 bytes track的时间长度
      (duration >>> 16) & 0xFF,
      (duration >>> 8) & 0xFF,
      (duration) & 0xFF,
      0x00, 0x00, 0x00, 0x00, // reserved: 2 * 4 bytes    保留位
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, // layer(2bytes) + alternate_group(2bytes)  视频层，默认为0，值小的在上层.track分组信息，默认为0表示该track未与其他track有群组关系
      0x00, 0x00, 0x00, 0x00, // volume(2bytes) + reserved(2bytes)    [8.8] 格式，如果为音频track，1.0（0x0100）表示最大音量；否则为0   +保留位
      0x00, 0x01, 0x00, 0x00, // ----begin composition matrix----
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x01, 0x00, 0x00, // 视频变换矩阵
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x40, 0x00, 0x00, 0x00, // ----end composition matrix----
      (width >>> 8) & 0xFF, // //宽度
      (width) & 0xFF,
      0x00, 0x00,
      (height >>> 8) & 0xFF, // 高度
      (height) & 0xFF,
      0x00, 0x00
    ]);

    return FLVMp4.init(8 + content.byteLength, 'tkhd', content);
  }

  static mdia(data) {
    let size = 8;
    let mdhd = FLVMp4.mdhd(data.timescale, data.duration);
    let hdlr = FLVMp4.hdlr(data.type);
    let minf = FLVMp4.minf(data);

    [mdhd, hdlr, minf].forEach(item => {
      size += item.byteLength;
    });

    return FLVMp4.init(size, 'mdia', mdhd, hdlr, minf);
  }

  static mdhd(timescale, duration) {
    let content = new Uint8Array([
      0x00, 0x00, 0x00, 0x00, // creation_time    创建时间
      0x00, 0x00, 0x00, 0x00, // modification_time修改时间
      (timescale >>> 24) & 0xFF, // timescale: 4 bytes    文件媒体在1秒时间内的刻度值，可以理解为1秒长度
      (timescale >>> 16) & 0xFF,
      (timescale >>> 8) & 0xFF,
      (timescale) & 0xFF,
      (duration >>> 24) & 0xFF, // duration: 4 bytes  track的时间长度
      (duration >>> 16) & 0xFF,
      (duration >>> 8) & 0xFF,
      (duration) & 0xFF,
      0x55, 0xC4, // language: und (undetermined) 媒体语言码。最高位为0，后面15位为3个字符（见ISO 639-2/T标准中定义）
      0x00, 0x00 // pre_defined = 0
    ]);

    return FLVMp4.init(12 + content.byteLength, 'mdhd', FLVMp4.extension(0, 0), content);
  }

  static hdlr(type) {
    let value = [0x00, // version 0
      0x00, 0x00, 0x00, // flags
      0x00, 0x00, 0x00, 0x00, // pre_defined
      0x76, 0x69, 0x64, 0x65, // handler_type: 'vide'
      0x00, 0x00, 0x00, 0x00, // reserved
      0x00, 0x00, 0x00, 0x00, // reserved
      0x00, 0x00, 0x00, 0x00, // reserved
      0x56, 0x69, 0x64, 0x65,
      0x6f, 0x48, 0x61, 0x6e,
      0x64, 0x6c, 0x65, 0x72, 0x00 // name: 'VideoHandler'
    ];
    if (type === 'audio') {
      value.splice(8, 4, ...[0x73, 0x6f, 0x75, 0x6e]);
      value.splice(24, 13, ...[0x53, 0x6f, 0x75, 0x6e,
        0x64, 0x48, 0x61, 0x6e,
        0x64, 0x6c, 0x65, 0x72, 0x00
      ]);
    }

    return FLVMp4.init(8 + value.length, 'hdlr', new Uint8Array(value));
  }

  static minf(data) {
    let size = 8;
    let vmhd = data.type === 'video' ? FLVMp4.vmhd() : FLVMp4.smhd();
    let dinf = FLVMp4.dinf();
    let stbl = FLVMp4.stbl(data);

    [vmhd, dinf, stbl].forEach(item => {
      size += item.byteLength;
    });

    return FLVMp4.init(size, 'minf', vmhd, dinf, stbl);
  }

  static vmhd() {
    let content = [
      0x00, // version
      0x00, 0x00, 0x01, // flags
      0x00, 0x00, // graphicsmode
      0x00, 0x00,
      0x00, 0x00,
      0x00, 0x00 // opcolor
    ];

    return FLVMp4.init(20, 'vmhd', new Uint8Array(content));
  }

  static smhd() {
    let content = [
      0x00, // version
      0x00, 0x00, 0x00, // flags
      0x00, 0x00, // balance
      0x00, 0x00 // reserved
    ];

    return FLVMp4.init(16, 'smhd', new Uint8Array(content));
  }

  static dinf() {
    let buffer = new Buffer();
    let dref = [
      0x00, // version 0
      0x00, 0x00, 0x00, // flags
      0x00, 0x00, 0x00, 0x01, // entry_count
      0x00, 0x00, 0x00, 0x0c, // entry_size
      0x75, 0x72, 0x6c, 0x20, // 'url' type
      0x00, // version 0
      0x00, 0x00, 0x01 // entry_flags
    ];

    buffer.write(FLVMp4.size(36), FLVMp4.type('dinf'), FLVMp4.size(28), FLVMp4.type('dref'), new Uint8Array(dref));
    return buffer.buffer;
  }

  static stbl(data) {
    let size = 8;
    let stsd = FLVMp4.stsd(data);
    let stts = FLVMp4.stts();
    let stsc = FLVMp4.stsc();
    let stsz = FLVMp4.stsz();
    let stco = FLVMp4.stco();

    [stsd, stts, stsc, stsz, stco].forEach(item => {
      size += item.byteLength;
    });

    return FLVMp4.init(size, 'stbl', stsd, stts, stsc, stsz, stco);
  }

  static stsd(data) {
    let content;
    if (data.type === 'audio') {
      content = FLVMp4.mp4a(data);
    } else {
      content = FLVMp4.avc1(data);
    }

    return FLVMp4.init(16 + content.byteLength, 'stsd', FLVMp4.extension(0, 0), new Uint8Array([0x00, 0x00, 0x00, 0x01]), content);
  }

  static stts() {
    let content = new Uint8Array([
      0x00, // version
      0x00, 0x00, 0x00, // flags
      0x00, 0x00, 0x00, 0x00 // entry_count
    ]);

    return FLVMp4.init(16, 'stts', content);
  }

  static stsc() {
    let content = new Uint8Array([
      0x00, // version
      0x00, 0x00, 0x00, // flags
      0x00, 0x00, 0x00, 0x00 // entry_count
    ]);

    return FLVMp4.init(16, 'stsc', content);
  }

  static stsz() {
    let content = new Uint8Array([
      0x00, // version
      0x00, 0x00, 0x00, // flags
      0x00, 0x00, 0x00, 0x00, // sample_size
      0x00, 0x00, 0x00, 0x00 // sample_count
    ]);

    return FLVMp4.init(20, 'stsz', content);
  }

  static stco() {
    let content = new Uint8Array([
      0x00, // version
      0x00, 0x00, 0x00, // flags
      0x00, 0x00, 0x00, 0x00 // entry_count
    ]);

    return FLVMp4.init(16, 'stco', content);
  }

  static mp4a(data) {
    let content = new Uint8Array([
      0x00, 0x00, 0x00, // reserved
      0x00, 0x00, 0x00, // reserved
      0x00, 0x01, // data_reference_index
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, // reserved
      0x00, data.channelCount, // channelcount
      0x00, 0x10, // sampleSize:16bits
      0x00, 0x00, 0x00, 0x00, // reserved2
      (data.samplerate >> 8) & 0xff,
      data.samplerate & 0xff, //
      0x00, 0x00
    ]);

    let esds = FLVMp4.esds(data.config);
    return FLVMp4.init(8 + content.byteLength + esds.byteLength, 'mp4a', content, esds);
  }

  static avc1(data) {
    let buffer = new Buffer();
    let size = 40; // 8(avc1)+8(avcc)+8(btrt)+16(pasp)
    let sps = data.sps;
    let pps = data.pps;
    let width = data.width;
    let height = data.height;
    let hSpacing = data.pixelRatio[0];
    let vSpacing = data.pixelRatio[1];
    let avccBuffer = new Buffer();
    avccBuffer.write(new Uint8Array([
      0x01, // version
      sps[1], // profile
      sps[2], // profile compatible
      sps[3], // level
      0xfc | 3,
      0xE0 | 1 // 目前只处理一个sps
    ].concat([sps.length >>> 8 & 0xff, sps.length & 0xff])));
    avccBuffer.write(sps, new Uint8Array([1, pps.length >>> 8 & 0xff, pps.length & 0xff]), pps);

    let avcc = avccBuffer.buffer;
    let avc1 = new Uint8Array([
      0x00, 0x00, 0x00, // reserved
      0x00, 0x00, 0x00, // reserved
      0x00, 0x01, // data_reference_index
      0x00, 0x00, // pre_defined
      0x00, 0x00, // reserved
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, // pre_defined
      (width >> 8) & 0xff,
      width & 0xff, // width
      (height >> 8) & 0xff,
      height & 0xff, // height
      0x00, 0x48, 0x00, 0x00, // horizresolution
      0x00, 0x48, 0x00, 0x00, // vertresolution
      0x00, 0x00, 0x00, 0x00, // reserved
      0x00, 0x01, // frame_count
      0x12,
      0x64, 0x61, 0x69, 0x6C, // dailymotion/hls.js
      0x79, 0x6D, 0x6F, 0x74,
      0x69, 0x6F, 0x6E, 0x2F,
      0x68, 0x6C, 0x73, 0x2E,
      0x6A, 0x73, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, // compressorname
      0x00, 0x18, // depth = 24
      0x11, 0x11
    ]); // pre_defined = -1
    let btrt = new Uint8Array([
      0x00, 0x1c, 0x9c, 0x80, // bufferSizeDB
      0x00, 0x2d, 0xc6, 0xc0, // maxBitrate
      0x00, 0x2d, 0xc6, 0xc0 // avgBitrate
    ]);
    let pasp = new Uint8Array([
      (hSpacing >> 24), // hSpacing
      (hSpacing >> 16) & 0xff,
      (hSpacing >> 8) & 0xff,
      hSpacing & 0xff,
      (vSpacing >> 24), // vSpacing
      (vSpacing >> 16) & 0xff,
      (vSpacing >> 8) & 0xff,
      vSpacing & 0xff
    ]);

    buffer.write(
      FLVMp4.size(size + avc1.byteLength + avcc.byteLength + btrt.byteLength), FLVMp4.type('avc1'), avc1,
      FLVMp4.size(8 + avcc.byteLength), FLVMp4.type('avcC'), avcc,
      FLVMp4.size(20), FLVMp4.type('btrt'), btrt,
      FLVMp4.size(16), FLVMp4.type('pasp'), pasp
    );

    return buffer.buffer;
  }

  static esds(config = [43, 146, 8, 0]) {
    const configlen = config.length;
    let buffer = new Buffer();
    let content = new Uint8Array([
      0x00, // version 0
      0x00, 0x00, 0x00, // flags

      0x03, // descriptor_type
      0x17 + configlen, // length
      0x00, 0x01, // es_id
      0x00, // stream_priority

      0x04, // descriptor_type
      0x0f + configlen, // length
      0x40, // codec : mpeg4_audio
      0x15, // stream_type
      0x00, 0x00, 0x00, // buffer_size
      0x00, 0x00, 0x00, 0x00, // maxBitrate
      0x00, 0x00, 0x00, 0x00, // avgBitrate

      0x05 // descriptor_type
    ].concat([configlen]).concat(config).concat([0x06, 0x01, 0x02]));
    buffer.write(FLVMp4.size(8 + content.byteLength), FLVMp4.type('esds'), content);
    return buffer.buffer;
  }

  static trex(id) {
    let content = new Uint8Array([
      0x00, // version 0
      0x00, 0x00, 0x00, // flags
      (id >> 24),
      (id >> 16) & 0xff,
      (id >> 8) & 0xff,
      (id & 0xff), // track_ID
      0x00, 0x00, 0x00, 0x01, // default_sample_description_index
      0x00, 0x00, 0x00, 0x00, // default_sample_duration
      0x00, 0x00, 0x00, 0x00, // default_sample_size
      0x00, 0x01, 0x00, 0x01 // default_sample_flags
    ]);

    return FLVMp4.init(8 + content.byteLength, 'trex', content);
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

  static extension(version, flag) {
    return new Uint8Array([
      version,
      (flag >> 16) & 0xff,
      (flag >> 8) & 0xff,
      flag & 0xff
    ]);
  }

  static type(name) {
    // let {
    //   getTypeCache
    // } = DataStore.OBJ;

    return DataStore.OBJ.getTypeCache(name);
  }

  // #endregion
}

FLVMp4.sequence = 1;

export default FLVMp4;