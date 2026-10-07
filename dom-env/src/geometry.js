// DOMRect and friends. There's no layout, so elements report empty rects.

import { tag } from "./shared.js";

export class DOMRectReadOnly {
  constructor(x = 0, y = 0, width = 0, height = 0) {
    this._x = +x;
    this._y = +y;
    this._width = +width;
    this._height = +height;
  }
  static fromRect(other = {}) {
    return new this(other.x, other.y, other.width, other.height);
  }
  get x() {
    return this._x;
  }
  get y() {
    return this._y;
  }
  get width() {
    return this._width;
  }
  get height() {
    return this._height;
  }
  get top() {
    return Math.min(this._y, this._y + this._height);
  }
  get right() {
    return Math.max(this._x, this._x + this._width);
  }
  get bottom() {
    return Math.max(this._y, this._y + this._height);
  }
  get left() {
    return Math.min(this._x, this._x + this._width);
  }
  toJSON() {
    const { x, y, width, height, top, right, bottom, left } = this;
    return { x, y, width, height, top, right, bottom, left };
  }
}
tag(DOMRectReadOnly);

export class DOMRect extends DOMRectReadOnly {
  get x() {
    return this._x;
  }
  set x(v) {
    this._x = +v;
  }
  get y() {
    return this._y;
  }
  set y(v) {
    this._y = +v;
  }
  get width() {
    return this._width;
  }
  set width(v) {
    this._width = +v;
  }
  get height() {
    return this._height;
  }
  set height(v) {
    this._height = +v;
  }
}
tag(DOMRect);

export class DOMRectList {
  constructor(rects = []) {
    this._rects = rects;
    rects.forEach((r, i) => {
      this[i] = r;
    });
  }
  get length() {
    return this._rects.length;
  }
  item(i) {
    return this._rects[i] ?? null;
  }
  [Symbol.iterator]() {
    return this._rects[Symbol.iterator]();
  }
}
tag(DOMRectList);

export class DOMPointReadOnly {
  constructor(x = 0, y = 0, z = 0, w = 1) {
    this._x = +x;
    this._y = +y;
    this._z = +z;
    this._w = +w;
  }
  static fromPoint(p = {}) {
    return new this(p.x, p.y, p.z, p.w);
  }
  get x() {
    return this._x;
  }
  get y() {
    return this._y;
  }
  get z() {
    return this._z;
  }
  get w() {
    return this._w;
  }
  toJSON() {
    return { x: this._x, y: this._y, z: this._z, w: this._w };
  }
}
tag(DOMPointReadOnly);

export class DOMPoint extends DOMPointReadOnly {}
tag(DOMPoint);
