// @ts-check
// Geometry for the merge resolver's panes: rows, windows and chunk-aligned
// scrolling. Pure and DOM-free.

/**
 * Cut a token list into lines. A token that spans lines, such as a block
 * comment, is split at each line ending, so every line carries its own
 * runs.
 *
 * @param {ReadonlyArray<{ type: string | null, text: string }>} tokens
 * @returns {Array<Array<[string | null, string]>>}
 */
export function cutTokenLines(tokens) {
  /** @type {Array<Array<[string | null, string]>>} */
  const lines = [[]];
  for (const { type, text } of tokens) {
    let from = 0;
    for (;;) {
      const at = text.indexOf("\n", from);
      const piece = text.slice(from, at === -1 ? text.length : at);
      if (piece !== "") lines[lines.length - 1].push([type, piece]);
      if (at === -1) break;
      lines.push([]);
      from = at + 1;
    }
  }
  return lines;
}

/**
 * Rows for a side pane: the side's lines in order, with a header (two rows
 * tall) ahead of each conflict for its actions. `starts` is the first row
 * of every chunk, with the row count last.
 *
 * @param {ReadonlyArray<{ type: string, ours: string[], theirs: string[], base: string[] | null }>} chunks
 * @param {"ours" | "theirs"} side
 * @returns {{ rows: import("./merge-view.js").SideRow[], starts: number[], longest: number }}
 */
export function buildSideRows(chunks, side) {
  /** @type {import("./merge-view.js").SideRow[]} */
  const rows = [];
  /** @type {number[]} */
  const starts = [];
  let number = 0;
  let longest = 0;
  chunks.forEach((chunk, chunkIndex) => {
    starts.push(rows.length);
    if (chunk.type === "conflict") {
      rows.push({ kind: "head", chunk: chunkIndex, text: "", no: 0, at: 0 });
      rows.push({ kind: "pad", chunk: chunkIndex, text: "", no: 0, at: 0 });
    }
    const lines = chunk.type === "unchanged" ? (chunk.base ?? []) : chunk[side];
    lines.forEach((text, at) => {
      number++;
      if (text.length > longest) longest = text.length;
      rows.push({ kind: "line", chunk: chunkIndex, text, no: number, at });
    });
  });
  starts.push(rows.length);
  return { rows, starts, longest };
}

/**
 * The y to put a pane at so the position `y` in a pane with chunk starts
 * `from` shows the same place in a pane with chunk starts `to`. Both lists
 * give where each chunk starts and end with the content height. Inside a
 * chunk the position carries over by its fraction, so a chunk of 3 lines
 * beside one of 8 stays side by side.
 *
 * @param {ArrayLike<number>} from
 * @param {ArrayLike<number>} to
 * @param {number} y
 * @returns {number}
 */
export function mapScroll(from, to, y) {
  const count = Math.min(from.length, to.length) - 1;
  if (count < 1) return y;
  if (y <= from[0]) return to[0] + (y - from[0]);
  if (y >= from[count]) return to[count] + (y - from[count]);
  let low = 0;
  let high = count - 1;
  while (low < high) {
    const mid = (low + high + 1) >> 1;
    if (from[mid] <= y) low = mid;
    else high = mid - 1;
  }
  const span = from[low + 1] - from[low];
  const fraction = span > 0 ? (y - from[low]) / span : 0;
  return to[low] + fraction * (to[low + 1] - to[low]);
}

/**
 * The rows to paint: those in view plus `overscan` either side.
 *
 * @param {number} scrollTop
 * @param {number} viewport
 * @param {number} rowHeight
 * @param {number} count
 * @param {number} [overscan]
 * @returns {{ from: number, to: number }}
 */
export function paintedRows(
  scrollTop,
  viewport,
  rowHeight,
  count,
  overscan = 10,
) {
  if (rowHeight <= 0 || count <= 0) return { from: 0, to: 0 };
  const first = Math.floor(Math.max(0, scrollTop) / rowHeight);
  const last = Math.ceil((Math.max(0, scrollTop) + viewport) / rowHeight);
  return {
    from: Math.max(0, first - overscan),
    to: Math.min(count, last + overscan),
  };
}

/**
 * Split a line's runs at the edges of marked character ranges, flagging the
 * pieces inside a range.
 *
 * @param {ReadonlyArray<[string | null, string]>} segments
 * @param {ReadonlyArray<[number, number]>} ranges Sorted and apart.
 * @returns {Array<[string | null, string, boolean]>}
 */
export function markSegments(segments, ranges) {
  /** @type {Array<[string | null, string, boolean]>} */
  const out = [];
  let position = 0;
  let r = 0;
  for (const [type, text] of segments) {
    let from = 0;
    while (from < text.length) {
      const at = position + from;
      while (r < ranges.length && ranges[r][1] <= at) r++;
      const inside = r < ranges.length && ranges[r][0] <= at;
      const stop = inside
        ? ranges[r][1]
        : r < ranges.length
          ? ranges[r][0]
          : Number.POSITIVE_INFINITY;
      const cut = Math.min(text.length, stop - position);
      out.push([type, text.slice(from, cut), inside]);
      from = cut;
    }
    position += text.length;
  }
  return out;
}
