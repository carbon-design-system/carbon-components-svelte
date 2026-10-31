// @ts-check
// Arrow key movement through a grid that may have empty cells.

const STEPS = {
  ArrowRight: [0, 1],
  ArrowLeft: [0, -1],
  ArrowDown: [1, 0],
  ArrowUp: [-1, 0],
};

/**
 * The next filled cell from `[row, column]` in the direction of an arrow
 * key, skipping empty cells. `null` for another key, or when nothing filled
 * lies that way.
 *
 * @param {string} key A `KeyboardEvent.key`.
 * @param {[number, number]} from
 * @param {[number, number]} size Row and column counts.
 * @param {(row: number, column: number) => boolean} filled
 * @returns {[number, number] | null}
 */
export function gridStep(key, from, size, filled) {
  const step = STEPS[/** @type {keyof typeof STEPS} */ (key)];
  if (!step) return null;
  let [r, c] = from;
  do {
    r += step[0];
    c += step[1];
    if (r < 0 || c < 0 || r >= size[0] || c >= size[1]) return null;
  } while (!filled(r, c));
  return [r, c];
}
