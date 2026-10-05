import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { tick } from "svelte";
import { rect } from "../utils/rect";
import { virtualWindowLayer } from "../utils/virtual-window-layer";
import VirtualList from "./VirtualList.test.svelte";

describe("VirtualList", () => {
  it("renders only a windowed slice of a large list", () => {
    render(VirtualList);

    // 200px container / 40px rows ≈ 5 rows visible; overscan adds a few more,
    // nowhere near all 500.
    expect(screen.getAllByTestId(/^row-/).length).toBeLessThan(50);
    expect(screen.queryByTestId("row-499")).not.toBeInTheDocument();
  });

  it("windows short lists by default", () => {
    render(VirtualList);

    // 5 visible rows plus 3 overscan below.
    expect(screen.getAllByTestId(/^short-row-/)).toHaveLength(8);
  });

  it("renders every item when the list is below threshold", () => {
    render(VirtualList);

    expect(screen.getAllByTestId(/^unwindowed-row-/)).toHaveLength(20);
  });

  it("fires scrollend with scroll metrics when scrolled near the bottom", async () => {
    render(VirtualList);

    const container = screen.getByTestId("large");
    Object.defineProperty(container, "scrollHeight", {
      value: 20000,
      configurable: true,
    });
    Object.defineProperty(container, "clientHeight", {
      value: 200,
      configurable: true,
    });
    container.scrollTop = 19800;
    await fireEvent.scroll(container);

    expect(screen.getByTestId("scrollend-count")).toHaveTextContent("1");
    expect(
      JSON.parse(screen.getByTestId("scrollend-detail").textContent ?? ""),
    ).toEqual({ scrollTop: 19800, scrollHeight: 20000, clientHeight: 200 });
    expect(screen.getByTestId("row-499")).toBeInTheDocument();
  });

  it("renders ahead in the direction of the last scroll", async () => {
    render(VirtualList);

    const container = screen.getByTestId("large");
    container.scrollTop = 4000;
    await fireEvent.scroll(container);
    // 4000 + 200 viewport + 200 lead reaches row 109; overscan adds three.
    expect(screen.getByTestId("row-112")).toBeInTheDocument();

    container.scrollTop = 3800;
    await fireEvent.scroll(container);
    // 3800 - 200 lead starts at row 90; overscan adds three above.
    expect(screen.getByTestId("row-87")).toBeInTheDocument();
    expect(screen.queryByTestId("row-112")).not.toBeInTheDocument();
  });

  it("windows against scrollElement instead of its own container", async () => {
    render(VirtualList);

    const list = screen.getByTestId("external");
    expect(list.style.height).toBe("");

    // jsdom has no layout: place the list 4000px above the scroller's top.
    list.getBoundingClientRect = () => ({ top: -4000 }) as DOMRect;
    const scroller = screen.getByTestId("scroller");
    scroller.scrollTop = 4000;
    await fireEvent.scroll(scroller);

    expect(screen.getByTestId("external-row-100")).toBeInTheDocument();
    expect(screen.queryByTestId("external-row-0")).not.toBeInTheDocument();
  });

  describe("spacerTag", () => {
    const getList = () => screen.getByRole("list", { name: "Items" });

    it("renders items as direct children of the parent list", () => {
      render(VirtualList);

      const list = getList();
      for (const child of list.children) {
        expect(child.tagName).toBe("LI");
      }

      // A spacer above, a spacer below, and only the window between them.
      const [start, ...rest] = Array.from(list.children);
      const end = rest.pop();
      expect(start).toHaveAttribute("aria-hidden", "true");
      expect(start).toHaveStyle({ height: "0px" });
      expect(end).toHaveAttribute("aria-hidden", "true");
      expect(rest.length).toBeLessThan(50);
      expect(end).toHaveStyle({ height: `${(500 - rest.length) * 40}px` });
    });

    it("drops the end spacer once the last item renders", async () => {
      render(VirtualList);

      const list = getList();
      const start = list.firstElementChild as HTMLElement;
      start.getBoundingClientRect = () => ({ top: -20_000 }) as DOMRect;
      const scroller = screen.getByTestId("list-scroller");
      scroller.scrollTop = 20_000;
      await fireEvent.scroll(scroller);
      await tick();

      // The true last item stays last, so `:last-of-type` styles still apply.
      const last = list.lastElementChild;
      expect(last).not.toHaveAttribute("aria-hidden");
      expect(last).toHaveAttribute("aria-posinset", "500");
    });

    it("skips attribute writes that would not change anything", async () => {
      render(VirtualList);

      const list = getList();
      const start = list.firstElementChild as HTMLElement;
      const scroller = screen.getByTestId("list-scroller");
      async function scrollTo(top: number) {
        start.getBoundingClientRect = () => ({ top: -top }) as DOMRect;
        scroller.scrollTop = top;
        await fireEvent.scroll(scroller);
        await tick();
      }

      await scrollTo(1);
      const records: MutationRecord[] = [];
      const observer = new MutationObserver((batch) => records.push(...batch));
      observer.observe(list, { subtree: true, attributes: true });

      // Moving 1px within the first row updates the list but not the window.
      await scrollTo(2);
      await tick();

      observer.disconnect();
      const ariaWrites = records.filter((record) =>
        record.attributeName?.startsWith("aria-"),
      );
      expect(ariaWrites).toHaveLength(0);
    });

    it("gives each item its position in the full list", async () => {
      render(VirtualList);
      await tick();

      const rows = within(getList()).getAllByRole("listitem");
      expect(rows[0]).toHaveAttribute("aria-posinset", "1");
      expect(rows[0]).toHaveAttribute("aria-setsize", "500");
      expect(rows[2]).toHaveAttribute("aria-posinset", "3");
    });

    it("windows against scrollElement", async () => {
      render(VirtualList);

      const list = getList();
      const start = list.firstElementChild as HTMLElement;
      // jsdom has no layout: place the list 4000px above the scroller's top.
      start.getBoundingClientRect = () => ({ top: -4000 }) as DOMRect;
      const scroller = screen.getByTestId("list-scroller");
      scroller.scrollTop = 4000;
      await fireEvent.scroll(scroller);
      await tick();

      expect(start).toHaveStyle({ height: `${97 * 40}px` });
      const firstRow = start.nextElementSibling;
      expect(firstRow).toHaveAttribute("aria-posinset", "98");
      expect(within(list).getByText("Item 100").closest("li")).toHaveAttribute(
        "aria-posinset",
        "101",
      );
      expect(within(list).queryByText("Item 0")).not.toBeInTheDocument();
    });
  });

  it("pins the window to the viewport with optimizeFastScroll", async () => {
    render(VirtualList);

    const list = screen.getByTestId("pinned");
    const layer = virtualWindowLayer(list);
    expect(layer.style.position).toBe("sticky");

    list.scrollTop = 4000;
    await fireEvent.scroll(list);

    // Row 100 is in view; the window starts at row 97, 120px above the layer.
    expect(screen.getByTestId("pinned-row-100")).toBeInTheDocument();
    expect(layer.style.transform).toBe("translateY(-120px)");
  });

  it("leaves the window unpinned without optimizeFastScroll", () => {
    render(VirtualList);

    const layer = virtualWindowLayer(screen.getByTestId("large"));
    expect(layer.style.position).toBe("");
    expect(layer.style.transform).toBe("translateY(0px)");
  });

  it("ignores optimizeFastScroll with scrollElement", async () => {
    render(VirtualList);

    const list = screen.getByTestId("pinned-external");
    list.getBoundingClientRect = () => rect({ top: -4000 });
    const scroller = screen.getByTestId("pinned-scroller");
    scroller.scrollTop = 4000;
    await fireEvent.scroll(scroller);

    const layer = virtualWindowLayer(list);
    expect(layer.style.position).toBe("");
    expect(layer.style.transform).toBe("translateY(3880px)");
  });
});
