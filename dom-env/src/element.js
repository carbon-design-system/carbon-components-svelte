// Element, Attr, NamedNodeMap, DOMTokenList, DOMStringMap, HTMLElement,
// SVGElement, focus, and attribute reflection helpers.

import {
  HTMLCollection,
  liveHTMLCollection,
  staticNodeList,
} from "./collections.js";
import { CSSStyleDeclaration } from "./css.js";
import {
  dispatch,
  FocusEvent,
  fire,
  MouseEvent,
  PointerEvent,
} from "./events.js";
import { DOMRect, DOMRectList } from "./geometry.js";
import { observing, queueMutation } from "./mutation.js";
import {
  ChildNode,
  childArray,
  DocumentFragment,
  descendantText,
  insertNode,
  Node,
  NonDocumentTypeChildNode,
  nextInTree,
  ParentNode,
  preInsert,
  replaceAll,
  setLiveChildren,
  setTextContent,
  Text,
  touch,
} from "./node.js";
import {
  parseFragmentInto,
  serializeChildren,
  serializeNode,
} from "./parser.js";
import { compile, matchesSelector } from "./selector.js";
import {
  ATTRIBUTE_NODE,
  domException,
  ELEMENT_NODE,
  HTML_NS,
  INTERNAL,
  illegalConstructor,
  mixin,
  SVG_NS,
  splitTokens,
  str,
  tag,
  XML_NS,
  XMLNS_NS,
} from "./shared.js";

// --- Attr -------------------------------------------------------------------------

export class Attr extends Node {
  constructor(token, doc, ns, prefix, localName, value, owner) {
    super(token, doc);
    this._ns = ns;
    this._prefix = prefix;
    this._localName = localName;
    this._name = prefix ? prefix + ":" + localName : localName;
    this._value = value;
    this._ownerElement = owner;
  }
  get nodeType() {
    return ATTRIBUTE_NODE;
  }
  get nodeName() {
    return this._name;
  }
  get name() {
    return this._name;
  }
  get localName() {
    return this._localName;
  }
  get namespaceURI() {
    return this._ns;
  }
  get prefix() {
    return this._prefix;
  }
  get ownerElement() {
    return this._ownerElement;
  }
  get specified() {
    return true;
  }
  get value() {
    return this._value;
  }
  set value(v) {
    const value = str(v);
    if (this._ownerElement) this._ownerElement._changeAttr(this, value);
    else this._value = value;
  }
  get nodeValue() {
    return this._value;
  }
  set nodeValue(v) {
    this.value = v === null ? "" : v;
  }
  get textContent() {
    return this._value;
  }
  set textContent(v) {
    this.value = v === null ? "" : v;
  }
  _cloneShallow(doc) {
    return new Attr(
      INTERNAL,
      doc,
      this._ns,
      this._prefix,
      this._localName,
      this._value,
      null,
    );
  }
}
tag(Attr);

// --- NamedNodeMap ---------------------------------------------------------------

export class NamedNodeMap {
  constructor(token, element) {
    if (token !== INTERNAL) illegalConstructor();
    this._el = element;
    this._indexed = 0;
    this._sync();
  }
  _sync() {
    const attrs = this._el._attrs ?? [];
    for (let i = 0; i < attrs.length; i++) {
      Object.defineProperty(this, i, {
        value: attrs[i],
        configurable: true,
        enumerable: true,
      });
    }
    for (let i = attrs.length; i < this._indexed; i++) delete this[i];
    this._indexed = attrs.length;
  }
  get length() {
    return this._el._attrs?.length ?? 0;
  }
  item(index) {
    return this._el._attrs?.[index >>> 0] ?? null;
  }
  getNamedItem(name) {
    return this._el.getAttributeNode(name);
  }
  getNamedItemNS(ns, localName) {
    return this._el.getAttributeNodeNS(ns, localName);
  }
  setNamedItem(attr) {
    return this._el.setAttributeNode(attr);
  }
  setNamedItemNS(attr) {
    return this._el.setAttributeNodeNS(attr);
  }
  removeNamedItem(name) {
    const attr = this._el.getAttributeNode(name);
    if (!attr)
      throw domException(
        `No item with name '${name}' was found.`,
        "NotFoundError",
      );
    this._el.removeAttributeNode(attr);
    return attr;
  }
  removeNamedItemNS(ns, localName) {
    const attr = this._el.getAttributeNodeNS(ns, localName);
    if (!attr)
      throw domException(
        `No item with name '${localName}' was found.`,
        "NotFoundError",
      );
    this._el.removeAttributeNode(attr);
    return attr;
  }
  [Symbol.iterator]() {
    return (this._el._attrs ?? []).slice()[Symbol.iterator]();
  }
}
tag(NamedNodeMap);

// --- DOMTokenList ---------------------------------------------------------------

export class DOMTokenList {
  constructor(token, element, attr, supported = null) {
    if (token !== INTERNAL) illegalConstructor();
    this._el = element;
    this._attr = attr;
    this._supported = supported;
    this._indexed = 0;
    this._syncedFor = undefined;
  }
  _tokens() {
    const el = this._el;
    if (this._attr === "class") {
      let t = el._classTokens;
      if (t === null) {
        const s = el._className;
        t = el._classTokens = s ? dedupe(splitTokens(s)) : [];
      }
      return t;
    }
    const v = el._getAttrRaw(this._attr);
    return v ? dedupe(splitTokens(v)) : [];
  }
  _syncIndices() {
    const tokens = this._tokens();
    if (this._syncedFor === tokens) return tokens;
    this._syncedFor = tokens;
    for (let i = 0; i < tokens.length; i++) {
      Object.defineProperty(this, i, {
        value: tokens[i],
        configurable: true,
        enumerable: true,
      });
    }
    for (let i = tokens.length; i < this._indexed; i++) delete this[i];
    this._indexed = tokens.length;
    return tokens;
  }
  _write(tokens) {
    this._el._setAttrRaw(this._attr, tokens.join(" "));
    this._syncIndices();
  }
  get length() {
    return this._syncIndices().length;
  }
  item(index) {
    return this._syncIndices()[index >>> 0] ?? null;
  }
  contains(token) {
    return this._tokens().includes(str(token));
  }
  add(...tokens) {
    const list = this._tokens().slice();
    for (let t of tokens) {
      t = validateToken(t);
      if (!list.includes(t)) list.push(t);
    }
    this._write(list);
  }
  remove(...tokens) {
    const remove = tokens.map(validateToken);
    const current = this._tokens();
    if (current.length === 0 && this._el._getAttrRaw(this._attr) === null)
      return;
    this._write(current.filter((t) => !remove.includes(t)));
  }
  toggle(token, force) {
    const t = validateToken(token);
    const list = this._tokens();
    if (list.includes(t)) {
      if (force === undefined || force === false) {
        this._write(list.filter((x) => x !== t));
        return false;
      }
      return true;
    }
    if (force === undefined || force === true) {
      this._write([...list, t]);
      return true;
    }
    return false;
  }
  replace(oldToken, newToken) {
    const o = validateToken(oldToken);
    const n = validateToken(newToken);
    const list = this._tokens();
    if (!list.includes(o)) return false;
    const out = [];
    for (const t of list) {
      const v = t === o ? n : t;
      if (!out.includes(v)) out.push(v);
    }
    this._write(out);
    return true;
  }
  supports(token) {
    if (!this._supported) {
      throw new TypeError("DOMTokenList has no supported tokens.");
    }
    return this._supported.includes(str(token).toLowerCase());
  }
  get value() {
    return this._el._getAttrRaw(this._attr) ?? "";
  }
  set value(v) {
    this._el._setAttrRaw(this._attr, str(v));
  }
  toString() {
    return this.value;
  }
  forEach(callback, thisArg) {
    const tokens = this._syncIndices().slice();
    for (let i = 0; i < tokens.length; i++)
      callback.call(thisArg, tokens[i], i, this);
  }
  keys() {
    return this._syncIndices().slice().keys();
  }
  values() {
    return this._syncIndices().slice().values();
  }
  entries() {
    return this._syncIndices().slice().entries();
  }
  [Symbol.iterator]() {
    return this._syncIndices().slice()[Symbol.iterator]();
  }
}
tag(DOMTokenList);

function dedupe(tokens) {
  if (tokens.length < 2) return tokens;
  return [...new Set(tokens)];
}

function validateToken(t) {
  const s = str(t);
  if (s === "")
    throw domException("The token provided must not be empty.", "SyntaxError");
  if (/[\t\n\f\r ]/.test(s)) {
    throw domException(
      `The token provided ('${s}') contains HTML space characters.`,
      "InvalidCharacterError",
    );
  }
  return s;
}

// --- DOMStringMap (dataset) -------------------------------------------------------

export class DOMStringMap {
  constructor(token) {
    if (token !== INTERNAL) illegalConstructor();
  }
}
tag(DOMStringMap);

function dataAttrName(prop) {
  if (/-[a-z]/.test(prop)) {
    throw domException(
      `'${prop}' is not a valid property name.`,
      "SyntaxError",
    );
  }
  return "data-" + prop.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());
}
function dataPropName(attr) {
  return attr.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function createDataset(el) {
  const target = new DOMStringMap(INTERNAL);
  return new Proxy(target, {
    get(t, prop, receiver) {
      if (typeof prop !== "string" || prop in t)
        return Reflect.get(t, prop, receiver);
      return el._getAttrRaw(dataAttrName(prop)) ?? undefined;
    },
    set(t, prop, value) {
      if (typeof prop !== "string") return Reflect.set(t, prop, value);
      el.setAttribute(dataAttrName(prop), str(value));
      return true;
    },
    deleteProperty(t, prop) {
      if (typeof prop !== "string") return Reflect.deleteProperty(t, prop);
      el.removeAttribute(dataAttrName(prop));
      return true;
    },
    has(t, prop) {
      if (typeof prop !== "string") return Reflect.has(t, prop);
      return el._getAttrRaw(dataAttrName(prop)) !== null || prop in t;
    },
    ownKeys() {
      const keys = [];
      for (const a of el._attrs ?? []) {
        if (a._ns === null && a._localName.startsWith("data-"))
          keys.push(dataPropName(a._localName));
      }
      return keys;
    },
    getOwnPropertyDescriptor(t, prop) {
      if (typeof prop !== "string")
        return Reflect.getOwnPropertyDescriptor(t, prop);
      const v = el._getAttrRaw(dataAttrName(prop));
      if (v === null) return undefined;
      return { value: v, writable: true, enumerable: true, configurable: true };
    },
  });
}

// --- Element ----------------------------------------------------------------------

const NAME_RE = /^[^\t\n\f\r />"'=\0]+$/;

function validateName(name) {
  if (!NAME_RE.test(name) || name === "") {
    throw domException(
      `'${name}' is not a valid attribute name.`,
      "InvalidCharacterError",
    );
  }
}

function validateQName(ns, qname) {
  validateName(qname);
  const colon = qname.indexOf(":");
  const prefix = colon === -1 ? null : qname.slice(0, colon);
  const localName = colon === -1 ? qname : qname.slice(colon + 1);
  ns = ns === "" ? null : ns;
  if (prefix !== null && ns === null)
    throw domException("Namespace error.", "NamespaceError");
  if (prefix === "xml" && ns !== XML_NS)
    throw domException("Namespace error.", "NamespaceError");
  if ((qname === "xmlns" || prefix === "xmlns") !== (ns === XMLNS_NS)) {
    throw domException("Namespace error.", "NamespaceError");
  }
  return { ns, prefix, localName };
}

export class Element extends Node {
  constructor(token, doc, ns, prefix, localName) {
    super(token, doc);
    this._ns = ns;
    this._prefix = prefix;
    this._localName = localName;
    this._qname = prefix ? prefix + ":" + localName : localName;
    this._tagName =
      ns === HTML_NS && doc._isHTML ? this._qname.toUpperCase() : this._qname;
    this._attrs = null;
    this._id = "";
    this._className = "";
    this._classTokens = null;
    this._classList = null;
    this._attrMap = null;
    this._childrenList = null;
    this._style = null;
    this._dataset = null;
    this._scrollTop = 0;
    this._scrollLeft = 0;
    this._shadowRoot = null;
  }

  get nodeType() {
    return ELEMENT_NODE;
  }
  get nodeName() {
    return this._tagName;
  }
  get tagName() {
    return this._tagName;
  }
  get localName() {
    return this._localName;
  }
  get namespaceURI() {
    return this._ns;
  }
  get prefix() {
    return this._prefix;
  }
  get textContent() {
    return descendantText(this);
  }
  set textContent(v) {
    setTextContent(this, v);
  }

  // Attributes ------------------------------------------------------------------

  _isHTMLInHTMLDoc() {
    return this._ns === HTML_NS && this._doc._isHTML;
  }

  _findAttr(qname) {
    const attrs = this._attrs;
    if (attrs === null) return null;
    for (let i = 0; i < attrs.length; i++)
      if (attrs[i]._name === qname) return attrs[i];
    return null;
  }

  _findAttrNS(ns, localName) {
    const attrs = this._attrs;
    if (attrs === null) return null;
    for (let i = 0; i < attrs.length; i++) {
      const a = attrs[i];
      if (a._ns === ns && a._localName === localName) return a;
    }
    return null;
  }

  /** No-namespace attribute value by local name, or null. */
  _getAttrRaw(localName) {
    const attrs = this._attrs;
    if (attrs === null) return null;
    for (let i = 0; i < attrs.length; i++) {
      const a = attrs[i];
      if (a._localName === localName && a._ns === null) return a._value;
    }
    return null;
  }

  /** Sets a no-namespace attribute (reflection setters, classList, style). */
  _setAttrRaw(localName, value) {
    const attr = this._findAttrNS(null, localName);
    if (attr) this._changeAttr(attr, value);
    else
      this._appendAttr(
        new Attr(INTERNAL, this._doc, null, null, localName, value, this),
      );
  }

  _removeAttrRaw(localName) {
    const attr = this._findAttrNS(null, localName);
    if (attr) this._removeAttr(attr);
  }

  /** Parser fast path: append without mutation records. */
  _appendAttrRaw(ns, prefix, localName, value) {
    const attr = new Attr(
      INTERNAL,
      this._doc,
      ns,
      prefix,
      localName,
      value,
      this,
    );
    (this._attrs ??= []).push(attr);
    if (ns === null) this._attrSideEffects(localName, null, value);
    this._attrHook(localName, ns, null, value);
  }

  _setAttrFromStyle(text) {
    this._setAttrRaw("style", text);
  }

  _appendAttr(attr) {
    attr._ownerElement = this;
    (this._attrs ??= []).push(attr);
    this._attrChanged(attr, null, attr._value);
  }

  _changeAttr(attr, value) {
    const old = attr._value;
    attr._value = value;
    this._attrChanged(attr, old, value);
  }

  _removeAttr(attr) {
    const attrs = this._attrs;
    const i = attrs.indexOf(attr);
    attrs.splice(i, 1);
    attr._ownerElement = null;
    this._attrChanged(attr, attr._value, null);
  }

  _attrChanged(attr, old, value) {
    if (observing.count)
      queueMutation("attributes", this, attr._localName, attr._ns, old);
    if (attr._ns === null) this._attrSideEffects(attr._localName, old, value);
    this._doc._version++;
    this._attrMap?._sync();
    this._attrHook(attr._localName, attr._ns, old, value);
  }

  _attrSideEffects(localName, _old, value) {
    if (localName === "id") this._id = value ?? "";
    else if (localName === "class") {
      this._className = value ?? "";
      this._classTokens = null;
    }
  }

  /** Overridden by elements with attribute-driven state (input, option, details...). */
  _attrHook(_localName, _ns, _old, _value) {}

  getAttribute(name) {
    let n = str(name);
    if (this._ns === HTML_NS && this._doc._isHTML) n = n.toLowerCase();
    const attrs = this._attrs;
    if (attrs === null) return null;
    for (let i = 0; i < attrs.length; i++)
      if (attrs[i]._name === n) return attrs[i]._value;
    return null;
  }
  getAttributeNS(ns, localName) {
    return (
      this._findAttrNS(ns === "" ? null : ns, str(localName))?._value ?? null
    );
  }
  setAttribute(name, value) {
    let n = str(name);
    validateName(n);
    if (this._ns === HTML_NS && this._doc._isHTML) n = n.toLowerCase();
    const v = str(value);
    const attr = this._findAttr(n);
    if (attr) {
      this._changeAttr(attr, v);
    } else {
      this._appendAttr(new Attr(INTERNAL, this._doc, null, null, n, v, this));
    }
  }
  setAttributeNS(ns, qname, value) {
    const { ns: n, prefix, localName } = validateQName(ns, str(qname));
    const v = str(value);
    const attr = this._findAttrNS(n, localName);
    if (attr) this._changeAttr(attr, v);
    else
      this._appendAttr(
        new Attr(INTERNAL, this._doc, n, prefix, localName, v, this),
      );
  }
  removeAttribute(name) {
    let n = str(name);
    if (this._ns === HTML_NS && this._doc._isHTML) n = n.toLowerCase();
    const attr = this._findAttr(n);
    if (attr) this._removeAttr(attr);
  }
  removeAttributeNS(ns, localName) {
    const attr = this._findAttrNS(ns === "" ? null : ns, str(localName));
    if (attr) this._removeAttr(attr);
  }
  toggleAttribute(name, force) {
    let n = str(name);
    validateName(n);
    if (this._ns === HTML_NS && this._doc._isHTML) n = n.toLowerCase();
    const attr = this._findAttr(n);
    if (!attr) {
      if (force === undefined || force === true) {
        this._appendAttr(
          new Attr(INTERNAL, this._doc, null, null, n, "", this),
        );
        return true;
      }
      return false;
    }
    if (force === undefined || force === false) {
      this._removeAttr(attr);
      return false;
    }
    return true;
  }
  hasAttribute(name) {
    let n = str(name);
    if (this._ns === HTML_NS && this._doc._isHTML) n = n.toLowerCase();
    return this._findAttr(n) !== null;
  }
  hasAttributeNS(ns, localName) {
    return this._findAttrNS(ns === "" ? null : ns, str(localName)) !== null;
  }
  hasAttributes() {
    return this._attrs !== null && this._attrs.length > 0;
  }
  getAttributeNames() {
    return (this._attrs ?? []).map((a) => a._name);
  }
  getAttributeNode(name) {
    let n = str(name);
    if (this._ns === HTML_NS && this._doc._isHTML) n = n.toLowerCase();
    return this._findAttr(n);
  }
  getAttributeNodeNS(ns, localName) {
    return this._findAttrNS(ns === "" ? null : ns, str(localName));
  }
  setAttributeNode(attr) {
    if (attr._ownerElement && attr._ownerElement !== this) {
      throw domException(
        "The attribute is in use by another element.",
        "InUseAttributeError",
      );
    }
    const old = this._findAttrNS(attr._ns, attr._localName);
    if (old === attr) return attr;
    if (old) this._removeAttr(old);
    attr._doc = this._doc;
    this._appendAttr(attr);
    return old;
  }
  setAttributeNodeNS(attr) {
    return this.setAttributeNode(attr);
  }
  removeAttributeNode(attr) {
    if (!this._attrs?.includes(attr)) {
      throw domException(
        "The attribute is not owned by this element.",
        "NotFoundError",
      );
    }
    this._removeAttr(attr);
    return attr;
  }
  get attributes() {
    return (this._attrMap ??= new NamedNodeMap(INTERNAL, this));
  }

  get id() {
    return this._id;
  }
  set id(v) {
    this._setAttrRaw("id", str(v));
  }
  get className() {
    return this._className;
  }
  set className(v) {
    this._setAttrRaw("class", str(v));
  }
  get classList() {
    return (this._classList ??= new DOMTokenList(INTERNAL, this, "class"));
  }
  set classList(v) {
    this.classList.value = v;
  }
  get slot() {
    return this._getAttrRaw("slot") ?? "";
  }
  set slot(v) {
    this._setAttrRaw("slot", str(v));
  }

  // Tree helpers ---------------------------------------------------------------

  matches(selectors) {
    return matchesSelector(this, compile(str(selectors)), this);
  }
  webkitMatchesSelector(selectors) {
    return this.matches(selectors);
  }
  closest(selectors) {
    const compiled = compile(str(selectors));
    for (let el = this; el; el = el._parent) {
      if (el.nodeType !== ELEMENT_NODE) return null;
      if (matchesSelector(el, compiled, this)) return el;
    }
    return null;
  }
  getElementsByTagName(name) {
    return elementsByTagName(this, str(name));
  }
  getElementsByTagNameNS(ns, localName) {
    return elementsByTagNameNS(this, ns === "" ? null : ns, str(localName));
  }
  getElementsByClassName(names) {
    return elementsByClassName(this, str(names));
  }

  get innerHTML() {
    return serializeChildren(this);
  }
  set innerHTML(v) {
    const html = v === null ? "" : str(v);
    const target = this._content ?? this;
    const frag = new DocumentFragment(INTERNAL, target._doc);
    parseFragmentInto(frag, html, this, target._doc);
    replaceAll(target, frag);
  }
  get outerHTML() {
    return serializeNode(this);
  }
  set outerHTML(v) {
    const parent = this._parent;
    if (!parent) return;
    if (parent.nodeType === 9) {
      throw domException(
        "Cannot set outerHTML on the document element.",
        "NoModificationAllowedError",
      );
    }
    const context =
      parent.nodeType === 11
        ? this._doc._createElementNS(HTML_NS, "body", null)
        : parent;
    const frag = new DocumentFragment(INTERNAL, this._doc);
    parseFragmentInto(frag, v === null ? "" : str(v), context, this._doc);
    parent.replaceChild(frag, this);
  }
  insertAdjacentHTML(position, text) {
    const pos = str(position).toLowerCase();
    let context;
    if (pos === "beforebegin" || pos === "afterend") {
      context = this._parent;
      if (!context || context.nodeType === 9) {
        throw domException(
          "The element has no parent.",
          "NoModificationAllowedError",
        );
      }
    } else {
      context = this;
    }
    if (context.nodeType !== ELEMENT_NODE)
      context = this._doc._createElementNS(HTML_NS, "body", null);
    const frag = new DocumentFragment(INTERNAL, this._doc);
    parseFragmentInto(frag, str(text), context, this._doc);
    insertAdjacent(this, pos, frag);
  }
  insertAdjacentElement(position, element) {
    return insertAdjacent(this, str(position).toLowerCase(), element);
  }
  insertAdjacentText(position, data) {
    insertAdjacent(
      this,
      str(position).toLowerCase(),
      new Text(INTERNAL, this._doc, str(data)),
    );
  }

  // Geometry (no layout) -------------------------------------------------------------

  getBoundingClientRect() {
    return new DOMRect(0, 0, 0, 0);
  }
  getClientRects() {
    return new DOMRectList([]);
  }
  get clientTop() {
    return 0;
  }
  get clientLeft() {
    return 0;
  }
  get clientWidth() {
    return 0;
  }
  get clientHeight() {
    return 0;
  }
  get scrollWidth() {
    return 0;
  }
  get scrollHeight() {
    return 0;
  }
  get scrollTop() {
    return this._scrollTop;
  }
  set scrollTop(v) {
    this._scrollTop = Number(v) || 0;
  }
  get scrollLeft() {
    return this._scrollLeft;
  }
  set scrollLeft(v) {
    this._scrollLeft = Number(v) || 0;
  }

  // Shadow DOM: enough for code that probes it; no slotting or retargeting.
  attachShadow(init) {
    if (this._shadowRoot) {
      throw domException(
        "Shadow root cannot be created on a host which already hosts a shadow tree.",
        "NotSupportedError",
      );
    }
    const root = new ShadowRoot(INTERNAL, this._doc);
    root._host = this;
    root._mode = init?.mode === "closed" ? "closed" : "open";
    this._shadowRoot = root;
    return root;
  }
  get shadowRoot() {
    return this._shadowRoot && this._shadowRoot._mode === "open"
      ? this._shadowRoot
      : null;
  }
  get assignedSlot() {
    return null;
  }

  _cloneShallow(doc, deep) {
    const copy = doc._createElementNS(this._ns, this._localName, this._prefix);
    if (this._attrs) {
      for (const a of this._attrs)
        copy._appendAttrRaw(a._ns, a._prefix, a._localName, a._value);
    }
    this._cloneState?.(copy, deep);
    return copy;
  }

  // Disabled state for :disabled/:enabled; overridden by form controls.
  _disabledState() {
    return undefined;
  }
}
mixin(Element, ParentNode, ChildNode, NonDocumentTypeChildNode);
tag(Element);

export class ShadowRoot extends DocumentFragment {
  get host() {
    return this._host;
  }
  get mode() {
    return this._mode;
  }
  get innerHTML() {
    return serializeChildren(this);
  }
  set innerHTML(v) {
    const frag = new DocumentFragment(INTERNAL, this._doc);
    parseFragmentInto(frag, str(v), null, this._doc);
    replaceAll(this, frag);
  }
  get activeElement() {
    return null;
  }
}
tag(ShadowRoot);

function insertAdjacent(el, pos, node) {
  switch (pos) {
    case "beforebegin":
      if (!el._parent) return null;
      preInsert(el._parent, node, el);
      return node;
    case "afterbegin":
      preInsert(el, node, el._first);
      return node;
    case "beforeend":
      preInsert(el, node, null);
      return node;
    case "afterend":
      if (!el._parent) return null;
      preInsert(el._parent, node, el._next);
      return node;
  }
  throw domException(
    `The value provided ('${pos}') is not one of the allowed positions.`,
    "SyntaxError",
  );
}

// --- Live element collections ------------------------------------------------------

function descendantsWhere(root, pred) {
  const out = [];
  for (let n = root._first; n; n = nextInTree(n, root)) {
    if (n.nodeType === ELEMENT_NODE && pred(n)) out.push(n);
  }
  return out;
}

function docVersion(root) {
  return () => (root._doc ?? root)._version;
}

export function elementsByTagName(root, name) {
  if (name === "*")
    return liveHTMLCollection({
      version: docVersion(root),
      items: () => descendantsWhere(root, () => true),
    });
  const lower = name.toLowerCase();
  return liveHTMLCollection({
    version: docVersion(root),
    items: () =>
      descendantsWhere(root, (el) =>
        el._ns === HTML_NS && el._doc._isHTML
          ? el._qname === lower
          : el._qname === name,
      ),
  });
}

function elementsByTagNameNS(root, ns, localName) {
  return liveHTMLCollection({
    version: docVersion(root),
    items: () =>
      descendantsWhere(
        root,
        (el) =>
          (ns === "*" || el._ns === ns) &&
          (localName === "*" || el._localName === localName),
      ),
  });
}

export function elementsByClassName(root, names) {
  const wanted = splitTokens(names);
  return liveHTMLCollection({
    version: docVersion(root),
    items: () => {
      if (wanted.length === 0) return [];
      return descendantsWhere(root, (el) => {
        if (!el._className) return false;
        const t =
          el._classTokens ?? (el._classTokens = splitTokens(el._className));
        return wanted.every((w) => t.includes(w));
      });
    },
  });
}

setLiveChildren((parent) =>
  liveHTMLCollection({
    version: () => parent._cv,
    items: () => childArray(parent).filter((c) => c.nodeType === ELEMENT_NODE),
  }),
);

// --- Focus --------------------------------------------------------------------------

function isInert(el) {
  for (let e = el; e; e = e._parent) {
    if (
      e.nodeType === ELEMENT_NODE &&
      e._ns === HTML_NS &&
      e._getAttrRaw("inert") !== null
    )
      return true;
  }
  return false;
}

function hasValidTabIndex(el) {
  const v = el._getAttrRaw("tabindex");
  return v !== null && /^\s*[+-]?\d+/.test(v);
}

export function isContentEditable(el) {
  for (let e = el; e && e.nodeType === ELEMENT_NODE; e = e._parent) {
    const v = e._getAttrRaw("contenteditable");
    if (v === null) continue;
    const l = v.toLowerCase();
    if (l === "" || l === "true" || l === "plaintext-only") return true;
    if (l === "false") return false;
  }
  return false;
}

/** Whether `focus()` can move focus to `el` (no rendering checks, like jsdom). */
export function isFocusable(el) {
  if (!el.isConnected || isInert(el)) return false;
  if (el._disabledState() === true) return false;
  if (hasValidTabIndex(el)) return true;
  if (el._ns === HTML_NS) {
    switch (el._localName) {
      case "a":
      case "area":
        return el._getAttrRaw("href") !== null;
      case "button":
      case "select":
      case "textarea":
      case "iframe":
        return true;
      case "input":
        return el._getAttrRaw("type")?.toLowerCase() !== "hidden";
      case "summary":
        return (
          el._parent?._localName === "details" &&
          el._parent.querySelector("summary") === el
        );
      case "audio":
      case "video":
        return el._getAttrRaw("controls") !== null;
    }
    return isContentEditable(el);
  }
  if (el._ns === SVG_NS && el._localName === "a")
    return (
      el.hasAttribute("href") ||
      el.hasAttributeNS("http://www.w3.org/1999/xlink", "href")
    );
  return false;
}

const TEXT_ENTRY = new Set([
  "text",
  "search",
  "url",
  "tel",
  "email",
  "password",
  "number",
  "date",
  "month",
  "week",
  "time",
  "datetime-local",
]);

function focusVisibleFor(doc, el) {
  if (doc._lastInput !== "pointer") return true;
  if (el._localName === "textarea" || isContentEditable(el)) return true;
  return el._localName === "input" && TEXT_ENTRY.has(el.type);
}

export function focusElement(el) {
  if (!isFocusable(el)) return;
  const doc = el._doc;
  let previous = doc._focused;
  if (previous && !previous.isConnected) previous = doc._focused = null;
  if (previous === el) return;
  doc._focusVisible = focusVisibleFor(doc, el);
  if (previous) {
    fire(
      previous,
      "blur",
      { relatedTarget: el, composed: true, view: doc._defaultView },
      FocusEvent,
    );
    fire(
      previous,
      "focusout",
      {
        relatedTarget: el,
        bubbles: true,
        composed: true,
        view: doc._defaultView,
      },
      FocusEvent,
    );
  }
  // A blur handler may have moved focus or removed the element.
  if (!el.isConnected) return;
  doc._focused = el;
  fire(
    el,
    "focus",
    { relatedTarget: previous, composed: true, view: doc._defaultView },
    FocusEvent,
  );
  fire(
    el,
    "focusin",
    {
      relatedTarget: previous,
      bubbles: true,
      composed: true,
      view: doc._defaultView,
    },
    FocusEvent,
  );
}

export function blurElement(el) {
  const doc = el._doc;
  if (doc._focused !== el) return;
  doc._focused = null;
  fire(
    el,
    "blur",
    { relatedTarget: null, composed: true, view: doc._defaultView },
    FocusEvent,
  );
  fire(
    el,
    "focusout",
    {
      relatedTarget: null,
      bubbles: true,
      composed: true,
      view: doc._defaultView,
    },
    FocusEvent,
  );
}

// --- Reflection helpers ---------------------------------------------------------------

export function reflectString(proto, prop, attr = prop.toLowerCase()) {
  Object.defineProperty(proto, prop, {
    get() {
      return this._getAttrRaw(attr) ?? "";
    },
    set(v) {
      this._setAttrRaw(attr, str(v));
    },
    configurable: true,
    enumerable: true,
  });
}

export function reflectNullableString(proto, prop, attr = prop.toLowerCase()) {
  Object.defineProperty(proto, prop, {
    get() {
      return this._getAttrRaw(attr);
    },
    set(v) {
      if (v === null) this._removeAttrRaw(attr);
      else this._setAttrRaw(attr, str(v));
    },
    configurable: true,
    enumerable: true,
  });
}

export function reflectBool(proto, prop, attr = prop.toLowerCase()) {
  Object.defineProperty(proto, prop, {
    get() {
      return this._getAttrRaw(attr) !== null;
    },
    set(v) {
      if (v) {
        if (this._getAttrRaw(attr) === null) this._setAttrRaw(attr, "");
      } else {
        this._removeAttrRaw(attr);
      }
    },
    configurable: true,
    enumerable: true,
  });
}

function parseInteger(s) {
  const m = /^[\t\n\f\r ]*([+-]?\d+)/.exec(s);
  return m ? Number.parseInt(m[1], 10) : null;
}

export function reflectInt(
  proto,
  prop,
  attr,
  def,
  { nonNegative = false, min = null } = {},
) {
  Object.defineProperty(proto, prop, {
    get() {
      const v = this._getAttrRaw(attr);
      if (v === null) return typeof def === "function" ? def(this) : def;
      const n = parseInteger(v);
      if (n === null || n > 2147483647 || n < -2147483648)
        return typeof def === "function" ? def(this) : def;
      if (nonNegative && n < 0)
        return typeof def === "function" ? def(this) : def;
      if (min !== null && n < min)
        return typeof def === "function" ? def(this) : def;
      return n;
    },
    set(v) {
      const n = Math.trunc(Number(v)) | 0;
      if ((nonNegative || min !== null) && n < (min ?? 0)) {
        throw domException(
          `The value provided (${n}) is negative.`,
          "IndexSizeError",
        );
      }
      this._setAttrRaw(attr, String(n));
    },
    configurable: true,
    enumerable: true,
  });
}

export function reflectEnum(
  proto,
  prop,
  attr,
  values,
  missing = "",
  invalid = missing,
) {
  Object.defineProperty(proto, prop, {
    get() {
      const v = this._getAttrRaw(attr);
      if (v === null) return missing;
      const l = v.toLowerCase();
      return values.includes(l) ? l : invalid;
    },
    set(v) {
      this._setAttrRaw(attr, str(v));
    },
    configurable: true,
    enumerable: true,
  });
}

export function resolveURL(el, value) {
  try {
    return new URL(value, el._doc.baseURI).href;
  } catch {
    return value;
  }
}

export function reflectURL(proto, prop, attr = prop.toLowerCase()) {
  Object.defineProperty(proto, prop, {
    get() {
      const v = this._getAttrRaw(attr);
      return v === null ? "" : resolveURL(this, v);
    },
    set(v) {
      this._setAttrRaw(attr, str(v));
    },
    configurable: true,
    enumerable: true,
  });
}

// --- HTMLElement ------------------------------------------------------------------------

/** Element classes by local name; filled in by html.js and forms.js. */
export const HTML_CLASSES = new Map();
export const SVG_CLASSES = new Map();

const DEFAULT_TABBABLE = new Set([
  "a",
  "area",
  "button",
  "frame",
  "iframe",
  "input",
  "object",
  "select",
  "textarea",
  "summary",
]);

export class HTMLOrSVGElement {
  get dataset() {
    return (this._dataset ??= createDataset(this));
  }
  get style() {
    return (this._style ??= new CSSStyleDeclaration(INTERNAL, this));
  }
  set style(v) {
    this.style.cssText = v;
  }
  get tabIndex() {
    const v = this._getAttrRaw("tabindex");
    if (v !== null) {
      const n = parseInteger(v);
      if (n !== null) return n;
    }
    if (
      this._ns === HTML_NS &&
      (DEFAULT_TABBABLE.has(this._localName) || isContentEditable(this))
    )
      return 0;
    if (this._ns === SVG_NS && this._localName === "a") return 0;
    return -1;
  }
  set tabIndex(v) {
    this._setAttrRaw("tabindex", String(Math.trunc(Number(v)) | 0));
  }
  get nonce() {
    return this._getAttrRaw("nonce") ?? "";
  }
  set nonce(v) {
    this._setAttrRaw("nonce", str(v));
  }
  get autofocus() {
    return this._getAttrRaw("autofocus") !== null;
  }
  set autofocus(v) {
    if (v) this._setAttrRaw("autofocus", "");
    else this._removeAttrRaw("autofocus");
  }
  focus() {
    focusElement(this);
  }
  blur() {
    blurElement(this);
  }
}

export class HTMLElement extends Element {
  get offsetParent() {
    return null;
  }
  get offsetTop() {
    return 0;
  }
  get offsetLeft() {
    return 0;
  }
  get offsetWidth() {
    return 0;
  }
  get offsetHeight() {
    return 0;
  }
  get isContentEditable() {
    return isContentEditable(this);
  }
  get contentEditable() {
    const v = this._getAttrRaw("contenteditable");
    if (v === null) return "inherit";
    const l = v.toLowerCase();
    if (l === "" || l === "true") return "true";
    if (l === "false" || l === "plaintext-only") return l;
    return "inherit";
  }
  set contentEditable(v) {
    const l = str(v).toLowerCase();
    if (l === "inherit") this._removeAttrRaw("contenteditable");
    else if (l === "true" || l === "false" || l === "plaintext-only")
      this._setAttrRaw("contenteditable", l);
    else
      throw domException(
        "The value provided is not one of 'true', 'false', 'plaintext-only', or 'inherit'.",
        "SyntaxError",
      );
  }
  click() {
    if (this._disabledState() === true || this._clickInProgress) return;
    this._clickInProgress = true;
    const event = new PointerEvent("click", {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: this._doc._defaultView,
      pointerId: -1,
    });
    try {
      dispatch(this, event);
    } finally {
      this._clickInProgress = false;
    }
  }
}
// innerText is deliberately absent, as in jsdom, rather than approximated.
mixin(HTMLElement, HTMLOrSVGElement);
for (const p of [
  "title",
  "lang",
  "accessKey",
  "autocapitalize",
  "enterKeyHint",
  "inputMode",
]) {
  reflectString(HTMLElement.prototype, p);
}
reflectEnum(HTMLElement.prototype, "dir", "dir", ["ltr", "rtl", "auto"]);
reflectBool(HTMLElement.prototype, "hidden");
reflectBool(HTMLElement.prototype, "inert");
Object.defineProperty(HTMLElement.prototype, "translate", {
  get() {
    for (let e = this; e && e.nodeType === ELEMENT_NODE; e = e._parent) {
      const v = e._getAttrRaw("translate");
      if (v === "" || v?.toLowerCase() === "yes") return true;
      if (v?.toLowerCase() === "no") return false;
    }
    return true;
  },
  set(v) {
    this._setAttrRaw("translate", v ? "yes" : "no");
  },
  configurable: true,
});
Object.defineProperty(HTMLElement.prototype, "draggable", {
  get() {
    const v = this._getAttrRaw("draggable")?.toLowerCase();
    if (v === "true") return true;
    if (v === "false") return false;
    return (
      this._localName === "img" ||
      (this._localName === "a" && this._getAttrRaw("href") !== null)
    );
  },
  set(v) {
    this._setAttrRaw("draggable", v ? "true" : "false");
  },
  configurable: true,
});
Object.defineProperty(HTMLElement.prototype, "spellcheck", {
  get() {
    for (let e = this; e && e.nodeType === ELEMENT_NODE; e = e._parent) {
      const v = e._getAttrRaw("spellcheck")?.toLowerCase();
      if (v === "" || v === "true") return true;
      if (v === "false") return false;
    }
    return true;
  },
  set(v) {
    this._setAttrRaw("spellcheck", v ? "true" : "false");
  },
  configurable: true,
});
tag(HTMLElement);

export class HTMLUnknownElement extends HTMLElement {}
tag(HTMLUnknownElement);

export class SVGElement extends Element {
  get ownerSVGElement() {
    for (
      let p = this._parent;
      p && p.nodeType === ELEMENT_NODE;
      p = p._parent
    ) {
      if (p._ns === SVG_NS && p._localName === "svg") return p;
    }
    return null;
  }
  get viewportElement() {
    return this.ownerSVGElement;
  }
  get className() {
    const el = this;
    return {
      get baseVal() {
        return el._className;
      },
      set baseVal(v) {
        el._setAttrRaw("class", str(v));
      },
      get animVal() {
        return el._className;
      },
    };
  }
}
mixin(SVGElement, HTMLOrSVGElement);
tag(SVGElement);

export class SVGGraphicsElement extends SVGElement {
  getBBox() {
    return new DOMRect(0, 0, 0, 0);
  }
  getCTM() {
    return null;
  }
  getScreenCTM() {
    return null;
  }
}
tag(SVGGraphicsElement);

export class SVGSVGElement extends SVGGraphicsElement {
  createSVGRect() {
    return new DOMRect();
  }
}
tag(SVGSVGElement);
SVG_CLASSES.set("svg", SVGSVGElement);
for (const n of "g path rect circle ellipse line polyline polygon text use image foreignObject tspan".split(
  " ",
)) {
  SVG_CLASSES.set(n, SVGGraphicsElement);
}

/** Creates an element of the right interface. */
export function createElementInternal(doc, ns, localName, prefix) {
  let Ctor;
  if (ns === HTML_NS) {
    Ctor =
      HTML_CLASSES.get(localName) ??
      (localName.includes("-") ? HTMLElement : HTMLUnknownElement);
  } else if (ns === SVG_NS) {
    Ctor = SVG_CLASSES.get(localName) ?? SVGElement;
  } else {
    Ctor = Element;
  }
  return new Ctor(INTERNAL, doc, ns, prefix, localName);
}

export { HTMLCollection, insertNode, MouseEvent, staticNodeList, touch };
