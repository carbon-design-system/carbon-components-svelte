// @ts-check
// Where labels may sit without covering each other. Data labels, error
// bars' values, and annotations all share this: each asks for a box at its
// anchor, with a few places it would accept, and the layout keeps the
// ones that fit, highest priority first, nudging before dropping.

/**
 * @typedef {object} LabelBox
 * @property {string} key
 * @property {number} x Left edge of the preferred place.
 * @property {number} y Top edge of the preferred place.
 * @property {number} width
 * @property {number} height
 * @property {number} [priority] Higher wins a collision. Default 0.
 * @property {ReadonlyArray<{ x: number; y: number }>} [alternatives] Other top-left corners to try, in order, before giving up.
 */

/**
 * @typedef {object} PlacedLabel
 * @property {string} key
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 * @property {boolean} moved Whether an alternative place was used.
 */

/**
 * @param {{ x: number; y: number; width: number; height: number }} a
 * @param {{ x: number; y: number; width: number; height: number }} b
 * @param {number} gap
 */
function overlaps(a, b, gap) {
  return (
    a.x < b.x + b.width + gap &&
    b.x < a.x + a.width + gap &&
    a.y < b.y + b.height + gap &&
    b.y < a.y + a.height + gap
  );
}

/**
 * @param {{ x: number; y: number; width: number; height: number }} box
 * @param {{ x0: number; x1: number; y0: number; y1: number } | undefined} bounds
 */
function inside(box, bounds) {
  if (!bounds) return true;
  return (
    box.x >= bounds.x0 &&
    box.y >= bounds.y0 &&
    box.x + box.width <= bounds.x1 &&
    box.y + box.height <= bounds.y1
  );
}

/**
 * Keep the labels that fit. Boxes are tried in priority order, then by
 * their x, so a sweep reads left to right; a box that collides tries its
 * alternatives, then is dropped. Quadratic over the kept set, which stays
 * small because a plot holds few readable labels.
 *
 * @param {ReadonlyArray<LabelBox>} boxes
 * @param {{ bounds?: { x0: number; x1: number; y0: number; y1: number }; gap?: number }} [options]
 * @returns {PlacedLabel[]}
 */
export function placeLabels(boxes, options = {}) {
  const gap = options.gap ?? 2;
  const ordered = [...boxes].sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0) || a.x - b.x,
  );
  /** @type {PlacedLabel[]} */
  const kept = [];
  for (const box of ordered) {
    const places = [{ x: box.x, y: box.y }, ...(box.alternatives ?? [])];
    for (let i = 0; i < places.length; i++) {
      const candidate = {
        x: places[i].x,
        y: places[i].y,
        width: box.width,
        height: box.height,
      };
      if (!inside(candidate, options.bounds)) continue;
      if (kept.some((other) => overlaps(candidate, other, gap))) continue;
      kept.push({ key: box.key, ...candidate, moved: i > 0 });
      break;
    }
  }
  return kept;
}

/**
 * The width of a label in the 12px label style, estimated from its glyph
 * count, since measuring text costs a layout per label.
 * @param {string} text
 * @param {number} [glyph] Average glyph width in pixels.
 */
export function labelWidth(text, glyph = 6.5) {
  return Math.ceil(text.length * glyph) + 4;
}
