// Range, Selection, TreeWalker, NodeIterator, NodeFilter.

import { DOMRect, DOMRectList } from "./geometry.js";
import {
  cloneNode,
  current,
  DocumentFragment,
  indexOf,
  preInsert,
  rangeHooks,
  removeNode,
  Text,
} from "./node.js";
import { parseFragmentInto } from "./parser.js";
import {
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
  PROCESSING_INSTRUCTION_NODE,
  str,
  TEXT_NODE,
  tag,
} from "./shared.js";

const liveRanges = new Set();

function nodeLength(node) {
  switch (node.nodeType) {
    case DOCUMENT_TYPE_NODE:
      return 0;
    case TEXT_NODE:
    case CDATA_SECTION_NODE:
    case COMMENT_NODE:
    case PROCESSING_INSTRUCTION_NODE:
      return node._data.length;
  }
  return node._childCount;
}

function rootOf(node) {
  let n = node;
  while (n._parent) n = n._parent;
  return n;
}

function isCharacterData(node) {
  const t = node.nodeType;
  return (
    t === TEXT_NODE ||
    t === CDATA_SECTION_NODE ||
    t === COMMENT_NODE ||
    t === PROCESSING_INSTRUCTION_NODE
  );
}

/** -1, 0, 1: position of boundary point A relative to B. */
function comparePoints(nodeA, offsetA, nodeB, offsetB) {
  if (nodeA === nodeB)
    return offsetA === offsetB ? 0 : offsetA < offsetB ? -1 : 1;
  const pos = nodeB.compareDocumentPosition(nodeA);
  if (pos & 4 /* A following B */) {
    return -comparePoints(nodeB, offsetB, nodeA, offsetA);
  }
  if (pos & 8 /* A contains B */) {
    let child = nodeB;
    while (child._parent !== nodeA) child = child._parent;
    return indexOf(child) < offsetA ? 1 : -1;
  }
  return -1;
}

export class AbstractRange {
  constructor(token) {
    if (token !== INTERNAL) illegalConstructor();
  }
  get startContainer() {
    return this._sc;
  }
  get startOffset() {
    return this._so;
  }
  get endContainer() {
    return this._ec;
  }
  get endOffset() {
    return this._eo;
  }
  get collapsed() {
    return this._sc === this._ec && this._so === this._eo;
  }
}
tag(AbstractRange);

export class StaticRange extends AbstractRange {
  constructor(init) {
    super(INTERNAL);
    this._sc = init.startContainer;
    this._so = init.startOffset;
    this._ec = init.endContainer;
    this._eo = init.endOffset;
  }
}
tag(StaticRange);

export class Range extends AbstractRange {
  constructor() {
    super(INTERNAL);
    const doc = current.document;
    this._sc = doc;
    this._so = 0;
    this._ec = doc;
    this._eo = 0;
    liveRanges.add(this);
    rangeHooks.count = liveRanges.size;
  }

  get commonAncestorContainer() {
    let container = this._sc;
    while (!container.contains(this._ec)) container = container._parent;
    return container;
  }

  _check(node, offset) {
    if (node.nodeType === DOCUMENT_TYPE_NODE) {
      throw domException(
        "The node provided is a doctype.",
        "InvalidNodeTypeError",
      );
    }
    if (offset > nodeLength(node)) {
      throw domException(
        `The offset ${offset} is larger than the node's length.`,
        "IndexSizeError",
      );
    }
  }
  setStart(node, offset) {
    offset >>>= 0;
    this._check(node, offset);
    this._sc = node;
    this._so = offset;
    if (
      rootOf(node) !== rootOf(this._ec) ||
      comparePoints(node, offset, this._ec, this._eo) > 0
    ) {
      this._ec = node;
      this._eo = offset;
    }
  }
  setEnd(node, offset) {
    offset >>>= 0;
    this._check(node, offset);
    this._ec = node;
    this._eo = offset;
    if (
      rootOf(node) !== rootOf(this._sc) ||
      comparePoints(node, offset, this._sc, this._so) < 0
    ) {
      this._sc = node;
      this._so = offset;
    }
  }
  _parentOf(node) {
    const p = node._parent;
    if (!p)
      throw domException("The node has no parent.", "InvalidNodeTypeError");
    return p;
  }
  setStartBefore(node) {
    this.setStart(this._parentOf(node), indexOf(node));
  }
  setStartAfter(node) {
    this.setStart(this._parentOf(node), indexOf(node) + 1);
  }
  setEndBefore(node) {
    this.setEnd(this._parentOf(node), indexOf(node));
  }
  setEndAfter(node) {
    this.setEnd(this._parentOf(node), indexOf(node) + 1);
  }
  collapse(toStart = false) {
    if (toStart) {
      this._ec = this._sc;
      this._eo = this._so;
    } else {
      this._sc = this._ec;
      this._so = this._eo;
    }
  }
  selectNode(node) {
    const parent = this._parentOf(node);
    const i = indexOf(node);
    this._sc = parent;
    this._so = i;
    this._ec = parent;
    this._eo = i + 1;
  }
  selectNodeContents(node) {
    if (node.nodeType === DOCUMENT_TYPE_NODE) {
      throw domException(
        "The node provided is a doctype.",
        "InvalidNodeTypeError",
      );
    }
    this._sc = node;
    this._so = 0;
    this._ec = node;
    this._eo = nodeLength(node);
  }
  compareBoundaryPoints(how, source) {
    let a;
    let b;
    switch (how) {
      case 0:
        a = [this._sc, this._so];
        b = [source._sc, source._so];
        break;
      case 1:
        a = [this._ec, this._eo];
        b = [source._sc, source._so];
        break;
      case 2:
        a = [this._ec, this._eo];
        b = [source._ec, source._eo];
        break;
      case 3:
        a = [this._sc, this._so];
        b = [source._ec, source._eo];
        break;
      default:
        throw domException(
          "The comparison method provided is not supported.",
          "NotSupportedError",
        );
    }
    return comparePoints(a[0], a[1], b[0], b[1]);
  }
  comparePoint(node, offset) {
    this._check(node, offset);
    if (comparePoints(node, offset, this._sc, this._so) < 0) return -1;
    if (comparePoints(node, offset, this._ec, this._eo) > 0) return 1;
    return 0;
  }
  isPointInRange(node, offset) {
    if (rootOf(node) !== rootOf(this._sc)) return false;
    return this.comparePoint(node, offset) === 0;
  }
  intersectsNode(node) {
    if (rootOf(node) !== rootOf(this._sc)) return false;
    const parent = node._parent;
    if (!parent) return true;
    const i = indexOf(node);
    return (
      comparePoints(parent, i, this._ec, this._eo) < 0 &&
      comparePoints(parent, i + 1, this._sc, this._so) > 0
    );
  }
  cloneRange() {
    const r = new Range();
    r._sc = this._sc;
    r._so = this._so;
    r._ec = this._ec;
    r._eo = this._eo;
    return r;
  }
  detach() {}

  toString() {
    if (this._sc === this._ec && this._sc.nodeType === TEXT_NODE)
      return this._sc._data.slice(this._so, this._eo);
    let out = "";
    if (this._sc.nodeType === TEXT_NODE) out += this._sc._data.slice(this._so);
    const root = this.commonAncestorContainer;
    for (let n = root._first ?? null; n; ) {
      if (
        n.nodeType === TEXT_NODE &&
        n !== this._sc &&
        n !== this._ec &&
        comparePoints(n, 0, this._sc, this._so) >= 0 &&
        comparePoints(n, n._data.length, this._ec, this._eo) <= 0
      ) {
        out += n._data;
      }
      if (n._first) n = n._first;
      else {
        while (n && n !== root && !n._next) n = n._parent;
        n = n && n !== root ? n._next : null;
      }
    }
    if (this._ec.nodeType === TEXT_NODE && this._ec !== this._sc)
      out += this._ec._data.slice(0, this._eo);
    return out;
  }

  _contentsOp(mode) {
    // mode: "clone" | "extract" | "delete"
    const doc = this._sc._doc ?? this._sc;
    const frag = new DocumentFragment(INTERNAL, doc);
    if (this.collapsed) return frag;
    const { _sc: sc, _so: so, _ec: ec, _eo: eo } = this;
    if (sc === ec && isCharacterData(sc)) {
      if (mode !== "delete") {
        const clone = cloneNode(sc, doc, false);
        clone._data = sc._data.slice(so, eo);
        frag.appendChild(clone);
      }
      if (mode !== "clone") sc.replaceData(so, eo - so, "");
      return frag;
    }
    let common = sc;
    while (!common.contains(ec)) common = common._parent;
    let firstPartial = null;
    if (!sc.contains(ec)) {
      firstPartial = sc;
      while (firstPartial._parent !== common)
        firstPartial = firstPartial._parent;
    }
    let lastPartial = null;
    if (!ec.contains(sc)) {
      lastPartial = ec;
      while (lastPartial._parent !== common) lastPartial = lastPartial._parent;
    }
    const contained = [];
    for (let c = common._first; c; c = c._next) {
      if (c === firstPartial || c === lastPartial) continue;
      const i = indexOf(c);
      if (
        comparePoints(common, i, sc, so) >= 0 &&
        comparePoints(common, i + 1, ec, eo) <= 0
      )
        contained.push(c);
    }
    let newNode;
    let newOffset;
    if (mode !== "clone") {
      if (sc.contains(ec)) {
        newNode = sc;
        newOffset = so;
      } else {
        let ref = sc;
        while (ref._parent && !ref._parent.contains(ec)) ref = ref._parent;
        newNode = ref._parent;
        newOffset = indexOf(ref) + 1;
      }
    }
    if (firstPartial) {
      if (isCharacterData(firstPartial)) {
        if (mode !== "delete") {
          const clone = cloneNode(sc, doc, false);
          clone._data = sc._data.slice(so);
          frag.appendChild(clone);
        }
        if (mode !== "clone") sc.replaceData(so, sc._data.length - so, "");
      } else {
        const clone = cloneNode(firstPartial, doc, false);
        if (mode !== "delete") frag.appendChild(clone);
        const sub = new Range();
        sub.setStart(sc, so);
        sub.setEnd(firstPartial, nodeLength(firstPartial));
        const inner = sub._contentsOp(mode);
        liveRanges.delete(sub);
        if (mode !== "delete") clone.appendChild(inner);
      }
    }
    for (const c of contained) {
      if (mode === "clone") frag.appendChild(cloneNode(c, doc, true));
      else if (mode === "extract") frag.appendChild(c);
      else removeNode(c);
    }
    if (lastPartial) {
      if (isCharacterData(lastPartial)) {
        if (mode !== "delete") {
          const clone = cloneNode(ec, doc, false);
          clone._data = ec._data.slice(0, eo);
          frag.appendChild(clone);
        }
        if (mode !== "clone") ec.replaceData(0, eo, "");
      } else {
        const clone = cloneNode(lastPartial, doc, false);
        if (mode !== "delete") frag.appendChild(clone);
        const sub = new Range();
        sub.setStart(lastPartial, 0);
        sub.setEnd(ec, eo);
        const inner = sub._contentsOp(mode);
        liveRanges.delete(sub);
        if (mode !== "delete") clone.appendChild(inner);
      }
    }
    rangeHooks.count = liveRanges.size;
    if (mode !== "clone") {
      this._sc = this._ec = newNode;
      this._so = this._eo = newOffset;
    }
    return frag;
  }
  cloneContents() {
    return this._contentsOp("clone");
  }
  extractContents() {
    return this._contentsOp("extract");
  }
  deleteContents() {
    this._contentsOp("delete");
  }
  insertNode(node) {
    const sc = this._sc;
    if (
      sc.nodeType === COMMENT_NODE ||
      sc.nodeType === PROCESSING_INSTRUCTION_NODE ||
      (sc.nodeType === TEXT_NODE && !sc._parent)
    ) {
      throw domException(
        "The range start is not a valid insertion point.",
        "HierarchyRequestError",
      );
    }
    let ref = null;
    let parent;
    if (sc.nodeType === TEXT_NODE) {
      ref = sc;
      parent = sc._parent;
    } else {
      parent = sc;
      let i = 0;
      for (ref = sc._first; ref && i < this._so; ref = ref._next) i++;
    }
    if (sc.nodeType === TEXT_NODE) ref = sc.splitText(this._so);
    if (ref === node) ref = node._next;
    const newOffset =
      (ref ? indexOf(ref) : parent._childCount) +
      (node.nodeType === DOCUMENT_FRAGMENT_NODE ? node._childCount : 1);
    preInsert(parent, node, ref);
    if (this.collapsed) {
      this._ec = parent;
      this._eo = newOffset;
    }
  }
  surroundContents(newParent) {
    const frag = this.extractContents();
    while (newParent._first) removeNode(newParent._first);
    this.insertNode(newParent);
    newParent.appendChild(frag);
    this.selectNode(newParent);
  }
  createContextualFragment(html) {
    let context = this._sc;
    if (context.nodeType !== ELEMENT_NODE) context = context._parent;
    const doc = this._sc._doc ?? this._sc;
    const frag = new DocumentFragment(INTERNAL, doc);
    parseFragmentInto(
      frag,
      str(html),
      context?.nodeType === ELEMENT_NODE ? context : null,
      doc,
    );
    return frag;
  }
  getBoundingClientRect() {
    return new DOMRect();
  }
  getClientRects() {
    return new DOMRectList([]);
  }
}
defineConstants(Range, {
  START_TO_START: 0,
  START_TO_END: 1,
  END_TO_END: 2,
  END_TO_START: 3,
});
tag(Range);

// Keep live ranges valid across mutations.
rangeHooks.onInsert = (parent, index, count) => {
  for (const r of liveRanges) {
    if (r._sc === parent && r._so > index) r._so += count;
    if (r._ec === parent && r._eo > index) r._eo += count;
  }
};
rangeHooks.onRemove = (node, parent, index) => {
  for (const r of liveRanges) {
    if (node.contains(r._sc)) {
      r._sc = parent;
      r._so = index;
    } else if (r._sc === parent && r._so > index) r._so--;
    if (node.contains(r._ec)) {
      r._ec = parent;
      r._eo = index;
    } else if (r._ec === parent && r._eo > index) r._eo--;
  }
};
rangeHooks.onTextChange = (node, offset, count, added) => {
  for (const r of liveRanges) {
    if (r._sc === node && r._so > offset)
      r._so = r._so <= offset + count ? offset : r._so + added - count;
    if (r._ec === node && r._eo > offset)
      r._eo = r._eo <= offset + count ? offset : r._eo + added - count;
  }
};

// --- Selection --------------------------------------------------------------------------

/** Selection-created ranges stop being tracked once the selection drops them. */
function setSelectionRange(sel, range, backward = false) {
  const old = sel._range;
  if (old && old !== range && old._fromSelection) {
    liveRanges.delete(old);
    rangeHooks.count = liveRanges.size;
  }
  sel._range = range;
  sel._backward = backward;
}

function selectionRange() {
  const r = new Range();
  r._fromSelection = true;
  return r;
}

export class Selection {
  constructor(token, doc) {
    if (token !== INTERNAL) illegalConstructor();
    this._doc = doc;
    this._range = null;
    this._backward = false;
  }
  get anchorNode() {
    if (!this._range) return null;
    return this._backward ? this._range._ec : this._range._sc;
  }
  get anchorOffset() {
    if (!this._range) return 0;
    return this._backward ? this._range._eo : this._range._so;
  }
  get focusNode() {
    if (!this._range) return null;
    return this._backward ? this._range._sc : this._range._ec;
  }
  get focusOffset() {
    if (!this._range) return 0;
    return this._backward ? this._range._so : this._range._eo;
  }
  get isCollapsed() {
    return !this._range || this._range.collapsed;
  }
  get rangeCount() {
    return this._range ? 1 : 0;
  }
  get type() {
    if (!this._range) return "None";
    return this._range.collapsed ? "Caret" : "Range";
  }
  get direction() {
    if (!this._range || this._range.collapsed) return "none";
    return this._backward ? "backward" : "forward";
  }
  getRangeAt(index) {
    if (index !== 0 || !this._range)
      throw domException(`${index} is not a valid index.`, "IndexSizeError");
    return this._range;
  }
  addRange(range) {
    if (this._range || rootOf(range._sc) !== this._doc) return;
    setSelectionRange(this, range);
  }
  removeRange(range) {
    if (range !== this._range)
      throw domException("The given range isn't in document.", "NotFoundError");
    setSelectionRange(this, null);
  }
  removeAllRanges() {
    setSelectionRange(this, null);
  }
  empty() {
    setSelectionRange(this, null);
  }
  collapse(node, offset = 0) {
    if (node === null) {
      setSelectionRange(this, null);
      return;
    }
    const r = selectionRange();
    r.setStart(node, offset);
    setSelectionRange(this, r);
  }
  setPosition(node, offset = 0) {
    this.collapse(node, offset);
  }
  collapseToStart() {
    if (!this._range)
      throw domException(
        "There is no selection to collapse.",
        "InvalidStateError",
      );
    this.collapse(this._range._sc, this._range._so);
  }
  collapseToEnd() {
    if (!this._range)
      throw domException(
        "There is no selection to collapse.",
        "InvalidStateError",
      );
    this.collapse(this._range._ec, this._range._eo);
  }
  extend(node, offset = 0) {
    if (!this._range)
      throw domException(
        "There is no selection to extend.",
        "InvalidStateError",
      );
    const anchorNode = this.anchorNode;
    const anchorOffset = this.anchorOffset;
    this.setBaseAndExtent(anchorNode, anchorOffset, node, offset);
  }
  setBaseAndExtent(anchorNode, anchorOffset, focusNode, focusOffset) {
    const r = selectionRange();
    const backward =
      comparePoints(anchorNode, anchorOffset, focusNode, focusOffset) > 0;
    if (backward) {
      r.setStart(focusNode, focusOffset);
      r.setEnd(anchorNode, anchorOffset);
    } else {
      r.setStart(anchorNode, anchorOffset);
      r.setEnd(focusNode, focusOffset);
    }
    setSelectionRange(this, r, backward);
  }
  selectAllChildren(node) {
    const r = selectionRange();
    r.selectNodeContents(node);
    setSelectionRange(this, r);
  }
  deleteFromDocument() {
    this._range?.deleteContents();
  }
  containsNode(node, allowPartial = false) {
    if (!this._range) return false;
    if (allowPartial) return this._range.intersectsNode(node);
    const parent = node._parent;
    if (!parent) return false;
    const i = indexOf(node);
    return (
      comparePoints(parent, i, this._range._sc, this._range._so) >= 0 &&
      comparePoints(parent, i + 1, this._range._ec, this._range._eo) <= 0
    );
  }
  modify() {}
  toString() {
    return this._range ? this._range.toString() : "";
  }
}
tag(Selection);

// --- NodeFilter, TreeWalker, NodeIterator ---------------------------------------------------

export const NodeFilter = {
  FILTER_ACCEPT: 1,
  FILTER_REJECT: 2,
  FILTER_SKIP: 3,
  SHOW_ALL: 0xffffffff,
  SHOW_ELEMENT: 0x1,
  SHOW_ATTRIBUTE: 0x2,
  SHOW_TEXT: 0x4,
  SHOW_CDATA_SECTION: 0x8,
  SHOW_ENTITY_REFERENCE: 0x10,
  SHOW_ENTITY: 0x20,
  SHOW_PROCESSING_INSTRUCTION: 0x40,
  SHOW_COMMENT: 0x80,
  SHOW_DOCUMENT: 0x100,
  SHOW_DOCUMENT_TYPE: 0x200,
  SHOW_DOCUMENT_FRAGMENT: 0x400,
  SHOW_NOTATION: 0x800,
};

function filterNode(walker, node) {
  if (walker._active)
    throw domException("Recursive filter invocation.", "InvalidStateError");
  const bit = 1 << (node.nodeType - 1);
  if (!(walker._whatToShow & bit)) return 3;
  const f = walker._filter;
  if (f === null) return 1;
  walker._active = true;
  try {
    return typeof f === "function" ? f(node) : f.acceptNode(node);
  } finally {
    walker._active = false;
  }
}

export class TreeWalker {
  constructor(token, root, whatToShow, filter) {
    if (token !== INTERNAL) illegalConstructor();
    this._root = root;
    this._whatToShow = whatToShow >>> 0;
    this._filter = filter ?? null;
    this._current = root;
    this._active = false;
  }
  get root() {
    return this._root;
  }
  get whatToShow() {
    return this._whatToShow;
  }
  get filter() {
    return this._filter;
  }
  get currentNode() {
    return this._current;
  }
  set currentNode(n) {
    this._current = n;
  }
  parentNode() {
    let node = this._current;
    while (node && node !== this._root) {
      node = node._parent;
      if (node && filterNode(this, node) === 1) {
        this._current = node;
        return node;
      }
    }
    return null;
  }
  _traverseChildren(first) {
    let node = first ? this._current._first : this._current._last;
    while (node) {
      const result = filterNode(this, node);
      if (result === 1) {
        this._current = node;
        return node;
      }
      if (result === 3) {
        const child = first ? node._first : node._last;
        if (child) {
          node = child;
          continue;
        }
      }
      while (node) {
        const sibling = first ? node._next : node._prev;
        if (sibling) {
          node = sibling;
          break;
        }
        const parent = node._parent;
        if (!parent || parent === this._root || parent === this._current)
          return null;
        node = parent;
      }
    }
    return null;
  }
  firstChild() {
    return this._traverseChildren(true);
  }
  lastChild() {
    return this._traverseChildren(false);
  }
  _traverseSiblings(next) {
    let node = this._current;
    if (node === this._root) return null;
    while (true) {
      let sibling = next ? node._next : node._prev;
      while (sibling) {
        node = sibling;
        const result = filterNode(this, node);
        if (result === 1) {
          this._current = node;
          return node;
        }
        sibling = next ? node._first : node._last;
        if (result === 2 || !sibling) sibling = next ? node._next : node._prev;
      }
      node = node._parent;
      if (!node || node === this._root) return null;
      if (filterNode(this, node) === 1) return null;
    }
  }
  nextSibling() {
    return this._traverseSiblings(true);
  }
  previousSibling() {
    return this._traverseSiblings(false);
  }
  previousNode() {
    let node = this._current;
    while (node !== this._root) {
      let sibling = node._prev;
      while (sibling) {
        node = sibling;
        let result = filterNode(this, node);
        while (result !== 2 && node._last) {
          node = node._last;
          result = filterNode(this, node);
        }
        if (result === 1) {
          this._current = node;
          return node;
        }
        sibling = node._prev;
      }
      if (node === this._root || !node._parent) return null;
      node = node._parent;
      if (filterNode(this, node) === 1) {
        this._current = node;
        return node;
      }
    }
    return null;
  }
  nextNode() {
    let node = this._current;
    let result = 1;
    while (true) {
      while (result !== 2 && node._first) {
        node = node._first;
        result = filterNode(this, node);
        if (result === 1) {
          this._current = node;
          return node;
        }
      }
      let sibling = null;
      let temp = node;
      while (temp) {
        if (temp === this._root) return null;
        sibling = temp._next;
        if (sibling) break;
        temp = temp._parent;
      }
      if (!sibling) return null;
      node = sibling;
      result = filterNode(this, node);
      if (result === 1) {
        this._current = node;
        return node;
      }
    }
  }
}
tag(TreeWalker);

export class NodeIterator {
  constructor(token, root, whatToShow, filter) {
    if (token !== INTERNAL) illegalConstructor();
    this._root = root;
    this._whatToShow = whatToShow >>> 0;
    this._filter = filter ?? null;
    this._ref = root;
    this._before = true;
    this._active = false;
  }
  get root() {
    return this._root;
  }
  get referenceNode() {
    return this._ref;
  }
  get pointerBeforeReferenceNode() {
    return this._before;
  }
  get whatToShow() {
    return this._whatToShow;
  }
  get filter() {
    return this._filter;
  }
  _following(node) {
    if (node._first) return node._first;
    for (let n = node; n && n !== this._root; n = n._parent)
      if (n._next) return n._next;
    return null;
  }
  _preceding(node) {
    if (node === this._root) return null;
    let n = node._prev;
    if (!n) return node._parent;
    while (n._last) n = n._last;
    return n;
  }
  nextNode() {
    let node = this._ref;
    let before = this._before;
    while (true) {
      if (before) before = false;
      else {
        node = this._following(node);
        if (!node) return null;
      }
      if (filterNode(this, node) === 1) break;
    }
    this._ref = node;
    this._before = before;
    return node;
  }
  previousNode() {
    let node = this._ref;
    let before = this._before;
    while (true) {
      if (before) {
        node = this._preceding(node);
        if (!node) return null;
      } else before = true;
      if (filterNode(this, node) === 1) break;
    }
    this._ref = node;
    this._before = before;
    return node;
  }
  detach() {}
}
tag(NodeIterator);

export { DOCUMENT_NODE, Text };
