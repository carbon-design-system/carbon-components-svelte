// Node and the tree algorithms (insert, remove, clone, adopt), plus the
// non-element node types. Children are a doubly linked list of fields on
// each node, so insertion and removal are O(1) pointer updates.

import { liveNodeList, staticNodeList } from "./collections.js";
import { EventTarget } from "./events.js";
import { observing, queueMutation } from "./mutation.js";
import {
  compile,
  matchesSelector,
  querySelectorAllFrom,
  querySelectorFrom,
} from "./selector.js";
import {
  ATTRIBUTE_NODE,
  CDATA_SECTION_NODE,
  COMMENT_NODE,
  DOCUMENT_FRAGMENT_NODE,
  DOCUMENT_NODE,
  DOCUMENT_TYPE_NODE,
  defineConstants,
  domException,
  ELEMENT_NODE,
  INTERNAL,
  illegalConstructor,
  mixin,
  PROCESSING_INSTRUCTION_NODE,
  str,
  TEXT_NODE,
  tag,
} from "./shared.js";

/** Live Range bookkeeping, filled in by range.js. */
export const rangeHooks = {
  count: 0,
  onInsert: null,
  onRemove: null,
  onTextChange: null,
};

/** Set by document.js: the window's current document, for `new Text()` etc. */
export const current = { document: null };

export class Node extends EventTarget {
  constructor(token, doc) {
    if (token !== INTERNAL) illegalConstructor();
    super();
    this._doc = doc;
    this._parent = null;
    this._first = null;
    this._last = null;
    this._prev = null;
    this._next = null;
    this._childCount = 0;
    this._cv = 0;
    this._childList = null;
    this._regs = null;
  }

  get nodeType() {
    return 0;
  }
  get nodeName() {
    return "";
  }
  get baseURI() {
    return (this._doc ?? this).baseURI;
  }
  get isConnected() {
    let n = this;
    while (n._parent) n = n._parent;
    return n.nodeType === DOCUMENT_NODE;
  }
  get ownerDocument() {
    return this._doc;
  }
  getRootNode() {
    let n = this;
    while (n._parent) n = n._parent;
    return n;
  }
  get parentNode() {
    return this._parent;
  }
  get parentElement() {
    const p = this._parent;
    return p && p.nodeType === ELEMENT_NODE ? p : null;
  }
  hasChildNodes() {
    return this._first !== null;
  }
  get childNodes() {
    return (this._childList ??= liveNodeList({
      version: () => this._cv,
      items: () => childArray(this),
    }));
  }
  get firstChild() {
    return this._first;
  }
  get lastChild() {
    return this._last;
  }
  get previousSibling() {
    return this._prev;
  }
  get nextSibling() {
    return this._next;
  }
  get nodeValue() {
    return null;
  }
  set nodeValue(_v) {}
  get textContent() {
    return null;
  }
  set textContent(_v) {}

  normalize() {
    let child = this._first;
    while (child) {
      const next = child._next;
      if (child.nodeType === TEXT_NODE) {
        if (child._data === "") {
          removeNode(child);
        } else {
          let data = "";
          let sib = child._next;
          while (sib && sib.nodeType === TEXT_NODE) {
            data += sib._data;
            const after = sib._next;
            removeNode(sib);
            sib = after;
          }
          if (data) child.appendData(data);
          child = sib;
          continue;
        }
      } else if (child._first) {
        child.normalize();
      }
      child = next;
    }
  }

  cloneNode(deep = false) {
    return cloneNode(this, this._doc, !!deep);
  }

  isEqualNode(other) {
    return other != null && nodesEqual(this, other);
  }
  isSameNode(other) {
    return this === other;
  }

  compareDocumentPosition(other) {
    return comparePosition(this, other);
  }

  contains(other) {
    for (let n = other ?? null; n; n = n._parent) if (n === this) return true;
    return false;
  }

  lookupPrefix(_ns) {
    return null;
  }
  lookupNamespaceURI(prefix) {
    let el = this.nodeType === ELEMENT_NODE ? this : this.parentElement;
    if (this.nodeType === DOCUMENT_NODE) el = this.documentElement;
    for (; el; el = el.parentElement) {
      if (el._ns && el._prefix === (prefix || null)) return el._ns;
    }
    return null;
  }
  isDefaultNamespace(ns) {
    return this.lookupNamespaceURI(null) === (ns || null);
  }

  insertBefore(node, child) {
    return preInsert(this, node, child ?? null);
  }
  appendChild(node) {
    return preInsert(this, node, null);
  }
  replaceChild(node, child) {
    return replaceChild(this, node, child);
  }
  removeChild(child) {
    if (!child || child._parent !== this) {
      throw domException(
        "The node to be removed is not a child of this node.",
        "NotFoundError",
      );
    }
    removeNode(child);
    return child;
  }

  // Overridden by subclasses that react to their children changing
  // (textarea default value, <style> sheet, select options, template).
  _childrenChanged() {}
}
defineConstants(Node, {
  ELEMENT_NODE,
  ATTRIBUTE_NODE,
  TEXT_NODE,
  CDATA_SECTION_NODE,
  ENTITY_REFERENCE_NODE: 5,
  ENTITY_NODE: 6,
  PROCESSING_INSTRUCTION_NODE,
  COMMENT_NODE,
  DOCUMENT_NODE,
  DOCUMENT_TYPE_NODE,
  DOCUMENT_FRAGMENT_NODE,
  NOTATION_NODE: 12,
  DOCUMENT_POSITION_DISCONNECTED: 1,
  DOCUMENT_POSITION_PRECEDING: 2,
  DOCUMENT_POSITION_FOLLOWING: 4,
  DOCUMENT_POSITION_CONTAINS: 8,
  DOCUMENT_POSITION_CONTAINED_BY: 16,
  DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC: 32,
});
tag(Node);

export function childArray(node) {
  const out = new Array(node._childCount);
  let i = 0;
  for (let c = node._first; c; c = c._next) out[i++] = c;
  return out;
}

/** Bumps versions that live collections and caches key off. */
export function touch(node) {
  node._cv++;
  const doc = node._doc ?? node;
  doc._version++;
}

// --- Character data ---------------------------------------------------------

export class CharacterData extends Node {
  constructor(token, doc, data) {
    super(token, doc);
    this._data = data;
  }
  get data() {
    return this._data;
  }
  set data(v) {
    replaceData(this, 0, this._data.length, v === null ? "" : str(v));
  }
  get nodeValue() {
    return this._data;
  }
  set nodeValue(v) {
    replaceData(this, 0, this._data.length, v === null ? "" : str(v));
  }
  get textContent() {
    return this._data;
  }
  set textContent(v) {
    replaceData(this, 0, this._data.length, v === null ? "" : str(v));
  }
  get length() {
    return this._data.length;
  }
  substringData(offset, count) {
    if (offset > this._data.length)
      throw domException("Offset out of range.", "IndexSizeError");
    return this._data.substr(offset, count);
  }
  appendData(data) {
    replaceData(this, this._data.length, 0, str(data));
  }
  insertData(offset, data) {
    replaceData(this, offset, 0, str(data));
  }
  deleteData(offset, count) {
    replaceData(this, offset, count, "");
  }
  replaceData(offset, count, data) {
    replaceData(this, offset, count, str(data));
  }
}
tag(CharacterData);

function replaceData(node, offset, count, data) {
  const old = node._data;
  if (offset > old.length)
    throw domException("Offset out of range.", "IndexSizeError");
  if (offset === 0 && count >= old.length) {
    if (data === old) {
      // Still a mutation per spec, but nothing observable changes without observers.
      if (observing.count)
        queueMutation("characterData", node, null, null, old);
      return;
    }
    node._data = data;
  } else {
    node._data = old.slice(0, offset) + data + old.slice(offset + count);
  }
  if (observing.count) queueMutation("characterData", node, null, null, old);
  if (rangeHooks.count)
    rangeHooks.onTextChange(node, offset, count, data.length);
  (node._doc ?? node)._version++;
  node._parent?._childrenChanged(node);
}

export class Text extends CharacterData {
  constructor(data = "") {
    if (data === INTERNAL) {
      super(INTERNAL, arguments[1], arguments[2]);
    } else {
      super(INTERNAL, current.document, str(data));
    }
  }
  get nodeType() {
    return TEXT_NODE;
  }
  get nodeName() {
    return "#text";
  }
  get wholeText() {
    let start = this;
    while (start._prev?.nodeType === TEXT_NODE) start = start._prev;
    let out = "";
    for (let n = start; n && n.nodeType === TEXT_NODE; n = n._next)
      out += n._data;
    return out;
  }
  get assignedSlot() {
    return null;
  }
  splitText(offset) {
    const data = this._data;
    if (offset > data.length)
      throw domException("Offset out of range.", "IndexSizeError");
    const node = new Text(INTERNAL, this._doc, data.slice(offset));
    if (this._parent) insertNode(this._parent, node, this._next);
    replaceData(this, offset, data.length - offset, "");
    return node;
  }
}
tag(Text);

export class CDATASection extends Text {
  get nodeType() {
    return CDATA_SECTION_NODE;
  }
  get nodeName() {
    return "#cdata-section";
  }
}
tag(CDATASection);

export class Comment extends CharacterData {
  constructor(data = "") {
    if (data === INTERNAL) {
      super(INTERNAL, arguments[1], arguments[2]);
    } else {
      super(INTERNAL, current.document, str(data));
    }
  }
  get nodeType() {
    return COMMENT_NODE;
  }
  get nodeName() {
    return "#comment";
  }
}
tag(Comment);

export class ProcessingInstruction extends CharacterData {
  constructor(token, doc, target, data) {
    super(token, doc, data);
    this._target = target;
  }
  get nodeType() {
    return PROCESSING_INSTRUCTION_NODE;
  }
  get nodeName() {
    return this._target;
  }
  get target() {
    return this._target;
  }
}
tag(ProcessingInstruction);

export class DocumentType extends Node {
  constructor(token, doc, name, publicId = "", systemId = "") {
    super(token, doc);
    this._name = name;
    this._publicId = publicId;
    this._systemId = systemId;
  }
  get nodeType() {
    return DOCUMENT_TYPE_NODE;
  }
  get nodeName() {
    return this._name;
  }
  get name() {
    return this._name;
  }
  get publicId() {
    return this._publicId;
  }
  get systemId() {
    return this._systemId;
  }
}
tag(DocumentType);

// --- Mixins -----------------------------------------------------------------

/** Converts `(Node or DOMString)...` arguments into a single node. */
function convertNodes(parent, nodes) {
  const doc = parent._doc ?? parent;
  if (nodes.length === 1) {
    const n = nodes[0];
    return n instanceof Node ? n : new Text(INTERNAL, doc, str(n));
  }
  const frag = new DocumentFragment(INTERNAL, doc);
  for (const n of nodes) {
    preInsert(
      frag,
      n instanceof Node ? n : new Text(INTERNAL, doc, str(n)),
      null,
    );
  }
  return frag;
}

export class ParentNode {
  get children() {
    return (this._childrenList ??= liveChildren(this));
  }
  get childElementCount() {
    let n = 0;
    for (let c = this._first; c; c = c._next)
      if (c.nodeType === ELEMENT_NODE) n++;
    return n;
  }
  get firstElementChild() {
    for (let c = this._first; c; c = c._next)
      if (c.nodeType === ELEMENT_NODE) return c;
    return null;
  }
  get lastElementChild() {
    for (let c = this._last; c; c = c._prev)
      if (c.nodeType === ELEMENT_NODE) return c;
    return null;
  }
  prepend(...nodes) {
    preInsert(this, convertNodes(this, nodes), this._first);
  }
  append(...nodes) {
    preInsert(this, convertNodes(this, nodes), null);
  }
  replaceChildren(...nodes) {
    const node = convertNodes(this, nodes);
    ensurePreInsertionValidity(this, node, null);
    replaceAll(this, node);
  }
  querySelector(selectors) {
    return querySelectorFrom(this, compile(str(selectors)));
  }
  querySelectorAll(selectors) {
    return staticNodeList(querySelectorAllFrom(this, compile(str(selectors))));
  }
}

let liveChildren = null;
/** Set by element.js, which owns HTMLCollection construction for `children`. */
export function setLiveChildren(fn) {
  liveChildren = fn;
}

export class ChildNode {
  before(...nodes) {
    const parent = this._parent;
    if (!parent) return;
    let viablePrev = this._prev;
    while (viablePrev && nodes.includes(viablePrev))
      viablePrev = viablePrev._prev;
    const node = convertNodes(parent, nodes);
    preInsert(parent, node, viablePrev ? viablePrev._next : parent._first);
  }
  after(...nodes) {
    const parent = this._parent;
    if (!parent) return;
    let viableNext = this._next;
    while (viableNext && nodes.includes(viableNext))
      viableNext = viableNext._next;
    preInsert(parent, convertNodes(parent, nodes), viableNext);
  }
  replaceWith(...nodes) {
    const parent = this._parent;
    if (!parent) return;
    let viableNext = this._next;
    while (viableNext && nodes.includes(viableNext))
      viableNext = viableNext._next;
    const node = convertNodes(parent, nodes);
    if (this._parent === parent) replaceChild(parent, node, this);
    else preInsert(parent, node, viableNext);
  }
  remove() {
    if (this._parent) removeNode(this);
  }
}

export class NonDocumentTypeChildNode {
  get previousElementSibling() {
    for (let s = this._prev; s; s = s._prev)
      if (s.nodeType === ELEMENT_NODE) return s;
    return null;
  }
  get nextElementSibling() {
    for (let s = this._next; s; s = s._next)
      if (s.nodeType === ELEMENT_NODE) return s;
    return null;
  }
}

mixin(CharacterData, ChildNode, NonDocumentTypeChildNode);
mixin(DocumentType, ChildNode);

export class DocumentFragment extends Node {
  constructor(token, doc) {
    if (token === INTERNAL) super(INTERNAL, doc);
    else super(INTERNAL, current.document);
    this._host = null;
  }
  get nodeType() {
    return DOCUMENT_FRAGMENT_NODE;
  }
  get nodeName() {
    return "#document-fragment";
  }
  get textContent() {
    return descendantText(this);
  }
  set textContent(v) {
    setTextContent(this, v);
  }
  getElementById(id) {
    id = str(id);
    for (let n = this._first; n; n = nextInTree(n, this)) {
      if (n.nodeType === ELEMENT_NODE && n._id === id) return n;
    }
    return null;
  }
}
mixin(DocumentFragment, ParentNode);
tag(DocumentFragment);

// --- Tree traversal helpers -------------------------------------------------

/** Next node in tree order within `root` (excluding `root` itself). */
export function nextInTree(node, root) {
  if (node._first) return node._first;
  for (let n = node; n && n !== root; n = n._parent) {
    if (n._next) return n._next;
  }
  return null;
}

/** Next node in tree order skipping `node`'s descendants. */
export function nextSkippingChildren(node, root) {
  for (let n = node; n && n !== root; n = n._parent) {
    if (n._next) return n._next;
  }
  return null;
}

export function descendantText(node) {
  let out = "";
  for (let n = node._first; n; n = nextInTree(n, node)) {
    const t = n.nodeType;
    if (t === TEXT_NODE || t === CDATA_SECTION_NODE) out += n._data;
  }
  return out;
}

export function setTextContent(node, v) {
  const value = v === null ? "" : str(v);
  const doc = node._doc ?? node;
  replaceAll(node, value === "" ? null : new Text(INTERNAL, doc, value));
}

export function indexOf(node) {
  let i = 0;
  for (let s = node._prev; s; s = s._prev) i++;
  return i;
}

// --- Insertion and removal ----------------------------------------------------

function isHostIncludingAncestor(ancestor, node) {
  for (let n = node; n; n = n._parent ?? n._host ?? null)
    if (n === ancestor) return true;
  return false;
}

function ensurePreInsertionValidity(parent, node, child) {
  const pt = parent.nodeType;
  if (
    pt !== DOCUMENT_NODE &&
    pt !== DOCUMENT_FRAGMENT_NODE &&
    pt !== ELEMENT_NODE
  ) {
    throw domException(
      "This node type does not support this method.",
      "HierarchyRequestError",
    );
  }
  if (!(node instanceof Node)) {
    throw new TypeError(
      "Failed to execute 'insertBefore' on 'Node': parameter 1 is not of type 'Node'.",
    );
  }
  if (isHostIncludingAncestor(node, parent)) {
    throw domException(
      "The new child element contains the parent.",
      "HierarchyRequestError",
    );
  }
  if (child !== null && child._parent !== parent) {
    throw domException(
      "The node before which the new node is to be inserted is not a child of this node.",
      "NotFoundError",
    );
  }
  const nt = node.nodeType;
  if (nt === DOCUMENT_NODE || nt === ATTRIBUTE_NODE) {
    throw domException(
      "Nodes of type '" + node.nodeName + "' may not be inserted.",
      "HierarchyRequestError",
    );
  }
  if (
    (nt === TEXT_NODE && pt === DOCUMENT_NODE) ||
    (nt === DOCUMENT_TYPE_NODE && pt !== DOCUMENT_NODE)
  ) {
    throw domException(
      "Nodes of that type may not be inserted here.",
      "HierarchyRequestError",
    );
  }
  if (pt === DOCUMENT_NODE) ensureDocumentValidity(parent, node, child, false);
}

function ensureDocumentValidity(doc, node, child, replacing) {
  const nt = node.nodeType;
  const elementCount = (n) => {
    let c = 0;
    for (let x = n._first; x; x = x._next) if (x.nodeType === ELEMENT_NODE) c++;
    return c;
  };
  const docHasElement = () => {
    for (let x = doc._first; x; x = x._next) {
      if (x.nodeType === ELEMENT_NODE && !(replacing && x === child))
        return true;
    }
    return false;
  };
  let adding = 0;
  if (nt === DOCUMENT_FRAGMENT_NODE) adding = elementCount(node);
  else if (nt === ELEMENT_NODE) adding = 1;
  if (adding > 1 || (adding === 1 && docHasElement())) {
    throw domException(
      "Only one element on document allowed.",
      "HierarchyRequestError",
    );
  }
}

/** Pre-insert: validity checks, then insert. Returns `node`. */
export function preInsert(parent, node, child) {
  ensurePreInsertionValidity(parent, node, child);
  let ref = child;
  if (ref === node) ref = node._next;
  insertNode(parent, node, ref);
  return node;
}

/** Inserts `node` (or a fragment's children) into `parent` before `child`. */
export function insertNode(parent, node, child, suppressObservers = false) {
  const isFragment = node.nodeType === DOCUMENT_FRAGMENT_NODE;
  let nodes;
  if (isFragment) {
    if (!node._first) return;
    nodes = childArray(node);
    for (const n of nodes) unlink(n);
    touch(node);
    if (observing.count && !suppressObservers) {
      queueMutation("childList", node, null, null, null, [], nodes, null, null);
    }
  } else {
    if (node._parent) removeNode(node, suppressObservers);
    nodes = null;
  }

  const doc = parent._doc ?? parent;
  const prev = child ? child._prev : parent._last;
  if (rangeHooks.count && child)
    rangeHooks.onInsert(parent, indexOf(child), nodes ? nodes.length : 1);

  if (nodes) {
    for (const n of nodes) {
      if (n._doc !== doc) adopt(n, doc);
      link(parent, n, child);
    }
  } else {
    if (node._doc !== doc) adopt(node, doc);
    link(parent, node, child);
  }
  touch(parent);

  if (observing.count && !suppressObservers) {
    queueMutation(
      "childList",
      parent,
      null,
      null,
      null,
      nodes ?? [node],
      [],
      prev,
      child,
    );
  }
  parent._childrenChanged();
  if (nodes) for (const n of nodes) n._inserted?.();
  else node._inserted?.();
}

/**
 * Parser fast path: appends to a detached parent without observers, ranges,
 * or focus fixup. Still runs `_childrenChanged`/`_inserted` so element state
 * (textarea default value, option selectedness) stays right.
 */
export function appendRaw(parent, node) {
  link(parent, node, null);
  parent._cv++;
  parent._childrenChanged();
  node._inserted?.();
}

function link(parent, node, child) {
  node._parent = parent;
  if (child) {
    const prev = child._prev;
    node._prev = prev;
    node._next = child;
    child._prev = node;
    if (prev) prev._next = node;
    else parent._first = node;
  } else {
    const last = parent._last;
    node._prev = last;
    node._next = null;
    if (last) last._next = node;
    else parent._first = node;
    parent._last = node;
  }
  parent._childCount++;
}

function unlink(node) {
  const parent = node._parent;
  const prev = node._prev;
  const next = node._next;
  if (prev) prev._next = next;
  else parent._first = next;
  if (next) next._prev = prev;
  else parent._last = prev;
  node._parent = null;
  node._prev = null;
  node._next = null;
  parent._childCount--;
}

export function removeNode(node, suppressObservers = false) {
  const parent = node._parent;
  const doc = parent._doc ?? parent;
  if (rangeHooks.count) rangeHooks.onRemove(node, parent, indexOf(node));
  // Focus fixup: losing the focused element leaves focus on the body.
  const focused = doc._focused;
  if (focused && (focused === node || node.contains(focused)))
    doc._focused = null;
  const prev = node._prev;
  const next = node._next;
  unlink(node);
  touch(parent);
  if (observing.count && !suppressObservers) {
    queueMutation(
      "childList",
      parent,
      null,
      null,
      null,
      [],
      [node],
      prev,
      next,
    );
  }
  parent._childrenChanged();
  node._removed?.(parent);
}

function replaceChild(parent, node, child) {
  ensurePreInsertionValidity(parent, node, null);
  if (!child || child._parent !== parent) {
    throw domException(
      "The node to be replaced is not a child of this node.",
      "NotFoundError",
    );
  }
  if (parent.nodeType === DOCUMENT_NODE)
    ensureDocumentValidity(parent, node, child, true);
  let ref = child._next;
  if (ref === node) ref = node._next;
  if (child === node) return child;
  const prev = child._prev;
  const removed = [child];
  removeNode(child, true);
  const added =
    node.nodeType === DOCUMENT_FRAGMENT_NODE ? childArray(node) : [node];
  insertNode(parent, node, ref, true);
  if (observing.count)
    queueMutation(
      "childList",
      parent,
      null,
      null,
      null,
      added,
      removed,
      prev,
      ref,
    );
  return child;
}

/** Replaces all children of `parent` with `node` (which may be null or a fragment). */
export function replaceAll(parent, node) {
  const removed = observing.count ? childArray(parent) : null;
  const added =
    node == null
      ? []
      : node.nodeType === DOCUMENT_FRAGMENT_NODE
        ? childArray(node)
        : [node];
  let c = parent._first;
  while (c) {
    const next = c._next;
    removeNode(c, true);
    c = next;
  }
  if (node) insertNode(parent, node, null, true);
  if (observing.count && (removed.length || added.length)) {
    queueMutation(
      "childList",
      parent,
      null,
      null,
      null,
      added,
      removed,
      null,
      null,
    );
  }
}

/** Moves a subtree into `doc`. */
export function adopt(node, doc) {
  for (let n = node; n; n = nextInTree(n, node)) {
    n._doc = doc;
    if (n._attrs) for (const a of n._attrs) a._doc = doc;
    n._adopted?.(doc);
  }
}

// --- Clone and compare --------------------------------------------------------

export function cloneNode(node, doc, deep) {
  const copy = node._cloneShallow(doc, deep);
  if (deep) {
    for (let c = node._first; c; c = c._next) {
      const childCopy = cloneNode(c, doc, true);
      link(copy, childCopy, null);
    }
    if (copy._first) touch(copy);
    copy._childrenChanged();
  }
  return copy;
}

Text.prototype._cloneShallow = function (doc) {
  return new Text(INTERNAL, doc, this._data);
};
CDATASection.prototype._cloneShallow = function (doc) {
  return new CDATASection(INTERNAL, doc, this._data);
};
Comment.prototype._cloneShallow = function (doc) {
  return new Comment(INTERNAL, doc, this._data);
};
ProcessingInstruction.prototype._cloneShallow = function (doc) {
  return new ProcessingInstruction(INTERNAL, doc, this._target, this._data);
};
DocumentType.prototype._cloneShallow = function (doc) {
  return new DocumentType(
    INTERNAL,
    doc,
    this._name,
    this._publicId,
    this._systemId,
  );
};
DocumentFragment.prototype._cloneShallow = (doc) =>
  new DocumentFragment(INTERNAL, doc);

function nodesEqual(a, b) {
  if (a.nodeType !== b.nodeType) return false;
  switch (a.nodeType) {
    case DOCUMENT_TYPE_NODE:
      if (
        a._name !== b._name ||
        a._publicId !== b._publicId ||
        a._systemId !== b._systemId
      )
        return false;
      break;
    case ELEMENT_NODE: {
      if (
        a._ns !== b._ns ||
        a._prefix !== b._prefix ||
        a._localName !== b._localName
      )
        return false;
      const aa = a._attrs ?? [];
      const ba = b._attrs ?? [];
      if (aa.length !== ba.length) return false;
      for (const x of aa) {
        if (
          !ba.some(
            (y) =>
              y._ns === x._ns &&
              y._localName === x._localName &&
              y._value === x._value,
          )
        ) {
          return false;
        }
      }
      break;
    }
    case PROCESSING_INSTRUCTION_NODE:
      if (a._target !== b._target || a._data !== b._data) return false;
      break;
    case TEXT_NODE:
    case CDATA_SECTION_NODE:
    case COMMENT_NODE:
      if (a._data !== b._data) return false;
      break;
    case ATTRIBUTE_NODE:
      if (
        a._ns !== b._ns ||
        a._localName !== b._localName ||
        a._value !== b._value
      )
        return false;
      break;
  }
  if (a._childCount !== b._childCount) return false;
  for (let x = a._first, y = b._first; x; x = x._next, y = y._next) {
    if (!nodesEqual(x, y)) return false;
  }
  return true;
}

function ancestors(node) {
  const out = [];
  for (let n = node; n; n = n._parent ?? n._ownerElement ?? null) out.push(n);
  return out;
}

function comparePosition(self, other) {
  if (self === other) return 0;
  let node1 = other;
  let node2 = self;
  let attr1 = null;
  let attr2 = null;
  if (node1.nodeType === ATTRIBUTE_NODE) {
    attr1 = node1;
    node1 = attr1._ownerElement;
  }
  if (node2.nodeType === ATTRIBUTE_NODE) {
    attr2 = node2;
    node2 = attr2._ownerElement;
    if (attr1 && node1 && node2 === node1) {
      for (const a of node2._attrs) {
        if (a === attr1) return 32 | 2;
        if (a === attr2) return 32 | 4;
      }
    }
  }
  const a1 = ancestors(node1 ?? other);
  const a2 = ancestors(node2 ?? self);
  if (!node1 || !node2 || a1[a1.length - 1] !== a2[a2.length - 1]) {
    return 1 | 32 | 4;
  }
  if ((!attr1 && a2.includes(node1)) || (attr2 && node2 === node1))
    return 8 | 2;
  if ((!attr2 && a1.includes(node2)) || (attr1 && node1 === node2))
    return 16 | 4;
  // Walk down from the common ancestor to find which branch comes first.
  let i = a1.length - 1;
  let j = a2.length - 1;
  while (i > 0 && j > 0 && a1[i - 1] === a2[j - 1]) {
    i--;
    j--;
  }
  const b1 = a1[i - 1];
  const b2 = a2[j - 1];
  for (let s = b2; s; s = s._next) if (s === b1) return 4;
  return 2;
}

// Selector-based helpers used by Element.matches/closest, defined here so
// node.js stays the single owner of tree walking.
export { compile, matchesSelector };
