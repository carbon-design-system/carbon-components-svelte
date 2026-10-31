import { fireEvent, render } from "@testing-library/svelte";
import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
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
const ROW = "bx--data-table--highlighted-row";

function highlightedHeaders() {
  return [...document.querySelectorAll("thead th")]
    .filter((th) => th.hasAttribute(COLUMN))
    .map((th) => th.textContent?.trim());
}

function highlightedCells() {
  return [...document.querySelectorAll("tbody td")]
    .filter((td) => td.hasAttribute(COLUMN))
    .map((td) => td.textContent?.trim());
}

describe("DataTable crosshair", () => {
  it("highlights the row and column of the hovered cell", async () => {
    render(DataTable, { props: { headers, rows, crosshair: true } });

    await fireEvent.mouseOver(getCells(getBodyRows()[1])[1]);

    expect(getBodyRows().map((row) => row.classList.contains(ROW))).toEqual([
      false,
      true,
      false,
    ]);
    expect(highlightedHeaders()).toEqual(["101"]);
    expect(highlightedCells()).toEqual(["5:30a", "5:34a", "5:38a"]);
  });

  it("moves the cross with the pointer and clears it on leave", async () => {
    render(DataTable, { props: { headers, rows, crosshair: true } });
    const [first, , third] = getBodyRows();

    await fireEvent.mouseOver(getCells(first)[1]);
    await fireEvent.mouseOver(getCells(third)[2]);

    expect(first.classList.contains(ROW)).toBe(false);
    expect(third.classList.contains(ROW)).toBe(true);
    expect(highlightedHeaders()).toEqual(["202"]);

    await fireEvent.mouseLeave(third);

    expect(third.classList.contains(ROW)).toBe(false);
    expect(highlightedHeaders()).toEqual([]);
    expect(highlightedCells()).toEqual([]);
  });

  it("highlights only the row over the expand and selection cells", async () => {
    render(DataTable, {
      props: { headers, rows, crosshair: true, expandable: true },
    });

    await fireEvent.mouseOver(getCells(getBodyRows()[0])[0]);

    expect(getBodyRows()[0].classList.contains(ROW)).toBe(true);
    expect(highlightedHeaders()).toEqual([]);
    expect(highlightedCells()).toEqual([]);
  });

  it("does nothing unless crosshair is set", async () => {
    render(DataTable, { props: { headers, rows } });

    await fireEvent.mouseOver(getCells(getBodyRows()[1])[1]);

    expect(document.querySelector(`.${ROW}, [${COLUMN}]`)).toBeNull();
  });

  it("keeps highlightedRowIds when the pointer leaves", async () => {
    render(DataTable, {
      props: { headers, rows, crosshair: true, highlightedRowIds: ["c"] },
    });
    const [first, , third] = getBodyRows();

    await fireEvent.mouseOver(getCells(first)[1]);
    await fireEvent.mouseLeave(first);

    expect(third.classList.contains(ROW)).toBe(true);
    expect(first.classList.contains(ROW)).toBe(false);
  });
});
