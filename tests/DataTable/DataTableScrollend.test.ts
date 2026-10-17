import { fireEvent, render } from "@testing-library/svelte";
import { setMenuMetrics } from "../utils/set-menu-metrics";
import DataTable from "./DataTable.test.svelte";
import { eventDetails, makeRows } from "./helpers";

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

describe("DataTable scrollend", () => {
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
