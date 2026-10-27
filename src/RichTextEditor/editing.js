// @ts-check

import { sanitizeHtml } from "./sanitize.js";

/**
 * Editing commands for a `contenteditable` host that holds the RichTextEditor
 * schema (see `sanitize.js`). They use the Selection and Range APIs and never
 * `document.execCommand`, which jsdom lacks, which writes whatever markup the
 * browser likes, and which shares an undo stack with the page.
 *
 * Every command that restructures the DOM saves the selection as a *tick
 * offset* first and restores it after. A tick is one character of text, one
 * `<br>`, or the start of a text block, so the offset survives any change
 * that keeps the text and its blocks in order, which is all these commands do.
 */

const ZWSP = "​";
const TEXT_BLOCKS = new Set(["P", "H2", "H3", "LI"]);
const ROOT_CHILDREN = new Set(["P", "H2", "H3", "UL", "OL", "BLOCKQUOTE"]);
const MARK_NAMES = new Set(["STRONG", "EM", "U", "S", "CODE"]);
const INLINE_NAMES = new Set(["STRONG", "EM", "U", "S", "CODE", "A", "BR"]);
const SHOW_ELEMENT = 1;
const SHOW_TEXT = 4;

/** @typedef {"strong" | "em" | "u" | "s" | "code"} MarkTag */
/** @typedef {{ anchor: number, focus: number }} SavedSelection */

/**
 * @param {Node | null} node
 * @returns {node is Element}
 */
function isElement(node) {
  return node?.nodeType === 1;
}

/**
 * @param {Node | null} node
 * @returns {node is Element}
 */
export function isTextBlock(node) {
  return isElement(node) && TEXT_BLOCKS.has(node.nodeName);
}

/** @param {Node} node */
function hasContent(node) {
  return (
    node.textContent !== "" ||
    !!(/** @type {Element | DocumentFragment} */ (node).querySelector?.("br"))
  );
}

/**
 * The text block `node` sits in, below `root`.
 *
 * @param {Node | null} node
 * @param {Element} root
 * @returns {Element | null}
 */
export function closestTextBlock(node, root) {
  for (let n = node; n && n !== root; n = n.parentNode) {
    if (isTextBlock(n)) return n;
  }
  return null;
}

/**
 * The first ancestor of `node`, below `root`, with the given node name.
 *
 * @param {Node | null} node
 * @param {string} name Upper case.
 * @param {Element} root
 * @returns {Element | null}
 */
function closestNamed(node, name, root) {
  for (let n = node; n && n !== root; n = n.parentNode) {
    if (isElement(n) && n.nodeName === name) return n;
  }
  return null;
}

/**
 * @param {Element} root
 * @returns {Selection | null}
 */
function getSelection(root) {
  return root.ownerDocument.defaultView?.getSelection() ?? null;
}

/**
 * The selection's range, when it lies inside `root`.
 *
 * @param {Element} root
 * @returns {Range | null}
 */
export function getRange(root) {
  const selection = getSelection(root);
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  return root.contains(range.startContainer) &&
    root.contains(range.endContainer)
    ? range
    : null;
}

/**
 * Count the ticks before a point.
 *
 * @param {Element} root
 * @param {Node} container
 * @param {number} offset
 */
function pointTicks(root, container, offset) {
  let ticks = 0;
  let done = false;

  /** @param {Node} node */
  function visit(node) {
    if (done) return;
    if (node === container) {
      if (node.nodeType === 3) {
        ticks += offset;
      } else {
        if (node !== root && isTextBlock(node)) ticks++;
        for (let i = 0; i < offset && i < node.childNodes.length; i++) {
          visit(node.childNodes[i]);
        }
      }
      done = true;
      return;
    }
    if (node.nodeType === 3) {
      ticks += /** @type {Text} */ (node).length;
      return;
    }
    if (!isElement(node)) return;
    if (node.nodeName === "BR") {
      ticks++;
      return;
    }
    if (node !== root && isTextBlock(node)) ticks++;
    for (
      let child = node.firstChild;
      child && !done;
      child = child.nextSibling
    ) {
      visit(child);
    }
  }

  visit(root);
  return ticks;
}

/**
 * The DOM point `ticks` ticks into `root`.
 *
 * @param {Element} root
 * @param {number} ticks
 * @returns {{ node: Node, offset: number }}
 */
function locate(root, ticks) {
  let remaining = ticks;
  /** @type {{ node: Node, offset: number } | null} */
  let found = null;

  /** @param {Node} node */
  function visit(node) {
    if (found) return;
    if (node.nodeType === 3) {
      const length = /** @type {Text} */ (node).length;
      if (remaining <= length) found = { node, offset: remaining };
      else remaining -= length;
      return;
    }
    if (!isElement(node)) return;
    const parent = node.parentNode;
    const index = parent
      ? Array.prototype.indexOf.call(parent.childNodes, node)
      : 0;
    if (node.nodeName === "BR") {
      if (remaining === 0 && parent) found = { node: parent, offset: index };
      else remaining--;
      return;
    }
    // A position before a block lands at the block's start instead, where a
    // caret can be.
    if (node !== root && isTextBlock(node) && remaining > 0) remaining--;
    for (
      let child = node.firstChild;
      child && !found;
      child = child.nextSibling
    ) {
      visit(child);
    }
  }

  visit(root);
  return found ?? { node: root, offset: root.childNodes.length };
}

/**
 * @param {Element} root
 * @returns {SavedSelection | null}
 */
export function saveSelection(root) {
  const selection = getSelection(root);
  if (
    !selection?.anchorNode ||
    !selection.focusNode ||
    !root.contains(selection.anchorNode) ||
    !root.contains(selection.focusNode)
  ) {
    return null;
  }
  return {
    anchor: pointTicks(root, selection.anchorNode, selection.anchorOffset),
    focus: pointTicks(root, selection.focusNode, selection.focusOffset),
  };
}

/**
 * @param {Element} root
 * @param {SavedSelection | null} saved
 */
export function restoreSelection(root, saved) {
  const selection = getSelection(root);
  if (!selection || !saved) return;
  const anchor = locate(root, saved.anchor);
  const focus = locate(root, saved.focus);
  selection.setBaseAndExtent(
    anchor.node,
    anchor.offset,
    focus.node,
    focus.offset,
  );
}

/**
 * @param {Document} doc
 * @param {string} html Already sanitized.
 * @returns {DocumentFragment}
 */
export function htmlToFragment(doc, html) {
  const template = doc.createElement("template");
  template.innerHTML = html;
  return template.content;
}

/**
 * Text blocks the range touches. A range that ends at the very start of a
 * block, as a triple click does, leaves that block out.
 *
 * @param {Element} root
 * @param {Range} range
 * @returns {Element[]}
 */
export function textBlocksInRange(root, range) {
  const doc = root.ownerDocument;
  const blocks = [];
  const walker = doc.createTreeWalker(root, SHOW_ELEMENT);
  const first = closestTextBlock(range.startContainer, root);
  if (first) walker.currentNode = first;
  /** @type {Node | null} */
  let node = first ?? walker.nextNode();
  const last = closestTextBlock(range.endContainer, root);
  const trailing =
    !range.collapsed &&
    last &&
    last !== first &&
    range.endOffset === 0 &&
    (range.endContainer === last ||
      (range.endContainer.nodeType === 3 &&
        pointTicks(root, range.endContainer, 0) ===
          pointTicks(root, last, 0) + 1));
  for (; node; node = walker.nextNode()) {
    if (!isTextBlock(node)) continue;
    if (trailing && node === last) break;
    if (!range.intersectsNode(node)) {
      if (blocks.length > 0) break;
      continue;
    }
    // A list item that only holds sub-lists has no text of its own to touch.
    blocks.push(node);
    if (node === last) break;
  }
  return blocks;
}

/**
 * Split the boundary text nodes and return the text nodes inside the range.
 *
 * @param {Element} root
 * @param {Range} range
 * @returns {Text[]}
 */
function selectedTextNodes(root, range) {
  const { endContainer, endOffset } = range;
  if (
    endContainer.nodeType === 3 &&
    endOffset > 0 &&
    endOffset < /** @type {Text} */ (endContainer).length
  ) {
    /** @type {Text} */ (endContainer).splitText(endOffset);
  }
  const { startContainer, startOffset } = range;
  if (
    startContainer.nodeType === 3 &&
    startOffset > 0 &&
    startOffset < /** @type {Text} */ (startContainer).length
  ) {
    /** @type {Text} */ (startContainer).splitText(startOffset);
  }
  const ancestor = range.commonAncestorContainer;
  /** @type {Text[]} */
  const nodes = [];
  /** @param {Node} node */
  const consider = (node) => {
    const text = /** @type {Text} */ (node);
    if (
      text.length > 0 &&
      range.comparePoint(text, 0) === 0 &&
      range.comparePoint(text, text.length) === 0
    ) {
      nodes.push(text);
    }
  };
  if (ancestor.nodeType === 3) {
    consider(ancestor);
    return nodes;
  }
  const walker = root.ownerDocument.createTreeWalker(ancestor, SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    consider(node);
  }
  return nodes;
}

/**
 * Move `node` out of `ancestor`, splitting `ancestor` around it, so that
 * `ancestor` holds only the path down to `node`.
 *
 * @param {Node} node
 * @param {Element} ancestor
 */
function isolate(node, ancestor) {
  const doc = ancestor.ownerDocument;
  const after = doc.createRange();
  after.setStartAfter(node);
  after.setEnd(ancestor, ancestor.childNodes.length);
  const afterContent = after.extractContents();
  const before = doc.createRange();
  before.setStart(ancestor, 0);
  before.setEndBefore(node);
  const beforeContent = before.extractContents();
  if (hasContent(afterContent)) {
    const clone = /** @type {Element} */ (ancestor.cloneNode(false));
    clone.appendChild(afterContent);
    ancestor.after(clone);
  }
  if (hasContent(beforeContent)) {
    const clone = /** @type {Element} */ (ancestor.cloneNode(false));
    clone.appendChild(beforeContent);
    ancestor.before(clone);
  }
}

/** @param {Element} element */
function unwrap(element) {
  while (element.firstChild) element.before(element.firstChild);
  element.remove();
}

/**
 * Take the mark `name` off one text node.
 *
 * @param {Text} text
 * @param {string} name Upper case.
 * @param {Element} root
 */
function removeMark(text, name, root) {
  for (let mark = closestNamed(text, name, root); mark;) {
    isolate(text, mark);
    unwrap(mark);
    mark = closestNamed(text, name, root);
  }
}

/**
 * Merge neighbouring marks of the same kind.
 *
 * @param {Element} parent
 * @returns {boolean} Whether any were merged.
 */
function mergeInline(parent) {
  let changed = false;
  for (let child = parent.firstChild; child;) {
    // Splitting a text node at its end leaves an empty one that would keep
    // two marks apart.
    if (child.nodeType === 3 && /** @type {Text} */ (child).length === 0) {
      const following = child.nextSibling;
      child.remove();
      child = following;
      changed = true;
      continue;
    }
    if (
      isElement(child) &&
      (MARK_NAMES.has(child.nodeName) || child.nodeName === "A")
    ) {
      // Deleting across a mark's edge leaves it empty.
      if (!hasContent(child)) {
        const following = child.nextSibling;
        child.remove();
        child = following;
        changed = true;
        continue;
      }
      for (
        let next = child.nextSibling;
        isElement(next) && sameMark(child, next);
        next = child.nextSibling
      ) {
        while (next.firstChild) child.appendChild(next.firstChild);
        next.remove();
        changed = true;
      }
      if (mergeInline(child)) changed = true;
    }
    child = child.nextSibling;
  }
  return changed;
}

/**
 * @param {Element} a
 * @param {Element} b
 */
function sameMark(a, b) {
  return (
    a.nodeName === b.nodeName &&
    (a.nodeName !== "A" || a.getAttribute("href") === b.getAttribute("href"))
  );
}

/**
 * Create the editing commands for `root`.
 *
 * @param {HTMLElement} root The `contenteditable` host.
 */
export function createEditing(root) {
  const doc = root.ownerDocument;
  /** Zero-width text nodes holding the caret inside a mark toggled on an empty selection. */
  const pending = /** @type {Set<Text>} */ (new Set());

  /**
   * @param {Element[]} blocks
   */
  function tidy(blocks) {
    for (const block of new Set(blocks)) {
      if (!block.isConnected) continue;
      mergeInline(block);
      block.normalize();
    }
  }

  /**
   * Run `change` and keep the selection on the same text.
   * @param {() => void} change
   */
  function keepingSelection(change) {
    const saved = saveSelection(root);
    change();
    restoreSelection(root, saved);
  }

  /**
   * Whether a mark covers the whole selection.
   * @param {Range} range
   * @param {string} name Upper case.
   */
  function covered(range, name) {
    if (range.collapsed)
      return !!closestNamed(range.startContainer, name, root);
    const walker = doc.createTreeWalker(
      range.commonAncestorContainer.nodeType === 3
        ? /** @type {Node} */ (range.commonAncestorContainer.parentNode)
        : range.commonAncestorContainer,
      SHOW_TEXT,
    );
    let any = false;
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = /** @type {Text} */ (node);
      if (!text.length || !range.intersectsNode(text)) continue;
      // Skip a node the range only touches at an edge.
      if (
        (text === range.endContainer && range.endOffset === 0) ||
        (text === range.startContainer && range.startOffset === text.length)
      ) {
        continue;
      }
      any = true;
      if (!closestNamed(text, name, root)) return false;
    }
    return any || !!closestNamed(range.commonAncestorContainer, name, root);
  }

  /**
   * Toggle an inline mark on the selection, or on the next text typed when
   * the selection is a caret.
   *
   * @param {MarkTag} tag
   * @returns {boolean}
   */
  function toggleMark(tag) {
    const range = getRange(root);
    if (!range) return false;
    const name = tag.toUpperCase();

    if (range.collapsed) {
      toggleCaretMark(range, tag);
      return true;
    }

    const blocks = textBlocksInRange(root, range);
    keepingSelection(() => {
      const live = /** @type {Range} */ (getRange(root));
      const remove = covered(live, name);
      for (const text of selectedTextNodes(root, live)) {
        if (remove) removeMark(text, name, root);
        else if (!closestNamed(text, name, root)) {
          const mark = doc.createElement(tag);
          text.before(mark);
          mark.appendChild(text);
        }
      }
    });
    tidy(blocks);
    return true;
  }

  /**
   * @param {Range} range
   * @param {MarkTag} tag
   */
  function toggleCaretMark(range, tag) {
    const selection = getSelection(root);
    if (!selection) return;
    const mark = closestNamed(range.startContainer, tag.toUpperCase(), root);
    const filler = doc.createTextNode(ZWSP);
    pending.add(filler);

    if (!mark) {
      const element = doc.createElement(tag);
      element.appendChild(filler);
      range.insertNode(element);
      selection.collapse(filler, 1);
      return;
    }

    // Leave the mark: split it at the caret and put the filler between.
    const after = doc.createRange();
    after.setStart(range.startContainer, range.startOffset);
    after.setEnd(mark, mark.childNodes.length);
    const tail = after.extractContents();
    mark.after(filler);
    if (hasContent(tail)) {
      const clone = /** @type {Element} */ (mark.cloneNode(false));
      clone.appendChild(tail);
      filler.after(clone);
    }
    if (!hasContent(mark)) mark.remove();
    selection.collapse(filler, 1);
  }

  /**
   * Drop the zero-width fillers left by a mark toggled at a caret, once text
   * has been typed after them or the caret has moved away.
   */
  function flushPending() {
    const selection = getSelection(root);
    const caret = selection?.isCollapsed ? selection.anchorNode : null;
    for (const text of pending) {
      if (!text.isConnected) {
        pending.delete(text);
        continue;
      }
      if (text.data === ZWSP) {
        if (text === caret) continue;
        const parent = text.parentElement;
        text.remove();
        pending.delete(text);
        pruneEmpty(parent);
        continue;
      }
      for (
        let i = text.data.indexOf(ZWSP);
        i !== -1;
        i = text.data.indexOf(ZWSP)
      ) {
        text.deleteData(i, 1);
      }
      if (text.data === "") {
        const parent = text.parentElement;
        text.remove();
        pruneEmpty(parent);
      }
      pending.delete(text);
    }
  }

  /** @param {Element | null} element */
  function pruneEmpty(element) {
    let current = element;
    while (
      current &&
      current !== root &&
      MARK_NAMES.has(current.nodeName) &&
      !hasContent(current)
    ) {
      const parent = current.parentElement;
      current.remove();
      current = parent;
    }
  }

  /**
   * Which formats the selection is in, for the toolbar's pressed states.
   * @returns {Set<string>}
   */
  function queryState() {
    /** @type {Set<string>} */
    const active = new Set();
    const range = getRange(root);
    if (!range) return active;
    for (const tag of /** @type {MarkTag[]} */ ([
      "strong",
      "em",
      "u",
      "s",
      "code",
    ])) {
      if (covered(range, tag.toUpperCase())) active.add(tag);
    }
    if (
      range.collapsed
        ? closestNamed(range.startContainer, "A", root)
        : range.commonAncestorContainer.parentElement?.closest?.("a") ||
          (isElement(range.commonAncestorContainer) &&
            range.commonAncestorContainer.querySelector("a"))
    ) {
      active.add("link");
    }
    const blocks = textBlocksInRange(root, range);
    if (blocks.length === 0) return active;
    const names = new Set(blocks.map((b) => b.nodeName));
    if (names.size === 1) {
      const [name] = names;
      if (name === "H2") active.add("h2");
      else if (name === "H3") active.add("h3");
      else if (name === "P") active.add("paragraph");
    }
    if (
      blocks.every(
        (b) => b.nodeName === "LI" && b.parentNode?.nodeName === "UL",
      )
    )
      active.add("ul");
    if (
      blocks.every(
        (b) => b.nodeName === "LI" && b.parentNode?.nodeName === "OL",
      )
    )
      active.add("ol");
    if (blocks.every((b) => b.parentNode?.nodeName === "BLOCKQUOTE"))
      active.add("blockquote");
    if (blocks.some((b) => b.nodeName === "LI")) active.add("list");
    return active;
  }

  /**
   * @param {Element} block
   * @param {string} tag
   * @returns {Element}
   */
  function retag(block, tag) {
    const next = doc.createElement(tag);
    while (block.firstChild) next.appendChild(block.firstChild);
    block.replaceWith(next);
    return next;
  }

  /**
   * Set the selected top-level blocks to a paragraph or heading. Choosing the
   * heading they already are turns them back into paragraphs.
   *
   * @param {"p" | "h2" | "h3"} tag
   * @returns {boolean}
   */
  function setBlock(tag) {
    const range = getRange(root);
    if (!range) return false;
    const blocks = textBlocksInRange(root, range).filter(
      (block) => block.parentNode === root,
    );
    if (blocks.length === 0) return false;
    const name = tag.toUpperCase();
    const target =
      tag !== "p" && blocks.every((block) => block.nodeName === name)
        ? "p"
        : tag;
    keepingSelection(() => {
      for (const block of blocks) {
        if (block.nodeName !== target.toUpperCase()) retag(block, target);
      }
    });
    return true;
  }

  /**
   * Move a list item out one level. A nested item goes after its parent item,
   * taking the items that followed it as its own children. A top-level item
   * becomes a paragraph. Returns the element that took its place.
   *
   * @param {Element} item
   * @returns {Element}
   */
  function liftItem(item) {
    const list = /** @type {Element} */ (item.parentNode);
    const parentItem =
      list.parentNode?.nodeName === "LI"
        ? /** @type {Element} */ (list.parentNode)
        : null;
    /** @type {Element[]} */
    const following = [];
    for (let s = item.nextElementSibling; s; s = s.nextElementSibling)
      following.push(s);

    if (parentItem) {
      if (following.length > 0) {
        const last = item.lastElementChild;
        let sub =
          last && (last.nodeName === "UL" || last.nodeName === "OL")
            ? last
            : null;
        if (!sub) {
          sub = /** @type {Element} */ (list.cloneNode(false));
          item.appendChild(sub);
        }
        for (const sibling of following) sub.appendChild(sibling);
      }
      parentItem.after(item);
      if (list.childElementCount === 0) list.remove();
      return item;
    }

    const paragraph = doc.createElement("p");
    /** @type {Element[]} */
    const sublists = [];
    while (item.firstChild) {
      const child = item.firstChild;
      if (
        isElement(child) &&
        (child.nodeName === "UL" || child.nodeName === "OL")
      ) {
        sublists.push(child);
        child.remove();
      } else paragraph.appendChild(child);
    }
    if (!hasContent(paragraph)) paragraph.appendChild(doc.createElement("br"));
    /** @type {Element | null} */
    let rest = null;
    if (following.length > 0) {
      rest = /** @type {Element} */ (list.cloneNode(false));
      for (const sibling of following) rest.appendChild(sibling);
    }
    item.remove();
    /** @type {Element} */
    let anchor = list;
    if (list.childElementCount === 0) {
      list.replaceWith(paragraph);
    } else {
      list.after(paragraph);
    }
    anchor = paragraph;
    for (const sublist of sublists) {
      anchor.after(sublist);
      anchor = sublist;
    }
    if (rest) anchor.after(rest);
    return paragraph;
  }

  /** Join neighbouring top-level lists of the same kind. */
  function mergeLists() {
    for (let child = root.firstElementChild; child;) {
      const next = child.nextElementSibling;
      if (
        next &&
        (child.nodeName === "UL" || child.nodeName === "OL") &&
        child.nodeName === next.nodeName
      ) {
        while (next.firstChild) child.appendChild(next.firstChild);
        next.remove();
        continue;
      }
      child = next;
    }
  }

  /**
   * Make the selected blocks a bulleted or numbered list, or take them out of
   * one when they all are already in that kind of list.
   *
   * @param {"ul" | "ol"} type
   * @returns {boolean}
   */
  function toggleList(type) {
    const range = getRange(root);
    if (!range) return false;
    const blocks = textBlocksInRange(root, range).filter(
      (block) => block.nodeName === "LI" || block.parentNode === root,
    );
    if (blocks.length === 0) return false;
    const name = type.toUpperCase();
    keepingSelection(() => {
      const off = blocks.every(
        (block) =>
          block.nodeName === "LI" && block.parentNode?.nodeName === name,
      );
      if (off) {
        for (const item of blocks) {
          let element = item;
          while (element.nodeName === "LI") element = liftItem(element);
        }
      } else {
        for (const block of blocks) {
          if (block.nodeName === "LI") {
            const list = /** @type {Element} */ (block.parentNode);
            if (list.nodeName !== name) retag(list, type);
            continue;
          }
          const item = doc.createElement("li");
          while (block.firstChild) item.appendChild(block.firstChild);
          const previous = block.previousElementSibling;
          if (previous?.nodeName === name) {
            previous.appendChild(item);
            block.remove();
          } else {
            const list = doc.createElement(type);
            list.appendChild(item);
            block.replaceWith(list);
          }
        }
      }
      mergeLists();
    });
    return true;
  }

  /**
   * Indent the selected list items under the item before each.
   * @returns {boolean} Whether an item moved.
   */
  function indent() {
    const range = getRange(root);
    if (!range) return false;
    const items = textBlocksInRange(root, range).filter(
      (b) => b.nodeName === "LI",
    );
    let moved = false;
    keepingSelection(() => {
      for (const item of items) {
        const previous = item.previousElementSibling;
        if (previous?.nodeName !== "LI") continue;
        const last = previous.lastElementChild;
        let sub =
          last && (last.nodeName === "UL" || last.nodeName === "OL")
            ? last
            : null;
        if (!sub) {
          sub = doc.createElement(
            /** @type {Element} */ (item.parentNode).nodeName.toLowerCase(),
          );
          previous.appendChild(sub);
        }
        sub.appendChild(item);
        moved = true;
      }
    });
    return moved;
  }

  /**
   * Move the selected list items out one level.
   * @returns {boolean} Whether the selection was in a list.
   */
  function outdent() {
    const range = getRange(root);
    if (!range) return false;
    const items = textBlocksInRange(root, range).filter(
      (b) => b.nodeName === "LI",
    );
    if (items.length === 0) return false;
    keepingSelection(() => {
      for (const item of items) liftItem(item);
      mergeLists();
    });
    return true;
  }

  /**
   * Quote the selected top-level paragraphs, or unquote them when they are
   * all quoted already.
   *
   * @returns {boolean}
   */
  function toggleBlockquote() {
    const range = getRange(root);
    if (!range) return false;
    const blocks = textBlocksInRange(root, range);
    if (blocks.length === 0) return false;
    const quoted = blocks.every((b) => b.parentNode?.nodeName === "BLOCKQUOTE");
    keepingSelection(() => {
      if (quoted) {
        for (const quote of new Set(
          blocks.map((b) => /** @type {Element} */ (b.parentNode)),
        )) {
          unwrap(quote);
        }
        return;
      }
      for (const block of blocks.filter((b) => b.parentNode === root)) {
        const paragraph = block.nodeName === "P" ? block : retag(block, "p");
        const previous = paragraph.previousElementSibling;
        if (previous?.nodeName === "BLOCKQUOTE") {
          previous.appendChild(paragraph);
        } else {
          const quote = doc.createElement("blockquote");
          paragraph.before(quote);
          quote.appendChild(paragraph);
        }
      }
    });
    return true;
  }

  /**
   * The link at the selection.
   * @returns {HTMLAnchorElement | null}
   */
  function getLink() {
    const range = getRange(root);
    if (!range) return null;
    const near = closestNamed(range.startContainer, "A", root);
    if (near) return /** @type {HTMLAnchorElement} */ (near);
    if (range.collapsed) return null;
    const container = range.commonAncestorContainer;
    const scope = isElement(container) ? container : container.parentElement;
    for (const link of scope?.querySelectorAll("a") ?? []) {
      if (range.intersectsNode(link))
        return /** @type {HTMLAnchorElement} */ (link);
    }
    return null;
  }

  /**
   * Link the selection to `href`, or insert a link with `text` at a caret.
   * An existing link is retargeted.
   *
   * @param {string} href
   * @param {string} [text]
   * @returns {boolean}
   */
  function setLink(href, text) {
    const range = getRange(root);
    if (!range) return false;
    const existing = getLink();
    if (range.collapsed) {
      if (existing) {
        existing.setAttribute("href", href);
        if (text && existing.textContent !== text) existing.textContent = text;
        return true;
      }
      const selection = getSelection(root);
      const link = doc.createElement("a");
      link.setAttribute("href", href);
      link.textContent = text || href;
      range.insertNode(link);
      const after = doc.createTextNode(ZWSP);
      pending.add(after);
      link.after(after);
      selection?.collapse(after, 1);
      return true;
    }
    const blocks = textBlocksInRange(root, range);
    keepingSelection(() => {
      const live = /** @type {Range} */ (getRange(root));
      for (const node of selectedTextNodes(root, live)) {
        removeMark(node, "A", root);
        const link = doc.createElement("a");
        link.setAttribute("href", href);
        node.before(link);
        link.appendChild(node);
      }
    });
    tidy(blocks);
    return true;
  }

  /** @returns {boolean} */
  function removeLink() {
    const range = getRange(root);
    if (!range) return false;
    if (range.collapsed) {
      const link = getLink();
      if (!link) return false;
      keepingSelection(() => unwrap(link));
      return true;
    }
    const blocks = textBlocksInRange(root, range);
    keepingSelection(() => {
      const live = /** @type {Range} */ (getRange(root));
      for (const node of selectedTextNodes(root, live))
        removeMark(node, "A", root);
    });
    tidy(blocks);
    return true;
  }

  /**
   * Strip bold, italic, underline, strike-through and code from the selection,
   * and turn headings into paragraphs. Links and lists stay.
   *
   * @returns {boolean}
   */
  function clearFormatting() {
    const range = getRange(root);
    if (!range) return false;
    if (range.collapsed) {
      let changed = false;
      for (const name of MARK_NAMES) {
        if (closestNamed(range.startContainer, name, root)) {
          toggleCaretMark(range, /** @type {MarkTag} */ (name.toLowerCase()));
          changed = true;
        }
      }
      return changed;
    }
    const blocks = textBlocksInRange(root, range);
    keepingSelection(() => {
      const live = /** @type {Range} */ (getRange(root));
      for (const node of selectedTextNodes(root, live)) {
        for (const name of MARK_NAMES) removeMark(node, name, root);
      }
      for (const block of blocks) {
        if (block.parentNode === root && block.nodeName !== "P")
          retag(block, "p");
      }
    });
    tidy(blocks);
    return true;
  }

  /**
   * Delete the selected range, joining the block it ends in to the block it
   * starts in as typing over it would. Leaves a caret.
   *
   * @returns {boolean}
   */
  function deleteSelection() {
    const range = getRange(root);
    const selection = getSelection(root);
    if (!range || !selection) return false;
    if (range.collapsed) return false;
    const first = closestTextBlock(range.startContainer, root);
    const last = closestTextBlock(range.endContainer, root);
    range.deleteContents();
    const marker = doc.createTextNode("");
    range.insertNode(marker);
    if (
      first &&
      last &&
      first !== last &&
      first.isConnected &&
      last.isConnected
    ) {
      const parent = /** @type {Element | null} */ (last.parentNode);
      while (last.firstChild) first.appendChild(last.firstChild);
      last.remove();
      if (parent && parent !== root && !parent.hasChildNodes()) parent.remove();
    }
    const block = closestTextBlock(marker, root);
    // The caret goes where the marker was, which then goes.
    const holder = /** @type {Node} */ (marker.parentNode);
    const ticks = pointTicks(
      root,
      holder,
      Array.prototype.indexOf.call(holder.childNodes, marker),
    );
    marker.remove();
    if (block) tidy([block]);
    for (const b of [first, block]) {
      if (b?.isConnected && !b.firstChild) {
        b.appendChild(doc.createElement("br"));
      }
    }
    restoreSelection(root, { anchor: ticks, focus: ticks });
    return true;
  }

  /**
   * Insert sanitized HTML at the selection. A single paragraph's text joins
   * the current block; several blocks split the current block around them.
   *
   * @param {string} html Output of `sanitizeHtml`.
   * @returns {boolean}
   */
  function insertHtml(html) {
    let range = getRange(root);
    const selection = getSelection(root);
    if (!range || !selection || !html) return false;
    if (!range.collapsed) {
      deleteSelection();
      range = getRange(root);
      if (!range) return false;
    }

    const fragment = htmlToFragment(doc, html);
    const pasted = /** @type {Element[]} */ (Array.from(fragment.children));
    if (pasted.length === 0) return false;
    const marker = doc.createTextNode("");

    const block = closestTextBlock(range.startContainer, root);
    if (!block) {
      // The caret sits between blocks, or the document is empty.
      fragment.appendChild(marker);
      range.insertNode(fragment);
      selection.collapse(marker, 0);
      return true;
    }

    if (pasted.length === 1 && TEXT_BLOCKS.has(pasted[0].nodeName)) {
      const inline = doc.createDocumentFragment();
      while (pasted[0].firstChild) inline.appendChild(pasted[0].firstChild);
      inline.appendChild(marker);
      range.insertNode(inline);
      selection.collapse(marker, 0);
      tidy([block]);
      return true;
    }

    const tailRange = doc.createRange();
    tailRange.setStart(range.startContainer, range.startOffset);
    tailRange.setEnd(block, block.childNodes.length);
    const rest = /** @type {Element} */ (block.cloneNode(false));
    rest.appendChild(tailRange.extractContents());

    const container = block.parentNode?.nodeName;
    /** @type {Element[]} */
    const blocks = [];
    for (const piece of pasted) {
      if (piece.nodeName === "UL" || piece.nodeName === "OL") {
        if (container === "LI" || block.nodeName === "LI") {
          for (const item of Array.from(piece.children)) blocks.push(item);
        } else if (container === "BLOCKQUOTE") {
          for (const item of Array.from(piece.children))
            blocks.push(retag(item, "p"));
        } else blocks.push(piece);
      } else if (piece.nodeName === "BLOCKQUOTE") {
        if (container === "BLOCKQUOTE") {
          for (const p of Array.from(piece.children)) blocks.push(p);
        } else if (block.nodeName === "LI") {
          for (const p of Array.from(piece.children))
            blocks.push(retag(p, "li"));
        } else blocks.push(piece);
      } else if (block.nodeName === "LI") {
        blocks.push(retag(piece, "li"));
      } else if (container === "BLOCKQUOTE" && piece.nodeName !== "P") {
        blocks.push(retag(piece, "p"));
      } else blocks.push(piece);
    }

    if (blocks.length === 0) return false;
    const [first] = blocks;
    const merged = TEXT_BLOCKS.has(first.nodeName);
    if (merged) {
      while (first.firstChild) block.appendChild(first.firstChild);
      blocks.shift();
    }
    /** @type {Element} */
    let target = block;
    for (const piece of blocks) {
      target.after(piece);
      target = piece;
    }
    // Nothing was before the caret and the paste starts with a list or quote.
    if (!merged && !hasContent(block)) block.remove();

    const blank = (rest.textContent ?? "") === "" && !rest.querySelector("li");
    if (TEXT_BLOCKS.has(target.nodeName) && !target.querySelector("ul, ol")) {
      target.appendChild(marker);
      if (!blank) {
        while (rest.firstChild) target.appendChild(rest.firstChild);
      }
    } else if (blank) {
      // The caret goes at the end of the last item or paragraph pasted.
      const inner = target.querySelectorAll("p, li");
      (inner[inner.length - 1] ?? target).appendChild(marker);
    } else {
      rest.prepend(marker);
      target.after(rest);
    }
    selection.collapse(marker, 0);
    tidy([block, target]);
    return true;
  }

  /**
   * Clean up after the browser's own edits: wrap stray top-level text,
   * rebuild any block holding markup outside the schema, and give empty
   * blocks a `<br>` to keep their height.
   *
   * @param {Element | null} [dirty] The top-level block to check; every block when omitted.
   * @returns {boolean} Whether anything was repaired.
   */
  function normalize(dirty) {
    let repaired = false;
    const saved = saveSelection(root);

    // Strays at the top level become paragraphs.
    for (let node = root.firstChild; node;) {
      const next = node.nextSibling;
      if (isElement(node) && ROOT_CHILDREN.has(node.nodeName)) {
        node = next;
        continue;
      }
      if (node.nodeType === 3 && /** @type {Text} */ (node).length === 0) {
        node.remove();
        node = next;
        continue;
      }
      if (isElement(node) && !INLINE_NAMES.has(node.nodeName)) {
        // A block the browser made, such as a div.
        const fixed = rebuild(node);
        repaired = true;
        node = fixed ? fixed.nextSibling : next;
        continue;
      }
      const paragraph = doc.createElement("p");
      node.before(paragraph);
      let current = node;
      while (
        current &&
        !(isElement(current) && !INLINE_NAMES.has(current.nodeName))
      ) {
        const following = current.nextSibling;
        paragraph.appendChild(current);
        current = /** @type {ChildNode} */ (following);
      }
      repaired = true;
      node = current;
    }

    if (!root.firstChild) {
      const paragraph = doc.createElement("p");
      paragraph.appendChild(doc.createElement("br"));
      root.appendChild(paragraph);
      repaired = true;
    }

    /** @type {Iterable<Element>} */
    const targets =
      dirty?.parentNode === root ? [dirty] : Array.from(root.children);
    for (const element of targets) {
      if (!conforms(element)) {
        rebuild(element);
        repaired = true;
      }
    }

    const scope = dirty?.isConnected ? dirty : root;
    const blocks = Array.from(scope.querySelectorAll("p, h2, h3, li"));
    if (isTextBlock(scope)) blocks.unshift(scope);
    for (const block of blocks) {
      const last = block.lastChild;
      if (!last) {
        block.appendChild(doc.createElement("br"));
        repaired = true;
      } else if (
        last.nodeName === "BR" &&
        last.previousSibling &&
        last.previousSibling.nodeName !== "BR" &&
        (block.textContent ?? "") !== ""
      ) {
        // A placeholder `<br>` after text only adds a line in some engines.
        last.remove();
        repaired = true;
      }
      if (mergeInline(block)) {
        block.normalize();
        repaired = true;
      }
    }

    if (repaired) restoreSelection(root, saved);
    return repaired;
  }

  /**
   * Replace `element` with its sanitized form.
   * @param {Element} element
   * @returns {Element | null} The last element that took its place.
   */
  function rebuild(element) {
    const fragment = htmlToFragment(doc, sanitizeHtml(element.outerHTML));
    const last = /** @type {Element | null} */ (fragment.lastElementChild);
    element.replaceWith(fragment);
    if (!last) return null;
    return last;
  }

  /**
   * Whether a top-level element only holds markup of the schema, nested as it
   * allows.
   * @param {Element} element
   */
  function conforms(element) {
    if (!ROOT_CHILDREN.has(element.nodeName)) return false;
    const all = [element, ...Array.from(element.querySelectorAll("*"))];
    for (const node of all) {
      const name = node.nodeName;
      const parent = node.parentNode?.nodeName;
      if (
        node.attributes.length >
        (name === "A" && node.hasAttribute("href") ? 1 : 0)
      )
        return false;
      if (name === "A" || name === "BR" || MARK_NAMES.has(name)) continue;
      if (name === "P") {
        if (node !== element && parent !== "BLOCKQUOTE") return false;
      } else if (name === "H2" || name === "H3") {
        if (node !== element) return false;
      } else if (name === "UL" || name === "OL") {
        if (node !== element && parent !== "LI") return false;
      } else if (name === "LI") {
        if (parent !== "UL" && parent !== "OL") return false;
      } else if (name === "BLOCKQUOTE") {
        if (node !== element) return false;
      } else return false;
    }
    return true;
  }

  /**
   * @param {Element} block
   * @returns {boolean}
   */
  function isBlank(block) {
    return (
      (block.textContent ?? "").replace(/​/g, "") === "" &&
      !block.querySelector("li")
    );
  }

  /**
   * Whether the caret is at the start (or end) of its text block.
   * @param {Range} range
   * @param {Element} block
   * @param {"start" | "end"} edge
   */
  function atEdge(range, block, edge) {
    const probe = doc.createRange();
    if (edge === "start") {
      probe.setStart(block, 0);
      probe.setEnd(range.startContainer, range.startOffset);
    } else {
      probe.setStart(range.startContainer, range.startOffset);
      // A list item's own text ends where its first sub-list starts.
      const sub = block.querySelector(":scope > ul, :scope > ol");
      if (sub) probe.setEndBefore(sub);
      else probe.setEnd(block, block.childNodes.length);
    }
    return probe.toString().replace(/​/g, "") === "";
  }

  /**
   * Enter in the places the browser gets wrong: an empty list item leaves its
   * list, an empty quoted paragraph leaves its quote, and Enter at the end of
   * a heading starts a paragraph rather than another heading.
   *
   * @returns {boolean} Whether the key was handled.
   */
  function enter() {
    const range = getRange(root);
    if (!range?.collapsed) return false;
    const block = closestTextBlock(range.startContainer, root);
    if (!block) return false;

    if (block.nodeName === "LI") {
      if (!isBlank(block)) return false;
      keepingSelection(() => {
        liftItem(block);
        mergeLists();
      });
      return true;
    }
    const parent = /** @type {Element} */ (block.parentNode);
    if (parent.nodeName === "BLOCKQUOTE" && isBlank(block)) {
      keepingSelection(() => {
        const following = [];
        for (let s = block.nextElementSibling; s; s = s.nextElementSibling) {
          following.push(s);
        }
        if (following.length > 0) {
          const rest = /** @type {Element} */ (parent.cloneNode(false));
          for (const sibling of following) rest.appendChild(sibling);
          parent.after(rest);
        }
        parent.after(block);
        if (!parent.hasChildNodes()) parent.remove();
      });
      return true;
    }
    if (
      (block.nodeName === "H2" || block.nodeName === "H3") &&
      atEdge(range, block, "end")
    ) {
      const paragraph = doc.createElement("p");
      paragraph.appendChild(doc.createElement("br"));
      block.after(paragraph);
      getSelection(root)?.collapse(paragraph, 0);
      return true;
    }
    return false;
  }

  /**
   * Backspace at the start of a list item, heading or first quoted paragraph
   * drops that structure instead of joining the block to the one before.
   *
   * @returns {boolean} Whether the key was handled.
   */
  function backspace() {
    const range = getRange(root);
    if (!range?.collapsed) return false;
    const block = closestTextBlock(range.startContainer, root);
    if (!block || !atEdge(range, block, "start")) return false;

    if (block.nodeName === "LI") {
      keepingSelection(() => {
        liftItem(block);
        mergeLists();
      });
      return true;
    }
    if (block.nodeName === "H2" || block.nodeName === "H3") {
      keepingSelection(() => retag(block, "p"));
      return true;
    }
    const parent = /** @type {Element | null} */ (block.parentNode);
    if (
      parent?.nodeName === "BLOCKQUOTE" &&
      block === parent.firstElementChild
    ) {
      keepingSelection(() => {
        parent.before(block);
        if (!parent.hasChildNodes()) parent.remove();
      });
      return true;
    }
    return false;
  }

  /** Whether the document holds nothing but an empty paragraph. */
  function isEmpty() {
    const first = root.firstElementChild;
    if (!first) return true;
    if (first !== root.lastElementChild || first.nodeName !== "P") return false;
    return (first.textContent ?? "").replace(/​/g, "") === "";
  }

  return {
    toggleMark,
    setBlock,
    toggleList,
    indent,
    outdent,
    toggleBlockquote,
    getLink,
    setLink,
    removeLink,
    clearFormatting,
    insertHtml,
    normalize,
    flushPending,
    queryState,
    isEmpty,
    deleteSelection,
    enter,
    backspace,
  };
}
