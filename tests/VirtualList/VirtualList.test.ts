import { setFlagsFromString } from "node:v8";
import { runInNewContext } from "node:vm";
import { fireEvent, render, screen, within } from "@testing-library/svelte";
import VirtualListComponent from "carbon-components-svelte/VirtualList/VirtualList.svelte";
import { tick } from "svelte";
import { flushMacrotask } from "../utils/flush-macrotask";
import { nextFrame } from "../utils/next-frame";
import { rect } from "../utils/rect";
import { stubPerOptionResizeObserver } from "../utils/stub-per-option-resize-observer";
import { virtualWindowLayer } from "../utils/virtual-window-layer";
import VirtualList from "./VirtualList.test.svelte";
import { scrollListTo } from "./helpers";

describe("VirtualList", () => {
  afterEach(vi.restoreAllMocks);

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

    await scrollListTo(screen.getByTestId("scroller"), list, 4000);

    expect(screen.getByTestId("external-row-100")).toBeInTheDocument();
    expect(screen.queryByTestId("external-row-0")).not.toBeInTheDocument();
  });

  it("windows against an already scrolled scrollElement on mount", async () => {
    const { rerender } = render(VirtualList);

    // jsdom has no layout: place the list 4000px above the scroller's top.
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
      function (this: Element) {
        return rect({ top: this.matches(".bx--virtual-list") ? -4000 : 0 });
      },
    );
    screen.getByTestId("scroller").scrollTop = 4000;
    await rerender({ lateList: true });
    await tick();

    expect(screen.getByTestId("late-row-100")).toBeInTheDocument();
    expect(screen.queryByTestId("late-row-0")).not.toBeInTheDocument();
  });

  it("keeps a row's element when items are prepended with getKey", async () => {
    const { rerender } = render(VirtualList);
    const row = screen.getByText("Keyed 2");

    await rerender({
      keyedItems: [
        { id: 100, label: "Keyed 100" },
        ...Array.from({ length: 10 }, (_, i) => ({
          id: i,
          label: `Keyed ${i}`,
        })),
      ],
    });

    expect(screen.getByText("Keyed 2")).toBe(row);
  });

  it("lets go of the items it was given once the list is replaced", async () => {
    // Node has no `gc` here, but V8 hands it out on request.
    setFlagsFromString("--expose-gc");
    const gc = runInNewContext("gc") as () => void;

    // Everything that points at the first list stays inside this function.
    // Render the list alone. Under Svelte 3 and 4, a `let:` slot keeps a copy
    // of its parent's state until a value it reads changes, so the rows of
    // the fixture's other lists would hold the first list. Track the array,
    // not an item: a Svelte 5 `{#each}` row keeps the item it was created
    // with for as long as the row lives.
    const mountFirst = () => {
      const first = Array.from({ length: 10 }, (_, i) => ({ id: i }));
      return {
        tracked: new WeakRef(first),
        view: render(VirtualListComponent, { props: { items: first } }),
      };
    };
    const { tracked, view } = mountFirst();
    await view.rerender({ items: [{ id: 100 }] });

    // Collect after a macrotask, so no task that touched the first list is
    // still running, and repeat in case one pass leaves it. Read `tracked`
    // only once: `deref` keeps its target alive until the task ends.
    const collect = async () => {
      await flushMacrotask();
      gc();
    };
    await collect();
    await collect();
    await collect();

    expect(
      tracked.deref(),
      "the first list is still reachable after garbage collection",
    ).toBeUndefined();
  });

  it("detaches its scroll listener from scrollElement on unmount", () => {
    const { unmount } = render(VirtualList);
    const scroller = screen.getByTestId("scroller");
    const removeEventListener = vi.spyOn(scroller, "removeEventListener");

    unmount();

    expect(removeEventListener).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function),
    );
  });

  describe("measured", () => {
    beforeEach(stubPerOptionResizeObserver);
    afterEach(vi.unstubAllGlobals);

    it("forgets measured heights when items are replaced", async () => {
      const { rerender } = render(VirtualList);
      const list = screen.getByTestId("measured");
      const getTotalHeight = () =>
        virtualWindowLayer(list).parentElement?.style.height;

      await nextFrame();
      list.scrollTop = 5000;
      await fireEvent.scroll(list);
      await nextFrame();

      await rerender({
        measuredItems: Array.from({ length: 20 }, (_, i) => ({
          id: i + 20,
          height: 40,
        })),
      });
      await nextFrame();
      expect(getTotalHeight()).toBe("800px");
    });

    it("forgets measured heights when items are replaced while unmeasured", async () => {
      const { rerender } = render(VirtualList);
      const list = screen.getByTestId("measured");
      const getTotalHeight = () =>
        virtualWindowLayer(list).parentElement?.style.height;

      await nextFrame();
      list.scrollTop = 5000;
      await fireEvent.scroll(list);
      await nextFrame();

      await rerender({ measuring: false });
      await rerender({
        measuredItems: Array.from({ length: 20 }, (_, i) => ({
          id: i + 20,
          height: 40,
        })),
      });
      await rerender({ measuring: true });
      await nextFrame();
      expect(getTotalHeight()).toBe("800px");
    });
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
      await scrollListTo(screen.getByTestId("list-scroller"), start, 20_000);
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
        await scrollListTo(scroller, start, top);
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
      await scrollListTo(screen.getByTestId("list-scroller"), start, 4000);
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
    await scrollListTo(screen.getByTestId("pinned-scroller"), list, 4000);

    const layer = virtualWindowLayer(list);
    expect(layer.style.position).toBe("");
    expect(layer.style.transform).toBe("translateY(3880px)");
  });
});
