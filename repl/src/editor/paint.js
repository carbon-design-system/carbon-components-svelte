// Paints tokens and diagnostics onto one text node with the CSS Custom
// Highlight API. Ranges are StaticRanges: live Ranges make every DOM mutation
// on the page slower, and the ranges are rebuilt on every edit anyway.
// Only the visible window (plus margin) is painted, so cost tracks the
// viewport, not the file size.
//
// Each paint builds fresh Highlight objects off the registry and swaps them in
// with one `CSS.highlights.set` per name. Mutating a registered Highlight
// range by range invalidates on every add/delete and scales badly. The REPL
// owns the `syntax-*` names; a shared library editor would need per-instance
// names or a coordinating registry.

/**
 * @param {Text} node
 */
export function createPainter(node) {
  /** @type {Set<string>} */
  let names = new Set();

  const clear = () => {
    for (const name of names) CSS.highlights.delete(name);
    names = new Set();
  };

  return {
    supported: typeof CSS !== "undefined" && "highlights" in CSS,
    clear,
    /**
     * @param {{ tokens: { type: string | null; text: string }[]; starts: Int32Array }} tokenized
     * @param {number} from - first visible offset
     * @param {number} to - last visible offset
     * @param {{ start: number; end: number; severity: string }[]} diagnostics
     * @returns {number} ranges painted
     */
    paint({ tokens, starts }, from, to, diagnostics) {
      const length = node.data.length;
      /** @type {Map<string, StaticRange[]>} */
      const byName = new Map();
      const add = (name, start, end) => {
        const range = new StaticRange({
          startContainer: node,
          startOffset: start,
          endContainer: node,
          endOffset: end,
        });
        const list = byName.get(name);
        if (list) list.push(range);
        else byName.set(name, [range]);
      };

      let count = 0;
      for (
        let i = firstTokenAt(starts, from);
        i < tokens.length && starts[i] < to;
        i++
      ) {
        const t = tokens[i];
        if (!t.type) continue;
        add(
          `syntax-${t.type}`,
          starts[i],
          Math.min(length, starts[i] + t.text.length),
        );
        count++;
      }
      for (const d of diagnostics) {
        if (d.start === undefined) continue;
        const start = Math.min(d.start, length);
        const end = Math.min(Math.max(d.end ?? start, start + 1), length);
        if (end > start) add(`repl-diagnostic-${d.severity}`, start, end);
      }

      for (const name of names) {
        if (!byName.has(name)) CSS.highlights.delete(name);
      }
      for (const [name, ranges] of byName) {
        CSS.highlights.set(name, new Highlight(...ranges));
      }
      names = new Set(byName.keys());
      return count;
    },
  };
}

/** Index of the token containing `offset`. */
function firstTokenAt(starts, offset) {
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= offset) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/** Cumulative start offsets for tokens (for binary search). */
export function tokenStarts(tokens) {
  const starts = new Int32Array(tokens.length);
  let offset = 0;
  for (let i = 0; i < tokens.length; i++) {
    starts[i] = offset;
    offset += tokens[i].text.length;
  }
  return starts;
}
