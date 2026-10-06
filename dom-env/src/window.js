// Turns a global object into a browser-like window: prototype chain,
// document, location/history/navigator/storage, timers that need a frame
// clock, and every interface constructor.

import { getComputedStyle } from "./css.js";
import { createHTMLDocument } from "./document.js";
import {
  dispatch,
  ErrorEvent,
  Event,
  EventTarget,
  fire,
  HashChangeEvent,
  hooks,
  PopStateEvent,
  StorageEvent,
} from "./events.js";
import { current } from "./node.js";
import { INTERNAL, illegalConstructor, str, tag } from "./shared.js";

// --- Storage --------------------------------------------------------------------------

export class Storage {
  constructor(token) {
    if (token !== INTERNAL) illegalConstructor();
  }
  get length() {
    return storageMap(this).size;
  }
  key(i) {
    return [...storageMap(this).keys()][i] ?? null;
  }
  getItem(key) {
    return storageMap(this).get(str(key)) ?? null;
  }
  setItem(key, value) {
    storageMap(this).set(str(key), str(value));
  }
  removeItem(key) {
    storageMap(this).delete(str(key));
  }
  clear() {
    storageMap(this).clear();
  }
}
tag(Storage);

const storageData = new WeakMap();
function storageMap(s) {
  return storageData.get(s);
}

function createStorage() {
  const target = new Storage(INTERNAL);
  const map = new Map();
  const proxy = new Proxy(target, {
    get(t, prop, receiver) {
      if (typeof prop === "symbol" || prop in Storage.prototype || prop in t)
        return Reflect.get(t, prop, receiver === proxy ? t : receiver);
      return map.has(prop) ? map.get(prop) : undefined;
    },
    set(t, prop, value) {
      if (typeof prop === "symbol" || prop in Storage.prototype)
        return Reflect.set(t, prop, value);
      map.set(prop, str(value));
      return true;
    },
    deleteProperty(t, prop) {
      if (typeof prop === "symbol") return Reflect.deleteProperty(t, prop);
      map.delete(prop);
      return true;
    },
    has(t, prop) {
      return (typeof prop === "string" && map.has(prop)) || prop in t;
    },
    ownKeys() {
      return [...map.keys()];
    },
    getOwnPropertyDescriptor(t, prop) {
      if (typeof prop === "string" && map.has(prop)) {
        return {
          value: map.get(prop),
          writable: true,
          enumerable: true,
          configurable: true,
        };
      }
      return Reflect.getOwnPropertyDescriptor(t, prop);
    },
  });
  storageData.set(target, map);
  storageData.set(proxy, map);
  return proxy;
}

// --- Location and history ------------------------------------------------------------------

export class Location {
  constructor(token, win) {
    if (token !== INTERNAL) illegalConstructor();
    this._win = win;
  }
  _url() {
    return new URL(this._win.document._url);
  }
  get href() {
    return this._win.document._url;
  }
  set href(v) {
    this.assign(v);
  }
  assign(v) {
    navigate(this._win, str(v));
  }
  replace(v) {
    navigate(this._win, str(v));
  }
  reload() {}
  toString() {
    return this.href;
  }
  get ancestorOrigins() {
    return [];
  }
}
for (const part of [
  "protocol",
  "host",
  "hostname",
  "port",
  "pathname",
  "search",
  "hash",
  "origin",
]) {
  Object.defineProperty(Location.prototype, part, {
    get() {
      return this._url()[part];
    },
    set(v) {
      if (part === "origin") return;
      const url = this._url();
      url[part] = str(v);
      navigate(this._win, url.href);
    },
    configurable: true,
    enumerable: true,
  });
}
tag(Location);

function navigate(win, href) {
  const doc = win.document;
  let next;
  try {
    next = new URL(href, doc.baseURI);
  } catch {
    return;
  }
  const prev = new URL(doc._url);
  const sameDoc =
    next.origin === prev.origin &&
    next.pathname === prev.pathname &&
    next.search === prev.search;
  if (!sameDoc) return; // Cross-document navigation isn't implemented (as in jsdom).
  if (next.hash === prev.hash && next.href === prev.href) return;
  doc._url = next.href;
  if (next.hash !== prev.hash) {
    const timers = win.__realTimers;
    timers.setTimeout(() => {
      fire(
        win,
        "hashchange",
        { oldURL: prev.href, newURL: next.href },
        HashChangeEvent,
      );
    }, 0);
  }
}

export class History {
  constructor(token, win) {
    if (token !== INTERNAL) illegalConstructor();
    this._win = win;
    this._entries = [{ state: null, url: null }];
    this._index = 0;
  }
  get length() {
    return this._entries.length;
  }
  get state() {
    return this._entries[this._index].state;
  }
  get scrollRestoration() {
    return "auto";
  }
  set scrollRestoration(_v) {}
  _setURL(url) {
    if (url === undefined || url === null) return;
    const doc = this._win.document;
    doc._url = new URL(str(url), doc.baseURI).href;
  }
  pushState(state, _title, url) {
    this._entries.length = this._index + 1;
    this._setURL(url);
    this._entries.push({
      state: structuredClone(state),
      url: this._win.document._url,
    });
    this._index++;
  }
  replaceState(state, _title, url) {
    this._setURL(url);
    this._entries[this._index] = {
      state: structuredClone(state),
      url: this._win.document._url,
    };
  }
  go(delta = 0) {
    const i = this._index + delta;
    if (delta === 0 || i < 0 || i >= this._entries.length) return;
    this._index = i;
    const entry = this._entries[i];
    if (entry.url) this._win.document._url = entry.url;
    this._win.__realTimers.setTimeout(() => {
      fire(this._win, "popstate", { state: entry.state }, PopStateEvent);
    }, 0);
  }
  back() {
    this.go(-1);
  }
  forward() {
    this.go(1);
  }
}
tag(History);

export class Navigator {
  constructor(token) {
    if (token !== INTERNAL) illegalConstructor();
  }
  get userAgent() {
    return "Mozilla/5.0 (darwin) AppleWebKit/537.36 (KHTML, like Gecko) dom-env";
  }
  get appName() {
    return "Netscape";
  }
  get appVersion() {
    return "5.0";
  }
  get platform() {
    return "";
  }
  get product() {
    return "Gecko";
  }
  get vendor() {
    return "Apple Computer, Inc.";
  }
  get language() {
    return "en-US";
  }
  get languages() {
    return ["en-US", "en"];
  }
  get onLine() {
    return true;
  }
  get cookieEnabled() {
    return true;
  }
  get hardwareConcurrency() {
    return 4;
  }
  get maxTouchPoints() {
    return 0;
  }
  get webdriver() {
    return false;
  }
  javaEnabled() {
    return false;
  }
}
tag(Navigator);

export class Screen {
  get width() {
    return 0;
  }
  get height() {
    return 0;
  }
  get availWidth() {
    return 0;
  }
  get availHeight() {
    return 0;
  }
  get colorDepth() {
    return 24;
  }
  get pixelDepth() {
    return 24;
  }
}
tag(Screen);

// --- Window -------------------------------------------------------------------------------------

export class Window extends EventTarget {
  constructor(token) {
    if (token !== INTERNAL) illegalConstructor();
    super();
  }
}
tag(Window);

const WINDOW_METHODS = {
  getComputedStyle(el, pseudo) {
    return getComputedStyle(el, pseudo);
  },
  getSelection() {
    return this.document.getSelection();
  },
  requestAnimationFrame(callback) {
    return requestFrame(this, callback);
  },
  cancelAnimationFrame(handle) {
    this.__frameCallbacks?.delete(handle);
  },
  alert() {},
  confirm() {
    return false;
  },
  prompt() {
    return null;
  },
  print() {},
  open() {
    return null;
  },
  close() {},
  stop() {},
  focus() {},
  blur() {},
  moveBy() {},
  moveTo() {},
  resizeBy() {},
  resizeTo() {},
  scroll(x, y) {
    scrollWindow(this, x, y, false);
  },
  scrollTo(x, y) {
    scrollWindow(this, x, y, false);
  },
  scrollBy(x, y) {
    scrollWindow(this, x, y, true);
  },
  postMessage(message, targetOrigin) {
    this.__realTimers.setTimeout(() => {
      const event = new this.MessageEvent("message", {
        data: message,
        origin: this.location.origin,
        source: this,
      });
      dispatch(this, event);
    }, 0);
    void targetOrigin;
  },
  reportError(error) {
    reportException(this, error);
  },
};

function scrollWindow(win, x, y, relative) {
  let left = x;
  let top = y;
  if (x !== null && typeof x === "object") {
    left = x.left;
    top = x.top;
  }
  const nx = Number(left ?? (relative ? 0 : win.__scrollX)) || 0;
  const ny = Number(top ?? (relative ? 0 : win.__scrollY)) || 0;
  win.__scrollX = relative ? win.__scrollX + nx : nx;
  win.__scrollY = relative ? win.__scrollY + ny : ny;
}

function requestFrame(win, callback) {
  if (typeof callback !== "function") {
    throw new TypeError(
      "Failed to execute 'requestAnimationFrame' on 'Window': parameter 1 is not of type 'Function'.",
    );
  }
  const callbacks = (win.__frameCallbacks ??= new Map());
  const id = ++win.__frameId;
  callbacks.set(id, callback);
  if (!win.__frameScheduled) {
    win.__frameScheduled = true;
    // Real timers, so fake timers don't stall frames (matches jsdom).
    win.__realTimers.setTimeout(() => {
      win.__frameScheduled = false;
      const now = win.performance.now();
      const batch = [...callbacks];
      callbacks.clear();
      for (const [, cb] of batch) {
        try {
          cb(now);
        } catch (error) {
          reportException(win, error);
        }
      }
    }, 1000 / 60);
  }
  return id;
}

function reportException(win, error) {
  const listeners = win._listeners?.get("error")?.length ?? 0;
  const event = new ErrorEvent("error", {
    cancelable: true,
    error,
    message: error?.message ?? String(error),
  });
  event._trusted = true;
  let handled = false;
  if (listeners > 0 || typeof win.onerror === "function") {
    handled = !dispatch(win, event);
    if (listeners > 0 && !handled) handled = false;
  }
  if (!handled) {
    if (typeof win.__domEnvUncaught === "function") win.__domEnvUncaught(error);
    else win.console?.error?.(error);
  }
}

// Event handler IDL attributes (`onclick = fn`).
const HANDLER_EVENTS =
  `abort animationcancel animationend animationiteration animationstart auxclick beforeinput blur cancel canplay
canplaythrough change click close contextmenu copy cuechange cut dblclick drag dragend dragenter dragleave dragover dragstart
drop durationchange emptied ended error focus focusin focusout formdata input invalid keydown keypress keyup load loadeddata
loadedmetadata loadstart mousedown mouseenter mouseleave mousemove mouseout mouseover mouseup paste pause play playing
pointercancel pointerdown pointerenter pointerleave pointermove pointerout pointerover pointerup progress ratechange reset
resize scroll scrollend securitypolicyviolation seeked seeking select selectionchange selectstart slotchange stalled submit
suspend timeupdate toggle touchcancel touchend touchmove touchstart transitioncancel transitionend transitionrun
transitionstart volumechange waiting wheel`
    .split(/\s+/)
    .filter(Boolean);
const WINDOW_EVENTS =
  "afterprint beforeprint beforeunload hashchange languagechange message messageerror offline online pagehide pageshow popstate rejectionhandled storage unhandledrejection unload".split(
    " ",
  );

export function defineEventHandlers(proto, names) {
  for (const type of names) {
    const prop = "on" + type;
    if (Object.hasOwn(proto, prop)) continue;
    Object.defineProperty(proto, prop, {
      get() {
        return this._handlers?.get(type)?.fn ?? null;
      },
      set(fn) {
        const handlers = (this._handlers ??= new Map());
        let entry = handlers.get(type);
        if (!entry) {
          entry = { fn: null };
          entry.listener = (event) => {
            const h = entry.fn;
            if (typeof h !== "function") return;
            const result = h.call(this, event);
            if (result === false && type !== "mouseover")
              event.preventDefault();
          };
          handlers.set(type, entry);
          EventTarget.prototype.addEventListener.call(
            this,
            type,
            entry.listener,
          );
        }
        entry.fn =
          typeof fn === "function" || (fn && typeof fn === "object")
            ? fn
            : null;
      },
      configurable: true,
      enumerable: true,
    });
  }
}

export { HANDLER_EVENTS, WINDOW_EVENTS };

/** CSS namespace object. */
export const CSSNamespace = {
  escape(value) {
    const s = str(value);
    let out = "";
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      if (c === 0) out += "�";
      else if (
        (c >= 1 && c <= 31) ||
        c === 127 ||
        (i === 0 && c >= 48 && c <= 57) ||
        (i === 1 && c >= 48 && c <= 57 && s.charCodeAt(0) === 45)
      ) {
        out += "\\" + c.toString(16) + " ";
      } else if (i === 0 && c === 45 && s.length === 1) out += "\\" + s[i];
      else if (
        c >= 128 ||
        c === 45 ||
        c === 95 ||
        (c >= 48 && c <= 57) ||
        (c >= 65 && c <= 90) ||
        (c >= 97 && c <= 122)
      )
        out += s[i];
      else out += "\\" + s[i];
    }
    return out;
  },
  supports() {
    return false;
  },
};

class CustomElementRegistry {
  constructor() {
    this._defs = new Map();
    this._waiting = new Map();
  }
  define(name, ctor) {
    if (this._defs.has(name))
      throw new DOMException(
        `'${name}' has already been defined.`,
        "NotSupportedError",
      );
    this._defs.set(name, ctor);
    this._waiting.get(name)?.(ctor);
  }
  get(name) {
    return this._defs.get(name);
  }
  getName(ctor) {
    for (const [k, v] of this._defs) if (v === ctor) return k;
    return null;
  }
  whenDefined(name) {
    if (this._defs.has(name)) return Promise.resolve(this._defs.get(name));
    return new Promise((resolve) => this._waiting.set(name, resolve));
  }
  upgrade() {}
}
tag(CustomElementRegistry);

/**
 * Installs the window onto `global`. `classes` is every interface
 * constructor to expose; `options.url` sets the document URL.
 */
export function installWindow(global, classes, options = {}) {
  const url = options.url ?? "http://localhost:3000/";
  const realTimers = {
    setTimeout: global.setTimeout.bind(global),
    clearTimeout: global.clearTimeout.bind(global),
  };

  Object.setPrototypeOf(global, Window.prototype);
  global._listeners = null;

  const doc = createHTMLDocument(new URL(url).href);
  doc._defaultView = global;
  current.document = doc;

  const define = (key, value, writable = true) =>
    Object.defineProperty(global, key, {
      value,
      writable,
      configurable: true,
      enumerable: true,
    });
  const getter = (key, get) =>
    Object.defineProperty(global, key, {
      get,
      set(v) {
        define(key, v);
      },
      configurable: true,
      enumerable: true,
    });

  for (const [name, Ctor] of Object.entries(classes)) define(name, Ctor);
  for (const [name, fn] of Object.entries(WINDOW_METHODS)) define(name, fn);

  define("__realTimers", realTimers, false);
  define("__frameId", 0);
  define("__frameScheduled", false);
  define("__frameCallbacks", null);
  define("__scrollX", 0);
  define("__scrollY", 0);

  define("window", global);
  define("self", global);
  define("top", global);
  define("parent", global);
  define("frames", global);
  define("document", doc, false);
  define("location", new Location(INTERNAL, global));
  define("history", new History(INTERNAL, global));
  define("navigator", new Navigator(INTERNAL));
  define("screen", new Screen());
  define("localStorage", createStorage());
  define("sessionStorage", createStorage());
  define("customElements", new CustomElementRegistry());
  define("CSS", CSSNamespace);
  define("name", "");
  define("closed", false);
  define("length", 0);
  define("frameElement", null);
  define("opener", null);
  define("origin", new URL(url).origin);
  define("isSecureContext", true);
  define("innerWidth", 1024);
  define("innerHeight", 768);
  define("outerWidth", 1024);
  define("outerHeight", 768);
  define("devicePixelRatio", 1);
  define("screenX", 0);
  define("screenY", 0);
  define("screenLeft", 0);
  define("screenTop", 0);
  define("visualViewport", null);
  getter("scrollX", () => global.__scrollX);
  getter("scrollY", () => global.__scrollY);
  getter("pageXOffset", () => global.__scrollX);
  getter("pageYOffset", () => global.__scrollY);

  global._navigateHash = (href) => navigate(global, href);

  hooks.reportError = (error) => reportException(global, error);

  // Constructors that depend on the window's document.
  const Option = function Option(
    text,
    value,
    defaultSelected = false,
    selected = false,
  ) {
    if (!new.target)
      throw new TypeError(
        "Class constructor Option cannot be invoked without 'new'",
      );
    const option = doc.createElement("option");
    if (text !== "") option.text = text;
    if (value !== undefined) option.value = value;
    if (defaultSelected) option.setAttribute("selected", "");
    option._selected = !!selected;
    return option;
  };
  Option.prototype = classes.HTMLOptionElement.prototype;
  define("Option", Option);
  const Image = function Image(width, height) {
    if (!new.target)
      throw new TypeError(
        "Class constructor Image cannot be invoked without 'new'",
      );
    const img = doc.createElement("img");
    if (width !== undefined) img.width = width;
    if (height !== undefined) img.height = height;
    return img;
  };
  Image.prototype = classes.HTMLImageElement.prototype;
  define("Image", Image);
  const Audio = function Audio(src) {
    if (!new.target)
      throw new TypeError(
        "Class constructor Audio cannot be invoked without 'new'",
      );
    const audio = doc.createElement("audio");
    audio.preload = "auto";
    if (src !== undefined) audio.src = src;
    return audio;
  };
  Audio.prototype = classes.HTMLAudioElement.prototype;
  define("Audio", Audio);

  defineEventHandlers(Window.prototype, [...HANDLER_EVENTS, ...WINDOW_EVENTS]);
  return doc;
}

export { Event, StorageEvent };
