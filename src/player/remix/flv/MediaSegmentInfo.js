export class MediaSample {
  constructor(info) {
    let _default = {
      dts: null,
      pts: null,
      duration: null,
      position: null,
      isRAP: false, // is Random access point
      originDts: null,
    };

    if (!info || typeof info !== 'object') {
      return _default;
    }

    let sample = Object.assign({}, _default, info);
    Object.entries(sample).forEach(([k, v]) => {
      this[k] = v;
    });
  }
}

export class MediaSegment {
  constructor() {
    this.startDts = -1;
    this.endDts = -1;
    this.startPts = -1;
    this.endPts = -1;

    this.originStartDts = -1;
    this.originStartPts = -1;
    this.randomAccessPoints = [];
    this.firstSample = null;
    this.lastSample = null;
  }

  addRAP(sample) {
    sample.isRAP = true;
    this.randomAccessPoints.push(sample);
  }
}

export class MediaSegmentList {
  constructor(type) {
    this._type = type;
    this._list = [];
    this._lastAppendLocation = -1; //  for cache last operate item index

    Object.defineProperties(this, {
      'length': {
        get() {
          return this._list.length;
        }
      },
      'type': {
        get() {
          return this._type;
        }
      }
    });
  }

  /**
   * 返回列表是否为空
   *
   * @returns
   * @memberof MediaSegmentList
   */
  isEmpty() {
    return this.length === 0;
  }

  clear() {
    this._list = [];
    this._lastAppendLocation = -1;
  }

  append(segment) {
    let list = this._list;
    let lastAppendIndex = this._lastAppendLocation;
    let insertIdx = -1;

    if (lastAppendIndex !== -1 &&
      lastAppendIndex < list.length &&
      segment.originStartDts >= list[lastAppendIndex].lastSample.originDts &&
      (lastAppendIndex === list.length - 1 ||
        (lastAppendIndex < list.length - 1 &&
          segment.originStartDts < list[lastAppendIndex + 1].originStartDts))) {
      insertIdx = lastAppendIndex + 1; // use cached location idx
    } else {
      if (list.length > 0) {
        insertIdx = this._binarySearchNearestSegmentBefore(segment.originStartDts) + 1;
      }
    }

    this._lastAppendLocation = insertIdx;
    this._list.splice(insertIdx, 0, segment);
  }

  _binarySearchNearestSegmentBefore(beginDts) {
    let list = this._list;

    if (list.length === 0) {
      return -2;
    }

    let last = list.length - 1;
    let mid = 0;
    let lbound = 0;
    let ubound = last;

    let idx = 0;

    if (beginDts < list[0].originDts) {
      idx = -1;
      return idx;
    }

    while (lbound < ubound) {
      mid = lbound + (ubound - lbound >> 0);
      if (mid === last ||
        beginDts > list[mid].lastSample.originDts &&
        beginDts < list[mid + 1].originDts) {
        idx = mid;
        break;
      } else if (list[mid].originDts < beginDts) {
        lbound = mid + 1;
      } else {
        ubound = mid - 1;
      }
    }

    return idx;
  }

}