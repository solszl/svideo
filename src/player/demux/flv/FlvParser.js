import EventEmitter from 'event-emitter';
import Log from '../../../utils/Log';
import Buffer from '../../fmp4/Buffer';
import MP4Remixer from '../../remix/MP4Remixer';
import DataStore from './DataStore';
import FlvProbe from './FlvProbe';
import TagDemuxer from './TagDemuxer';

const NOOP = () => {};
export default class FlvParser {
  constructor() {
    EventEmitter(this);
    // flv 探针
    this.flvProbe = new FlvProbe();
    // tag 解析器
    this.tagDemuxer = new TagDemuxer();
    this.tagDemuxer.bindEvents();
    // MP4 Remixer
    this.mp4Remixer = new MP4Remixer();

    this.buffer = new Buffer();

    // this.handleDataReady = NOOP;
    // this.handleMediaInfoReady = NOOP;
    // this.handleMetaDataReady = NOOP;

    this.bindEvents();
    this.initialed = true;

    this.videoCount = 0;
    this.audioCount = 0;

    this._tempTimeBase = 0;
    this.sourceOpen = false;

    this._pendingFragments = [];
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

          // let timeBase = DataStore.OBJ.timestampBase;
          if (0 !== this._tempTimeBase && tags[0].getTime() === this._tempTimeBase) {
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

  bindEvents() {
    this.tagDemuxer.handleDataReady = this.handleDataReady.bind(this);
    this.tagDemuxer.handleMediaInfoReady = this.handleMediaInfoReady.bind(this);
    this.tagDemuxer.handleMetaDataReady = this.handleMetaDataReady.bind(this);
    this.tagDemuxer.bindEvents();

    this.mp4Remixer.handleMediaFragment = this.handleNewMediaFragment.bind(this);
    this.mp4Remixer.bindEvents();
  }

  unbindEvents() {

  }

  handleDataReady(audioTrack, videoTrack) {
    this.mp4Remixer.remix(audioTrack, videoTrack);
  }

  handleMediaInfoReady(mi) {
    const FTYP_MOOV = this.mp4Remixer.onMediaInfoReady(mi);
    if (!this.ftyp_moov) {
      this.ftyp_moov = FTYP_MOOV;
      this.emit('ready', FTYP_MOOV);
    }
  }

  handleMetaDataReady(type, meta) {
    this.mp4Remixer.onMetaDataReady(type, meta);
  }

  handleNewMediaFragment(fragment) {
    // if (fragment.type === 'video') {
    //   this.videoCount += 1;
    // } else if (fragment.type === 'audio') {
    //   this.audioCount += 1;
    // } else {
    //   console.log('shit');
    // }
    // console.log(`完成解析${fragment.type}`, this.videoCount, this.audioCount);

    this.pendingFragments.push(fragment);
    const {
      randomAccessPoints
    } = fragment.fragment;

    if (randomAccessPoints && randomAccessPoints.length) {
      randomAccessPoints.forEach(rap => {
        this.bufferKeyframes.add(rap.dts);
      });
    }

    if (!this.sourceOpen) {
      return;
    }

    if (this.hasPendingFragments) {
      const frag = this._pendingFragments.shift();
      if (!this.handleMediaFragment(frag)) {
        this.pendingFragments.unshift(frag);
      } else {
        console.log('ok');
      }
    }
  }

  get pendingFragments() {
    return this._pendingFragments;
  }

  get hasPendingFragments() {
    return this._pendingFragments.length !== 0;
  }
}