import AbstractDemuxer from './../demux/AbstractDemuxer';
import Log from './../../utils/Log';
/**
 * 视频数据解析器
 *
 * @export
 * @class VideoDemuxer
 * @extends {AbstractDemuxer}
 * @author zhenliang.sun
 */
export default class VideoDemuxer extends AbstractDemuxer {
  constructor() {
    super();

    this.currentTag = null;
    this.data = new Uint8Array(0);
    this.readOffset = 0;
  }

  reset() {
    this.currentTag = null;
    this.data = new Uint8Array(0);
    this.readOffset = 0;
  }

  resolve(tag) {
    super.resolve(tag);

    this.data = tag.body;
    this.currentTag = tag;

    const firstUI8 = this.readData(1)[0];
    const frameType = (firstUI8 & 0xF0) >>> 4;
    const codecId = firstUI8 & 0x0F;

    if (7 !== codecId) {
      Log.OBJ.warn(`unsupported codecId ${codecId}`);
      return;
    }

    this._parseAVCPacket(frameType);

    this.reset();
  }

  readData(num) {
    const {
      data,
      readOffset
    } = this;

    if (this.dataLength > readOffset + num) {
      this.readOffset += num;
      return data.slice(readOffset, num);
    }

    return [];
  }

  /**
   * tag body 长度
   *
   * @readonly
   * @memberof VideoDemuxer
   * @returns tag.body.length
   */
  get dataLength() {
    return this.data.length;
  }

  /**
   * 返回该tag中，未读取的长度
   *
   * @readonly
   * @memberof VideoDemuxer
   * @returns tag.body.length - readOffset
   */
  get unreadLength() {
    return this.data.length - this.readOffset;
  }


  // #region private methods
  _parseAVCPacket(frameType) {
    if (4 > this.unreadLength) {
      Log.OBJ.error('Invalid Avc Tag');
    }
  }
  // #endregion
}