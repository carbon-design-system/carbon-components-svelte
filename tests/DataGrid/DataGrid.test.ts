import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { rect } from "../utils/rect";
import { user } from "../utils/user";
import DataGrid from "./DataGrid.test.svelte";

/** Reports a 600 by 320 grid, as a browser would, in place of the shared 0 by 100 mock. */
class ViewportObserver {
  callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe(element: Element) {
    queueMicrotask(() =>
      this.callback(
        [
          { target: element, contentRect: rect({ width: 600, height: 320 }) },
        ] as ResizeObserverEntry[],
        this as unknown as ResizeObserver,
      ),
    );
  }
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", ViewportObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function makeGrid(rowCount: number, columnCount: number) {
  const columns = Array.from({ length: columnCount }, (_, c) => ({
    key: `c${c}`,
    title: `Column ${c}`,
    width: 100,
  }));
  const rows = Array.from({ length: rowCount }, (_, r) =>
    Object.fromEntries(columns.map((column, c) => [column.key, `r${r}c${c}`])),
  );
  return { columns, rows };
}

const cell = (row: number, column: number) =>
  document.querySelector<HTMLElement>(
    `[role="gridcell"][data-row="${row}"][data-column="${column}"]`,
  );

function mustCell(row: number, column: number) {
  const found = cell(row, column);
  assert(found, `cell ${row},${column} is painted`);
  return found;
}

const active = () => screen.getByTestId("active").textContent;
const selection = () => screen.getByTestId("selection").textContent;

/**
 * Give the grid the box a browser would: 600 by 320, with 15px scrollbars
 * at the inline end and the bottom, inside it.
 */
function measure(grid: HTMLElement) {
  vi.spyOn(grid, "getBoundingClientRect").mockReturnValue(
    rect({ width: 600, height: 320 }),
  );
  Object.defineProperty(grid, "clientWidth", { value: 585 });
  Object.defineProperty(grid, "clientHeight", { value: 305 });
}

/** Scroll the grid the way the browser does: set the offset, then fire `scroll`. */
async function scrollTo(grid: HTMLElement, top: number, left = 0) {
  Object.defineProperty(grid, "scrollTop", { value: top, configurable: true });
  Object.defineProperty(grid, "scrollLeft", {
    value: left,
    configurable: true,
  });
  await fireEvent.scroll(grid);
}

describe("DataGrid", () => {
  describe("semantics", () => {
    it("resolves a v11 size alias before it reaches the class", () => {
      render(DataGrid, { ...makeGrid(3, 3), size: "xs" });

      const grid = screen.getByRole("grid");
      expect(grid).toHaveClass("bx--data-grid--compact");
      expect(grid.style.getPropertyValue("--ccs-data-grid-row-height")).toBe(
        "24px",
      );
    });

    it("announces a selection with selectionDescription", async () => {
      render(DataGrid, {
        ...makeGrid(5, 5),
        selectionDescription: (rows: number, columns: number) =>
          `${rows} x ${columns}`,
      });
      mustCell(0, 0).focus();

      await user.keyboard("{Shift>}{ArrowDown}{ArrowRight}{/Shift}");

      expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent(
        "2 x 2",
      );
    });

    it("dispatches a change event for each bindable value", async () => {
      const onChange = vi.fn();
      render(DataGrid, { ...makeGrid(5, 5), onChange });
      expect(onChange).not.toHaveBeenCalled();
      mustCell(0, 0).focus();

      await user.keyboard("{ArrowDown}");
      expect(onChange).toHaveBeenLastCalledWith("active-cell:change", {
        activeCell: { row: 1, column: 0 },
      });

      await user.keyboard("{Shift>}{ArrowRight}{/Shift}");
      expect(onChange).toHaveBeenLastCalledWith("selection:change", {
        selection: { startRow: 1, startColumn: 0, endRow: 1, endColumn: 1 },
      });
      expect(onChange).toHaveBeenCalledTimes(2);
    });

    it("counts every row and column, though it paints few", () => {
      render(DataGrid, makeGrid(1000, 30));

      const grid = screen.getByRole("grid", { name: "Sales" });
      expect(grid).toHaveAttribute("aria-rowcount", "1001");
      // 30 columns and the row headers.
      expect(grid).toHaveAttribute("aria-colcount", "31");
      expect(grid).toHaveAttribute("aria-multiselectable", "true");
      expect(grid).toHaveAttribute("aria-readonly", "true");
      expect(screen.getAllByRole("row").length).toBeLessThan(30);
      expect(cell(500, 0)).toBeNull();
      expect(cell(0, 29)).toBeNull();
    });

    it("indexes rows and columns by their place in the whole grid", () => {
      render(DataGrid, makeGrid(1000, 30));

      const [header, first] = screen.getAllByRole("row");
      expect(header).toHaveAttribute("aria-rowindex", "1");
      expect(first).toHaveAttribute("aria-rowindex", "2");
      expect(
        within(header, "columnheader").map((node) =>
          node.getAttribute("aria-colindex"),
        )[0],
      ).toBe("1");
      // Column 0 is the second column, after the row header.
      expect(mustCell(0, 0)).toHaveAttribute("aria-colindex", "2");
      expect(mustCell(3, 4)).toHaveAttribute("aria-colindex", "6");
      expect(screen.getAllByRole("rowheader")[0]).toHaveTextContent("1");
    });

    it("numbers the columns from 1 without row headers", () => {
      render(DataGrid, { ...makeGrid(10, 5), rowHeaders: false });

      expect(screen.getByRole("grid")).toHaveAttribute("aria-colcount", "5");
      expect(mustCell(0, 0)).toHaveAttribute("aria-colindex", "1");
      expect(screen.queryAllByRole("rowheader")).toHaveLength(0);
    });

    it("has one tab stop, the active cell", () => {
      render(DataGrid, makeGrid(1000, 30));

      const stops = document.querySelectorAll(
        '[role="gridcell"][tabindex="0"]',
      );
      expect(stops).toHaveLength(1);
      expect(stops[0]).toBe(mustCell(0, 0));
    });

    it("keeps the active cell painted after it scrolls out of the window", async () => {
      render(DataGrid, makeGrid(1000, 30));
      const grid = screen.getByRole("grid");

      await scrollTo(grid, 32 * 600);

      expect(cell(300, 0)).toBeNull();
      expect(mustCell(0, 0)).toHaveAttribute("tabindex", "0");
      expect(cell(600, 0)).not.toBeNull();
    });
  });

  describe("virtual columns", () => {
    it("paints the columns in view as the grid scrolls sideways", async () => {
      render(DataGrid, makeGrid(10, 30));
      const grid = screen.getByRole("grid");

      await scrollTo(grid, 0, 2000);

      expect(cell(2, 0)).not.toBeNull();
      expect(cell(2, 3)).toBeNull();
      expect(mustCell(2, 20)).toHaveAttribute("aria-colindex", "22");
      expect(cell(2, 29)).toBeNull();
    });

    it("reads a negative scroll offset as the distance from the inline start", async () => {
      render(DataGrid, { ...makeGrid(10, 30), dir: "rtl" });
      const grid = screen.getByRole("grid");

      await scrollTo(grid, 0, -2000);

      expect(cell(2, 3)).toBeNull();
      expect(cell(2, 20)).not.toBeNull();
    });
  });

  describe("keyboard", () => {
    it("moves one cell with the arrow keys and stops at the edges", async () => {
      render(DataGrid, makeGrid(20, 5));
      mustCell(0, 0).focus();

      await user.keyboard("{ArrowDown}{ArrowRight}{ArrowRight}");
      expect(active()).toBe("1,2");
      expect(mustCell(1, 2)).toHaveFocus();
      expect(mustCell(1, 2)).toHaveAttribute("tabindex", "0");
      expect(mustCell(0, 0)).toHaveAttribute("tabindex", "-1");

      await user.keyboard(
        "{ArrowUp}{ArrowUp}{ArrowLeft}{ArrowLeft}{ArrowLeft}",
      );
      expect(active()).toBe("0,0");
    });

    it("goes to the row ends with Home and End, and the grid ends with Ctrl", async () => {
      render(DataGrid, makeGrid(20, 5));
      mustCell(0, 0).focus();

      await user.keyboard("{ArrowDown}{ArrowDown}{End}");
      expect(active()).toBe("2,4");

      await user.keyboard("{Home}");
      expect(active()).toBe("2,0");

      await user.keyboard("{Control>}{End}{/Control}");
      expect(active()).toBe("19,4");

      await user.keyboard("{Control>}{Home}{/Control}");
      expect(active()).toBe("0,0");
    });

    it("pages by the rows in view", async () => {
      // 320px less the header row leaves nine 32px rows.
      render(DataGrid, makeGrid(100, 5));
      mustCell(0, 0).focus();

      await user.keyboard("{PageDown}");
      expect(active()).toBe("9,0");

      await user.keyboard("{PageUp}");
      expect(active()).toBe("0,0");
    });

    it("swaps the horizontal arrows under dir=rtl", async () => {
      render(DataGrid, { ...makeGrid(5, 5), dir: "rtl" });
      mustCell(0, 2).focus();
      await user.keyboard("{ArrowRight}");
      expect(active()).toBe("0,1");

      await user.keyboard("{ArrowLeft}{ArrowLeft}");
      expect(active()).toBe("0,3");
    });

    it("scrolls a distant cell into view and focuses it", async () => {
      render(DataGrid, makeGrid(100, 10));

      await user.click(screen.getByRole("button", { name: "Go to cell" }));
      await tick();

      expect(active()).toBe("40,3");
      expect(mustCell(40, 3)).toHaveFocus();
    });

    it("leaves a control inside a cell its own keys", async () => {
      render(DataGrid, { ...makeGrid(5, 5), withButton: true });
      const button = screen.getByRole("button", { name: "r0c1" });
      button.focus();

      await user.keyboard("{ArrowRight}{ArrowDown}");

      expect(active()).toBe("0,1");
      expect(button).toHaveFocus();
    });

    it("clamps the active cell when the rows shrink", async () => {
      const { rerender } = render(DataGrid, makeGrid(20, 5));
      mustCell(0, 0).focus();
      await user.keyboard("{Control>}{End}{/Control}");

      await rerender(makeGrid(3, 2));
      await tick();

      expect(active()).toBe("2,1");
      expect(mustCell(2, 1)).toHaveAttribute("tabindex", "0");
    });
  });

  describe("selection", () => {
    it("extends a rectangle with Shift and the arrow keys", async () => {
      render(DataGrid, makeGrid(20, 5));
      mustCell(1, 1).focus();

      await user.keyboard("{Shift>}{ArrowDown}{ArrowRight}{/Shift}");

      expect(selection()).toBe("1,1:2,2");
      // The active cell stays where the selection began.
      expect(active()).toBe("1,1");
      const selected = [
        ...document.querySelectorAll('[role="gridcell"][aria-selected="true"]'),
      ];
      expect(selected).toEqual([
        mustCell(1, 1),
        mustCell(1, 2),
        mustCell(2, 1),
        mustCell(2, 2),
      ]);
      expect(mustCell(0, 0)).toHaveAttribute("aria-selected", "false");
    });

    it("marks the edges of the rectangle", async () => {
      render(DataGrid, makeGrid(20, 5));
      mustCell(1, 1).focus();

      await user.keyboard("{Shift>}{ArrowDown}{ArrowRight}{/Shift}");

      expect(mustCell(1, 1)).toHaveClass(
        "bx--data-grid__cell--range-top",
        "bx--data-grid__cell--range-start",
      );
      expect(mustCell(2, 2)).toHaveClass(
        "bx--data-grid__cell--range-bottom",
        "bx--data-grid__cell--range-end",
      );
      expect(mustCell(2, 1)).toHaveClass("bx--data-grid__cell--range-bottom");
      expect(mustCell(2, 1)).not.toHaveClass(
        "bx--data-grid__cell--range-top",
        "bx--data-grid__cell--range-end",
      );
    });

    it("shrinks it back, and a single cell is not a selection", async () => {
      render(DataGrid, makeGrid(20, 5));
      mustCell(1, 1).focus();

      await user.keyboard("{Shift>}{ArrowDown}{/Shift}");
      expect(selection()).toBe("1,1:2,1");

      await user.keyboard("{Shift>}{ArrowUp}{/Shift}");
      expect(selection()).toBe("none");
      expect(
        document.querySelector('[role="gridcell"][aria-selected="true"]'),
      ).toBeNull();
    });

    it("clears the selection with Escape and with a plain arrow key", async () => {
      render(DataGrid, makeGrid(20, 5));
      mustCell(1, 1).focus();

      await user.keyboard("{Shift>}{ArrowDown}{/Shift}{Escape}");
      expect(selection()).toBe("none");

      await user.keyboard("{Shift>}{ArrowDown}{/Shift}{ArrowRight}");
      expect(selection()).toBe("none");
      expect(active()).toBe("1,2");
    });

    it("selects the grid, a column and a row from the keyboard", async () => {
      render(DataGrid, makeGrid(20, 5));
      mustCell(3, 2).focus();

      await user.keyboard("{Control>}a{/Control}");
      expect(selection()).toBe("0,0:19,4");

      await user.keyboard("{Control>} {/Control}");
      expect(selection()).toBe("0,2:19,2");

      await user.keyboard("{Shift>} {/Shift}");
      expect(selection()).toBe("3,0:3,4");
      expect(active()).toBe("3,2");
    });

    it("selects by dragging from one cell to another", async () => {
      render(DataGrid, makeGrid(20, 5));
      const grid = screen.getByRole("grid");
      measure(grid);
      // Row headers are 48px wide, columns 100px, rows 32px, header row 32px.
      const at = (row: number, column: number) => ({
        clientX: 48 + column * 100 + 10,
        clientY: 32 + row * 32 + 10,
        pointerId: 1,
      });

      await fireEvent.pointerDown(mustCell(1, 1), at(1, 1));
      await fireEvent.pointerMove(grid, at(3, 2));
      await fireEvent.pointerUp(grid, at(3, 2));

      expect(selection()).toBe("1,1:3,2");
      expect(active()).toBe("1,1");
      expect(mustCell(1, 1)).toHaveFocus();
    });

    it("leaves the selection alone when a scrollbar is pressed", async () => {
      render(DataGrid, makeGrid(20, 5));
      const grid = screen.getByRole("grid");
      measure(grid);
      mustCell(1, 1).focus();

      // The vertical scrollbar, then the horizontal one.
      await fireEvent.pointerDown(grid, {
        clientX: 592,
        clientY: 100,
        pointerId: 1,
      });
      await fireEvent.pointerUp(grid, { pointerId: 1 });
      await fireEvent.pointerDown(grid, {
        clientX: 200,
        clientY: 312,
        pointerId: 1,
      });
      await fireEvent.pointerUp(grid, { pointerId: 1 });

      expect(selection()).toBe("none");
      expect(active()).toBe("1,1");
    });

    it("selects a column, a row, or the grid from its header", async () => {
      render(DataGrid, makeGrid(20, 5));
      const grid = screen.getByRole("grid");
      measure(grid);

      // Over the "Column 2" header.
      await fireEvent.pointerDown(grid, {
        clientX: 48 + 250,
        clientY: 10,
        pointerId: 1,
      });
      await fireEvent.pointerUp(grid, { pointerId: 1 });
      expect(selection()).toBe("0,2:19,2");

      // Over the row header of the fifth row.
      await fireEvent.pointerDown(grid, {
        clientX: 10,
        clientY: 32 * 5 + 10,
        pointerId: 1,
      });
      await fireEvent.pointerUp(grid, { pointerId: 1 });
      expect(selection()).toBe("4,0:4,4");

      // Over the corner.
      await fireEvent.pointerDown(grid, {
        clientX: 10,
        clientY: 10,
        pointerId: 1,
      });
      await fireEvent.pointerUp(grid, { pointerId: 1 });
      expect(selection()).toBe("0,0:19,4");
    });
  });

  describe("clipboard", () => {
    function clipboard(text = "") {
      const store: Record<string, string> = {};
      return {
        store,
        data: {
          setData: (type: string, value: string) => {
            store[type] = value;
          },
          getData: () => text,
        },
      };
    }

    it("copies the selection as TSV and as an HTML table", async () => {
      render(DataGrid, makeGrid(20, 5));
      mustCell(1, 1).focus();
      await user.keyboard("{Shift>}{ArrowDown}{ArrowRight}{/Shift}");
      const { store, data } = clipboard();

      await fireEvent.copy(mustCell(1, 1), { clipboardData: data });

      expect(store["text/plain"]).toBe("r1c1\tr1c2\nr2c1\tr2c2");
      expect(store["text/html"]).toBe(
        "<table><tbody><tr><td>r1c1</td><td>r1c2</td></tr><tr><td>r2c1</td><td>r2c2</td></tr></tbody></table>",
      );
    });

    it("copies the active cell when nothing else is selected", async () => {
      render(DataGrid, makeGrid(20, 5));
      mustCell(2, 3).focus();
      const { store, data } = clipboard();

      await fireEvent.copy(mustCell(2, 3), { clipboardData: data });

      expect(store["text/plain"]).toBe("r2c3");
    });

    it("lets a copy listener cancel the copy", async () => {
      const onCopy = vi.fn((event: CustomEvent) => event.preventDefault());
      render(DataGrid, { ...makeGrid(20, 5), onCopy });
      mustCell(2, 3).focus();
      const { store, data } = clipboard();

      await fireEvent.copy(mustCell(2, 3), { clipboardData: data });

      expect(onCopy.mock.calls[0][0].detail).toEqual({
        range: { startRow: 2, startColumn: 3, endRow: 2, endColumn: 3 },
        matrix: [["r2c3"]],
      });
      expect(store).toEqual({});
    });

    it("hands a pasted matrix to the consumer and selects what it covers", async () => {
      const onPaste = vi.fn();
      render(DataGrid, { ...makeGrid(20, 5), onPaste });
      mustCell(2, 1).focus();
      const { data } = clipboard('a\tb\n"c\td"\te');

      await fireEvent.paste(mustCell(2, 1), { clipboardData: data });

      expect(onPaste).toHaveBeenCalledTimes(1);
      expect(onPaste.mock.calls[0][0].detail).toEqual({
        matrix: [
          ["a", "b"],
          ["c\td", "e"],
        ],
        text: 'a\tb\n"c\td"\te',
        range: { startRow: 2, startColumn: 1, endRow: 3, endColumn: 2 },
        truncated: false,
      });
      expect(selection()).toBe("2,1:3,2");
    });

    it("pastes at the top left of the selection and reports a clamped paste", async () => {
      const onPaste = vi.fn();
      render(DataGrid, { ...makeGrid(4, 3), onPaste });
      mustCell(2, 1).focus();
      await user.keyboard("{Shift>}{ArrowDown}{/Shift}");
      const { data } = clipboard("a\tb\tc\nd\te\tf\ng\th\ti");

      await fireEvent.paste(mustCell(2, 1), { clipboardData: data });

      expect(onPaste.mock.calls[0][0].detail.range).toEqual({
        startRow: 2,
        startColumn: 1,
        endRow: 3,
        endColumn: 2,
      });
      expect(onPaste.mock.calls[0][0].detail.truncated).toBe(true);
    });

    it("leaves the selection alone when the consumer cancels a paste", async () => {
      const onPaste = vi.fn((event: CustomEvent) => event.preventDefault());
      render(DataGrid, { ...makeGrid(20, 5), onPaste });
      mustCell(2, 1).focus();
      const { data } = clipboard("a\tb");

      await fireEvent.paste(mustCell(2, 1), { clipboardData: data });

      expect(onPaste).toHaveBeenCalledTimes(1);
      expect(selection()).toBe("none");
    });

    it("ignores a paste of nothing", async () => {
      const onPaste = vi.fn();
      render(DataGrid, { ...makeGrid(20, 5), onPaste });
      mustCell(2, 1).focus();

      await fireEvent.paste(mustCell(2, 1), {
        clipboardData: clipboard("").data,
      });

      expect(onPaste).not.toHaveBeenCalled();
    });
  });

  describe("frozen rows and columns", () => {
    it("paints frozen columns after the row headers, at their own offsets", () => {
      render(DataGrid, { ...makeGrid(20, 6), frozenColumns: 2 });

      const frozen = mustCell(5, 1);
      expect(frozen).toHaveClass("bx--data-grid__frozen");
      expect(frozen).toHaveClass("bx--data-grid__frozen--edge");
      expect(mustCell(5, 0)).not.toHaveClass("bx--data-grid__frozen--edge");
      expect(mustCell(5, 2)).not.toHaveClass("bx--data-grid__frozen");
      // 48px of row headers, then one 100px column.
      expect(frozen.style.getPropertyValue("--ccs-data-grid-x")).toBe("148px");
    });

    it("keeps frozen rows painted however far the body scrolls", async () => {
      render(DataGrid, { ...makeGrid(1000, 4), frozenRows: 2 });
      const grid = screen.getByRole("grid");

      await scrollTo(grid, 32 * 500);

      const rows = screen.getAllByRole("row");
      expect(rows[0]).toHaveAttribute("aria-rowindex", "1");
      expect(rows[1]).toHaveClass("bx--data-grid__row--frozen");
      expect(rows[2]).toHaveClass("bx--data-grid__row--frozen-edge");
      expect(cell(0, 0)).not.toBeNull();
      expect(cell(1, 0)).not.toBeNull();
      expect(cell(2, 0)).toBeNull();
      expect(cell(500, 0)).not.toBeNull();
    });
  });
});

/** The descendants of `node` with `role`. */
function within(node: HTMLElement, role: string) {
  return [...node.querySelectorAll<HTMLElement>(`[role="${role}"]`)];
}
