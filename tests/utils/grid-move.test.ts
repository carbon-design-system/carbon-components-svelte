// @vitest-environment node
import { inlineGridKey, moveGridCursor } from "../../src/utils/grid-move.js";

// 10 cells in lines of 4: 0-3, 4-7, 8-9
const base = { count: 10, columns: 4 };

describe("moveGridCursor", () => {
  it("steps and carries into the next line", () => {
    expect(
      moveGridCursor({ ...base, index: 3, key: "ArrowRight" })?.index,
    ).toBe(4);
    expect(moveGridCursor({ ...base, index: 4, key: "ArrowLeft" })?.index).toBe(
      3,
    );
    expect(
      moveGridCursor({ ...base, index: 9, key: "ArrowRight" })?.index,
    ).toBe(9);
  });

  it("keeps the column and clamps a short last line", () => {
    const down = moveGridCursor({ ...base, index: 7, key: "ArrowDown" });
    expect(down).toEqual({ index: 9, column: 3 });
    expect(
      moveGridCursor({
        ...base,
        index: 9,
        key: "ArrowUp",
        column: down?.column,
      })?.index,
    ).toBe(7);
  });

  it("goes to the ends of a line, or of the grid with ctrl", () => {
    expect(moveGridCursor({ ...base, index: 5, key: "Home" })?.index).toBe(4);
    expect(moveGridCursor({ ...base, index: 5, key: "End" })?.index).toBe(7);
    expect(
      moveGridCursor({ ...base, index: 9, key: "Home", ctrl: true })?.index,
    ).toBe(0);
    expect(
      moveGridCursor({ ...base, index: 0, key: "End", ctrl: true })?.index,
    ).toBe(9);
  });

  it("pages by lines and stops at the edges", () => {
    expect(
      moveGridCursor({ ...base, index: 1, key: "PageDown", pageRows: 5 })
        ?.index,
    ).toBe(9);
    expect(moveGridCursor({ ...base, index: 1, key: "ArrowUp" })?.index).toBe(
      1,
    );
  });

  it("enters from no cursor at either end", () => {
    expect(
      moveGridCursor({ ...base, index: -1, key: "ArrowDown" })?.index,
    ).toBe(0);
    expect(moveGridCursor({ ...base, index: -1, key: "ArrowUp" })?.index).toBe(
      9,
    );
  });

  it("ignores other keys and an empty grid", () => {
    expect(moveGridCursor({ ...base, index: 0, key: "a" })).toBeNull();
    expect(
      moveGridCursor({ count: 0, columns: 4, index: -1, key: "Home" }),
    ).toBeNull();
  });

  it("swaps the inline keys under RTL", () => {
    expect(inlineGridKey("ArrowLeft", true)).toBe("ArrowRight");
    expect(inlineGridKey("ArrowDown", true)).toBe("ArrowDown");
    expect(inlineGridKey("ArrowLeft", false)).toBe("ArrowLeft");
  });
});
