import { fireEvent, render, waitFor } from "@testing-library/svelte";
import { setMenuMetrics } from "../utils/set-menu-metrics";
import DataTable from "./DataTable.test.svelte";
import { eventDetails, getRenderedRowIds, makeRows } from "./helpers";

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

describe("DataTable scrollend", () => {
  const headers = [{ key: "name", value: "Name" }];
  const virtualize = { containerHeight: 200, threshold: 1 };

  function getScrollContainer(stickyHeader: boolean) {
    const table = document.querySelector("table");
    assert(table);
    if (stickyHeader) return table;
    // Table.svelte wraps `<table>` in its own `.bx--data-table-content` div;
    // the `scrollContainerRef` DataTable renders is one level further out.
    const container = table.parentElement?.parentElement;
    assert(container);
    return container;
  }

  const nearBottom = { scrollTop: 800, scrollHeight: 1000, clientHeight: 200 };

  it.each([
    ["non-sticky container", false],
    ["sticky-header table", true],
  ])(
    "dispatches scrollend when the %s scrolls near the bottom",
    async (_, stickyHeader) => {
      const onevent = vi.fn();
      render(DataTable, {
        props: {
          headers,
          rows: makeRows(200),
          virtualize,
          stickyHeader,
          onevent,
        },
      });

      const container = getScrollContainer(stickyHeader);
      setMenuMetrics(container, nearBottom);
      await fireEvent.scroll(container);

      expect(eventDetails(onevent, "scrollend")).toEqual([nearBottom]);
    },
  );

  it("does not dispatch scrollend when virtualize is disabled", async () => {
    const onevent = vi.fn();
    render(DataTable, {
      props: { headers, rows: makeRows(200), virtualize: false, onevent },
    });

    const container = getScrollContainer(false);
    setMenuMetrics(container, nearBottom);
    await fireEvent.scroll(container);

    expect(eventDetails(onevent, "scrollend")).toEqual([]);
  });

  it("re-arms when rows grow", async () => {
    const onevent = vi.fn();
    const { rerender } = render(DataTable, {
      props: { headers, rows: makeRows(200), virtualize, onevent },
    });

    const container = getScrollContainer(false);
    setMenuMetrics(container, nearBottom);
    await fireEvent.scroll(container);
    await fireEvent.scroll(container);
    expect(eventDetails(onevent, "scrollend")).toHaveLength(1);

    await rerender({ rows: makeRows(220) });

    const containerAfter = getScrollContainer(false);
    setMenuMetrics(containerAfter, {
      scrollTop: 1900,
      scrollHeight: 2100,
      clientHeight: 200,
    });
    await fireEvent.scroll(containerAfter);
    expect(eventDetails(onevent, "scrollend")).toHaveLength(2);
  });
});
