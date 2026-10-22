// @ts-check
// Push labels apart so none overlap, keeping their order and staying
// inside a range. Slope and bump charts label every line at its ends.

/**
 * Given positions along one axis, return positions at least `gap` apart in
 * the same order, moved as little as possible and kept within `[lo, hi]`.
 * Labels that collide form a cluster centered on where they wanted to be.
 * When the range is too small for them all, they pack from `lo`.
 *
 * @param {ReadonlyArray<number>} positions
 * @param {number} gap
 * @param {number} lo
 * @param {number} hi
 * @returns {number[]}
 */
export function spreadLabels(positions, gap, lo, hi) {
  const order = positions
    .map((value, index) => ({ value, index }))
    .sort((a, b) => a.value - b.value);
  // A cluster of `count` labels starting at `start`, `gap` apart. Its best
  // start is the mean of where each member would start the cluster from,
  // which `sum` keeps so a merge needs no second pass.
  /** @type {Array<{ start: number; count: number; sum: number }>} */
  const clusters = [];
  const clamp = (/** @type {number} */ start, /** @type {number} */ count) =>
    Math.max(lo, Math.min(start, hi - (count - 1) * gap));
  for (const entry of order) {
    let cluster = { start: clamp(entry.value, 1), count: 1, sum: entry.value };
    while (clusters.length > 0) {
      const prev = clusters[clusters.length - 1];
      if (prev.start + prev.count * gap <= cluster.start) break;
      clusters.pop();
      const sum = prev.sum + cluster.sum - cluster.count * prev.count * gap;
      const count = prev.count + cluster.count;
      cluster = { start: clamp(sum / count, count), count, sum };
    }
    clusters.push(cluster);
  }
  const out = new Array(positions.length).fill(0);
  let at = 0;
  for (const cluster of clusters) {
    for (let j = 0; j < cluster.count; j++) {
      out[order[at + j].index] = cluster.start + j * gap;
    }
    at += cluster.count;
  }
  return out;
}
