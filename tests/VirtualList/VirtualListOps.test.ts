import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import VirtualList from "./VirtualListOps.test.svelte";

const makeItems = (from: number, to: number) =>
  Array.from({ length: to - from }, (_, i) => ({
    id: from + i,
    label: `Row ${from + i}`,
  }));

const scrollTo = async (list: HTMLElement, top: number) => {
  list.scrollTop = top;
  await fireEvent.scroll(list);
};

describe("VirtualList operations", () => {
  it("renders the first window for initialScrollTop and scrolls there on mount", async () => {
    render(VirtualList, { props: { initialScrollTop: 5000 } });

    // Rows 250 to 254 are in view; two rows of overscan each side.
    expect(screen.getByTestId("row-248")).toBeInTheDocument();
    expect(screen.getByTestId("row-256")).toBeInTheDocument();
    expect(screen.queryByTestId("row-0")).not.toBeInTheDocument();

    await tick();
    expect(screen.getByTestId("list").scrollTop).toBe(5000);
  });

  it("scrolls to an index with each alignment", async () => {
    const { component } = render(VirtualList);
    const list = screen.getByTestId("list");

    component.scrollToIndex(300);
    await tick();
    expect(list.scrollTop).toBe(6000);
    await fireEvent.scroll(list);
    expect(screen.getByTestId("row-300")).toBeInTheDocument();

    component.scrollToIndex(300, { align: "end" });
    await tick();
    expect(list.scrollTop).toBe(301 * 20 - 100);

    component.scrollToIndex(300, { align: "center" });
    await tick();
    expect(list.scrollTop).toBe(300 * 20 + 10 - 50);
  });

  it("moves only as far as it takes for the nearest alignment", async () => {
    const { component } = render(VirtualList);
    const list = screen.getByTestId("list");

    expect(component.scrollToIndex(2, { align: "nearest" })).toBeNull();
    component.scrollToIndex(10, { align: "nearest" });
    await tick();
    expect(list.scrollTop).toBe(11 * 20 - 100);
  });

  it("holds the reader's place when items are put before the first", async () => {
    const { rerender } = render(VirtualList, {
      props: { items: makeItems(100, 1100) },
    });
    const list = screen.getByTestId("list");
    await scrollTo(list, 5000);
    const row = screen.getByText("Row 350");

    await rerender({ items: makeItems(50, 1100) });
    await tick();

    // 50 rows of 20px went in above: the list moved by as much.
    expect(list.scrollTop).toBe(5000 + 50 * 20);
    expect(screen.getByText("Row 350")).toBe(row);
  });

  it("leaves the top alone when items are put before the first", async () => {
    const { rerender } = render(VirtualList, {
      props: { items: makeItems(100, 1100) },
    });
    const list = screen.getByTestId("list");

    await rerender({ items: makeItems(90, 1100) });
    await tick();

    expect(list.scrollTop).toBe(0);
    expect(screen.getByTestId("row-0")).toHaveTextContent("Row 90");
  });

  it("holds the reader's place when items are dropped from the front", async () => {
    const items = makeItems(0, 1000);
    const { rerender } = render(VirtualList, { props: { items } });
    const list = screen.getByTestId("list");
    await scrollTo(list, 5000);
    const row = screen.getByText("Row 260");

    // A log that keeps its last lines: 40 gone from the front, 10 added.
    await rerender({ items: [...items.slice(40), ...makeItems(1000, 1010)] });
    await tick();

    expect(list.scrollTop).toBe(5000 - 40 * 20);
    expect(screen.getByText("Row 260")).toBe(row);
  });

  it("keeps an item rendered after it scrolls out of the window", async () => {
    const { rerender } = render(VirtualList, {
      props: { keepMounted: [3] },
    });
    const list = screen.getByTestId("list");
    const focused = screen.getByTestId("row-3");

    await scrollTo(list, 9000);
    expect(screen.queryByTestId("row-2")).not.toBeInTheDocument();
    expect(screen.getByTestId("row-3")).toBe(focused);
    expect(screen.getByTestId("row-450")).toBeInTheDocument();

    await rerender({ keepMounted: [] });
    expect(screen.queryByTestId("row-3")).not.toBeInTheDocument();
  });

  it("pins the last sticky item scrolled past, once", async () => {
    render(VirtualList, { props: { stickyIndices: [0, 100, 200] } });
    const list = screen.getByTestId("list");

    await scrollTo(list, 2030);
    const pinned = screen.getAllByTestId("row-100");
    expect(pinned).toHaveLength(1);
    const layer = pinned[0].parentElement?.parentElement;
    expect(layer).toHaveStyle({ position: "sticky", top: "0px" });

    await scrollTo(list, 4100);
    expect(screen.getAllByTestId("row-200")).toHaveLength(1);
    expect(screen.queryByTestId("row-100")).not.toBeInTheDocument();
  });

  describe("follow", () => {
    it("starts at the end and stays there as items arrive", async () => {
      const { rerender } = render(VirtualList, {
        props: { items: makeItems(0, 100), follow: "end" },
      });
      const list = screen.getByTestId("list");
      await tick();
      expect(list.scrollTop).toBe(100 * 20 - 100);
      expect(screen.getByTestId("row-99")).toBeInTheDocument();

      await rerender({ items: makeItems(0, 130) });
      await tick();
      expect(list.scrollTop).toBe(130 * 20 - 100);
      expect(screen.getByTestId("row-129")).toBeInTheDocument();
      expect(screen.getByTestId("at-end")).toHaveTextContent("true");
    });

    it("lets go on the wheel, before the scroll it causes is reported", async () => {
      const { rerender } = render(VirtualList, {
        props: { items: makeItems(0, 100), follow: "end" },
      });
      const list = screen.getByTestId("list");
      await tick();

      await fireEvent.wheel(list, { deltaY: -120 });
      await rerender({ items: makeItems(0, 130) });
      await tick();

      expect(list.scrollTop).toBe(100 * 20 - 100);
      expect(screen.getByTestId("at-end")).toHaveTextContent("false");
    });

    it("lets go when the reader scrolls up, and takes hold again at the end", async () => {
      const { rerender, component } = render(VirtualList, {
        props: { items: makeItems(0, 100), follow: "end" },
      });
      const list = screen.getByTestId("list");
      await tick();

      await scrollTo(list, 500);
      expect(screen.getByTestId("at-end")).toHaveTextContent("false");
      await rerender({ items: makeItems(0, 130) });
      await tick();
      expect(list.scrollTop).toBe(500);

      component.scrollToEnd();
      await tick();
      expect(list.scrollTop).toBe(130 * 20 - 100);
      await fireEvent.scroll(list);
      await rerender({ items: makeItems(0, 150) });
      await tick();
      expect(list.scrollTop).toBe(150 * 20 - 100);
    });
  });
});
