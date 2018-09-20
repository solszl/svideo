import Component from "../core/Component";

/**
 *
 *
 * @export
 * @class Plugin
 * @extends {Component}
 * @author zhenliang.sun
 */
export default class Plugin extends Component {
  constructor(player) {
    super();
    this._player = player;
    this._type = "BASE_PLUGIN";
  }

  get player() {
    return this._player;
  }

  get type() {
    return this._type;
  }

  destroy() {

  }
}