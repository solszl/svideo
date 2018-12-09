import TagDemuxer from './TagDemuxer';
import FlvProbe from './FlvProbe';
import DataStore from './DataStore';
import Log from '../../../utils/Log';
import Buffer from '../../fmp4/Buffer';

export default class FlvParser {
  constructor() {
    // flv 探针
    this.flvProbe = new FlvProbe();
    // tag 解析器
    this.tagDemuxer = new TagDemuxer();
    this.tagDemuxer.bindEvents();
    // MP4 Remixer
    this.mp4Remixer = null;

    this.buffer = new Buffer();

    this.initialed = true;
  }

  destroy() {
    this.initialed = false;
  }

  setData(buffer) {
    if (undefined === buffer) {
      Log.OBJ.warn('传入的buffer是空');
      return;
    }

    try {
      this.buffer.write(new Uint8Array(buffer));
      let offset = this.flvProbe.getOffset(this.buffer.buffer);
      let tags = DataStore.OBJ.tags;
      if (tags.length) {
        if (this.initialed) {
          if (tags[0].tagType !== 18) {
            throw new Error('flv file without metadata tag');
          }

          let timeBase = DataStore.OBJ.timestampBase;
          let tagTime = tags[0].getTime();
          if (0 !== timeBase && tagTime === timeBase) {
            DataStore.OBJ.timestampBase = 0;
          }

          this.initialed = false;
        }

        this.tagDemuxer.resolveTags(tags);
      }
      this.buffer.buffer = this.buffer.buffer.slice(offset);
    } catch (e) {
      Log.OBJ.error(`load buffer error, msg:${e.message}`);
    }
  }

}