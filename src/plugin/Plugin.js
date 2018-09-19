import Component from "../core/Component";

export default class Plugin extends Component {
  constructor(type, player) {
    super();
    this._player = player;
    this._type = type;
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