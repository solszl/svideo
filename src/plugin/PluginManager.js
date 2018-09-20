import Exception from "../error/Exception";
import IllegalStateException from "../error/IllegalStateException";
import Log from "../utils/Log";


/**
 * 
 *
 * @export
 * @class PluginManager
 * @author zhenliang.sun
 */
export default class PluginManager {
  constructor() {
    if (this._instance) {
      throw new Exception("plugin manager is singlton");
    }

    this._instance = this;
    this._plugins = [];
  }

  static get OBJ() {
    if (!this._instance) {
      this._instance = new PluginManager();
    }

    return this._instance;
  }


  /**
   *
   * 获取当前插件 实例列表
   * @readonly
   * @memberof PluginManager
   */
  get plugins() {
    return this._plugins;
  }


  /**
   *
   * 注册一个插件
   * @param {*} plugin
   * @memberof PluginManager
   */
  regPlugin(plugin) {
    let pluginWarpper = {
      type: plugin.type,
      plugin: plugin
    };

    let find = this._plugins.some(p => {
      return p.type === pluginWarpper.type;
    });

    if (find) {
      throw new IllegalStateException(`${plugin.type} had already registed`);
    }

    this._plugins.push(pluginWarpper);
  }


  /**
   *
   * 卸载插件， 根据实例还是根据type卸载，再说
   * @param {*} plugin
   * @returns
   * @memberof PluginManager
   */
  unregPlugin(plugin) {
    if (this._plugins.length === 0) {
      return;
    }

    let findIdx = -1;

    for (let i = 0; i < this._plugins.length; i++) {
      const p = this._plugins[i];
      if (p.type === plugin.type) {
        findIdx = i;
        break;
      }
    }

    if (findIdx === -1) {
      Log.OBJ.warn(`${plugin.type} hadn't registed`);
      return;
    }

    this._plugins.splice(findIdx, 1);
  }
}