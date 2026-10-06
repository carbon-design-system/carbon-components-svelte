// NodeList, HTMLCollection, and friends.
//
// Live collections cache their items and refresh lazily when the version
// they were built against changes. Index properties (`list[0]`) are real
// own properties, re-synced on refresh, so holders that read indices after
// a mutation without touching `length`/`item()` first may see stale values.
// Callers almost always re-read `childNodes`/`children`, which refreshes.

import { INTERNAL, illegalConstructor, tag } from "./shared.js";

function syncIndices(list, items, oldLength) {
  const n = items.length;
  for (let i = 0; i < n; i++) {
    if (list[i] !== items[i]) {
      Object.defineProperty(list, i, {
        value: items[i],
        configurable: true,
        enumerable: true,
        writable: false,
      });
    }
  }
  for (let i = n; i < oldLength; i++) delete list[i];
}

export class NodeList {
  constructor(token) {
    if (token !== INTERNAL) illegalConstructor();
    this._items = [];
    this._source = null;
    this._version = -1;
  }
  _refresh() {
    const src = this._source;
    if (src && src.version() !== this._version) {
      const old = this._items.length;
      this._items = src.items();
      this._version = src.version();
      syncIndices(this, this._items, old);
    }
    return this._items;
  }
  get length() {
    return this._refresh().length;
  }
  item(index) {
    return this._refresh()[index >>> 0] ?? null;
  }
  forEach(callback, thisArg) {
    const items = this._refresh().slice();
    for (let i = 0; i < items.length; i++)
      callback.call(thisArg, items[i], i, this);
  }
  keys() {
    return this._refresh().slice().keys();
  }
  values() {
    return this._refresh().slice().values();
  }
  entries() {
    return this._refresh().slice().entries();
  }
  [Symbol.iterator]() {
    return this._refresh().slice()[Symbol.iterator]();
  }
}
tag(NodeList);

/** A NodeList over a fixed array (querySelectorAll, getElementsByName snapshot). */
export function staticNodeList(items) {
  const list = new NodeList(INTERNAL);
  list._items = items;
  syncIndices(list, items, 0);
  return list;
}

/** A live NodeList; `source` is `{ version(): number, items(): Node[] }`. */
export function liveNodeList(source) {
  const list = new NodeList(INTERNAL);
  list._source = source;
  return list;
}

export class HTMLCollection {
  constructor(token) {
    if (token !== INTERNAL) illegalConstructor();
    this._items = [];
    this._source = null;
    this._version = -1;
    this._named = null;
    this._wantsNames = false;
  }
  _refresh() {
    const src = this._source;
    if (src.version() !== this._version) {
      const old = this._items.length;
      this._items = src.items();
      this._version = src.version();
      syncIndices(this, this._items, old);
      // Named properties (`form.elements.email`) only where callers use them.
      if (this._wantsNames) this._syncNamed();
    }
    return this._items;
  }
  _syncNamed() {
    if (this._named) for (const k of this._named) delete this[k];
    this._named = null;
    for (const el of this._items) {
      for (const key of [el.getAttribute("id"), el.getAttribute("name")]) {
        if (!key || key in this || /^\d+$/.test(key)) continue;
        Object.defineProperty(this, key, {
          value: el,
          configurable: true,
          enumerable: false,
        });
        (this._named ??= []).push(key);
      }
    }
  }
  get length() {
    return this._refresh().length;
  }
  item(index) {
    return this._refresh()[index >>> 0] ?? null;
  }
  namedItem(name) {
    if (!name) return null;
    for (const el of this._refresh()) {
      if (el.getAttribute("id") === name || el.getAttribute("name") === name)
        return el;
    }
    return null;
  }
  [Symbol.iterator]() {
    return this._refresh().slice()[Symbol.iterator]();
  }
}
tag(HTMLCollection);

export function liveHTMLCollection(
  source,
  Ctor = HTMLCollection,
  wantsNames = false,
) {
  const c = new Ctor(INTERNAL);
  c._source = source;
  c._wantsNames = wantsNames;
  return c;
}

export class HTMLFormControlsCollection extends HTMLCollection {
  namedItem(name) {
    if (!name) return null;
    const matches = this._refresh().filter(
      (el) =>
        el.getAttribute("id") === name || el.getAttribute("name") === name,
    );
    if (matches.length === 0) return null;
    if (matches.length === 1) return matches[0];
    const list = new RadioNodeList(INTERNAL);
    list._items = matches;
    syncIndices(list, matches, 0);
    return list;
  }
}
tag(HTMLFormControlsCollection);

export class RadioNodeList extends NodeList {
  get value() {
    for (const el of this._items) {
      if (el.localName === "input" && el.type === "radio" && el.checked)
        return el.value;
    }
    return "";
  }
  set value(v) {
    for (const el of this._items) {
      if (
        el.localName === "input" &&
        el.type === "radio" &&
        el.value === String(v)
      ) {
        el.checked = true;
        return;
      }
    }
  }
}
tag(RadioNodeList);

export class HTMLOptionsCollection extends HTMLCollection {
  get length() {
    return this._refresh().length;
  }
  set length(n) {
    const select = this._select;
    const items = this._refresh();
    n >>>= 0;
    if (n < items.length) {
      for (let i = items.length - 1; i >= n; i--) items[i].remove();
    } else {
      for (let i = items.length; i < n; i++) {
        select.appendChild(select.ownerDocument.createElement("option"));
      }
    }
  }
  get selectedIndex() {
    return this._select.selectedIndex;
  }
  set selectedIndex(v) {
    this._select.selectedIndex = v;
  }
  add(element, before) {
    this._select.add(element, before);
  }
  remove(index) {
    this._refresh()[index]?.remove();
  }
}
tag(HTMLOptionsCollection);
