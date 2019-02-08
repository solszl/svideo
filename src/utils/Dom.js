import Log from './Log';

/**
 * 创建一个为 tagName 标签 element
 *
 * @export
 * @param {string} [tagName="div"]
 * @param {*} [properties={}]
 * @param {*} [attributes={}]
 * @returns element
 */
export function createElement(tagName = 'div', properties = {}, attributes = {}) {
  const el = document.createElement(tagName);
  Object.getOwnPropertyNames(properties).forEach(prop => {
    const val = properties[prop];
    el[prop] = val;
  });
  Object.getOwnPropertyNames(attributes).forEach(attr => {
    el.setAttribute(attr, attributes[attr]);
  });

  return el;
}

export function appendChild(parentId, child) {
  const parent = document.getElementById(parentId);
  if (!parent) {
    Log.OBJ.error(`doesn't exist parent element id: ${parentId}`);
    return;
  }

  if (!child) {
    Log.OBJ.error('doesn\'t exist child');
    return;
  }

  parent.appendChild(child);
}

/**
 * 判断某个元素是否包含某一个样式类
 *
 * @export
 * @param {*} el
 * @param {*} clazzName
 * @returns 返回是否包含样式类
 */
export function hasClass(el, clazzName) {
  if (el.classList) {
    return el.classList.contains(clazzName);
  }
  const reg = new RegExp('(^|\\s)' + clazzName + '($|\\s)');
  return reg.test(el.className);
}

/**
 * 为某一个元素添加一个样式类
 *
 * @export
 * @param {*} el
 * @param {*} clazz
 * @returns 返回添加样式后的元素
 */
export function addClass(el, clazz) {
  if (el.classList) {
    el.classList.add(clazz);
  } else if (!hasClass(el, clazz)) {
    el.className = (el.className + ' ' + clazz).trim();
  }
  return el;
}

/**
 * 为某一个元素移除一个样式
 *
 * @export
 * @param {*} el
 * @param {*} clazz
 * @returns 返回移除样式后的元素
 */
export function removeClass(el, clazz) {
  if (el.classList) {
    el.classList.remove(clazz);
  } else {
    el.className = el.className.split(/\s+/).filter(c => {
      return c !== clazz;
    }).join(' ');
  }

  return el;
}

/**
 *某一个元素的某一个属性进行开关
 *
 * @export
 * @param {*} el
 * @param {*} clazzName
 * @param {*} predicate 可选参数为， 函数或者布尔类型，当传入函数的时候，则为一个回调，回调返回一个布尔类型
 * @returns toggle 元素的 某一个样式
 */
export function toggleClass(el, clazzName, predicate) {
  const has = hasClass(el, clazzName);
  // 回调
  if (typeof predicate === 'function') {
    predicate = predicate(el, clazzName);
  }

  // 如果是布尔值
  if (typeof predicate === 'boolean') {
    predicate = !has;
  }

  if (predicate === has) {
    return;
  }

  if (predicate) {
    addClass(el, clazzName);
  } else {
    removeClass(el, clazzName);
  }

  return el;
}

/**
 * 页面元素自己从父容器中移除
 *
 * @export
 * @param {*} el
 * @param {*} [callBK=null]
 */
export function removeFromParent(el, callBK = null) {
  if (!el) {
    return;
  }

  if (el.parentNode) {
    el.parentNode.removeChild(el);
  }

  callBK && callBK();
}