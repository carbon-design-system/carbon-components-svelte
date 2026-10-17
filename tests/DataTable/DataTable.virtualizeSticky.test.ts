import { render, waitFor } from "@testing-library/svelte";
import DataTable from "./DataTable.test.svelte";
import { getRenderedRowIds, makeRows } from "./helpers";

describe("DataTable virtualize + stickyHeader", () => {
  const renderVirtualSticky = (
    props: { size?: "medium"; stickyHeaderMaxHeight?: number | string } = {},
  ) =>
    render(DataTable, {
      props: {
        headers: [{ key: "name", value: "Name" }],
        rows: makeRows(500),
        stickyHeader: true,
        stickyHeaderMaxHeight: 240,
        virtualize: true,
        ...props,
      },
    });

  it("sizes the virtual window from a numeric stickyHeaderMaxHeight", () => {
    // itemHeight is 48 (the unset default size) and stickyHeaderMaxHeight
    // is 240, so the virtual window should render ceil(240 / 48) + overscan
    // (3) = 8 rows, not the 10-row-default window (itemHeight * 10 = 480,
    // which would render 13 rows).
    renderVirtualSticky();

    expect(getRenderedRowIds().length).toBe(8);
  });

  it("estimates rows at the 40px height that `medium` renders", () => {
    renderVirtualSticky({ size: "medium" });

    // `bx--data-table--md` rows are 40px: ceil(240 / 40) + overscan (3) = 9.
    expect(getRenderedRowIds().length).toBe(9);
  });

  it("falls back to the maxVisibleRows default when stickyHeaderMaxHeight is a string", () => {
    renderVirtualSticky({ stickyHeaderMaxHeight: "50vh" });

    // itemHeight (48) * maxVisibleRows (10) = 480; ceil(480 / 48) + overscan
    // (3) = 13 rows.
    expect(getRenderedRowIds().length).toBe(13);
  });

  it("updates the visible window when the sticky-header table scrolls", async () => {
    renderVirtualSticky();
    expect(getRenderedRowIds()).toContain("0");

    // `stickyHeader` makes the inner `<table>` the scrolling element, not
    // its wrapping `<section>`; scroll it directly, the same way a real
    // scroll would fire the listener attached to that element.
    const table = document.querySelector("table");
    assert(table);
    table.scrollTop = 500;
    table.dispatchEvent(new Event("scroll"));

    await waitFor(() => {
      expect(getRenderedRowIds()).not.toContain("0");
    });
    expect(getRenderedRowIds()).toContain("7");
  });
});
