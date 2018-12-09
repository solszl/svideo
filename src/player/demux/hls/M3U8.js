import EventEmitter from 'event-emitter';
import Log from '../../utils/Log';
import LoaderXHR from '../loader/LoaderXHR';
import LoaderFetch from '../loader/LoaderFetch';

/**
 *
 *
 * @export
 * @class M3U8
 * @author zhenliang.sun
 */
export default class M3U8 {
  constructor(url) {
    EventEmitter(this);
    this.init(url);
  }

  init(url) {

  }

  fetch(url) {
    let loader = new LoaderXHR();
    // let loader = new LoaderFetch();
    loader.url = url;
    loader.option = {
      responseType: 'text'
    };

    loader.open();
    loader.onComplete = this._m3u8LoadComplete.bind(this);
  }

  _m3u8LoadComplete(e) {
    console.log(e.content.length);
    Log.OBJ.info('M3U8 load complete');
    this.emit('ready');
  }
}