export function debounce(func, wait) {
  let lastTime = null
  let timeout
  return function() {
    let context = this
    let now = new Date()
    // 判定不是一次抖动
    if (now - lastTime - wait > 0) {
      setTimeout(() => {
        func.apply(context, arguments)
      }, wait)
    } else {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      timeout = setTimeout(() => {
        func.apply(context, arguments)
      }, wait)
    }
    // 注意这里lastTime是上次的触发时间
    lastTime = now
  }
}

export function throttle(func, wait) {
  let lastTime = null
  let timeout
  return function() {
    let context = this
    let now = new Date()
    // 如果上次执行的时间和这次触发的时间大于一个执行周期，则执行
    if (now - lastTime - wait > 0) {
      // 如果之前有了定时任务则清除
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      func.apply(context, arguments)
      lastTime = now
    } else if (!timeout) {
      timeout = setTimeout(() => {
        // 改变执行上下文环境
        func.apply(context, arguments)
      }, wait)
    }
  }
}

/**
 * 方法混入
 *
 * @export
 * @param {*} target 混入目标
 * @param {*} Constructor 被混入的构造函数
 * @param {*} args 被混入的构造函数参数
 */
export function mixin(target, Constructor, ...args) {
  let source = new Constructor(...args)
  let names = Object.getOwnPropertyNames(Constructor.prototype)
  for (let name of names) {
    let val = source[name]
    if (typeof val === 'function' && name !== 'constructor') {
      target[name] = val.bind(source)
    }
  }
}
