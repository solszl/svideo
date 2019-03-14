const debounce = function (func, wait) {
  let lastTime = null
  let timeout
  return function () {
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

const throttle = function (func, wait) {
  let lastTime = null
  let timeout
  return function () {
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

exports.debounce = debounce
exports.throttle = throttle
