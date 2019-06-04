/**
 * 异常基类
 *
 * @export
 * @class Exception
 * @author zhenliang.sun
 */
export class Exception {
  constructor(msg) {
    this._msg = msg;
    this._type = this.constructor.name;
  }

  get type() {
    return this._type;
  }

  get message() {
    return this._msg;
  }

  toString() {
    return `[${this.type}] ${this.msg}`;
  }
}

export class IllegalStateException extends Exception {
  constructor(msg) {
    super(msg);
  }
}

export class InvalidArgumentException extends Exception {
  constructor(msg) {
    super(msg);
  }
}

export class NotImplementedException extends Exception {
  constructor(msg) {
    super(msg);
  }
}