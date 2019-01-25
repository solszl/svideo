/**
 *
 *
 * @export
 * @class Chain
 * @author zhenliang.sun
 */
class Chain {
  constructor() {
    this.nextChain = null;
  }

  setNext(chain) {
    this.nextChain = chain;
    return this.nextChain;
  }

  execute(obj) {

  }
}

class ChainSame extends Chain {
  execute(obj) {

  }
}

class Chain720p extends Chain {
  execute(obj) {

  }
}

class Chain480p extends Chain {
  execute(obj) {

  }
}

class Chain360p extends Chain {
  execute(obj) {

  }
}


module.exports = {
  ChainSame,
  Chain720p,
  Chain480p,
  Chain360p
};