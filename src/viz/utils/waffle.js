// @ts-check
// Waffle math: hand out a fixed number of cells to parts of a whole so the
// cells add up exactly, then say which part each cell belongs to.

/**
 * How many of `count` cells each share gets, by largest remainder: every
 * share takes the floor of its due, and the cells left over go to the
 * largest fractions, so the counts sum to `count` and never differ from
 * the exact due by a whole cell. A tie goes to the smaller part. A share of
 * zero gets no cell; a share above zero gets at least one, taken from the
 * part that is furthest over its due, so a small part is not rounded away.
 *
 * @param {ReadonlyArray<number>} shares Fractions of the whole, summing to 1 or less.
 * @param {number} count
 * @returns {number[]}
 */
export function allocateCells(shares, count) {
  const n = shares.length;
  const cells = new Array(n).fill(0);
  if (n === 0 || count <= 0) return cells;
  const dues = new Array(n);
  const remainders = new Array(n);
  let given = 0;
  for (let i = 0; i < n; i++) {
    dues[i] = Math.max(0, shares[i]) * count;
    cells[i] = Math.floor(dues[i]);
    remainders[i] = dues[i] - cells[i];
    given += cells[i];
  }
  const order = shares
    .map((_, i) => i)
    .sort(
      (a, b) => remainders[b] - remainders[a] || cells[a] - cells[b] || a - b,
    );
  for (let k = 0; k < order.length && given < count; k++) {
    if (remainders[order[k]] <= 0) break;
    cells[order[k]]++;
    given++;
  }
  // Nothing visible for a part that exists: borrow from the part furthest
  // over its due, which is the one rounding favored most.
  for (let i = 0; i < n; i++) {
    if (shares[i] > 0 && cells[i] === 0) {
      let from = -1;
      for (let j = 0; j < n; j++) {
        if (
          cells[j] > 1 &&
          (from === -1 || cells[j] - dues[j] > cells[from] - dues[from])
        ) {
          from = j;
        }
      }
      if (from === -1) break;
      cells[from]--;
      cells[i]++;
    }
  }
  return cells;
}

/**
 * The grid, row by row from the top, as the part index each cell belongs
 * to or `-1` for an empty cell. Cells fill column by column from the
 * bottom left, so a part reads as a rising block.
 *
 * @param {ReadonlyArray<number>} counts Cells per part, as `allocateCells` gives.
 * @param {number} rows
 * @param {number} columns
 * @returns {number[]}
 */
export function layoutCells(counts, rows, columns) {
  const grid = new Array(rows * columns).fill(-1);
  let part = 0;
  let left = counts[0] ?? 0;
  for (let k = 0; k < rows * columns; k++) {
    while (part < counts.length && left === 0) {
      part++;
      left = counts[part] ?? 0;
    }
    if (part >= counts.length) break;
    const column = Math.floor(k / rows);
    const row = rows - 1 - (k % rows);
    grid[row * columns + column] = part;
    left--;
  }
  return grid;
}
