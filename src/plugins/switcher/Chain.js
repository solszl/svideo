import { PlayerEvent } from './../../PlayerEvents'
import { PropertyPriority } from '../../core/Constant'
/**
 * 卡顿切线责任链
 *
 * @export
 * @class Chain
 * @author zhenliang.sun
 */
class Chain {
  constructor(player) {
    this.player = player
    this.allDefList = this.player.allDefinitionList
    this.currentDef = this.player.currentDefinition
    this.currentDefList = this.player.currentDefinitionList
    this.currentDefListIndex = this.player.currentDefinitionListIndex
    this.nextChain = null
    this.polling = []
  }

  destroy() {
    while (this.nextChain) {
      this.nextChain.destroy()
      this.nextChain = null
    }
  }

  setNext(chain) {
    this.nextChain = chain
    return this.nextChain
  }

  execute(polling) {
    this.polling = polling
  }

  /**
   * 根据key找到当前清晰度列表中对应的清晰度实体
   *
   * @param {*} key 传入的清晰度 'same','720p'等
   * @returns 如果找到了，返回对应的实体，否则返回null
   * @memberof Chain
   */
  findDefinitionByDefKey(key) {
    this.currentDefList = this.player.currentDefinitionList
    if (this.currentDefList === null || this.currentDefList.length === 0) {
      return null
    }

    let result = this.currentDefList.filter(item => {
      return item.def === key
    })

    return result.length > 0 ? result[0] : null
  }

  findNextDef(key) {
    if (this.polling.indexOf(key) > -1) {
      return this.nextChain && this.nextChain.execute(this.polling)
    } else {
      this.polling.push(key)
      let def = this.findDefinitionByDefKey(key)
      if (def) {
        return def
      } else {
        return this.nextChain && this.nextChain.execute(this.polling)
      }
    }
  }
}

export class ChainSame extends Chain {
  execute(polling) {
    super.execute(polling)
    // 如果没遍历过原画， 返回原画清晰度，否则调度下一个清晰度
    return this.findNextDef('same')
  }
}

export class Chain720p extends Chain {
  execute(polling) {
    super.execute(polling)
    return this.findNextDef('720p')
  }
}

export class Chain480p extends Chain {
  execute(polling) {
    super.execute(polling)
    return this.findNextDef('480p')
  }
}

export class Chain360p extends Chain {
  constructor(player, cbk = null) {
    super(player)
    this._cbk = cbk // 加这个回调是因为外面传进来的轮询数组变成值类型了，并不是引用类型，无法内部修改外部同样修改
  }
  execute(polling) {
    super.execute(polling)
    const defKey = '360p'
    if (polling.indexOf(defKey) > -1) {
      // 360 都遍历过了，还是不行， 那就换条线路了，  currentDefListIndex += 1; 然后再从原画来一遍。如果就一条线路。。 那就不换线路，从原画接着来
      this._cbk && this._cbk()
      return this.changeDefList()
    } else {
      polling.push(defKey)
      let def = this.findDefinitionByDefKey(defKey)
      if (def) {
        this.player.currentDefinition = def
        return def
      } else {
        this._cbk && this._cbk()
        return this.changeDefList()
      }
    }
  }

  changeDefList() {
    let allListCount = this.allDefList.length
    // 如果只有一条线路的话，就在这条线路里循环吧,如果大于一条，就先切线
    if (allListCount !== 1) {
      let idx = this.currentDefListIndex
      idx += 1
      idx %= allListCount
      this.currentDefListIndex = idx
      this.currentDefList = this.allDefList[idx]
      this.player.currentDefinitionListIndex = idx
      // sort
      this.currentDefList = this.currentDefList.sort((a, b) => PropertyPriority[a.def] - PropertyPriority[b.def])
      this.player.currentDefinitionList = this.currentDefList
      // 派发清晰度列表更新事件
      this.player.emit2All(PlayerEvent.DEFINITION_LIST_CHANGED)
    }

    this.polling = []
    return this.nextChain && this.nextChain.execute(this.polling)
  }

  destroy() {
    if (this.nextChain) {
      this.nextChain = null
    }
  }
}
