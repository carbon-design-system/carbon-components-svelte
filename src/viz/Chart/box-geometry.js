// @ts-check
// Box and whisker geometry for the `ChartBoxes` mark, kept out of the
// component so a test can count how often it runs.

/**
 * One box per entry whose category is on the x scale. `along` values run
 * along the x scale and `across` values along the y scale, so the component
 * can draw either orientation from the same numbers.
 *
 * @param {ReadonlyArray<import("./box-geometry.d.ts").BoxInput>} boxes
 * @param {import("./model.js").ChartScales} scales
 * @param {{ padding?: number; maxBoxWidth?: number }} [options]
 * @returns {import("./box-geometry.d.ts").BoxShape[]}
 */
export function buildBoxes(boxes, scales, options = {}) {
  const { padding = 0.4, maxBoxWidth = 64 } = options;
  const step = scales.step;
  if (!step) return [];
  const width = Math.max(4, Math.min(maxBoxWidth, step * (1 - padding)));

  /** @type {import("./box-geometry.d.ts").BoxShape[]} */
  const shapes = [];
  for (const box of boxes) {
    const slot = scales.categories.indexOf(String(box.x));
    if (slot < 0) continue;
    const center = scales.x.map(slot);
    const q1 = scales.y.map(box.q1);
    const q3 = scales.y.map(box.q3);
    if (
      !Number.isFinite(center) ||
      !Number.isFinite(q1) ||
      !Number.isFinite(q3)
    ) {
      continue;
    }
    shapes.push({
      key: String(box.x),
      slot,
      center,
      width,
      boxStart: Math.min(q1, q3),
      boxLength: Math.abs(q3 - q1),
      median: scales.y.map(box.median),
      whiskerLow: scales.y.map(box.whiskerLow),
      whiskerHigh: scales.y.map(box.whiskerHigh),
      q1,
      q3,
      outliers: box.outliers.map((value) => scales.y.map(value)),
    });
  }
  return shapes;
}
