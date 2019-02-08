import EventHandler from '../event-handler';
import Event from '../events';
import Log from '../../../utils/Log';
import Model from '../../../core/Model';


/**
 *
 *
 * @class VhallController
 * @extends {EventHandler}
 * @author zhenliang.sun
 */
class VhallController extends EventHandler {
  constructor(hls) {
    super(hls,
      Event.FRAG_LOADED,
      Event.ERROR);

    this.CLASS_NAME = this.constructor.name;
    this.info('info', '注册vhall controller');
  }

  /**
   * TS 加载完成
   *
   * @param {*} data
   * @memberof VhallController
   */
  onFragLoaded(data) {
    const frag = data.frag;
    if (!frag) {
      return;
    }
    this.info('info', `编号：${frag.sn}加载完成,url:${frag.relurl},size:${frag.loaded}, duration:${frag.duration}`);
    Model.OBJ.downloadSize += frag.loaded;
  }

  /**
   * 统一错误消息捕获
   *
   * @param {*} e {type:'', details:'', fatal:'', reason:'', frag:null}
   * @memberof VhallController
   */
  onError(e) {
    let {
      type,
      details
    } = e;

    this.info('error', JSON.stringify({
      type,
      details
    }));
  }

  destroy() {
    EventHandler.prototype.destroy.call(this);
  }

  info(type, ...args) {
    Log.OBJ[type](`[${this.CLASS_NAME}] ${args}`);
  }
}

export default VhallController;