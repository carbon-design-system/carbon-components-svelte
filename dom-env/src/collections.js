// NodeList, HTMLCollection, and friends.
//
// Live collections cache their items and refresh lazily when the version
// they were built against changes. Index properties (`list[0]`) are real
// own properties, re-synced on refresh, so holders that read indices after
// a mutation without touching `length`/`item()` first may see stale values.
// Callers almost always re-read `childNodes`/`children`, which refreshes.

import { INTERNAL, illegalConstructor, tag } from "./shared.js";

const INDEX_RE = /^(?:0|[1-9]\d*)$/;

/**
 * Live collections are Proxies so `list[0]` always reflects the current
 * tree, even when read before `length`/`item()` or after a mutation.
 */
function liveProxy(collection) {
  return new Proxy(collection, {
    get(target, prop, receiver) {
      if (typeof prop === "string" && INDEX_RE.test(prop))
        return target._refresh()[prop];
      if (typeof prop === "string" && target._wantsNames && !(prop in target)) {
        return target.namedItem(prop) ?? undefined;
      }
      const value = Reflect.get(target, prop, target);
      return typeof value === "function" && prop !== "constructor"
        ? value.bind(receiver === undefined ? target : target)
        : value;
    },
    has(target, prop) {
      if (typeof prop === "string" && INDEX_RE.test(prop))
        return Number(prop) < target._refresh().length;
      return prop in target;
    },
    ownKeys(target) {
      const keys = target._refresh().map((_, i) => String(i));
      return [
        ...keys,
        ...Reflect.ownKeys(target).filter(
          (k) => typeof k !== "string" || !INDEX_RE.test(k),
        ),
      ];
    },
    getOwnPropertyDescriptor(target, prop) {
      if (typeof prop === "string" && INDEX_RE.test(prop)) {
        const item = target._refresh()[prop];
        return item === undefined
          ? undefined
          : {
              value: item,
              writable: false,
              enumerable: true,
              configurable: true,
            };
      }
      return Reflect.getOwnPropertyDescriptor(target, prop);
    },
    set(target, prop, value) {
      if (typeof prop === "string" && INDEX_RE.test(prop)) return true;
      return Reflect.set(target, prop, value, target);
    },
  });
}

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
      this._items = src.items();
      this._version = src.version();
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
  return liveProxy(list);
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
      this._items = src.items();
      this._version = src.version();
    }
    return this._items;
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
  return liveProxy(c);
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
