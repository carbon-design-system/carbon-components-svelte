// @ts-check
// Circle geometry for `CirclePackChart`, kept out of the component so a test
// can count how often it runs.

import { packCircles } from "../utils/pack-circles.js";
import { categoricalColors, vizColor } from "../utils/tokens.js";

/** Average glyph width of 12px IBM Plex Sans. */
const GLYPH = 6.6;

/**
 * Sum `rows` by label, pack each group's leaves, pack the groups, and scale
 * the whole to `size`. A circle's area follows its value. Without a `group`
 * accessor every leaf sits in one unnamed group. A leaf carries a label only
 * when its circle can hold one.
 *
 * @template T
 * @param {ReadonlyArray<T>} rows
 * @param {import("./pack-geometry.d.ts").PackOptions<T>} options
 * @returns {import("./pack-geometry.d.ts").Pack<T>}
 */
export function buildPack(rows, options) {
  const {
    value,
    label,
    group,
    size,
    padding = 3,
    palette = 1,
    colors = {},
  } = options;

  /** @type {Map<string, Map<string, { value: number; rows: T[] }>>} */
  const tree = new Map();
  let total = 0;
  for (let i = 0; i < rows.length; i++) {
    const amount = Number(value(rows[i], i));
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const leafKey = String(label(rows[i], i));
    const groupKey = group ? String(group(rows[i], i)) : "";
    let leaves = tree.get(groupKey);
    if (!leaves) {
      leaves = new Map();
      tree.set(groupKey, leaves);
    }
    const leaf = leaves.get(leafKey);
    if (leaf) {
      leaf.value += amount;
      leaf.rows.push(rows[i]);
    } else {
      leaves.set(leafKey, { value: amount, rows: [rows[i]] });
    }
    total += amount;
  }
  if (total <= 0) return { total: 0, grouped: Boolean(group), groups: [] };

  const entries = [...tree].map(([key, leaves]) => {
    const list = [...leaves].map(([leafKey, leaf]) => ({
      key: leafKey,
      ...leaf,
    }));
    list.sort((a, b) => b.value - a.value);
    let sum = 0;
    for (const leaf of list) sum += leaf.value;
    // Radius is the square root of the value, so area follows the value.
    const inner = packCircles(
      list.map((leaf) => Math.sqrt(leaf.value)),
      { padding: 0 },
    );
    return { key, leaves: list, value: sum, inner };
  });
  entries.sort((a, b) => b.value - a.value);

  // Padding is in pixels, but the scale is not known until everything is
  // packed. One unpadded pass gives a close enough scale to convert it.
  const loose = packCircles(entries.map((entry) => entry.inner.radius));
  const guess = loose.radius > 0 ? size / 2 / loose.radius : 1;
  const gap = padding / guess;
  for (const entry of entries) {
    entry.inner = packCircles(
      entry.leaves.map((leaf) => Math.sqrt(leaf.value)),
      { padding: gap },
    );
  }
  const ring = group ? gap * 2 : 0;
  const outer = packCircles(
    entries.map((entry) => entry.inner.radius + ring),
    { padding: gap * 2 },
  );
  const scale = outer.radius > 0 ? size / 2 / outer.radius : 1;
  const center = size / 2;
  const assigned = categoricalColors(entries.length, palette);

  return {
    total,
    grouped: Boolean(group),
    groups: entries.map((entry, g) => {
      const at = outer.circles[g];
      const color =
        colors[entry.key] === undefined
          ? assigned[g]
          : (vizColor(colors[entry.key]) ?? assigned[g]);
      return {
        key: entry.key,
        value: entry.value,
        share: entry.value / total,
        color,
        cx: center + at.x * scale,
        cy: center + at.y * scale,
        r: at.r * scale,
        leaves: entry.leaves.map((leaf, l) => {
          const circle = entry.inner.circles[l];
          const r = circle.r * scale;
          // A label needs room for a few characters across the middle.
          const fits = Math.floor((r * 2 - 8) / GLYPH);
          return {
            id: `${entry.key}/${leaf.key}`,
            key: leaf.key,
            group: entry.key,
            value: leaf.value,
            share: leaf.value / total,
            rows: leaf.rows,
            cx: center + (at.x + circle.x) * scale,
            cy: center + (at.y + circle.y) * scale,
            r,
            label:
              fits < 3
                ? ""
                : leaf.key.length <= fits
                  ? leaf.key
                  : `${leaf.key.slice(0, Math.max(fits - 1, 1))}…`,
          };
        }),
      };
    }),
  };
}
