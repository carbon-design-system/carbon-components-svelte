// @vitest-environment node
import { adjacentRowIndex } from "../../src/utils/adjacent-row-index.js";

// Three 100px tiles per row, seven tiles: the last row holds one, under the
// first column.
function rect(index: number) {
  const top = Math.floor(index / 3) * 100;
  const left = (index % 3) * 100;
  return { top, bottom: top + 100, left, right: left + 100 };
}

describe("adjacentRowIndex", () => {
  it.each([
    { index: 1, step: 1, expected: 4, note: "down, same column" },
    { index: 4, step: -1, expected: 1, note: "up, same column" },
    { index: 5, step: 1, expected: 6, note: "down to a shorter row" },
    { index: 6, step: 1, expected: 6, note: "down from the last row" },
    { index: 2, step: -1, expected: 2, note: "up from the first row" },
  ] as const)("$note", ({ index, step, expected }) => {
    expect(adjacentRowIndex(7, index, step, rect)).toBe(expected);
  });

  it("lands on the nearest item that isn't skipped", () => {
    expect(adjacentRowIndex(7, 1, 1, rect, (i) => i === 4)).toBe(3);
  });
});
