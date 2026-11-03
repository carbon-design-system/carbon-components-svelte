import {
  buildGridLayout,
  columnsForWidth,
  rowAtOffset,
  rowOffsets,
} from "../../src/utils/grid-layout.js";
import { gridNav, moveGridIndex } from "../../src/utils/grid-navigation.js";

// Two sections of 7 and 4 cells in 3 columns, each with a header:
//   header A
//   0 1 2
//   3 4 5
//   6
//   header B
//   7 8 9
//   10
const layout = buildGridLayout({
  counts: [7, 4],
  columns: 3,
  headers: [true, true],
});

function move(index: number, key: string, extra = {}) {
  return moveGridIndex({ layout, index, key, ...extra });
}

describe("buildGridLayout", () => {
  it("starts each section on a new line and keeps headers out of the lines", () => {
    expect(layout.rows.map((row) => row.type)).toEqual([
      "header",
      "cells",
      "cells",
      "cells",
      "header",
      "cells",
      "cells",
    ]);
    expect(layout.rows[3]).toMatchObject({ start: 6, length: 1 });
    expect(layout.rows[5]).toMatchObject({ start: 7, length: 3 });
    expect(layout.sectionRows).toEqual([0, 4]);
    expect(layout.itemColumn[10]).toBe(0);
    expect(layout.itemLine[10]).toBe(4);
  });
});

describe("moveGridIndex", () => {
  it("steps one cell and carries on into the next line and section", () => {
    expect(move(2, "ArrowRight")?.index).toBe(3);
    expect(move(6, "ArrowRight")?.index).toBe(7);
    expect(move(7, "ArrowLeft")?.index).toBe(6);
  });

  it("does not wrap at the ends", () => {
    expect(move(0, "ArrowLeft")?.index).toBe(0);
    expect(move(10, "ArrowRight")?.index).toBe(10);
    expect(move(1, "ArrowUp")?.index).toBe(1);
    expect(move(10, "ArrowDown")?.index).toBe(10);
  });

  it("clamps to a short line and remembers the column for the next move", () => {
    const down = move(5, "ArrowDown");
    expect(down).toEqual({ index: 6, column: 2 });
    // Back out of the short line to the remembered column.
    expect(move(6, "ArrowDown", { column: down?.column })).toEqual({
      index: 9,
      column: 2,
    });
    expect(move(6, "ArrowUp", { column: 2 })?.index).toBe(5);
  });

  it("moves to the ends of the line, or of the grid with ctrl", () => {
    expect(move(4, "Home")?.index).toBe(3);
    expect(move(4, "End")?.index).toBe(5);
    expect(move(6, "End")?.index).toBe(6);
    expect(move(4, "Home", { ctrl: true })?.index).toBe(0);
    expect(move(4, "End", { ctrl: true })?.index).toBe(10);
  });

  it("moves a page of lines and clamps at the first and last line", () => {
    expect(move(1, "PageDown", { pageRows: 2 })?.index).toBe(6);
    expect(move(1, "PageDown", { pageRows: 99 })?.index).toBe(10);
    expect(move(9, "PageUp", { pageRows: 99 })?.index).toBe(2);
  });

  it("enters at the first cell, or at the last for the keys that point back", () => {
    expect(move(-1, "ArrowDown")?.index).toBe(0);
    expect(move(-1, "ArrowUp")?.index).toBe(10);
    expect(move(-1, "End")?.index).toBe(10);
  });

  it("ignores other keys and an empty grid", () => {
    expect(move(0, "a")).toBeNull();
    const empty = buildGridLayout({ counts: [], columns: 3 });
    expect(moveGridIndex({ layout: empty, index: -1, key: "ArrowDown" })).toBe(
      null,
    );
  });
});

describe("gridNav", () => {
  function setup(options = {}) {
    const node = document.createElement("input");
    document.body.appendChild(node);
    let active = 1;
    const onMove = vi.fn((index: number) => {
      active = index;
    });
    const action = gridNav(node, {
      getLayout: () => layout,
      getIndex: () => active,
      onMove,
      ...options,
    });
    const press = (key: string, init: KeyboardEventInit = {}) => {
      const event = new KeyboardEvent("keydown", {
        key,
        bubbles: true,
        cancelable: true,
        ...init,
      });
      node.dispatchEvent(event);
      return event;
    };
    return { node, onMove, action, press };
  }

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("reports the next cell and prevents the default", () => {
    const { onMove, press } = setup();
    const event = press("ArrowDown");
    expect(onMove).toHaveBeenCalledWith(4, event);
    expect(event.defaultPrevented).toBe(true);
  });

  it("swaps the arrows when rtl() is true", () => {
    const { onMove, press } = setup({ rtl: () => true });
    press("ArrowLeft");
    expect(onMove.mock.calls[0][0]).toBe(2);
  });

  it("keeps the column across vertical moves, until the cursor moves from outside", () => {
    const { onMove, press } = setup();
    press("ArrowRight"); // 2
    press("ArrowDown"); // 5
    press("ArrowDown"); // 6, short line
    press("ArrowDown"); // 9, column 2 again
    expect(onMove.mock.calls.map((call) => call[0])).toEqual([2, 5, 6, 9]);
  });

  it("leaves a key to the element when shouldHandle says so", () => {
    const { onMove, press } = setup({ shouldHandle: () => false });
    const event = press("ArrowRight");
    expect(onMove).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it("leaves Shift, Alt and unrelated Ctrl keys alone", () => {
    const { onMove, press } = setup();
    press("ArrowRight", { shiftKey: true });
    press("ArrowRight", { altKey: true });
    press("ArrowRight", { ctrlKey: true });
    expect(onMove).not.toHaveBeenCalled();
    press("End", { ctrlKey: true });
    expect(onMove.mock.calls[0][0]).toBe(10);
  });
});

describe("columnsForWidth", () => {
  it("fits as many cells as the width holds, and falls back before it is known", () => {
    expect(columnsForWidth({ width: 320, cell: 40 })).toBe(8);
    expect(columnsForWidth({ width: 320, cell: 40, gap: 8 })).toBe(6);
    expect(columnsForWidth({ width: 10, cell: 40 })).toBe(1);
    expect(columnsForWidth({ width: 0, cell: 40, fallback: 5 })).toBe(5);
  });
});

describe("rowAtOffset", () => {
  it("finds the row under a scroll offset by its height", () => {
    const offsets = rowOffsets([32, 48, 48, 32]);
    expect(rowAtOffset(offsets, 0)).toBe(0);
    expect(rowAtOffset(offsets, 31)).toBe(0);
    expect(rowAtOffset(offsets, 32)).toBe(1);
    expect(rowAtOffset(offsets, 500)).toBe(3);
  });
});
