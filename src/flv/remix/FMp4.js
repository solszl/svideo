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
 * @class FMp4
 * @author zhenliang.sun
 */
class FMP4 {
  static init() {
    FMP4.types = {
      avc1: [],
      avcC: [],
      btrt: [],
      dinf: [],
      dref: [],
      esds: [],
      ftyp: [],
      hdlr: [],
      mdat: [],
      mdhd: [],
      mdia: [],
      mfhd: [],
      minf: [],
      moof: [],
      moov: [],
      mp4a: [],
      mvex: [],
      mvhd: [],
      sdtp: [],
      stbl: [],
      stco: [],
      stsc: [],
      stsd: [],
      stsz: [],
      stts: [],
      tfdt: [],
      tfhd: [],
      traf: [],
      trak: [],
      trun: [],
      trex: [],
      tkhd: [],
      vmhd: [],
      smhd: [],
      '.mp3': []
    };

    for (let name in FMP4.types) {
      if (FMP4.types.hasOwnProperty(name)) {
        FMP4.types[name] = [
          name.charCodeAt(0),
          name.charCodeAt(1),
          name.charCodeAt(2),
          name.charCodeAt(3)
        ];
      }
    }

    let constants = FMP4.constants = {};

    constants.FTYP = new Uint8Array([
      0x69, 0x73, 0x6F, 0x6D, // major_brand: isom
      0x0, 0x0, 0x0, 0x1, // minor_version: 0x01
      0x69, 0x73, 0x6F, 0x6D, // isom
      0x61, 0x76, 0x63, 0x31 // avc1
    ]);

    constants.STSD_PREFIX = new Uint8Array([
      0x00, 0x00, 0x00, 0x00, // version(0) + flags
      0x00, 0x00, 0x00, 0x01 // entry_count
    ]);

    constants.STTS = new Uint8Array([
      0x00, 0x00, 0x00, 0x00, // version(0) + flags
      0x00, 0x00, 0x00, 0x00 // entry_count
    ]);

    constants.STSC = constants.STCO = constants.STTS;

    constants.STSZ = new Uint8Array([
      0x00, 0x00, 0x00, 0x00, // version(0) + flags
      0x00, 0x00, 0x00, 0x00, // sample_size
      0x00, 0x00, 0x00, 0x00 // sample_count
    ]);

    constants.HDLR_VIDEO = new Uint8Array([
      0x00, 0x00, 0x00, 0x00, // version(0) + flags
      0x00, 0x00, 0x00, 0x00, // pre_defined
      0x76, 0x69, 0x64, 0x65, // handler_type: 'vide'
      0x00, 0x00, 0x00, 0x00, // reserved: 3 * 4 bytes
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x56, 0x69, 0x64, 0x65,
      0x6F, 0x48, 0x61, 0x6E,
      0x64, 0x6C, 0x65, 0x72, 0x00 // name: VideoHandler
    ]);

    constants.HDLR_AUDIO = new Uint8Array([
      0x00, 0x00, 0x00, 0x00, // version(0) + flags
      0x00, 0x00, 0x00, 0x00, // pre_defined
      0x73, 0x6F, 0x75, 0x6E, // handler_type: 'soun'
      0x00, 0x00, 0x00, 0x00, // reserved: 3 * 4 bytes
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x53, 0x6F, 0x75, 0x6E,
      0x64, 0x48, 0x61, 0x6E,
      0x64, 0x6C, 0x65, 0x72, 0x00 // name: SoundHandler
    ]);

    constants.DREF = new Uint8Array([
      0x00, 0x00, 0x00, 0x00, // version(0) + flags
      0x00, 0x00, 0x00, 0x01, // entry_count
      0x00, 0x00, 0x00, 0x0C, // entry_size
      0x75, 0x72, 0x6C, 0x20, // type 'url '
      0x00, 0x00, 0x00, 0x01 // version(0) + flags
    ]);

    // Sound media header
    constants.SMHD = new Uint8Array([
      0x00, 0x00, 0x00, 0x00, // version(0) + flags
      0x00, 0x00, 0x00, 0x00 // balance(2) + reserved(2)
    ]);

    // video media header
    constants.VMHD = new Uint8Array([
      0x00, 0x00, 0x00, 0x01, // version(0) + flags
      0x00, 0x00, // graphicsmode: 2 bytes
      0x00, 0x00, 0x00, 0x00, // opcolor: 3 * 2 bytes
      0x00, 0x00
    ]);
  }

  // Generate a box
  static box(type) {
    let size = 8;
    let result = null;
    let datas = Array.prototype.slice.call(arguments, 1);
    let arrayCount = datas.length;

    for (let i = 0; i < arrayCount; i++) {
      size += datas[i].byteLength;
    }

    result = new Uint8Array(size);
    result[0] = (size >>> 24) & 0xFF; // size
    result[1] = (size >>> 16) & 0xFF;
    result[2] = (size >>> 8) & 0xFF;
    result[3] = (size) & 0xFF;

    result.set(type, 4); // type

    let offset = 8;
    for (let i = 0; i < arrayCount; i++) { // data body
      result.set(datas[i], offset);
      offset += datas[i].byteLength;
    }

    return result;
  }

  // emit ftyp & moov
  static generateInitSegment(meta) {
    let ftyp = FMP4.box(FMP4.types.ftyp, FMP4.constants.FTYP);
    let moov = FMP4.moov(meta);

    let result = new Uint8Array(ftyp.byteLength + moov.byteLength);
    result.set(ftyp, 0);
    result.set(moov, ftyp.byteLength);
    return result;
  }

  // Movie metadata box
  static moov(meta) {
    let mvhd = FMP4.mvhd(meta.timescale, meta.duration);
    let trak = FMP4.trak(meta);
    let mvex = FMP4.mvex(meta);
    return FMP4.box(FMP4.types.moov, mvhd, trak, mvex);
  }

  // Movie header box
  static mvhd(timescale, duration) {
    return FMP4.box(FMP4.types.mvhd, new Uint8Array([
      0x00, 0x00, 0x00, 0x00, // version(0) + flags
      0x00, 0x00, 0x00, 0x00, // creation_time
      0x00, 0x00, 0x00, 0x00, // modification_time
      (timescale >>> 24) & 0xFF, // timescale: 4 bytes
      (timescale >>> 16) & 0xFF,
      (timescale >>> 8) & 0xFF,
      (timescale) & 0xFF,
      (duration >>> 24) & 0xFF, // duration: 4 bytes
      (duration >>> 16) & 0xFF,
      (duration >>> 8) & 0xFF,
      (duration) & 0xFF,
      0x00, 0x01, 0x00, 0x00, // Preferred rate: 1.0
      0x01, 0x00, 0x00, 0x00, // PreferredVolume(1.0, 2bytes) + reserved(2bytes)
      0x00, 0x00, 0x00, 0x00, // reserved: 4 + 4 bytes
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x01, 0x00, 0x00, // ----begin composition matrix----
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x01, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x40, 0x00, 0x00, 0x00, // ----end composition matrix----
      0x00, 0x00, 0x00, 0x00, // ----begin pre_defined 6 * 4 bytes----
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, // ----end pre_defined 6 * 4 bytes----
      0xFF, 0xFF, 0xFF, 0xFF // next_track_ID
    ]));
  }

  // Track box
  static trak(meta) {
    return FMP4.box(FMP4.types.trak, FMP4.tkhd(meta), FMP4.mdia(meta));
  }

  // Track header box
  static tkhd(meta) {
    let trackId = meta.id,
      duration = meta.duration;
    let width = meta.presentWidth,
      height = meta.presentHeight;

    return FMP4.box(FMP4.types.tkhd, new Uint8Array([
      0x00, 0x00, 0x00, 0x07, // version(0) + flags
      0x00, 0x00, 0x00, 0x00, // creation_time
      0x00, 0x00, 0x00, 0x00, // modification_time
      (trackId >>> 24) & 0xFF, // track_ID: 4 bytes
      (trackId >>> 16) & 0xFF,
      (trackId >>> 8) & 0xFF,
      (trackId) & 0xFF,
      0x00, 0x00, 0x00, 0x00, // reserved: 4 bytes
      (duration >>> 24) & 0xFF, // duration: 4 bytes
      (duration >>> 16) & 0xFF,
      (duration >>> 8) & 0xFF,
      (duration) & 0xFF,
      0x00, 0x00, 0x00, 0x00, // reserved: 2 * 4 bytes
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, // layer(2bytes) + alternate_group(2bytes)
      0x00, 0x00, 0x00, 0x00, // volume(2bytes) + reserved(2bytes)
      0x00, 0x01, 0x00, 0x00, // ----begin composition matrix----
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x01, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x40, 0x00, 0x00, 0x00, // ----end composition matrix----
      (width >>> 8) & 0xFF, // width and height
      (width) & 0xFF,
      0x00, 0x00,
      (height >>> 8) & 0xFF,
      (height) & 0xFF,
      0x00, 0x00
    ]));
  }

  // Media Box
  static mdia(meta) {
    return FMP4.box(FMP4.types.mdia, FMP4.mdhd(meta), FMP4.hdlr(meta), FMP4.minf(meta));
  }

  // Media header box
  static mdhd(meta) {
    let timescale = meta.timescale;
    let duration = meta.duration;
    return FMP4.box(FMP4.types.mdhd, new Uint8Array([
      0x00, 0x00, 0x00, 0x00, // version(0) + flags
      0x00, 0x00, 0x00, 0x00, // creation_time
      0x00, 0x00, 0x00, 0x00, // modification_time
      (timescale >>> 24) & 0xFF, // timescale: 4 bytes
      (timescale >>> 16) & 0xFF,
      (timescale >>> 8) & 0xFF,
      (timescale) & 0xFF,
      (duration >>> 24) & 0xFF, // duration: 4 bytes
      (duration >>> 16) & 0xFF,
      (duration >>> 8) & 0xFF,
      (duration) & 0xFF,
      0x55, 0xC4, // language: und (undetermined)
      0x00, 0x00 // pre_defined = 0
    ]));
  }

  // Media handler reference box
  static hdlr(meta) {
    let data = null;
    if (meta.type === 'audio') {
      data = FMP4.constants.HDLR_AUDIO;
    } else {
      data = FMP4.constants.HDLR_VIDEO;
    }
    return FMP4.box(FMP4.types.hdlr, data);
  }

  // Media infomation box
  static minf(meta) {
    let xmhd = null;
    if (meta.type === 'audio') {
      xmhd = FMP4.box(FMP4.types.smhd, FMP4.constants.SMHD);
    } else {
      xmhd = FMP4.box(FMP4.types.vmhd, FMP4.constants.VMHD);
    }
    return FMP4.box(FMP4.types.minf, xmhd, FMP4.dinf(), FMP4.stbl(meta));
  }

  // Data infomation box
  static dinf() {
    let result = FMP4.box(FMP4.types.dinf,
      FMP4.box(FMP4.types.dref, FMP4.constants.DREF)
    );
    return result;
  }

  // Sample table box
  static stbl(meta) {
    let result = FMP4.box(FMP4.types.stbl, // type: stbl
      FMP4.stsd(meta), // Sample Description Table
      FMP4.box(FMP4.types.stts, FMP4.constants.STTS), // Time-To-Sample
      FMP4.box(FMP4.types.stsc, FMP4.constants.STSC), // Sample-To-Chunk
      FMP4.box(FMP4.types.stsz, FMP4.constants.STSZ), // Sample size
      FMP4.box(FMP4.types.stco, FMP4.constants.STCO) // Chunk offset
    );
    return result;
  }

  // Sample description box
  static stsd(meta) {
    if (meta.type === 'audio') {
      if (meta.codec === 'mp3') {
        return FMP4.box(FMP4.types.stsd, FMP4.constants.STSD_PREFIX, FMP4.mp3(meta));
      }
      // else: aac -> mp4a
      return FMP4.box(FMP4.types.stsd, FMP4.constants.STSD_PREFIX, FMP4.mp4a(meta));
    } else {
      return FMP4.box(FMP4.types.stsd, FMP4.constants.STSD_PREFIX, FMP4.avc1(meta));
    }
  }

  static mp3(meta) {
    let channelCount = meta.channelCount;
    let sampleRate = meta.audioSampleRate;

    let data = new Uint8Array([
      0x00, 0x00, 0x00, 0x00, // reserved(4)
      0x00, 0x00, 0x00, 0x01, // reserved(2) + data_reference_index(2)
      0x00, 0x00, 0x00, 0x00, // reserved: 2 * 4 bytes
      0x00, 0x00, 0x00, 0x00,
      0x00, channelCount, // channelCount(2)
      0x00, 0x10, // sampleSize(2)
      0x00, 0x00, 0x00, 0x00, // reserved(4)
      (sampleRate >>> 8) & 0xFF, // Audio sample rate
      (sampleRate) & 0xFF,
      0x00, 0x00
    ]);

    return FMP4.box(FMP4.types['.mp3'], data);
  }

  static mp4a(meta) {
    let channelCount = meta.channelCount;
    let sampleRate = meta.audioSampleRate;

    let data = new Uint8Array([
      0x00, 0x00, 0x00, 0x00, // reserved(4)
      0x00, 0x00, 0x00, 0x01, // reserved(2) + data_reference_index(2)
      0x00, 0x00, 0x00, 0x00, // reserved: 2 * 4 bytes
      0x00, 0x00, 0x00, 0x00,
      0x00, channelCount, // channelCount(2)
      0x00, 0x10, // sampleSize(2)
      0x00, 0x00, 0x00, 0x00, // reserved(4)
      (sampleRate >>> 8) & 0xFF, // Audio sample rate
      (sampleRate) & 0xFF,
      0x00, 0x00
    ]);

    return FMP4.box(FMP4.types.mp4a, data, FMP4.esds(meta));
  }

  static esds(meta) {
    let config = meta.config || [];
    let configSize = config.length;
    let data = new Uint8Array([
      0x00, 0x00, 0x00, 0x00, // version 0 + flags

      0x03, // descriptor_type
      0x17 + configSize, // length3
      0x00, 0x01, // es_id
      0x00, // stream_priority

      0x04, // descriptor_type
      0x0F + configSize, // length
      0x40, // codec: mpeg4_audio
      0x15, // stream_type: Audio
      0x00, 0x00, 0x00, // buffer_size
      0x00, 0x00, 0x00, 0x00, // maxBitrate
      0x00, 0x00, 0x00, 0x00, // avgBitrate

      0x05 // descriptor_type
    ].concat([
      configSize
    ]).concat(
      config
    ).concat([
      0x06, 0x01, 0x02 // GASpecificConfig
    ]));
    return FMP4.box(FMP4.types.esds, data);
  }

  static avc1(meta) {
    let avcc = meta.avcc;
    let width = meta.codecWidth,
      height = meta.codecHeight;

    let data = new Uint8Array([
      0x00, 0x00, 0x00, 0x00, // reserved(4)
      0x00, 0x00, 0x00, 0x01, // reserved(2) + data_reference_index(2)
      0x00, 0x00, 0x00, 0x00, // pre_defined(2) + reserved(2)
      0x00, 0x00, 0x00, 0x00, // pre_defined: 3 * 4 bytes
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      (width >>> 8) & 0xFF, // width: 2 bytes
      (width) & 0xFF,
      (height >>> 8) & 0xFF, // height: 2 bytes
      (height) & 0xFF,
      0x00, 0x48, 0x00, 0x00, // horizresolution: 4 bytes
      0x00, 0x48, 0x00, 0x00, // vertresolution: 4 bytes
      0x00, 0x00, 0x00, 0x00, // reserved: 4 bytes
      0x00, 0x01, // frame_count
      0x0A, // strlen
      0x78, 0x71, 0x71, 0x2F, // compressorname: 32 bytes
      0x66, 0x6C, 0x76, 0x2E,
      0x6A, 0x73, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00,
      0x00, 0x18, // depth
      0xFF, 0xFF // pre_defined = -1
    ]);
    return FMP4.box(FMP4.types.avc1, data, FMP4.box(FMP4.types.avcC, avcc));
  }

  // Movie Extends box
  static mvex(meta) {
    return FMP4.box(FMP4.types.mvex, FMP4.trex(meta));
  }

  // Track Extends box
  static trex(meta) {
    let trackId = meta.id;
    let data = new Uint8Array([
      0x00, 0x00, 0x00, 0x00, // version(0) + flags
      (trackId >>> 24) & 0xFF, // track_ID
      (trackId >>> 16) & 0xFF,
      (trackId >>> 8) & 0xFF,
      (trackId) & 0xFF,
      0x00, 0x00, 0x00, 0x01, // default_sample_description_index
      0x00, 0x00, 0x00, 0x00, // default_sample_duration
      0x00, 0x00, 0x00, 0x00, // default_sample_size
      0x00, 0x01, 0x00, 0x01 // default_sample_flags
    ]);
    return FMP4.box(FMP4.types.trex, data);
  }

  // Movie fragment box
  static moof(track, baseMediaDecodeTime) {
    return FMP4.box(FMP4.types.moof, FMP4.mfhd(track.sequenceNumber), FMP4.traf(track, baseMediaDecodeTime));
  }

  static mfhd(sequenceNumber) {
    let data = new Uint8Array([
      0x00, 0x00, 0x00, 0x00,
      (sequenceNumber >>> 24) & 0xFF, // sequence_number: int32
      (sequenceNumber >>> 16) & 0xFF,
      (sequenceNumber >>> 8) & 0xFF,
      (sequenceNumber) & 0xFF
    ]);
    return FMP4.box(FMP4.types.mfhd, data);
  }

  // Track fragment box
  static traf(track, baseMediaDecodeTime) {
    let trackId = track.id;

    // Track fragment header box
    let tfhd = FMP4.box(FMP4.types.tfhd, new Uint8Array([
      0x00, 0x00, 0x00, 0x00, // version(0) & flags
      (trackId >>> 24) & 0xFF, // track_ID
      (trackId >>> 16) & 0xFF,
      (trackId >>> 8) & 0xFF,
      (trackId) & 0xFF
    ]));
    // Track Fragment Decode Time
    let tfdt = FMP4.box(FMP4.types.tfdt, new Uint8Array([
      0x00, 0x00, 0x00, 0x00, // version(0) & flags
      (baseMediaDecodeTime >>> 24) & 0xFF, // baseMediaDecodeTime: int32
      (baseMediaDecodeTime >>> 16) & 0xFF,
      (baseMediaDecodeTime >>> 8) & 0xFF,
      (baseMediaDecodeTime) & 0xFF
    ]));
    let sdtp = FMP4.sdtp(track);
    let trun = FMP4.trun(track, sdtp.byteLength + 16 + 16 + 8 + 16 + 8 + 8);

    return FMP4.box(FMP4.types.traf, tfhd, tfdt, trun, sdtp);
  }

  // Sample Dependency Type box
  static sdtp(track) {
    let samples = track.samples || [];
    let sampleCount = samples.length;
    let data = new Uint8Array(4 + sampleCount);
    // 0~4 bytes: version(0) & flags
    for (let i = 0; i < sampleCount; i += 1) {
      let flags = samples[i].flags;
      data[i + 4] = (flags.isLeading << 6) // is_leading: 2 (bit)
        |
        (flags.dependsOn << 4) // sample_depends_on
        |
        (flags.isDependedOn << 2) // sample_is_depended_on
        |
        (flags.hasRedundancy); // sample_has_redundancy
    }
    return FMP4.box(FMP4.types.sdtp, data);
  }

  // Track fragment run box
  static trun(track, offset) {
    let samples = track.samples || [];
    let sampleCount = samples.length;
    let dataSize = 12 + 16 * sampleCount;
    let data = new Uint8Array(dataSize);
    offset += 8 + dataSize;

    data.set([
      0x00, 0x00, 0x0F, 0x01, // version(0) & flags
      (sampleCount >>> 24) & 0xFF, // sample_count
      (sampleCount >>> 16) & 0xFF,
      (sampleCount >>> 8) & 0xFF,
      (sampleCount) & 0xFF,
      (offset >>> 24) & 0xFF, // data_offset
      (offset >>> 16) & 0xFF,
      (offset >>> 8) & 0xFF,
      (offset) & 0xFF
    ], 0);

    for (let i = 0; i < sampleCount; i += 1) {
      let duration = samples[i].duration;
      let size = samples[i].size;
      let flags = samples[i].flags;
      let cts = samples[i].cts;
      data.set([
        (duration >>> 24) & 0xFF, // sample_duration
        (duration >>> 16) & 0xFF,
        (duration >>> 8) & 0xFF,
        (duration) & 0xFF,
        (size >>> 24) & 0xFF, // sample_size
        (size >>> 16) & 0xFF,
        (size >>> 8) & 0xFF,
        (size) & 0xFF,
        (flags.isLeading << 2) | flags.dependsOn, // sample_flags
        (flags.isDependedOn << 6) | (flags.hasRedundancy << 4) | flags.isNonSync,
        0x00, 0x00, // sample_degradation_priority
        (cts >>> 24) & 0xFF, // sample_composition_time_offset
        (cts >>> 16) & 0xFF,
        (cts >>> 8) & 0xFF,
        (cts) & 0xFF
      ], 12 + 16 * i);
    }
    return FMP4.box(FMP4.types.trun, data);
  }

  static mdat(data) {
    return FMP4.box(FMP4.types.mdat, data);
  }
}


FMP4.init();

export default FMP4;