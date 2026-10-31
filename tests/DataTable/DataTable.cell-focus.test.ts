import { fireEvent, render, screen } from "@testing-library/svelte";
import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
import { tick } from "svelte";
import { getBodyRows, getCells } from "./helpers";

const headers = [
  { key: "station", value: "Station" },
  { key: "t1", value: "101" },
  { key: "t2", value: "202" },
];
const rows = [
  { id: "a", station: "Millbrae", t1: "5:30a", t2: "5:57a" },
  { id: "b", station: "Burlingame", t1: "5:34a", t2: "—" },
  { id: "c", station: "San Mateo", t1: "5:38a", t2: "6:04a" },
];

const COLUMN = "data-highlighted-column";

function cellAt(row: number, column: number) {
  return getCells(getBodyRows()[row])[column];
}

function tabStops() {
  return [...document.querySelectorAll('td[tabindex="0"]')].map((td) =>
    td.textContent?.trim(),
  );
}

describe("DataTable cellFocus", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("dir");
  });

  it("makes one cell the tab stop and gives the table the grid role", () => {
    render(DataTable, { props: { headers, rows, cellFocus: true } });

    expect(screen.getByRole("grid")).toBeInTheDocument();
    expect(tabStops()).toEqual(["Millbrae"]);
    expect(document.querySelectorAll('td[tabindex="-1"]')).toHaveLength(8);
  });

  it("leaves the cells alone unless cellFocus is set", () => {
    render(DataTable, { props: { headers, rows } });

    expect(screen.queryByRole("grid")).toBeNull();
    expect(document.querySelector("td[tabindex]")).toBeNull();
  });

  it("moves with the arrow keys and Home and End", async () => {
    render(DataTable, { props: { headers, rows, cellFocus: true } });
    cellAt(0, 0).focus();

    await fireEvent.keyDown(cellAt(0, 0), { key: "ArrowRight" });
    expect(cellAt(0, 1)).toHaveFocus();

    await fireEvent.keyDown(cellAt(0, 1), { key: "ArrowDown" });
    expect(cellAt(1, 1)).toHaveFocus();

    await fireEvent.keyDown(cellAt(1, 1), { key: "End" });
    expect(cellAt(1, 2)).toHaveFocus();

    await fireEvent.keyDown(cellAt(1, 2), { key: "ArrowUp" });
    expect(cellAt(0, 2)).toHaveFocus();

    await fireEvent.keyDown(cellAt(0, 2), { key: "Home" });
    expect(cellAt(0, 0)).toHaveFocus();

    await fireEvent.keyDown(cellAt(0, 0), { key: "End", ctrlKey: true });
    expect(cellAt(2, 2)).toHaveFocus();

    await fireEvent.keyDown(cellAt(2, 2), { key: "Home", ctrlKey: true });
    expect(cellAt(0, 0)).toHaveFocus();
  });

  it("stops at the edges", async () => {
    render(DataTable, { props: { headers, rows, cellFocus: true } });
    cellAt(0, 0).focus();

    const left = await fireEvent.keyDown(cellAt(0, 0), { key: "ArrowLeft" });
    const down = await fireEvent.keyDown(cellAt(2, 0), { key: "ArrowDown" });

    expect(cellAt(0, 0)).toHaveFocus();
    // Left unprevented, so the page scrolls as it would.
    expect(left && down).toBe(true);
  });

  it("takes the header row into the grid, with no tab stop of its own", async () => {
    render(DataTable, {
      props: { headers, rows, cellFocus: true, sortable: true },
    });
    const buttons = [...document.querySelectorAll("thead button")];

    expect(buttons).toHaveLength(3);
    for (const button of buttons) {
      expect(button).toHaveAttribute("tabindex", "-1");
    }

    cellAt(0, 1).focus();
    await fireEvent.keyDown(cellAt(0, 1), { key: "ArrowUp" });
    expect(buttons[1]).toHaveFocus();

    await fireEvent.keyDown(buttons[1], { key: "ArrowRight" });
    expect(buttons[2]).toHaveFocus();

    await fireEvent.keyDown(buttons[2], { key: "Home" });
    expect(buttons[0]).toHaveFocus();

    const up = await fireEvent.keyDown(buttons[0], { key: "ArrowUp" });
    expect(up).toBe(true);

    await fireEvent.keyDown(buttons[0], { key: "ArrowDown" });
    expect(cellAt(0, 0)).toHaveFocus();
  });

  it("focuses a header cell with no sort button", async () => {
    render(DataTable, { props: { headers, rows, cellFocus: true } });
    const header = document.querySelectorAll("thead th")[2];

    expect(header).toHaveAttribute("tabindex", "-1");
    cellAt(0, 2).focus();
    await fireEvent.keyDown(cellAt(0, 2), { key: "ArrowUp" });
    expect(header).toHaveFocus();
  });

  it("leaves the header controls in the tab order without cellFocus", () => {
    render(DataTable, { props: { headers, rows, sortable: true } });

    for (const button of document.querySelectorAll("thead button")) {
      expect(button).not.toHaveAttribute("tabindex");
    }
  });

  it("swaps the horizontal arrows in right-to-left text", async () => {
    document.documentElement.setAttribute("dir", "rtl");
    render(DataTable, { props: { headers, rows, cellFocus: true } });
    cellAt(0, 0).focus();

    await fireEvent.keyDown(cellAt(0, 0), { key: "ArrowLeft" });
    expect(cellAt(0, 1)).toHaveFocus();

    await fireEvent.keyDown(cellAt(0, 1), { key: "ArrowRight" });
    expect(cellAt(0, 0)).toHaveFocus();
  });

  it("keeps the last focused cell as the tab stop", async () => {
    render(DataTable, { props: { headers, rows, cellFocus: true } });

    cellAt(1, 2).focus();
    await tick();

    expect(tabStops()).toEqual(["—"]);
  });

  it("skips the expand and selection cells", async () => {
    render(DataTable, {
      props: {
        headers,
        rows,
        cellFocus: true,
        expandable: true,
        selectable: true,
      },
    });
    const first = getCells(getBodyRows()[0]);

    expect(first[0]).not.toHaveAttribute("tabindex");
    expect(first[1]).not.toHaveAttribute("tabindex");
    expect(tabStops()).toEqual(["Millbrae"]);

    first[2].focus();
    await fireEvent.keyDown(first[2], { key: "ArrowLeft" });

    expect(first[2]).toHaveFocus();
  });

  it("skips a cell's own keys when focus is inside its content", async () => {
    render(DataTable, {
      props: { headers, rows, cellFocus: true, expandable: true },
    });
    const toggle = screen.getAllByRole("button", { name: /expand/i })[0];
    toggle.focus();

    await fireEvent.keyDown(toggle, { key: "ArrowRight" });

    expect(toggle).toHaveFocus();
  });

  it("keeps a tab stop when the focused cell's row is removed", async () => {
    const { rerender } = render(DataTable, {
      props: { headers, rows, cellFocus: true },
    });
    cellAt(2, 1).focus();
    await tick();
    expect(tabStops()).toEqual(["5:38a"]);

    await rerender({ rows: rows.slice(0, 2) });

    // The column stays; the row falls back to the first one.
    expect(tabStops()).toEqual(["5:30a"]);
  });

  it("drives the crosshair from the focused cell", async () => {
    render(DataTable, {
      props: { headers, rows, cellFocus: true, crosshair: true },
    });

    cellAt(1, 1).focus();
    await tick();

    expect(getBodyRows()[1]).toHaveClass("bx--data-table--highlighted-row");
    expect(cellAt(0, 1)).toHaveAttribute(COLUMN);
    expect(cellAt(2, 1)).toHaveAttribute(COLUMN);

    cellAt(1, 1).blur();
    await tick();

    expect(document.querySelector(`[${COLUMN}]`)).toBeNull();
    expect(getBodyRows()[1]).not.toHaveClass("bx--data-table--highlighted-row");
  });
});
