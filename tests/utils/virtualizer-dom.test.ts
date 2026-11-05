import { tick } from "svelte";
import {
  attachGridScroller,
  attachScroller,
  syncScroll,
} from "../../src/utils/virtualizer-dom.js";
import {
  createGridVirtualizer,
  createVirtualizer,
} from "../../src/utils/virtualizer.js";

/** A scroller with a size, since jsdom lays nothing out. */
function createScroller(size = { width: 200, height: 100 }) {
  const element = document.createElement("div");
  Object.defineProperty(element, "clientWidth", { value: size.width });
  Object.defineProperty(element, "clientHeight", { value: size.height });
  document.body.appendChild(element);
  return element;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("createGridVirtualizer", () => {
  it("windows both axes and tells subscribers when either moves", () => {
    const grid = createGridVirtualizer({
      rows: { count: 1000, size: 20, viewportSize: 100, overscan: 1 },
      columns: { count: 500, size: 100, viewportSize: 300, overscan: 1 },
    });
    const seen: Array<[number, number]> = [];
    const stop = grid.subscribe(({ rows, columns }) => {
      seen.push([rows.startIndex, columns.startIndex]);
    });
    expect(seen).toEqual([[0, 0]]);

    grid.setScroll(2000, 5000);
    expect(grid.getState().rows.startIndex).toBeGreaterThan(90);
    expect(grid.getState().columns.startIndex).toBeGreaterThan(45);
    expect(seen.length).toBeGreaterThan(1);

    stop();
    const count = seen.length;
    grid.setScroll(0, 0);
    expect(seen.length).toBe(count);
  });

  it("scrolls to a cell on both axes", () => {
    const writes: Array<[string, number]> = [];
    const grid = createGridVirtualizer({
      rows: {
        count: 1000,
        size: 20,
        viewportSize: 100,
        scrollTo: (offset) => void writes.push(["top", offset]),
      },
      columns: {
        count: 500,
        size: 100,
        viewportSize: 300,
        scrollTo: (offset) => void writes.push(["left", offset]),
      },
    });
    grid.scrollToCell(40, 12);
    expect(writes).toEqual([
      ["top", 800],
      ["left", 1200],
    ]);
  });
});

describe("attachScroller", () => {
  it("reads the scroll position and writes the one it is asked for", async () => {
    const element = createScroller();
    const virtualizer = createVirtualizer({ count: 1000, size: 20 });
    const detach = attachScroller(virtualizer, element);
    expect(virtualizer.getState().viewportSize).toBe(100);

    element.scrollTop = 600;
    element.dispatchEvent(new Event("scroll"));
    expect(virtualizer.getScrollOffset()).toBe(600);

    virtualizer.scrollToIndex(300);
    await tick();
    expect(element.scrollTop).toBe(6000);

    detach();
    element.scrollTop = 0;
    element.dispatchEvent(new Event("scroll"));
    expect(virtualizer.getScrollOffset()).toBe(6000);
  });

  it("measures from the inline start in a right-to-left scroller", async () => {
    const element = createScroller();
    element.style.direction = "rtl";
    const virtualizer = createVirtualizer({ count: 1000, size: 100 });
    attachScroller(virtualizer, element, { axis: "x" });
    expect(virtualizer.getState().viewportSize).toBe(200);

    // Scrolled 500px toward the end of a right-to-left row.
    element.scrollLeft = -500;
    element.dispatchEvent(new Event("scroll"));
    expect(virtualizer.getScrollOffset()).toBe(500);

    virtualizer.scrollToIndex(20);
    await tick();
    expect(element.scrollLeft).toBe(-2000);
  });

  it("scrolls to where the first window was resolved", async () => {
    const element = createScroller();
    const virtualizer = createVirtualizer({
      count: 1000,
      size: 20,
      initialOffset: 4000,
    });
    attachScroller(virtualizer, element);
    await tick();
    expect(element.scrollTop).toBe(4000);
  });

  it("drives both axes of a grid from one element", async () => {
    const element = createScroller();
    const grid = createGridVirtualizer({
      rows: { count: 1000, size: 20 },
      columns: { count: 500, size: 100 },
    });
    attachGridScroller(grid, element);

    grid.scrollToCell(100, 40);
    await tick();
    expect(element.scrollTop).toBe(2000);
    expect(element.scrollLeft).toBe(4000);
  });
});

describe("syncScroll", () => {
  it("scrolls the other panes without echoing back", () => {
    const [a, b] = [createScroller(), createScroller()];
    const echo = vi.fn();
    b.addEventListener("scroll", echo);
    const stop = syncScroll([a, b]);

    a.scrollTop = 300;
    a.dispatchEvent(new Event("scroll"));
    expect(b.scrollTop).toBe(300);

    // The scroll event b's own write fires is not passed back to a.
    a.scrollTop = 0;
    b.dispatchEvent(new Event("scroll"));
    expect(a.scrollTop).toBe(0);

    stop();
    a.scrollTop = 900;
    a.dispatchEvent(new Event("scroll"));
    expect(b.scrollTop).toBe(300);
  });

  it("maps a position between panes of different length", () => {
    const [a, b] = [createScroller(), createScroller()];
    syncScroll([a, b], { map: (offset) => offset * 2 });
    a.scrollTop = 100;
    a.dispatchEvent(new Event("scroll"));
    expect(b.scrollTop).toBe(200);
  });

  it("keeps the inline axis together when asked", () => {
    const [a, b] = [createScroller(), createScroller()];
    syncScroll([a, b], { axis: "x" });
    a.scrollLeft = 50;
    a.scrollTop = 70;
    a.dispatchEvent(new Event("scroll"));
    expect(b.scrollLeft).toBe(50);
    expect(b.scrollTop).toBe(0);
  });
});
