import { render, waitFor } from "@testing-library/svelte";
import DataTableVirtualizeSticky from "./DataTable.virtualizeSticky.test.svelte";

describe("DataTable virtualize + stickyHeader", () => {
  const renderedRowCount = () =>
    document.querySelectorAll("tbody tr[data-row]").length;
  const renderedRowIds = () =>
    [...document.querySelectorAll("tbody tr[data-row]")].map((tr) =>
      tr.getAttribute("data-row"),
    );

  it("sizes the virtual window from a numeric stickyHeaderMaxHeight", () => {
    // itemHeight is 48 (medium, the default size) and stickyHeaderMaxHeight
    // is 240, so the virtual window should render ceil(240 / 48) + overscan
    // (3) = 8 rows, not the 10-row-default window (itemHeight * 10 = 480,
    // which would render 13 rows).
    render(DataTableVirtualizeSticky);

    expect(renderedRowCount()).toBe(8);
  });

  it("falls back to the maxVisibleRows default when stickyHeaderMaxHeight is a string", () => {
    render(DataTableVirtualizeSticky, {
      props: { stickyHeaderMaxHeight: "50vh" },
    });

    // itemHeight (48) * maxVisibleRows (10) = 480; ceil(480 / 48) + overscan
    // (3) = 13 rows.
    expect(renderedRowCount()).toBe(13);
  });

  it("updates the visible window when the sticky-header table scrolls", async () => {
    render(DataTableVirtualizeSticky);
    expect(renderedRowIds()).toContain("0");

    // `stickyHeader` makes the inner `<table>` the scrolling element, not
    // its wrapping `<section>`; scroll it directly, the same way a real
    // scroll would fire the listener attached to that element.
    const table = document.querySelector("table") as HTMLTableElement;
    table.scrollTop = 500;
    table.dispatchEvent(new Event("scroll"));

    await waitFor(() => {
      expect(renderedRowIds()).not.toContain("0");
    });
    expect(renderedRowIds()).toContain("7");
  });
});
