import EventEmitter from 'event-emitter';
import Log from '../../../utils/Log';
import DataStore from './DataStore';
import Tag from './Tag';
import Buffer from '../../fmp4/Buffer';
/**
 * FLV 数据解析器
 *
 * @export
 * @class FlvProbe
 * @author zhenliang.sun
 */
export default class FlvProbe {
  constructor() {
    EventEmitter(this);
    this.stop = false;
    this.initialHeaderFlag = true;
    this.streamPosition = 0;

    this.offset = 0;
    this.index = 0;
    this.temp_buffer = null;
    this.dataLen = 0;
  }

  destroy() {
    this.stop = false;
    this.initialHeaderFlag = true;
    this.streamPosition = 0;

    this.offset = 0;
    this.index = 0;
    this.temp_buffer = null;
    this.dataLen = 0;
  }

  /**
   * 判断数据是否是FLV 数据流
   *
   * @static
   * @param {*} data
   * @returns 返回数据的前三个字符组成的是否是 'FLV'
   * @memberof FlvProbe
   */
  static isFlvHead(data) {
    let header = [data[0], data[1], data[2]];
    return String.fromCharCode.apply(String, header) === 'FLV';
  }

  /**
   * 获取流发偏移量
   *
   * @param {*} buffer
   * @returns
   * @memberof FlvProbe
   */
  getOffset(buffer) {
    // Log.OBJ.info(`获取buffer 偏移 ${buffer.length}`);
    this.stop = false;
    this.index = 0;
    this.offset = 0;
    this.temp_buffer = buffer;
    const tempU8a = buffer;
    this.dataLen = buffer.length;

    if (!this.initialHeaderFlag) {
      return this.parseData();
    } else if (tempU8a.length > 13 && FlvProbe.isFlvHead(tempU8a)) {
      this.parseHead();
      this.readData(9); // skip header
      this.readData(4); // skip next head size 
      this.parseData();
      this.initialHeaderFlag = false;
      this.streamPosition += this.offset;
      return this.offset;
    } else {
      return this.offset;
    }
  }

  /**
   * 解析Header, 判断是否包含音频数据、视频数据
   *
   * @returns
   * @memberof FlvProbe
   */
  parseHead() {
    const result = {
      match: false
    };

    if (1 !== this.temp_buffer[3]) {
      return result;
    }

    const flag = this.temp_buffer[4];
    const hasAudio = ((flag & 4) >>> 2) !== 0;
    const hasVideo = (flag & 1) !== 0;
    if (!hasAudio && !hasVideo) {
      return result;
    }

    DataStore.OBJ.hasAudio = hasAudio;
    DataStore.OBJ.hasVideo = hasVideo;
  }

  /**
   * 解析数据。返回偏移长度
   *
   * @memberof FlvProbe
   */
  parseData() {
    const len = this.temp_buffer.length;
    // 不停的解析数据
    while (this.index < len && !this.stop) {
      this.offset = this.index;

      const tag = new Tag();

      if (this.unreadLength >= 11) {
        tag.position = this.streamPosition + this.offset;
        tag.tagType = this.readData(1)[0];
        tag.bodySize = this.readData(3);
        tag.timestamp = this.readData(4);
        tag.streamID = this.readData(3);

        console.log(tag);
      } else {
        this.stop = true;
        continue;
      }

      if (this.unreadLength >= this.getBodySize(tag.bodySize) + 4) {
        tag.body = this.readData(this.getBodySize(tag.bodySize));
        tag.tagSize = this.readData(4);
        let tags = DataStore.OBJ.tags;
        let hasVideo = DataStore.OBJ.hasVideo;
        let hasAudio = DataStore.OBJ.hasAudio;
        switch (tag.tagType) {
        case 8:
          hasAudio && tags.push(tag);
          break;
        case 9:
          hasVideo && tags.push(tag);
          break;
        case 18:
          tags.push(tag);
          break;
        default:
          Log.OBJ.warn(`unsupported tagType: ${tag.tagType}`);
          break;
        }
      } else {
        this.stop = true;
        continue;
      }

      this.offset = this.index;
    }

    this.streamPosition += this.offset;
    this.temp_buffer = null;
    return this.offset;
  }

  getBodySize(arr) {
    return Buffer.readAsInt(arr);
  }

  readData(len) {
    const _index = this.index;
    this.index += len;
    return this.temp_buffer.slice(_index, _index + len);
  }

  get unreadLength() {
    return this.dataLen - this.index;
  }
}