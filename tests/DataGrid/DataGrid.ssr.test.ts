// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import DataGrid from "./DataGrid.test.svelte";

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

describe("DataGrid server render", () => {
  const render = (props: Record<string, unknown> = {}) =>
    renderSSR(DataGrid, { ...makeGrid(10_000, 50), ...props }).document;

  it("paints one screen of a large grid, not all of it", () => {
    const document = render();

    expect(document.querySelectorAll('[role="gridcell"]').length).toBeLessThan(
      400,
    );
    expect(
      document.querySelector('[data-row="0"][data-column="0"]'),
    ).not.toBeNull();
    expect(document.querySelector('[data-row="9999"]')).toBeNull();
    expect(document.querySelector('[data-column="49"]')).toBeNull();
  });

  it("writes the counts and the indexes of the whole grid", () => {
    const document = render();
    const grid = document.querySelector('[role="grid"]');

    expect(grid).toHaveAttribute("aria-rowcount", "10001");
    expect(grid).toHaveAttribute("aria-colcount", "51");
    expect(
      document.querySelector('[data-row="3"][data-column="4"]'),
    ).toHaveAttribute("aria-colindex", "6");
    expect(document.querySelectorAll('[role="row"]')[4]).toHaveAttribute(
      "aria-rowindex",
      "5",
    );
  });

  it("has its one tab stop in the markup", () => {
    const document = render();

    expect(
      document.querySelectorAll('[role="gridcell"][tabindex="0"]'),
    ).toHaveLength(1);
    expect(
      document.querySelector('[data-row="0"][data-column="0"]'),
    ).toHaveAttribute("tabindex", "0");
  });

  it("writes frozen offsets and row positions inline, so the first paint is exact", () => {
    const document = render({ frozenColumns: 2, frozenRows: 1 });
    const frozen = document.querySelector<HTMLElement>(
      '[data-row="5"][data-column="1"]',
    );

    expect(frozen).toHaveClass("bx--data-grid__frozen--edge");
    // 73px of row headers (five digits of row number), then one 100px column.
    expect(frozen?.getAttribute("style")).toContain("--ccs-data-grid-x: 173px");
    expect(
      document.querySelector('[role="row"][aria-rowindex="2"]'),
    ).toHaveClass("bx--data-grid__row--frozen");
    expect(
      document
        .querySelector('[role="row"][aria-rowindex="7"]')
        ?.getAttribute("style"),
    ).toContain("top: 192px");
  });

  it("renders an empty grid as its headers and one empty state cell", () => {
    const document = render({ rows: [] });

    expect(document.querySelectorAll('[role="row"]')).toHaveLength(2);
    const empty = document.querySelector('[role="gridcell"]');
    expect(empty).toHaveTextContent("No rows");
    expect(empty).toHaveAttribute("tabindex", "0");
    expect(empty).toHaveAttribute("aria-colspan", "50");
    expect(document.querySelector('[role="grid"]')).toHaveAttribute(
      "aria-rowcount",
      "2",
    );
  });
});
