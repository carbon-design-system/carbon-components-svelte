/**
 * Offsets into the text of a container, and back to DOM `Range`s. The text
 * is every text node under the container in document order, so inline
 * markup (`<em>`, `<a>`, `<mark>`) does not change an offset. Nodes under
 * `[data-ccs-annotation-ignore]`, `script`, `style`, `noscript` and
 * `template` are not part of it.
 */

/**
 * @typedef {object} TextIndex
 * @property {string} text The text of the container.
 * @property {Text[]} nodes The text nodes that make it up, none empty.
 * @property {number[]} starts The offset at which each node starts.
 * @property {Map<Text, number>} positions Where each node is in `nodes`.
 */

const SPACE = /\s/;
const SKIPPED = /^(?:SCRIPT|STYLE|NOSCRIPT|TEMPLATE)$/;

/**
 * @param {Node} node
 */
function isIgnored(node) {
  return (
    node.nodeType === 1 &&
    (SKIPPED.test(/** @type {Element} */ (node).tagName) ||
      /** @type {Element} */ (node).hasAttribute("data-ccs-annotation-ignore"))
  );
}

/**
 * Walk the container's text nodes and note where each starts.
 * @param {Node} root
 * @returns {TextIndex}
 */
export function buildTextIndex(root) {
  /** @type {Text[]} */
  const nodes = [];
  /** @type {number[]} */
  const starts = [];
  const parts = [];
  /** @type {Map<Text, number>} */
  const positions = new Map();
  let length = 0;
  const walker = /** @type {Document} */ (
    root.ownerDocument ?? root
  ).createTreeWalker(
    root,
    // SHOW_ELEMENT | SHOW_TEXT
    0x1 | 0x4,
    {
      acceptNode(node) {
        if (node.nodeType === 3) {
          return /** @type {Text} */ (node).data.length ? 1 : 3;
        }
        // FILTER_REJECT skips the subtree, FILTER_SKIP only the element.
        return isIgnored(node) ? 2 : 3;
      },
    },
  );
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = /** @type {Text} */ (node);
    positions.set(text, nodes.length);
    nodes.push(text);
    starts.push(length);
    parts.push(text.data);
    length += text.data.length;
  }
  return { text: parts.join(""), nodes, starts, positions };
}

/**
 * The index of the node holding `offset`: the last node that starts at or
 * before it. With `inclusiveEnd`, an offset at a node's end belongs to that
 * node rather than to the next one.
 * @param {TextIndex} index
 * @param {number} offset
 * @param {boolean} inclusiveEnd
 */
function nodeIndexAt(index, offset, inclusiveEnd) {
  const { starts, nodes } = index;
  let low = 0;
  let high = starts.length - 1;
  while (low < high) {
    const mid = (low + high + 1) >> 1;
    const start = starts[mid];
    if (inclusiveEnd ? start < offset : start <= offset) low = mid;
    else high = mid - 1;
  }
  // Past the last node, stay on it.
  return nodes.length ? low : -1;
}

/**
 * The range covering the text between two offsets, or `null` when there is
 * no text.
 * @param {TextIndex} index
 * @param {number} start
 * @param {number} end
 * @param {Document} [doc]
 * @returns {Range | null}
 */
export function rangeFromOffsets(index, start, end, doc) {
  const { nodes, starts, text } = index;
  if (!nodes.length) return null;
  const from = Math.max(0, Math.min(text.length, start));
  const to = Math.max(from, Math.min(text.length, end));
  const first = nodeIndexAt(index, from, false);
  const last = nodeIndexAt(index, to, true);
  const range = (doc ?? nodes[0].ownerDocument).createRange();
  range.setStart(nodes[first], from - starts[first]);
  range.setEnd(nodes[last], to - starts[last]);
  return range;
}

/**
 * The offset of a DOM boundary point: a position in a text node, or a child
 * position in an element.
 * @param {TextIndex} index
 * @param {Node} container
 * @param {number} offset
 * @returns {number}
 */
export function offsetOfPoint(index, container, offset) {
  const { nodes, starts, text } = index;
  if (container.nodeType === 3) {
    const at = index.positions.get(/** @type {Text} */ (container));
    if (at !== undefined) {
      return starts[at] + Math.min(offset, nodes[at].data.length);
    }
  }
  // The offset of the first text node at or after the point.
  const probe = container.ownerDocument?.createRange();
  if (!probe) return 0;
  probe.setStart(container, offset);
  probe.collapse(true);
  let low = 0;
  let high = nodes.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    // 1 when the node's first position is after the point
    if (probe.comparePoint(nodes[mid], 0) >= 0) high = mid;
    else low = mid + 1;
  }
  return low < nodes.length ? starts[low] : text.length;
}

/**
 * The offsets a range covers.
 * @param {TextIndex} index
 * @param {Range} range
 * @returns {{ start: number, end: number }}
 */
export function offsetsFromRange(index, range) {
  const start = offsetOfPoint(index, range.startContainer, range.startOffset);
  const end = offsetOfPoint(index, range.endContainer, range.endOffset);
  return { start: Math.min(start, end), end: Math.max(start, end) };
}

/**
 * Narrow offsets to the text between them with no space or line break at
 * either edge, so a selection that grabbed a trailing space annotates the
 * word and not the gap.
 * @param {string} text
 * @param {number} start
 * @param {number} end
 */
export function trimOffsets(text, start, end) {
  let from = start;
  let to = end;
  while (from < to && SPACE.test(text[from])) from++;
  while (to > from && SPACE.test(text[to - 1])) to--;
  return { start: from, end: to };
}
