// Document, HTMLDocument, DOMImplementation, DOMParser, XMLSerializer.

import { liveHTMLCollection, staticNodeList } from "./collections.js";
import {
  Attr,
  createElementInternal,
  elementsByClassName,
  elementsByTagName,
  HTMLElement,
} from "./element.js";
import { CREATE_EVENT_INTERFACES, hooks } from "./events.js";
import {
  adopt,
  CDATASection,
  Comment,
  cloneNode,
  current,
  DocumentFragment,
  DocumentType,
  Node,
  nextInTree,
  ParentNode,
  ProcessingInstruction,
  removeNode,
  setTextContent,
  Text,
} from "./node.js";
import { parseDocumentInto, serializeNode } from "./parser.js";
import { NodeIterator, Range, Selection, TreeWalker } from "./range.js";
import {
  DOCUMENT_FRAGMENT_NODE,
  DOCUMENT_NODE,
  domException,
  ELEMENT_NODE,
  HTML_NS,
  INTERNAL,
  illegalConstructor,
  mixin,
  SVG_NS,
  str,
  tag,
  XML_NS,
  XMLNS_NS,
} from "./shared.js";

const NAME_START = /^[:A-Z_a-zÀ-ÖØ-öø-˿Ͱ-ͽͿ-῿‌-‍⁰-↏Ⰰ-⿯、-퟿豈-﷏ﷰ-�]/;
const NAME_REST = /^[-.0-9:A-Z_a-z·À-ÖØ-öø-ͽͿ-῿‌-‍‿-⁀⁰-↏Ⰰ-⿯、-퟿豈-﷏ﷰ-�]*$/;

function validateElementName(name) {
  if (!NAME_START.test(name) || !NAME_REST.test(name.slice(1))) {
    throw domException(
      `The tag name provided ('${name}') is not a valid name.`,
      "InvalidCharacterError",
    );
  }
}

function validateAndExtract(ns, qname) {
  ns = ns === "" || ns === undefined ? null : ns;
  validateElementName(qname);
  const colon = qname.indexOf(":");
  const prefix = colon === -1 ? null : qname.slice(0, colon);
  const localName = colon === -1 ? qname : qname.slice(colon + 1);
  if (prefix !== null && ns === null)
    throw domException("Namespace error.", "NamespaceError");
  if (prefix === "xml" && ns !== XML_NS)
    throw domException("Namespace error.", "NamespaceError");
  if ((qname === "xmlns" || prefix === "xmlns") !== (ns === XMLNS_NS)) {
    throw domException("Namespace error.", "NamespaceError");
  }
  return { ns, prefix, localName };
}

export class Document extends Node {
  constructor(token) {
    // `new Document()` is allowed and creates an XML document.
    super(INTERNAL, null);
    this._doc = this;
    this._isHTML = false;
    this._contentType = "application/xml";
    this._url = "about:blank";
    this._focused = null;
    this._focusVisible = false;
    this._lastInput = null;
    this._version = 0;
    this._defaultView = null;
    this._templateDocument = null;
    this._allStyles = new Set();
    this._selection = null;
    this._cookies = new Map();
    this._implementation = null;
    this._childrenList = null;
    if (token !== INTERNAL && token !== undefined) illegalConstructor();
  }

  get nodeType() {
    return DOCUMENT_NODE;
  }
  get nodeName() {
    return "#document";
  }
  get ownerDocument() {
    return null;
  }
  get textContent() {
    return null;
  }
  set textContent(_v) {}

  get implementation() {
    return (this._implementation ??= new DOMImplementation(INTERNAL, this));
  }
  get URL() {
    return this._url;
  }
  get documentURI() {
    return this._url;
  }
  get baseURI() {
    const base = this.querySelector("base[href]");
    if (base) {
      try {
        return new URL(base.getAttribute("href"), this._url).href;
      } catch {}
    }
    return this._url;
  }
  get compatMode() {
    return this.doctype ? "CSS1Compat" : "BackCompat";
  }
  get characterSet() {
    return "UTF-8";
  }
  get charset() {
    return "UTF-8";
  }
  get inputEncoding() {
    return "UTF-8";
  }
  get contentType() {
    return this._contentType;
  }
  get doctype() {
    for (let c = this._first; c; c = c._next) if (c.nodeType === 10) return c;
    return null;
  }
  get documentElement() {
    for (let c = this._first; c; c = c._next)
      if (c.nodeType === ELEMENT_NODE) return c;
    return null;
  }
  get head() {
    const html = this.documentElement;
    if (!html) return null;
    for (let c = html._first; c; c = c._next)
      if (
        c.nodeType === ELEMENT_NODE &&
        c._localName === "head" &&
        c._ns === HTML_NS
      )
        return c;
    return null;
  }
  get body() {
    const html = this.documentElement;
    if (!html) return null;
    for (let c = html._first; c; c = c._next) {
      if (
        c.nodeType === ELEMENT_NODE &&
        c._ns === HTML_NS &&
        (c._localName === "body" || c._localName === "frameset")
      )
        return c;
    }
    return null;
  }
  set body(el) {
    if (
      !el ||
      el._ns !== HTML_NS ||
      (el._localName !== "body" && el._localName !== "frameset")
    ) {
      throw domException(
        "The new body element must be a 'BODY' or 'FRAMESET' element.",
        "HierarchyRequestError",
      );
    }
    const old = this.body;
    if (old === el) return;
    if (old) old._parent.replaceChild(el, old);
    else {
      const html = this.documentElement;
      if (!html)
        throw domException("No document element.", "HierarchyRequestError");
      html.appendChild(el);
    }
  }
  get title() {
    const root = this.documentElement;
    if (root?._ns === SVG_NS) {
      for (let c = root._first; c; c = c._next)
        if (c.nodeType === ELEMENT_NODE && c._localName === "title")
          return c.textContent;
      return "";
    }
    const t = this.querySelector("title");
    return t ? t.textContent.replace(/[\t\n\f\r ]+/g, " ").trim() : "";
  }
  set title(v) {
    let t = this.querySelector("title");
    if (!t) {
      const head = this.head;
      if (!head) return;
      t = this.createElement("title");
      head.appendChild(t);
    }
    setTextContent(t, v);
  }
  get dir() {
    return this.documentElement?.dir ?? "";
  }
  set dir(v) {
    if (this.documentElement) this.documentElement.dir = v;
  }
  get activeElement() {
    const f = this._focused;
    if (f?.isConnected) return f;
    return this.body ?? this.documentElement ?? null;
  }
  hasFocus() {
    return true;
  }
  get defaultView() {
    return this._defaultView;
  }
  get location() {
    return this._defaultView?.location ?? null;
  }
  get readyState() {
    return "complete";
  }
  get visibilityState() {
    return "visible";
  }
  get hidden() {
    return false;
  }
  get referrer() {
    return "";
  }
  get domain() {
    try {
      return new URL(this._url).hostname;
    } catch {
      return "";
    }
  }
  get lastModified() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${p(d.getMonth() + 1)}/${p(d.getDate())}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }
  get designMode() {
    return "off";
  }
  set designMode(_v) {}
  get scrollingElement() {
    return this.documentElement;
  }
  get fullscreenElement() {
    return null;
  }
  get pointerLockElement() {
    return null;
  }
  get currentScript() {
    return null;
  }
  get cookie() {
    return [...this._cookies].map(([k, v]) => (k ? `${k}=${v}` : v)).join("; ");
  }
  set cookie(v) {
    const [pair, ...attrs] = str(v).split(";");
    const eq = pair.indexOf("=");
    const name = eq === -1 ? "" : pair.slice(0, eq).trim();
    const value = eq === -1 ? pair.trim() : pair.slice(eq + 1).trim();
    let expired = false;
    for (const a of attrs) {
      const [k, val] = a.split("=").map((s) => s?.trim());
      if (k?.toLowerCase() === "max-age" && Number(val) <= 0) expired = true;
      if (k?.toLowerCase() === "expires" && Date.parse(val) <= Date.now())
        expired = true;
    }
    if (expired) this._cookies.delete(name);
    else this._cookies.set(name, value);
  }

  get forms() {
    return this._collection("form");
  }
  get images() {
    return this._collection("img");
  }
  get scripts() {
    return this._collection("script");
  }
  get embeds() {
    return this._collection("embed");
  }
  get plugins() {
    return this._collection("embed");
  }
  get links() {
    return liveHTMLCollection({
      version: () => this._version,
      items: () => this.querySelectorAll("a[href], area[href]")._items,
    });
  }
  get anchors() {
    return liveHTMLCollection({
      version: () => this._version,
      items: () => this.querySelectorAll("a[name]")._items,
    });
  }
  _collection(name) {
    return liveHTMLCollection({
      version: () => this._version,
      items: () => this.querySelectorAll(name)._items,
    });
  }
  get styleSheets() {
    const sheets = this._styleSheets() ?? [];
    const list = {
      length: sheets.length,
      item: (i) => sheets[i] ?? null,
      [Symbol.iterator]: () => sheets[Symbol.iterator](),
    };
    sheets.forEach((s, i) => {
      list[i] = s;
    });
    return list;
  }
  _styleSheets() {
    if (this._allStyles.size === 0) return null;
    const out = [];
    for (let n = this._first; n; n = nextInTree(n, this)) {
      if (
        n.nodeType === ELEMENT_NODE &&
        n._localName === "style" &&
        n._ns === HTML_NS &&
        n._sheet &&
        !n._sheet._disabled
      ) {
        out.push(n._sheet);
      }
    }
    return out;
  }

  // Factories ---------------------------------------------------------------

  _createElementNS(ns, localName, prefix) {
    return createElementInternal(this, ns, localName, prefix);
  }
  createElement(localName, _options) {
    let name = str(localName);
    validateElementName(name);
    if (this._isHTML) name = name.toLowerCase();
    const ns =
      this._isHTML || this._contentType === "application/xhtml+xml"
        ? HTML_NS
        : null;
    return createElementInternal(this, ns, name, null);
  }
  createElementNS(ns, qname, _options) {
    const { ns: n, prefix, localName } = validateAndExtract(ns, str(qname));
    return createElementInternal(this, n, localName, prefix);
  }
  createTextNode(data) {
    return new Text(INTERNAL, this, str(data));
  }
  createComment(data) {
    return new Comment(INTERNAL, this, str(data));
  }
  createCDATASection(data) {
    if (this._isHTML)
      throw domException(
        "This operation is not supported for HTML documents.",
        "NotSupportedError",
      );
    return new CDATASection(INTERNAL, this, str(data));
  }
  createProcessingInstruction(target, data) {
    return new ProcessingInstruction(INTERNAL, this, str(target), str(data));
  }
  createDocumentFragment() {
    return new DocumentFragment(INTERNAL, this);
  }
  createAttribute(name) {
    let n = str(name);
    validateElementName(n);
    if (this._isHTML) n = n.toLowerCase();
    return new Attr(INTERNAL, this, null, null, n, "", null);
  }
  createAttributeNS(ns, qname) {
    const { ns: n, prefix, localName } = validateAndExtract(ns, str(qname));
    return new Attr(INTERNAL, this, n, prefix, localName, "", null);
  }
  createEvent(name) {
    const Ctor = CREATE_EVENT_INTERFACES[str(name).toLowerCase()];
    if (!Ctor)
      throw domException(
        `The provided event type ('${name}') is invalid.`,
        "NotSupportedError",
      );
    const event = new Ctor("");
    event._initialized = false;
    return event;
  }
  createRange() {
    const prev = current.document;
    current.document = this;
    try {
      return new Range();
    } finally {
      current.document = prev;
    }
  }
  createTreeWalker(root, whatToShow = 0xffffffff, filter = null) {
    return new TreeWalker(INTERNAL, root, whatToShow, filter);
  }
  createNodeIterator(root, whatToShow = 0xffffffff, filter = null) {
    return new NodeIterator(INTERNAL, root, whatToShow, filter);
  }
  importNode(node, deep = false) {
    if (
      node.nodeType === DOCUMENT_NODE ||
      (node.nodeType === DOCUMENT_FRAGMENT_NODE && node._mode !== undefined)
    ) {
      throw domException(
        "The node provided is a document.",
        "NotSupportedError",
      );
    }
    return cloneNode(node, this, !!deep);
  }
  adoptNode(node) {
    if (node.nodeType === DOCUMENT_NODE)
      throw domException(
        "The node provided is a document.",
        "NotSupportedError",
      );
    if (node._parent) removeNode(node);
    if (node._doc !== this) adopt(node, this);
    return node;
  }

  getElementById(id) {
    id = str(id);
    if (id === "") return null;
    for (let n = this._first; n; n = nextInTree(n, this)) {
      if (n.nodeType === ELEMENT_NODE && n._id === id) return n;
    }
    return null;
  }
  getElementsByName(name) {
    const n = str(name);
    return staticNodeList(
      this.querySelectorAll("[name]")._items.filter(
        (el) => el.getAttribute("name") === n,
      ),
    );
  }
  getElementsByTagName(name) {
    return elementsByTagName(this, str(name));
  }
  getElementsByTagNameNS(_ns, localName) {
    return this.documentElement
      ? elementsByTagName(this, str(localName))
      : elementsByTagName(this, "*");
  }
  getElementsByClassName(names) {
    return elementsByClassName(this, str(names));
  }
  elementFromPoint() {
    return null;
  }
  elementsFromPoint() {
    return [];
  }
  getSelection() {
    return this._defaultView
      ? (this._selection ??= new Selection(INTERNAL, this))
      : null;
  }
  execCommand() {
    return false;
  }
  queryCommandSupported() {
    return false;
  }
  queryCommandEnabled() {
    return false;
  }
  open() {
    return this;
  }
  close() {}
  write() {}
  writeln() {}

  _templateDoc() {
    if (this._templateDocument) return this._templateDocument;
    if (!this._defaultView && this._isTemplateDoc) return this;
    const doc = new HTMLDocument(INTERNAL);
    doc._isTemplateDoc = true;
    doc._url = this._url;
    doc._templateDocument = doc;
    this._templateDocument = doc;
    return doc;
  }
  _cloneShallow() {
    const doc = this._isHTML
      ? new HTMLDocument(INTERNAL)
      : new Document(INTERNAL);
    doc._contentType = this._contentType;
    doc._url = this._url;
    return doc;
  }
}
mixin(Document, ParentNode);
tag(Document);

export class HTMLDocument extends Document {
  constructor(token) {
    super(token);
    this._isHTML = true;
    this._contentType = "text/html";
  }
}
tag(HTMLDocument);

export class XMLDocument extends Document {}
tag(XMLDocument);

/** A fresh HTML document with the standard skeleton. */
export function createHTMLDocument(url, title) {
  const doc = new HTMLDocument(INTERNAL);
  doc._url = url;
  parseDocumentInto(
    doc,
    "<!DOCTYPE html><html><head></head><body></body></html>",
  );
  if (title !== undefined) doc.title = title;
  return doc;
}

export class DOMImplementation {
  constructor(token, doc) {
    if (token !== INTERNAL) illegalConstructor();
    this._doc = doc;
  }
  createHTMLDocument(title) {
    return createHTMLDocument("about:blank", title);
  }
  createDocument(ns, qname, doctype = null) {
    const doc = new XMLDocument(INTERNAL);
    if (ns === HTML_NS) doc._contentType = "application/xhtml+xml";
    else if (ns === SVG_NS) doc._contentType = "image/svg+xml";
    if (doctype) doc.appendChild(doctype);
    if (qname) doc.appendChild(doc.createElementNS(ns, qname));
    return doc;
  }
  createDocumentType(name, publicId, systemId) {
    return new DocumentType(
      INTERNAL,
      this._doc,
      str(name),
      str(publicId),
      str(systemId),
    );
  }
  hasFeature() {
    return true;
  }
}
tag(DOMImplementation);

export class DOMParser {
  parseFromString(string, type) {
    const t = str(type);
    if (t === "text/html") {
      const doc = new HTMLDocument(INTERNAL);
      doc._url = current.document?._url ?? "about:blank";
      parseDocumentInto(doc, str(string));
      return doc;
    }
    if (
      [
        "text/xml",
        "application/xml",
        "application/xhtml+xml",
        "image/svg+xml",
      ].includes(t)
    ) {
      const doc = new XMLDocument(INTERNAL);
      doc._contentType = t;
      const scratch = new HTMLDocument(INTERNAL);
      parseDocumentInto(scratch, str(string));
      const body = scratch.body;
      for (let c = body?._first; c; c = c._next)
        doc.appendChild(cloneNode(c, doc, true));
      return doc;
    }
    throw new TypeError(
      `The provided value '${t}' is not a valid enum value of type DOMParserSupportedType.`,
    );
  }
}
tag(DOMParser);

export class XMLSerializer {
  serializeToString(node) {
    if (
      node.nodeType === DOCUMENT_NODE ||
      node.nodeType === DOCUMENT_FRAGMENT_NODE
    ) {
      let out = "";
      for (let c = node._first; c; c = c._next) out += serializeNode(c);
      return out;
    }
    return serializeNode(node);
  }
}
tag(XMLSerializer);

// Event dispatch path: element -> ... -> document -> window.
hooks.getParent = (target, event) => {
  if (target instanceof Node) {
    if (target.nodeType === DOCUMENT_NODE)
      return event._type === "load" ? null : target._defaultView;
    return (
      target._parent ?? (target._host && event._composed ? target._host : null)
    );
  }
  return null;
};

// :focus-visible heuristics: remember whether the last input was keyboard or pointer.
hooks.beforeDispatch = (target, event) => {
  const t = event._type;
  if (t === "keydown") {
    const doc = target._doc ?? target.document ?? null;
    if (doc) doc._lastInput = "keyboard";
  } else if (t === "mousedown" || t === "pointerdown") {
    const doc = target._doc ?? target.document ?? null;
    if (doc) doc._lastInput = "pointer";
  }
};

export { HTMLElement };
