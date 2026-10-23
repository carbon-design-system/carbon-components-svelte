// @ts-check
// Beeswarm placement: one dot per value along an axis, pushed sideways
// only as far as needed so no two overlap.

/**
 * An offset across the axis for each value, given its position along
 * it. Dots are placed in value order; each takes the offset nearest the
 * axis line that clears every dot already placed within two radii of it.
 * Offsets alternate sides, so the swarm stays centered.
 *
 * @param {ReadonlyArray<number>} positions Positions along the axis, in pixels.
 * @param {number} radius
 * @returns {number[]} An offset across the axis per position, in pixels.
 */
export function beeswarm(positions, radius) {
  const order = positions
    .map((along, index) => ({ along, index }))
    .filter((entry) => Number.isFinite(entry.along))
    .sort((a, b) => a.along - b.along);
  const out = new Array(positions.length).fill(Number.NaN);
  /** @type {Array<{ along: number; across: number }>} */
  const placed = [];
  const gap = radius * 2;
  for (const entry of order) {
    // Only dots within a diameter along the axis can collide.
    const near = [];
    for (let i = placed.length - 1; i >= 0; i--) {
      if (entry.along - placed[i].along >= gap) break;
      near.push(placed[i]);
    }
    /** @type {number[]} */
    const candidates = [0];
    for (const other of near) {
      const dx = entry.along - other.along;
      const dy = Math.sqrt(Math.max(gap * gap - dx * dx, 0));
      candidates.push(other.across + dy, other.across - dy);
    }
    candidates.sort((a, b) => Math.abs(a) - Math.abs(b) || a - b);
    let across = 0;
    for (const candidate of candidates) {
      const clear = near.every((other) => {
        const dx = entry.along - other.along;
        const dy = candidate - other.across;
        return dx * dx + dy * dy >= gap * gap - 1e-6;
      });
      if (clear) {
        across = candidate;
        break;
      }
    }
    placed.push({ along: entry.along, across });
    out[entry.index] = across;
  }
  return out;
}
