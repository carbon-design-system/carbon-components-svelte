import { fireEvent, render } from "@testing-library/svelte";
import { setMenuMetrics } from "../utils/set-menu-metrics";
import DataTableScrollend from "./DataTableScrollend.test.svelte";

function createRows(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: String(i),
    name: `Row ${i + 1}`,
  }));
}

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
      const onScrollend = vi.fn();
      render(DataTableScrollend, {
        props: { rows: createRows(200), stickyHeader, onScrollend },
      });

      const container = getScrollContainer(stickyHeader);
      setMenuMetrics(container, nearBottom);
      await fireEvent.scroll(container);

      expect(onScrollend).toHaveBeenCalledTimes(1);
      expect(onScrollend.mock.calls[0][0].detail).toEqual(nearBottom);
    },
  );

  it("does not dispatch scrollend when virtualize is disabled", async () => {
    const onScrollend = vi.fn();
    render(DataTableScrollend, {
      props: { rows: createRows(200), virtualize: false, onScrollend },
    });

    const container = getScrollContainer(false);
    setMenuMetrics(container, nearBottom);
    await fireEvent.scroll(container);

    expect(onScrollend).not.toHaveBeenCalled();
  });

  it("re-arms when rows grow", async () => {
    const onScrollend = vi.fn();
    const { rerender } = render(DataTableScrollend, {
      props: { rows: createRows(200), onScrollend },
    });

    const container = getScrollContainer(false);
    setMenuMetrics(container, nearBottom);
    await fireEvent.scroll(container);
    await fireEvent.scroll(container);
    expect(onScrollend).toHaveBeenCalledTimes(1);

    await rerender({ rows: createRows(220), onScrollend });

    const containerAfter = getScrollContainer(false);
    setMenuMetrics(containerAfter, {
      scrollTop: 1900,
      scrollHeight: 2100,
      clientHeight: 200,
    });
    await fireEvent.scroll(containerAfter);
    expect(onScrollend).toHaveBeenCalledTimes(2);
  });
});
