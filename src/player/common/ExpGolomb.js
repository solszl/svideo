import Log from '../../utils/Log';

/**
 * 哥伦布编码器
 * 
 * @description ExpGolomb codeword structure
 *              [Zero prefix][1][INFO]
 *              The codeword consists of a prefix of M zeros, where M is 0 or a positive integer,
 *              a 1 and an M-bit information field, INFO. Each codeword may be generated algorithmically from the parameter code_num
 * 
 *              M = floor(log_2 [code_num + 1])
 *              INFO = code_num + 1 - 2^M
 * 
 *              Conversely, code_num may be decodeed as follows:
 *                1, Read a series of consecutive zero until a 1 is detected , Count the number of zeros(M)
 *                2, Read a 1(ignore).
 *                3, Read M bits = INFO.
 *                4, Code_num = 2^M + INFO -1
 * 
 *              Example:
 *                code_num = 107
 *                                
 *                log2[108] = 6.754...
 *                M = 6
 *                INFO = 107 + 1 - 2^6 = 101100_2
 *                codeword = 0000001101100
 *                
 * 
 *                codeword = 000000011100011
 *                Count leading zeros: M = 7
 *                INFO = 1100011_2 = 99_10
 *                code_num = 2^7 + 99 - 1 = 226
 * 
 *            @via: https://blog.csdn.net/fanbird2008/article/details/9117873
 *            简单的理解为数字与字节码的相互转换
 *
 * @export
 * @class ExpGolomb
 * @author zhenliang.sun
 */
export default class ExpGolomb {
  constructor(uint8array) {
    // 想知道这个具体是干什么的，把类上面的注释读明白了。你就知道这个类是干嘛的了
    this.CLASS_NAME = this.constructor.name;
    this.data = uint8array;
    this.bytesAvailable = this.data.byteLength;
    this.codeword = 0;
    this.bitsAvailable = 0;
  }

  destory() {
    this.data = null;
  }

  readBits(count) {
    if (this.count > 32) {
      this.info('error', `could not read more than 32 bits once time, bitCount: ${count}`);
      return;
    }

    let bits = Math.min(this.bitsAvailable, count);
    let valu = this.codeword >>> (32 - bits);

    this.bitsAvailable -= bits;

    if (this.bitsAvailable > 0) {
      this.codeword <<= bits;
    } else if (this.bytesAvailable > 0) {
      this._fillCurrentWord();
    }

    bits = count - bits;
    if (bits > 0 && this.bitsAvailable) {
      return valu << bits | this.readBits(bits);
    } else {
      return valu;
    }
  }

  readBoolean() {
    return 1 === this.readBits(1);
  }

  readUByte() {
    return this.readBits(8);
  }

  readUShort() {
    return this.readBits(16);
  }

  readUInt() {
    return this.readBits(32);
  }

  /**
   * unsigned exponential golomb
   *
   * @memberof ExpGolomb
   */
  readUEG() {
    var clz = this._skipLeadingZero(); // :uint
    return this.readBits(clz + 1) - 1;
  }

  /**
   * signed exponential golomb
   *
   * @memberof ExpGolomb
   */
  readSEG() {
    var valu = this.readUEG(); // :int
    if (0x01 & valu) {
      // the number is odd if the low order bit is set
      return (1 + valu) >>> 1; // add 1 to make it even, and divide by 2
    } else {
      return -1 * (valu >>> 1); // divide by two then make it negative
    }
  }

  skipUEG() {
    this._skipBits(1 + this._skipLeadingZero());
  }

  skipSEG() {
    this._skipBits(1 + this._skipLeadingZero());
  }

  /**
   * Advance the ExpGolomb decoder past a scaling list. The scaling
   * list is optionally transmitted as part of a sequence parameter
   * set and is not relevant to transmuxing.
   * @param count {number} the number of entries in this scaling list
   * @see Recommendation ITU-T H.264, Section 7.3.2.1.1.1
   */
  skipScalingList(count) {
    var lastScale = 8,
      nextScale = 8,
      j,
      deltaScale;
    for (j = 0; j < count; j += 1) {
      if (nextScale !== 0) {
        deltaScale = this.readEG();
        nextScale = (lastScale + deltaScale + 256) % 256;
      }
      lastScale = (nextScale === 0) ?
        lastScale :
        nextScale;
    }
  }

  /**
   * Read a sequence parameter set and return some interesting video
   * properties. A sequence parameter set is the H264 metadata that
   * describes the properties of upcoming video frames.
   * @param data {Uint8Array} the bytes of a sequence parameter set
   * @return {object} an object with configuration parsed from the
   * sequence parameter set, including the dimensions of the
   * associated video frames.
   */
  readSPS() {
    var frameCropLeftOffset = 0,
      frameCropRightOffset = 0,
      frameCropTopOffset = 0,
      frameCropBottomOffset = 0,
      profileIdc,
      profileCompat,
      levelIdc,
      numRefFramesInPicOrderCntCycle,
      picWidthInMbsMinus1,
      picHeightInMapUnitsMinus1,
      frameMbsOnlyFlag,
      scalingListCount,
      i,
      readUByte = this.readUByte.bind(this),
      readBits = this.readBits.bind(this),
      readUEG = this.readUEG.bind(this),
      readBoolean = this.readBoolean.bind(this),
      skipBits = this._skipBits.bind(this),
      skipEG = this.skipSEG.bind(this),
      skipUEG = this.skipUEG.bind(this),
      skipScalingList = this.skipScalingList.bind(this);

    readUByte();
    profileIdc = readUByte(); // profile_idc
    profileCompat = readBits(5); // constraint_set[0-4]_flag, u(5)
    skipBits(3); // reserved_zero_3bits u(3),
    levelIdc = readUByte(); // level_idc u(8)
    skipUEG(); // seq_parameter_set_id
    // some profiles have more optional data we don't need
    if (profileIdc === 100 || profileIdc === 110 || profileIdc === 122 || profileIdc === 244 || profileIdc === 44 || profileIdc === 83 || profileIdc === 86 || profileIdc === 118 || profileIdc === 128) {
      var chromaFormatIdc = readUEG();
      if (chromaFormatIdc === 3) {
        skipBits(1); // separate_colour_plane_flag
      }
      skipUEG(); // bit_depth_luma_minus8
      skipUEG(); // bit_depth_chroma_minus8
      skipBits(1); // qpprime_y_zero_transform_bypass_flag
      if (readBoolean()) { // seq_scaling_matrix_present_flag
        scalingListCount = (chromaFormatIdc !== 3) ?
          8 :
          12;
        for (i = 0; i < scalingListCount; i += 1) {
          if (readBoolean()) { // seq_scaling_list_present_flag[ i ]
            if (i < 6) {
              skipScalingList(16);
            } else {
              skipScalingList(64);
            }
          }
        }
      }
    }
    skipUEG(); // log2_max_frame_num_minus4
    var picOrderCntType = readUEG();
    if (picOrderCntType === 0) {
      readUEG(); // log2_max_pic_order_cnt_lsb_minus4
    } else if (picOrderCntType === 1) {
      skipBits(1); // delta_pic_order_always_zero_flag
      skipEG(); // offset_for_non_ref_pic
      skipEG(); // offset_for_top_to_bottom_field
      numRefFramesInPicOrderCntCycle = readUEG();
      for (i = 0; i < numRefFramesInPicOrderCntCycle; i += 1) {
        skipEG(); // offset_for_ref_frame[ i ]
      }
    }
    skipUEG(); // max_num_ref_frames
    skipBits(1); // gaps_in_frame_num_value_allowed_flag
    picWidthInMbsMinus1 = readUEG();
    picHeightInMapUnitsMinus1 = readUEG();
    frameMbsOnlyFlag = readBits(1);
    if (frameMbsOnlyFlag === 0) {
      skipBits(1); // mb_adaptive_frame_field_flag
    }
    skipBits(1); // direct_8x8_inference_flag
    if (readBoolean()) { // frame_cropping_flag
      frameCropLeftOffset = readUEG();
      frameCropRightOffset = readUEG();
      frameCropTopOffset = readUEG();
      frameCropBottomOffset = readUEG();
    }
    let pixelRatio = [1, 1];
    if (readBoolean()) {
      // vui_parameters_present_flag
      if (readBoolean()) {
        // aspect_ratio_info_present_flag
        const aspectRatioIdc = readUByte();
        switch (aspectRatioIdc) {
        case 1:
          pixelRatio = [1, 1];
          break;
        case 2:
          pixelRatio = [12, 11];
          break;
        case 3:
          pixelRatio = [10, 11];
          break;
        case 4:
          pixelRatio = [16, 11];
          break;
        case 5:
          pixelRatio = [40, 33];
          break;
        case 6:
          pixelRatio = [24, 11];
          break;
        case 7:
          pixelRatio = [20, 11];
          break;
        case 8:
          pixelRatio = [32, 11];
          break;
        case 9:
          pixelRatio = [80, 33];
          break;
        case 10:
          pixelRatio = [18, 11];
          break;
        case 11:
          pixelRatio = [15, 11];
          break;
        case 12:
          pixelRatio = [64, 33];
          break;
        case 13:
          pixelRatio = [160, 99];
          break;
        case 14:
          pixelRatio = [4, 3];
          break;
        case 15:
          pixelRatio = [3, 2];
          break;
        case 16:
          pixelRatio = [2, 1];
          break;
        case 255:
        {
          pixelRatio = [
            readUByte() << 8 | readUByte(),
            readUByte() << 8 | readUByte()
          ];
          break;
        }
        }
      }
    }
    return {
      width: Math.ceil((((picWidthInMbsMinus1 + 1) * 16) - frameCropLeftOffset * 2 - frameCropRightOffset * 2)),
      height: ((2 - frameMbsOnlyFlag) * (picHeightInMapUnitsMinus1 + 1) * 16) - ((
        frameMbsOnlyFlag ?
          2 :
          4) * (frameCropTopOffset + frameCropBottomOffset)),
      pixelRatio: pixelRatio
    };
  }


  info(type, ...args) {
    Log.OBJ[type](`[${this.CLASS_NAME}] ${args}`);
  }

  _skipLeadingZero() {
    var leadingZeroCount; // uint
    for (leadingZeroCount = 0; leadingZeroCount < this.bitsAvailable; leadingZeroCount += 1) {
      if (0 !== (this.codeword & (0x80000000 >>> leadingZeroCount))) {
        this.codeword <<= leadingZeroCount;
        this.bitsAvailable -= leadingZeroCount;
        return leadingZeroCount;
      }
    }

    this._fillCurrentWord();
    return leadingZeroCount + this._skipLeadingZero();
  }

  _fillCurrentWord() {
    let data = this.data;
    let bytesAvailable = this.bytesAvailable;
    let position = data.byteLength - bytesAvailable;
    let workingBytes = new Uint8Array(4);
    let avaliableBytes = Math.min(4, bytesAvailable);

    if (0 === avaliableBytes) {
      this.info('error', 'no bytes avaliable');
      return;
    }

    workingBytes.set(data.subarray(position, position + avaliableBytes));
    this.codeword = new DataView(workingBytes.buffer).getUint32(0);
    this.bitsAvailable = avaliableBytes * 8;
    this.bytesAvailable -= avaliableBytes;
  }

  _skipBits(count) {
    var skipBytes;
    if (this.bitsAvailable > count) {
      this.codeword <<= count;
      this.bitsAvailable -= count;
    } else {
      count -= this.bitsAvailable;
      skipBytes = count >> 3;
      count -= skipBytes >> 3;
      this.bytesAvailable -= skipBytes;
      this._fillCurrentWord();
      this.codeword <<= count;
      this.bitsAvailable -= count;
    }
    return skipBytes;
  }
}