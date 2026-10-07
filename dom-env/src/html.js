// The remaining HTML element interfaces. Most only exist so `instanceof`
// checks and reflected attributes behave; a few carry real behavior
// (anchor URL parts, <template> contents, <details> toggle, <style> sheets,
// tables).

import { liveHTMLCollection } from "./collections.js";
import { parseStyleSheet } from "./css.js";
import {
  DOMTokenList,
  HTML_CLASSES,
  HTMLElement,
  reflectBool,
  reflectEnum,
  reflectInt,
  reflectString,
  reflectURL,
} from "./element.js";
import { Event, fire } from "./events.js";
import {
  adopt,
  cloneNode,
  DocumentFragment,
  descendantText,
  nextInTree,
  setTextContent,
} from "./node.js";
import {
  domException,
  ELEMENT_NODE,
  HTML_NS,
  INTERNAL,
  str,
  tag,
} from "./shared.js";

function define(names, Ctor) {
  for (const n of names.split(" ")) HTML_CLASSES.set(n, Ctor);
  tag(Ctor);
  return Ctor;
}

function simple(name, tags, reflect = []) {
  const Ctor = { [name]: class extends HTMLElement {} }[name];
  for (const p of reflect) reflectString(Ctor.prototype, p);
  return define(tags, Ctor);
}

export const HTMLHtmlElement = simple("HTMLHtmlElement", "html", ["version"]);
export const HTMLHeadElement = simple("HTMLHeadElement", "head");
export const HTMLBodyElement = simple("HTMLBodyElement", "body", [
  "text",
  "link",
  "vLink",
  "aLink",
  "bgColor",
  "background",
]);
export const HTMLDivElement = simple("HTMLDivElement", "div", ["align"]);
export const HTMLSpanElement = simple("HTMLSpanElement", "span");
export const HTMLParagraphElement = simple("HTMLParagraphElement", "p", [
  "align",
]);
export const HTMLHeadingElement = simple(
  "HTMLHeadingElement",
  "h1 h2 h3 h4 h5 h6",
  ["align"],
);
export const HTMLPreElement = simple("HTMLPreElement", "pre listing xmp");
export const HTMLQuoteElement = simple("HTMLQuoteElement", "blockquote q", [
  "cite",
]);
export const HTMLModElement = simple("HTMLModElement", "ins del", [
  "cite",
  "dateTime",
]);
export const HTMLBRElement = simple("HTMLBRElement", "br", ["clear"]);
export const HTMLHRElement = simple("HTMLHRElement", "hr", [
  "align",
  "color",
  "size",
  "width",
]);
export const HTMLUListElement = simple("HTMLUListElement", "ul", ["type"]);
export const HTMLDListElement = simple("HTMLDListElement", "dl");
export const HTMLMenuElement = simple("HTMLMenuElement", "menu");
export const HTMLDirectoryElement = simple("HTMLDirectoryElement", "dir");
export const HTMLPictureElement = simple("HTMLPictureElement", "picture");
export const HTMLSourceElement = simple("HTMLSourceElement", "source", [
  "type",
  "srcset",
  "sizes",
  "media",
]);
export const HTMLTrackElement = simple("HTMLTrackElement", "track", [
  "kind",
  "srclang",
  "label",
]);
export const HTMLMapElement = simple("HTMLMapElement", "map", ["name"]);
export const HTMLParamElement = simple("HTMLParamElement", "param", [
  "name",
  "value",
]);
export const HTMLEmbedElement = simple("HTMLEmbedElement", "embed", [
  "type",
  "width",
  "height",
]);
export const HTMLObjectElement = simple("HTMLObjectElement", "object", [
  "type",
  "name",
  "width",
  "height",
]);
export const HTMLMetaElement = simple("HTMLMetaElement", "meta", [
  "name",
  "content",
  "media",
  "scheme",
]);
export const HTMLBaseElement = simple("HTMLBaseElement", "base", ["target"]);
export const HTMLTitleElement = simple("HTMLTitleElement", "title");
export const HTMLScriptElement = simple("HTMLScriptElement", "script", [
  "type",
  "charset",
  "crossOrigin",
  "integrity",
  "referrerPolicy",
]);
export const HTMLNoScriptElement = HTMLElement;
export const HTMLDataElement = simple("HTMLDataElement", "data", ["value"]);
export const HTMLTimeElement = simple("HTMLTimeElement", "time");
export const HTMLSlotElement = simple("HTMLSlotElement", "slot", ["name"]);
export const HTMLTableCaptionElement = simple(
  "HTMLTableCaptionElement",
  "caption",
  ["align"],
);
export const HTMLTableColElement = simple(
  "HTMLTableColElement",
  "col colgroup",
  ["align", "width"],
);
export const HTMLFrameSetElement = simple("HTMLFrameSetElement", "frameset");
export const HTMLMarqueeElement = simple("HTMLMarqueeElement", "marquee");
export const HTMLFontElement = simple("HTMLFontElement", "font", [
  "color",
  "face",
  "size",
]);

reflectString(HTMLMetaElement.prototype, "httpEquiv", "http-equiv");
reflectString(HTMLTimeElement.prototype, "dateTime", "datetime");
reflectBool(HTMLScriptElement.prototype, "async");
reflectBool(HTMLScriptElement.prototype, "defer");
reflectBool(HTMLScriptElement.prototype, "noModule", "nomodule");
reflectURL(HTMLScriptElement.prototype, "src");
reflectURL(HTMLSourceElement.prototype, "src");
reflectURL(HTMLTrackElement.prototype, "src");
reflectURL(HTMLEmbedElement.prototype, "src");
reflectURL(HTMLObjectElement.prototype, "data");
reflectURL(HTMLBaseElement.prototype, "href");
reflectInt(HTMLTableColElement.prototype, "span", "span", 1, { min: 1 });
for (const Ctor of [HTMLScriptElement, HTMLTitleElement]) {
  Object.defineProperty(Ctor.prototype, "text", {
    get() {
      return descendantText(this);
    },
    set(v) {
      setTextContent(this, v);
    },
    configurable: true,
  });
}
HTMLSlotElement.prototype.assignedNodes = () => [];
HTMLSlotElement.prototype.assignedElements = () => [];
HTMLSlotElement.prototype.assign = () => {};

// --- Lists --------------------------------------------------------------------------

export const HTMLOListElement = simple("HTMLOListElement", "ol", ["type"]);
reflectBool(HTMLOListElement.prototype, "reversed");
reflectInt(HTMLOListElement.prototype, "start", "start", 1);

export const HTMLLIElement = simple("HTMLLIElement", "li", ["type"]);
reflectInt(HTMLLIElement.prototype, "value", "value", 0);

// --- Hyperlinks --------------------------------------------------------------------------

class HyperlinkMixin {
  _url() {
    const href = this._getAttrRaw("href");
    if (href === null) return null;
    try {
      return new URL(href, this._doc.baseURI);
    } catch {
      return null;
    }
  }
  _setURLPart(part, v) {
    const url = this._url();
    if (!url) return;
    url[part] = v;
    this._setAttrRaw("href", url.href);
  }
  get href() {
    const href = this._getAttrRaw("href");
    if (href === null) return "";
    return this._url()?.href ?? href;
  }
  set href(v) {
    this._setAttrRaw("href", str(v));
  }
  get origin() {
    return this._url()?.origin ?? "";
  }
  toString() {
    return this.href;
  }
}
for (const part of [
  "protocol",
  "username",
  "password",
  "host",
  "hostname",
  "port",
  "pathname",
  "search",
  "hash",
]) {
  Object.defineProperty(HyperlinkMixin.prototype, part, {
    get() {
      return this._url()?.[part] ?? "";
    },
    set(v) {
      this._setURLPart(part, str(v));
    },
    configurable: true,
  });
}

function withHyperlink(Ctor) {
  for (const key of Reflect.ownKeys(HyperlinkMixin.prototype)) {
    if (key === "constructor") continue;
    Object.defineProperty(
      Ctor.prototype,
      key,
      Object.getOwnPropertyDescriptor(HyperlinkMixin.prototype, key),
    );
  }
  for (const p of [
    "target",
    "download",
    "ping",
    "rel",
    "hreflang",
    "type",
    "referrerPolicy",
  ]) {
    reflectString(Ctor.prototype, p, p.toLowerCase());
  }
  Object.defineProperty(Ctor.prototype, "relList", {
    get() {
      return (this._relList ??= new DOMTokenList(INTERNAL, this, "rel", [
        "noreferrer",
        "noopener",
        "opener",
      ]));
    },
    configurable: true,
  });
}

export class HTMLAnchorElement extends HTMLElement {
  get text() {
    return descendantText(this);
  }
  set text(v) {
    setTextContent(this, v);
  }
}
withHyperlink(HTMLAnchorElement);
define("a", HTMLAnchorElement);

export class HTMLAreaElement extends HTMLElement {}
withHyperlink(HTMLAreaElement);
reflectString(HTMLAreaElement.prototype, "alt");
reflectString(HTMLAreaElement.prototype, "coords");
reflectString(HTMLAreaElement.prototype, "shape");
define("area", HTMLAreaElement);

// --- Template ----------------------------------------------------------------------------

export class HTMLTemplateElement extends HTMLElement {
  constructor(token, doc, ns, prefix, localName) {
    super(token, doc, ns, prefix, localName);
    this._content = new DocumentFragment(INTERNAL, doc._templateDoc());
    this._content._host = this;
  }
  get content() {
    return this._content;
  }
  _adopted(doc) {
    adopt(this._content, doc._templateDoc());
  }
  _cloneState(copy, deep) {
    if (!deep) return;
    const doc = copy._content._doc;
    for (let c = this._content._first; c; c = c._next) {
      copy._content.appendChild(cloneNode(c, doc, true));
    }
  }
}
define("template", HTMLTemplateElement);

// --- Details / dialog -----------------------------------------------------------------------

export class HTMLDetailsElement extends HTMLElement {
  _attrHook(name, ns, old, value) {
    if (ns !== null || name !== "open" || (old === null) === (value === null))
      return;
    const win = this._doc._defaultView;
    if (!win) return;
    // Toggle fires asynchronously, coalescing rapid changes.
    if (this._toggleTimer) win.clearTimeout(this._toggleTimer);
    const oldState = old === null ? "closed" : "open";
    this._toggleTimer = win.setTimeout(() => {
      this._toggleTimer = null;
      const newState = this._getAttrRaw("open") === null ? "closed" : "open";
      fire(this, "toggle", { oldState, newState }, win.ToggleEvent ?? Event);
    }, 0);
  }
}
reflectBool(HTMLDetailsElement.prototype, "open");
reflectString(HTMLDetailsElement.prototype, "name");
define("details", HTMLDetailsElement);

export class HTMLDialogElement extends HTMLElement {}
reflectBool(HTMLDialogElement.prototype, "open");
Object.defineProperty(HTMLDialogElement.prototype, "returnValue", {
  get() {
    return this._returnValue ?? "";
  },
  set(v) {
    this._returnValue = str(v);
  },
  configurable: true,
});
define("dialog", HTMLDialogElement);

// --- Media, images, embeds ---------------------------------------------------------------------

export class HTMLImageElement extends HTMLElement {
  get naturalWidth() {
    return 0;
  }
  get naturalHeight() {
    return 0;
  }
  get complete() {
    return true;
  }
  get currentSrc() {
    return this.src;
  }
  get x() {
    return 0;
  }
  get y() {
    return 0;
  }
  decode() {
    return Promise.resolve();
  }
}
for (const p of [
  "alt",
  "srcset",
  "sizes",
  "useMap",
  "loading",
  "decoding",
  "referrerPolicy",
  "crossOrigin",
  "fetchPriority",
]) {
  reflectString(HTMLImageElement.prototype, p, p.toLowerCase());
}
reflectURL(HTMLImageElement.prototype, "src");
reflectBool(HTMLImageElement.prototype, "isMap", "ismap");
reflectInt(HTMLImageElement.prototype, "width", "width", 0, {
  nonNegative: true,
});
reflectInt(HTMLImageElement.prototype, "height", "height", 0, {
  nonNegative: true,
});
define("img", HTMLImageElement);

export class HTMLMediaElement extends HTMLElement {
  constructor(token, doc, ns, prefix, localName) {
    super(token, doc, ns, prefix, localName);
    this._paused = true;
    this._currentTime = 0;
    this._volume = 1;
    this._muted = false;
    this._playbackRate = 1;
  }
  get paused() {
    return this._paused;
  }
  get ended() {
    return false;
  }
  get duration() {
    return Number.NaN;
  }
  get readyState() {
    return 0;
  }
  get networkState() {
    return 0;
  }
  get currentTime() {
    return this._currentTime;
  }
  set currentTime(v) {
    this._currentTime = Number(v) || 0;
  }
  get volume() {
    return this._volume;
  }
  set volume(v) {
    this._volume = Number(v);
  }
  get muted() {
    return this._muted;
  }
  set muted(v) {
    this._muted = !!v;
  }
  get playbackRate() {
    return this._playbackRate;
  }
  set playbackRate(v) {
    this._playbackRate = Number(v);
  }
  play() {
    this._paused = false;
    return Promise.resolve();
  }
  pause() {
    this._paused = true;
  }
  load() {}
  canPlayType() {
    return "";
  }
}
reflectURL(HTMLMediaElement.prototype, "src");
for (const p of ["autoplay", "controls", "loop"])
  reflectBool(HTMLMediaElement.prototype, p);
reflectBool(HTMLMediaElement.prototype, "defaultMuted", "muted");
reflectString(HTMLMediaElement.prototype, "preload");
reflectString(HTMLMediaElement.prototype, "crossOrigin", "crossorigin");
tag(HTMLMediaElement);
export class HTMLAudioElement extends HTMLMediaElement {}
define("audio", HTMLAudioElement);
export class HTMLVideoElement extends HTMLMediaElement {
  get videoWidth() {
    return 0;
  }
  get videoHeight() {
    return 0;
  }
}
reflectURL(HTMLVideoElement.prototype, "poster");
reflectBool(HTMLVideoElement.prototype, "playsInline", "playsinline");
reflectInt(HTMLVideoElement.prototype, "width", "width", 0, {
  nonNegative: true,
});
reflectInt(HTMLVideoElement.prototype, "height", "height", 0, {
  nonNegative: true,
});
define("video", HTMLVideoElement);

export class HTMLCanvasElement extends HTMLElement {
  getContext() {
    return null;
  }
  toDataURL() {
    return "data:,";
  }
  toBlob(callback) {
    callback?.(null);
  }
}
reflectInt(HTMLCanvasElement.prototype, "width", "width", 300, {
  nonNegative: true,
});
reflectInt(HTMLCanvasElement.prototype, "height", "height", 150, {
  nonNegative: true,
});
define("canvas", HTMLCanvasElement);

export class HTMLIFrameElement extends HTMLElement {
  get contentWindow() {
    return null;
  }
  get contentDocument() {
    return null;
  }
}
for (const p of [
  "name",
  "srcdoc",
  "allow",
  "width",
  "height",
  "referrerPolicy",
  "loading",
]) {
  reflectString(HTMLIFrameElement.prototype, p, p.toLowerCase());
}
reflectURL(HTMLIFrameElement.prototype, "src");
reflectBool(HTMLIFrameElement.prototype, "allowFullscreen", "allowfullscreen");
define("iframe", HTMLIFrameElement);
export const HTMLFrameElement = simple("HTMLFrameElement", "frame", ["name"]);

// --- Style and link ----------------------------------------------------------------------------

export class CSSStyleSheet {
  constructor() {
    this._text = "";
    this._parsed = null;
    this._owner = null;
    this._disabled = false;
  }
  _rules() {
    if (this._owner) {
      const text = descendantText(this._owner);
      if (text !== this._text || this._parsed === null) {
        this._text = text;
        this._parsed = parseStyleSheet(text);
      }
    }
    return this._parsed ?? [];
  }
  get cssRules() {
    return this._rules().map((r) => ({
      selectorText: r.selectors.map((s) => s.text).join(", "),
      cssText: `${r.selectors.map((s) => s.text).join(", ")} { ${[...r.decls].map(([k, d]) => `${k}: ${d.value}${d.important ? " !important" : ""};`).join(" ")} }`,
      style: Object.fromEntries([...r.decls].map(([k, d]) => [k, d.value])),
    }));
  }
  get rules() {
    return this.cssRules;
  }
  get ownerNode() {
    return this._owner;
  }
  get disabled() {
    return this._disabled;
  }
  set disabled(v) {
    this._disabled = !!v;
  }
  get type() {
    return "text/css";
  }
  insertRule(rule, index = 0) {
    const rules = this._rules().slice();
    rules.splice(index, 0, ...parseStyleSheet(str(rule)));
    this._parsed = rules;
    this._owner = null;
    return index;
  }
  deleteRule(index) {
    const rules = this._rules().slice();
    rules.splice(index, 1);
    this._parsed = rules;
    this._owner = null;
  }
  replaceSync(text) {
    this._owner = null;
    this._parsed = parseStyleSheet(str(text));
  }
  replace(text) {
    this.replaceSync(text);
    return Promise.resolve(this);
  }
}
tag(CSSStyleSheet);

export class HTMLStyleElement extends HTMLElement {
  constructor(token, doc, ns, prefix, localName) {
    super(token, doc, ns, prefix, localName);
    this._sheet = new CSSStyleSheet();
    this._sheet._owner = this;
    doc._allStyles.add(this);
  }
  get sheet() {
    return this.isConnected ? this._sheet : null;
  }
  _adopted(doc) {
    doc._allStyles.add(this);
  }
}
reflectString(HTMLStyleElement.prototype, "media");
reflectBool(HTMLStyleElement.prototype, "disabled");
define("style", HTMLStyleElement);

export class HTMLLinkElement extends HTMLElement {
  get sheet() {
    return null;
  }
  get relList() {
    return (this._relList ??= new DOMTokenList(INTERNAL, this, "rel", [
      "alternate",
      "dns-prefetch",
      "icon",
      "manifest",
      "modulepreload",
      "next",
      "preconnect",
      "prefetch",
      "preload",
      "search",
      "stylesheet",
    ]));
  }
}
for (const p of [
  "rel",
  "media",
  "hreflang",
  "type",
  "as",
  "sizes",
  "crossOrigin",
  "integrity",
  "referrerPolicy",
]) {
  reflectString(HTMLLinkElement.prototype, p, p.toLowerCase());
}
reflectURL(HTMLLinkElement.prototype, "href");
define("link", HTMLLinkElement);

// --- Tables -------------------------------------------------------------------------------------

function childrenNamed(parent, names) {
  const out = [];
  for (let c = parent._first; c; c = c._next) {
    if (
      c.nodeType === ELEMENT_NODE &&
      c._ns === HTML_NS &&
      names.includes(c._localName)
    )
      out.push(c);
  }
  return out;
}

function liveChildrenNamed(parent, names) {
  return liveHTMLCollection({
    version: () => parent._cv,
    items: () => childrenNamed(parent, names),
  });
}

export class HTMLTableElement extends HTMLElement {
  get caption() {
    return childrenNamed(this, ["caption"])[0] ?? null;
  }
  get tHead() {
    return childrenNamed(this, ["thead"])[0] ?? null;
  }
  get tFoot() {
    return childrenNamed(this, ["tfoot"])[0] ?? null;
  }
  get tBodies() {
    return liveChildrenNamed(this, ["tbody"]);
  }
  _rowList() {
    const rows = [];
    const sections = (n) => childrenNamed(this, [n]);
    for (const s of sections("thead")) rows.push(...childrenNamed(s, ["tr"]));
    for (let c = this._first; c; c = c._next) {
      if (c.nodeType !== ELEMENT_NODE || c._ns !== HTML_NS) continue;
      if (c._localName === "tr") rows.push(c);
      else if (c._localName === "tbody") rows.push(...childrenNamed(c, ["tr"]));
    }
    for (const s of sections("tfoot")) rows.push(...childrenNamed(s, ["tr"]));
    return rows;
  }
  get rows() {
    return liveHTMLCollection({
      version: () => this._doc._version,
      items: () => this._rowList(),
    });
  }
  createCaption() {
    return (
      this.caption ??
      this.insertBefore(this._doc.createElement("caption"), this._first)
    );
  }
  deleteCaption() {
    this.caption?.remove();
  }
  createTHead() {
    return (
      this.tHead ??
      this.insertBefore(
        this._doc.createElement("thead"),
        this.tBodies[0] ?? null,
      )
    );
  }
  deleteTHead() {
    this.tHead?.remove();
  }
  createTFoot() {
    return this.tFoot ?? this.appendChild(this._doc.createElement("tfoot"));
  }
  deleteTFoot() {
    this.tFoot?.remove();
  }
  createTBody() {
    const bodies = childrenNamed(this, ["tbody"]);
    const after = bodies[bodies.length - 1]?._next ?? null;
    return this.insertBefore(this._doc.createElement("tbody"), after);
  }
  insertRow(index = -1) {
    const rows = this._rowList();
    if (index < -1 || index > rows.length)
      throw domException(
        "The index provided is outside the range.",
        "IndexSizeError",
      );
    const tr = this._doc.createElement("tr");
    if (rows.length === 0) {
      const body =
        childrenNamed(this, ["tbody"]).pop() ??
        this.appendChild(this._doc.createElement("tbody"));
      body.appendChild(tr);
    } else if (index === -1 || index === rows.length) {
      rows[rows.length - 1]._parent.appendChild(tr);
    } else {
      rows[index]._parent.insertBefore(tr, rows[index]);
    }
    return tr;
  }
  deleteRow(index) {
    const rows = this._rowList();
    const i = index === -1 ? rows.length - 1 : index;
    if (i < 0 || i >= rows.length)
      throw domException(
        "The index provided is outside the range.",
        "IndexSizeError",
      );
    rows[i].remove();
  }
}
for (const p of [
  "align",
  "border",
  "frame",
  "rules",
  "summary",
  "width",
  "bgColor",
  "cellPadding",
  "cellSpacing",
]) {
  reflectString(HTMLTableElement.prototype, p, p.toLowerCase());
}
define("table", HTMLTableElement);

export class HTMLTableSectionElement extends HTMLElement {
  get rows() {
    return liveChildrenNamed(this, ["tr"]);
  }
  insertRow(index = -1) {
    const rows = childrenNamed(this, ["tr"]);
    if (index < -1 || index > rows.length)
      throw domException(
        "The index provided is outside the range.",
        "IndexSizeError",
      );
    const tr = this._doc.createElement("tr");
    this.insertBefore(tr, index === -1 ? null : (rows[index] ?? null));
    return tr;
  }
  deleteRow(index) {
    const rows = childrenNamed(this, ["tr"]);
    const i = index === -1 ? rows.length - 1 : index;
    if (i < 0 || i >= rows.length)
      throw domException(
        "The index provided is outside the range.",
        "IndexSizeError",
      );
    rows[i].remove();
  }
}
reflectString(HTMLTableSectionElement.prototype, "align");
define("thead tbody tfoot", HTMLTableSectionElement);

export class HTMLTableRowElement extends HTMLElement {
  get cells() {
    return liveChildrenNamed(this, ["td", "th"]);
  }
  get rowIndex() {
    let table = this._parent;
    if (table && ["thead", "tbody", "tfoot"].includes(table._localName))
      table = table._parent;
    if (table?._localName !== "table") return -1;
    return table._rowList().indexOf(this);
  }
  get sectionRowIndex() {
    const p = this._parent;
    return p ? childrenNamed(p, ["tr"]).indexOf(this) : -1;
  }
  insertCell(index = -1) {
    const cells = childrenNamed(this, ["td", "th"]);
    if (index < -1 || index > cells.length)
      throw domException(
        "The index provided is outside the range.",
        "IndexSizeError",
      );
    const td = this._doc.createElement("td");
    this.insertBefore(td, index === -1 ? null : (cells[index] ?? null));
    return td;
  }
  deleteCell(index) {
    const cells = childrenNamed(this, ["td", "th"]);
    const i = index === -1 ? cells.length - 1 : index;
    if (i < 0 || i >= cells.length)
      throw domException(
        "The index provided is outside the range.",
        "IndexSizeError",
      );
    cells[i].remove();
  }
}
reflectString(HTMLTableRowElement.prototype, "align");
define("tr", HTMLTableRowElement);

export class HTMLTableCellElement extends HTMLElement {
  get cellIndex() {
    const p = this._parent;
    return p && p._localName === "tr"
      ? childrenNamed(p, ["td", "th"]).indexOf(this)
      : -1;
  }
}
reflectInt(HTMLTableCellElement.prototype, "colSpan", "colspan", 1, { min: 1 });
reflectInt(HTMLTableCellElement.prototype, "rowSpan", "rowspan", 1, {
  nonNegative: true,
});
for (const p of [
  "headers",
  "abbr",
  "align",
  "axis",
  "height",
  "width",
  "bgColor",
]) {
  reflectString(HTMLTableCellElement.prototype, p, p.toLowerCase());
}
reflectEnum(HTMLTableCellElement.prototype, "scope", "scope", [
  "row",
  "col",
  "rowgroup",
  "colgroup",
]);
define("td th", HTMLTableCellElement);

export { nextInTree };

// Elements whose interface is plain HTMLElement.
for (const n of "abbr acronym address article aside b basefont bdi bdo big center cite code dd dfn dt em figcaption figure footer header hgroup i kbd main mark nav nobr noembed noframes noscript plaintext rb rp rt rtc ruby s samp search section small strike strong sub summary sup tt u var wbr".split(
  " ",
)) {
  HTML_CLASSES.set(n, HTMLElement);
}
