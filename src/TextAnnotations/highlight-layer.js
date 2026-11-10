/**
 * The layer that paints annotated text. Two techniques behind one shape:
 *
 * - The CSS Custom Highlight API (`CSS.highlights`) paints ranges with no
 *   change to the document's DOM. It is the default where it exists.
 * - `<mark>` elements wrapped around the text, for browsers without it.
 *   Wrapping splits text nodes, and unwrapping puts each back as it was, so
 *   a framework that holds those nodes keeps working.
 */

import { segmentsOfKind } from "./segments.js";
import { rangeFromOffsets } from "./text-index.js";

/** @typedef {import("./segments.js").HighlightSegment} HighlightSegment */
/** @typedef {import("./segments.js").HighlightKind} HighlightKind */
/** @typedef {import("./text-index.js").TextIndex} TextIndex */

/** @type {ReadonlyArray<HighlightKind>} */
const KINDS = ["base", "overlap", "active", "draft"];

/** @type {Record<HighlightKind, string>} */
export const HIGHLIGHT_NAMES = {
  base: "ccs-text-annotation",
  overlap: "ccs-text-annotation-overlap",
  active: "ccs-text-annotation-active",
  draft: "ccs-text-annotation-draft",
};

/**
 * Whether this browser paints ranges with `CSS.highlights`.
 * @returns {boolean}
 */
export function supportsHighlightApi() {
  return (
    typeof CSS !== "undefined" &&
    "highlights" in CSS &&
    typeof Highlight !== "undefined"
  );
}

/**
 * @typedef {object} HighlightLayer
 * @property {"highlight-api" | "mark"} technique
 * @property {boolean} rewrites Whether painting changes the DOM, so the text index must be built again afterward.
 * @property {(index: TextIndex, segments: ReadonlyArray<HighlightSegment>) => boolean} paint Paint the segments. Returns `true` when the DOM changed.
 * @property {() => void} unwrap Put the document back as it was.
 * @property {() => void} destroy
 */

/**
 * @param {"highlight-api" | "mark"} technique
 * @returns {HighlightLayer}
 */
export function createHighlightLayer(technique) {
  return technique === "highlight-api" ? createRangeLayer() : createMarkLayer();
}

/** @returns {HighlightLayer} */
function createRangeLayer() {
  /** @type {Record<HighlightKind, Set<Range>>} */
  const own = {
    base: new Set(),
    overlap: new Set(),
    active: new Set(),
    draft: new Set(),
  };

  /** @param {HighlightKind} kind */
  function registered(kind) {
    const name = HIGHLIGHT_NAMES[kind];
    let highlight = CSS.highlights.get(name);
    if (!highlight) {
      highlight = new Highlight();
      highlight.priority = KINDS.indexOf(kind);
      CSS.highlights.set(name, highlight);
    }
    return highlight;
  }

  function clear() {
    for (const kind of KINDS) {
      const highlight = CSS.highlights.get(HIGHLIGHT_NAMES[kind]);
      for (const range of own[kind]) highlight?.delete(range);
      own[kind].clear();
    }
  }

  return {
    technique: "highlight-api",
    rewrites: false,
    paint(index, segments) {
      clear();
      for (const kind of KINDS) {
        const highlight = registered(kind);
        for (const { start, end } of segmentsOfKind(segments, kind)) {
          const range = rangeFromOffsets(index, start, end);
          if (range) {
            highlight.add(range);
            own[kind].add(range);
          }
        }
      }
      return false;
    },
    unwrap() {},
    destroy: clear,
  };
}

/**
 * @typedef {object} Wrap
 * @property {Text} original The node that was split.
 * @property {Text} inner The text now inside the mark.
 * @property {Text | null} after The rest of the node, after the mark.
 * @property {HTMLElement} mark
 */

/** @returns {HighlightLayer} */
function createMarkLayer() {
  /** @type {Wrap[]} */
  let wraps = [];
  /** @type {Map<HTMLElement, HighlightSegment>} */
  let marks = new Map();
  let structure = "";

  function unwrap() {
    // The last wrap made is the first undone, so each node's data is put
    // back from the end.
    for (let i = wraps.length - 1; i >= 0; i--) {
      const { original, inner, after, mark } = wraps[i];
      if (inner === original) {
        mark.replaceWith(original);
      } else {
        original.data += inner.data;
        mark.remove();
      }
      if (after) {
        original.data += after.data;
        after.remove();
      }
    }
    wraps = [];
    marks = new Map();
    structure = "";
  }

  /** @param {HTMLElement} mark @param {HighlightSegment} segment */
  function classify(mark, segment) {
    mark.classList.toggle(
      "bx--text-annotations__mark--overlap",
      segment.ids.length > 1,
    );
    mark.classList.toggle("bx--text-annotations__mark--active", segment.active);
    mark.classList.toggle("bx--text-annotations__mark--draft", segment.draft);
  }

  return {
    technique: "mark",
    rewrites: true,
    paint(index, segments) {
      const key = JSON.stringify(
        segments.map((s) => [s.start, s.end, s.ids, s.draft]),
      );
      if (key === structure && marks.size) {
        // The same stretches: only the look moves.
        const byStart = new Map(segments.map((s) => [s.start, s]));
        for (const mark of marks.keys()) {
          const segment = byStart.get(Number(mark.dataset.start));
          if (segment) {
            classify(mark, segment);
            marks.set(mark, segment);
          }
        }
        return false;
      }
      unwrap();
      wrapSegments(index, segments);
      structure = key;
      return true;
    },
    unwrap,
    destroy: unwrap,
  };

  /**
   * @param {TextIndex} index
   * @param {ReadonlyArray<HighlightSegment>} segments
   */
  function wrapSegments(index, segments) {
    const { nodes, starts } = index;
    /** @type {Map<number, Array<{ from: number, to: number, segment: HighlightSegment }>>} */
    const cuts = new Map();
    // Segments are in order; walk the nodes beside them.
    let n = 0;
    for (const segment of segments) {
      while (
        n < nodes.length &&
        starts[n] + nodes[n].data.length <= segment.start
      ) {
        n++;
      }
      for (let k = n; k < nodes.length && starts[k] < segment.end; k++) {
        const from = Math.max(segment.start, starts[k]) - starts[k];
        const to =
          Math.min(segment.end, starts[k] + nodes[k].data.length) - starts[k];
        if (to > from) {
          const list = cuts.get(k) ?? [];
          list.push({ from, to, segment });
          cuts.set(k, list);
        }
      }
    }
    for (const [k, list] of cuts) {
      // From the end, so the offsets of the earlier cuts hold.
      for (let c = list.length - 1; c >= 0; c--) {
        const { from, to, segment } = list[c];
        const original = nodes[k];
        const inner = from > 0 ? original.splitText(from) : original;
        const after =
          to - from < inner.data.length ? inner.splitText(to - from) : null;
        const mark = original.ownerDocument.createElement("mark");
        mark.className = "bx--text-annotations__mark";
        mark.dataset.annotationIds = segment.ids.join(" ");
        mark.dataset.start = String(segment.start);
        classify(mark, segment);
        inner.before(mark);
        mark.append(inner);
        wraps.push({ original, inner, after, mark });
        marks.set(mark, segment);
      }
    }
  }
}
