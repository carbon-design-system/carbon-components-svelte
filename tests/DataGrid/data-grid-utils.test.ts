import {
  applyDataGridPaste,
  buildColumnLayout,
  findOffsetIndex,
  getCellAtPoint,
  getColumnWindow,
  getFarCorner,
  getPasteRange,
  getRevealScroll,
  getRowWindow,
  moveCell,
  normalizeRange,
  parseTsv,
  rowHeightForSize,
  toHtmlTable,
  toTsv,
} from "carbon-components-svelte/DataGrid/data-grid-utils.js";

describe("data-grid-utils", () => {
  describe("buildColumnLayout", () => {
    it("accumulates widths and falls back for a missing one", () => {
      const layout = buildColumnLayout(
        [{ width: 100 }, {}, { width: 0 }, { width: 50 }],
        80,
      );

      expect(layout.widths).toEqual([100, 80, 80, 50]);
      expect(layout.offsets).toEqual([0, 100, 180, 260, 310]);
      expect(layout.total).toBe(310);
    });
  });

  describe("findOffsetIndex", () => {
    const offsets = [0, 100, 180, 260];

    it("finds the column holding an offset, clamped to the ends", () => {
      expect(findOffsetIndex(offsets, 0)).toBe(0);
      expect(findOffsetIndex(offsets, 99)).toBe(0);
      expect(findOffsetIndex(offsets, 100)).toBe(1);
      expect(findOffsetIndex(offsets, 259)).toBe(2);
      expect(findOffsetIndex(offsets, 9999)).toBe(2);
      expect(findOffsetIndex(offsets, -20)).toBe(0);
    });

    it("returns -1 without columns", () => {
      expect(findOffsetIndex([0], 10)).toBe(-1);
    });
  });

  describe("rowHeightForSize", () => {
    it("maps sizes and defaults to 32", () => {
      expect(rowHeightForSize("compact")).toBe(24);
      expect(rowHeightForSize("default")).toBe(48);
      expect(rowHeightForSize("tall")).toBe(64);
      expect(rowHeightForSize(undefined)).toBe(32);
    });
  });

  describe("getRowWindow", () => {
    const base = {
      rowCount: 10_000,
      rowHeight: 32,
      frozenRows: 0,
      viewportHeight: 320,
      overscan: 2,
    };

    it("covers the viewport below the column header", () => {
      // 10 rows of 32px fit in 320px, and the header takes one of them.
      expect(getRowWindow({ ...base, scrollTop: 0 })).toEqual({
        start: 0,
        end: 11,
      });
    });

    it("moves with the scroll position", () => {
      expect(getRowWindow({ ...base, scrollTop: 3200 })).toEqual({
        start: 98,
        end: 111,
      });
    });

    it("never paints a frozen row in the window", () => {
      expect(getRowWindow({ ...base, frozenRows: 3, scrollTop: 0 }).start).toBe(
        3,
      );
    });

    it("reaches ahead in the direction of travel", () => {
      const still = getRowWindow({ ...base, scrollTop: 3200 });
      const down = getRowWindow({ ...base, scrollTop: 3200, lead: 5 });
      const up = getRowWindow({ ...base, scrollTop: 3200, lead: -5 });

      expect(down.end).toBe(still.end + 5);
      expect(down.start).toBe(still.start);
      expect(up.start).toBe(still.start - 5);
      expect(up.end).toBe(still.end);
    });

    it("clamps to the row count", () => {
      expect(getRowWindow({ ...base, rowCount: 4, scrollTop: 0 })).toEqual({
        start: 0,
        end: 4,
      });
      expect(getRowWindow({ ...base, rowCount: 0, scrollTop: 0 })).toEqual({
        start: 0,
        end: 0,
      });
    });
  });

  describe("getColumnWindow", () => {
    const { offsets } = buildColumnLayout(
      Array.from({ length: 50 }, () => ({ width: 100 })),
      100,
    );
    const base = {
      offsets,
      frozenColumns: 0,
      gutterWidth: 50,
      viewportWidth: 450,
      overscan: 1,
    };

    it("covers the viewport after the row headers", () => {
      expect(getColumnWindow({ ...base, scrollStart: 0 })).toEqual({
        start: 0,
        end: 6,
      });
    });

    it("moves with the scroll position", () => {
      expect(getColumnWindow({ ...base, scrollStart: 2000 })).toEqual({
        start: 19,
        end: 26,
      });
    });

    it("leaves frozen columns to the caller", () => {
      expect(
        getColumnWindow({ ...base, frozenColumns: 2, scrollStart: 0 }).start,
      ).toBe(2);
    });
  });

  describe("moveCell", () => {
    const options = {
      rowCount: 100,
      columnCount: 10,
      pageRows: 12,
      pageColumns: 4,
    };
    const from = { row: 50, column: 5 };

    it("moves one cell and stops at the edges", () => {
      expect(moveCell("ArrowDown", from, options)).toEqual({
        row: 51,
        column: 5,
      });
      expect(moveCell("ArrowUp", { row: 0, column: 0 }, options)).toEqual({
        row: 0,
        column: 0,
      });
      expect(moveCell("ArrowRight", { row: 0, column: 9 }, options)).toEqual({
        row: 0,
        column: 9,
      });
    });

    it("jumps to the edge with Ctrl", () => {
      expect(moveCell("ArrowDown", from, { ...options, ctrl: true })).toEqual({
        row: 99,
        column: 5,
      });
      expect(moveCell("ArrowLeft", from, { ...options, ctrl: true })).toEqual({
        row: 50,
        column: 0,
      });
    });

    it("goes to the row ends with Home and End, and the grid ends with Ctrl", () => {
      expect(moveCell("Home", from, options)).toEqual({ row: 50, column: 0 });
      expect(moveCell("End", from, options)).toEqual({ row: 50, column: 9 });
      expect(moveCell("Home", from, { ...options, ctrl: true })).toEqual({
        row: 0,
        column: 0,
      });
      expect(moveCell("End", from, { ...options, ctrl: true })).toEqual({
        row: 99,
        column: 9,
      });
    });

    it("pages by rows, or by columns with Alt", () => {
      expect(moveCell("PageDown", from, options)).toEqual({
        row: 62,
        column: 5,
      });
      expect(moveCell("PageUp", from, options)).toEqual({ row: 38, column: 5 });
      expect(moveCell("PageDown", from, { ...options, alt: true })).toEqual({
        row: 50,
        column: 9,
      });
    });

    it("ignores other keys", () => {
      expect(moveCell("a", from, options)).toBeNull();
    });
  });

  describe("selection", () => {
    it("normalizes two corners", () => {
      expect(
        normalizeRange({ row: 5, column: 1 }, { row: 2, column: 4 }),
      ).toEqual({ startRow: 2, startColumn: 1, endRow: 5, endColumn: 4 });
    });

    it("finds the corner opposite the active cell", () => {
      const selection = {
        startRow: 2,
        startColumn: 1,
        endRow: 5,
        endColumn: 4,
      };

      expect(getFarCorner(selection, { row: 2, column: 1 })).toEqual({
        row: 5,
        column: 4,
      });
      expect(getFarCorner(selection, { row: 5, column: 4 })).toEqual({
        row: 2,
        column: 1,
      });
      expect(getFarCorner(null, { row: 3, column: 3 })).toEqual({
        row: 3,
        column: 3,
      });
    });
  });

  describe("getRevealScroll", () => {
    const { offsets } = buildColumnLayout(
      Array.from({ length: 20 }, () => ({ width: 100 })),
      100,
    );
    const base = {
      offsets,
      rowCount: 1000,
      rowHeight: 32,
      frozenRows: 0,
      frozenColumns: 0,
      gutterWidth: 50,
      scrollStart: 0,
      scrollTop: 0,
      viewportWidth: 450,
      viewportHeight: 320,
    };

    it("leaves a cell in view where it is", () => {
      expect(getRevealScroll({ ...base, cell: { row: 2, column: 2 } })).toEqual(
        { scrollStart: 0, scrollTop: 0 },
      );
    });

    it("scrolls a cell below the viewport to its end", () => {
      // Row 30 spans 992 to 1024, so the viewport ends there.
      expect(
        getRevealScroll({ ...base, cell: { row: 30, column: 0 } }).scrollTop,
      ).toBe(1024 - 320);
    });

    it("scrolls a cell hidden under the frozen rows and columns out from under them", () => {
      const frozen = { ...base, frozenRows: 2, frozenColumns: 1 };
      const scrolled = { ...frozen, scrollTop: 640, scrollStart: 500 };
      // Row 20 sits at 672, under the column header and two frozen rows (96)
      // at scroll 640. Column 5 sits at 550, under the row headers and one
      // frozen column (150) at scroll 500.
      const next = getRevealScroll({
        ...scrolled,
        cell: { row: 19, column: 4 },
      });

      expect(next.scrollTop).toBe(19 * 32 + 32 - 96);
      expect(next.scrollStart).toBe(50 + 400 - 150);
    });

    it("never goes past the content", () => {
      expect(
        getRevealScroll({ ...base, cell: { row: 999, column: 19 } }),
      ).toEqual({
        scrollStart: 50 + 2000 - 450,
        scrollTop: 32 * 1001 - 320,
      });
    });

    it("scrolls an axis back to the start for a frozen cell it moved to", () => {
      const frozen = {
        ...base,
        frozenRows: 1,
        frozenColumns: 1,
        scrollTop: 5000,
        scrollStart: 800,
      };

      expect(
        getRevealScroll({ ...frozen, cell: { row: 0, column: 0 } }),
      ).toEqual({ scrollStart: 800, scrollTop: 5000 });
      expect(
        getRevealScroll({
          ...frozen,
          cell: { row: 0, column: 0 },
          resetRow: true,
        }),
      ).toEqual({ scrollStart: 800, scrollTop: 0 });
      expect(
        getRevealScroll({
          ...frozen,
          cell: { row: 0, column: 0 },
          resetColumn: true,
        }),
      ).toEqual({ scrollStart: 0, scrollTop: 5000 });
    });
  });

  describe("getCellAtPoint", () => {
    const { offsets } = buildColumnLayout(
      Array.from({ length: 20 }, () => ({ width: 100 })),
      100,
    );
    const base = {
      offsets,
      rowCount: 1000,
      rowHeight: 32,
      frozenRows: 0,
      frozenColumns: 0,
      gutterWidth: 50,
      scrollStart: 0,
      scrollTop: 0,
    };

    it("finds a cell, and a header by -1", () => {
      expect(getCellAtPoint({ ...base, x: 160, y: 80 })).toEqual({
        row: 1,
        column: 1,
      });
      expect(getCellAtPoint({ ...base, x: 160, y: 10 })).toEqual({
        row: -1,
        column: 1,
      });
      expect(getCellAtPoint({ ...base, x: 20, y: 80 })).toEqual({
        row: 1,
        column: -1,
      });
      expect(getCellAtPoint({ ...base, x: 20, y: 10 })).toEqual({
        row: -1,
        column: -1,
      });
    });

    it("adds the scroll offsets, except over frozen cells", () => {
      const scrolled = {
        ...base,
        frozenRows: 1,
        frozenColumns: 1,
        scrollStart: 1000,
        scrollTop: 3200,
      };

      // Over the frozen column and frozen row: where they sit unscrolled.
      expect(getCellAtPoint({ ...scrolled, x: 100, y: 48 })).toEqual({
        row: 0,
        column: 0,
      });
      // Past them: shifted by the scroll.
      expect(getCellAtPoint({ ...scrolled, x: 200, y: 100 })).toEqual({
        row: 102,
        column: 11,
      });
    });

    it("clamps below the last row", () => {
      expect(
        getCellAtPoint({ ...base, rowCount: 3, x: 160, y: 5000 }).row,
      ).toBe(2);
    });
  });

  describe("clipboard text", () => {
    it("quotes only the fields a spreadsheet would", () => {
      expect(
        toTsv([
          ["a", "b"],
          ['say "hi"', "x\ty"],
          ["two\nlines", ""],
        ]),
      ).toBe('a\tb\n"say ""hi"""\t"x\ty"\n"two\nlines"\t');
    });

    it("escapes HTML in a table", () => {
      expect(toHtmlTable([["a<b", 'c"&']])).toBe(
        "<table><tbody><tr><td>a&lt;b</td><td>c&quot;&amp;</td></tr></tbody></table>",
      );
    });

    it("round-trips what it writes", () => {
      const matrix = [
        ["plain", 'say "hi"', "x\ty"],
        ["two\nlines", "", "end"],
      ];

      expect(parseTsv(toTsv(matrix))).toEqual(matrix);
    });

    it("reads CRLF and CR line breaks and ignores the closing one", () => {
      expect(parseTsv("a\tb\r\nc\td\r\n")).toEqual([
        ["a", "b"],
        ["c", "d"],
      ]);
      expect(parseTsv("a\rb")).toEqual([["a"], ["b"]]);
    });

    it("pads short rows to a rectangle", () => {
      expect(parseTsv("a\tb\tc\nd")).toEqual([
        ["a", "b", "c"],
        ["d", "", ""],
      ]);
    });

    it("keeps an empty row and an empty trailing field", () => {
      expect(parseTsv("a\t\n\nb")).toEqual([
        ["a", ""],
        ["", ""],
        ["b", ""],
      ]);
    });

    it("returns nothing for empty text", () => {
      expect(parseTsv("")).toEqual([]);
    });
  });

  describe("getPasteRange", () => {
    const base = { rowCount: 10, columnCount: 5 };
    const two = [
      ["a", "b"],
      ["c", "d"],
    ];

    it("starts at the active cell without a selection", () => {
      expect(
        getPasteRange({
          ...base,
          matrix: two,
          selection: null,
          active: { row: 3, column: 1 },
        }),
      ).toEqual({
        range: { startRow: 3, startColumn: 1, endRow: 4, endColumn: 2 },
        truncated: false,
      });
    });

    it("starts at the top left of a selection", () => {
      const result = getPasteRange({
        ...base,
        matrix: two,
        selection: { startRow: 5, startColumn: 2, endRow: 8, endColumn: 4 },
        active: { row: 8, column: 4 },
      });

      expect(result?.range).toEqual({
        startRow: 5,
        startColumn: 2,
        endRow: 6,
        endColumn: 3,
      });
    });

    it("fills a selection with one value", () => {
      const selection = {
        startRow: 1,
        startColumn: 1,
        endRow: 4,
        endColumn: 3,
      };

      expect(
        getPasteRange({
          ...base,
          matrix: [["x"]],
          selection,
          active: { row: 1, column: 1 },
        }),
      ).toEqual({ range: selection, truncated: false });
    });

    it("clamps to the grid and reports it", () => {
      expect(
        getPasteRange({
          ...base,
          matrix: two,
          selection: null,
          active: { row: 9, column: 4 },
        }),
      ).toEqual({
        range: { startRow: 9, startColumn: 4, endRow: 9, endColumn: 4 },
        truncated: true,
      });
    });

    it("has no target for an empty paste", () => {
      expect(
        getPasteRange({
          ...base,
          matrix: [],
          selection: null,
          active: { row: 0, column: 0 },
        }),
      ).toBeNull();
    });
  });

  describe("applyDataGridPaste", () => {
    const columns = [{ key: "a" }, { key: "b" }, { key: "c" }];
    const rows = [
      { a: 1, b: 2, c: 3 },
      { a: 4, b: 5, c: 6 },
      { a: 7, b: 8, c: 9 },
    ];

    it("writes the matrix over the range and leaves the input alone", () => {
      const next = applyDataGridPaste(rows, columns, {
        matrix: [
          ["x", "y"],
          ["z", "w"],
        ],
        range: { startRow: 1, startColumn: 1, endRow: 2, endColumn: 2 },
      });

      expect(next).toEqual([
        { a: 1, b: 2, c: 3 },
        { a: 4, b: "x", c: "y" },
        { a: 7, b: "z", c: "w" },
      ]);
      expect(next[0]).toBe(rows[0]);
      expect(rows[1]).toEqual({ a: 4, b: 5, c: 6 });
    });

    it("fills a larger range with one value, through toValue", () => {
      const next = applyDataGridPaste(
        rows,
        columns,
        {
          matrix: [["10"]],
          range: { startRow: 0, startColumn: 0, endRow: 1, endColumn: 1 },
        },
        (text, column) => (column.key === "a" ? Number(text) : text),
      );

      expect(next.slice(0, 2)).toEqual([
        { a: 10, b: "10", c: 3 },
        { a: 10, b: "10", c: 6 },
      ]);
    });

    it("stops at the last row and column", () => {
      const next = applyDataGridPaste(rows, columns, {
        matrix: [["x", "y"]],
        range: { startRow: 2, startColumn: 2, endRow: 5, endColumn: 5 },
      });

      expect(next).toHaveLength(3);
      expect(next[2]).toEqual({ a: 7, b: 8, c: "x" });
    });
  });
});
