import { createFixedOffsets } from "../../src/utils/virtual-offsets.js";
import {
  createVirtualizer,
  getDroppedCount,
  getPrependedCount,
  getScrollOffsetForIndex,
} from "../../src/utils/virtualizer.js";

/** A scroller the virtualizer can write to, as an element would be. */
function scroller(max = Number.POSITIVE_INFINITY) {
  const scroller = {
    top: 0,
    writes: [] as number[],
    scrollTo(offset: number) {
      scroller.top = Math.min(offset, max);
      scroller.writes.push(offset);
      return scroller.top;
    },
  };
  return scroller;
}

describe("createVirtualizer window", () => {
  it("resolves the first window from an initial offset with no scroll event", () => {
    const virtualizer = createVirtualizer({
      count: 1000,
      size: 20,
      viewportSize: 100,
      initialOffset: 5000,
      overscan: 2,
    });

    const state = virtualizer.getState();
    expect(state.isVirtualized).toBe(true);
    expect(state.startIndex).toBe(248);
    expect(state.endIndex).toBe(257);
    expect(state.startOffset).toBe(248 * 20);
    expect(state.totalSize).toBe(20000);
    expect(virtualizer.getScrollOffset()).toBe(5000);
  });

  it("renders every item below the threshold", () => {
    const virtualizer = createVirtualizer({
      count: 50,
      size: 20,
      viewportSize: 100,
      threshold: 100,
    });
    const state = virtualizer.getState();
    expect(state.isVirtualized).toBe(false);
    expect(state.endIndex).toBe(50);
    expect(state.totalSize).toBe(1000);
  });

  it("implements the store contract", () => {
    const virtualizer = createVirtualizer({
      count: 1000,
      size: 20,
      viewportSize: 100,
    });
    const seen: number[] = [];
    const stop = virtualizer.subscribe((state) => seen.push(state.startIndex));
    expect(seen).toEqual([0]);

    virtualizer.setScroll(2000);
    virtualizer.setScroll(2000);
    expect(seen).toEqual([0, 97]);

    stop();
    virtualizer.setScroll(4000);
    expect(seen).toEqual([0, 97]);
  });

  it("does not notify when a scroll leaves the window where it was", () => {
    const virtualizer = createVirtualizer({
      count: 1000,
      size: 20,
      viewportSize: 90,
      overscan: 5,
      lead: 0,
    });
    const listener = vi.fn();
    virtualizer.subscribe(listener);
    listener.mockClear();

    virtualizer.setScroll(10);
    expect(listener).not.toHaveBeenCalled();
    virtualizer.setScroll(100);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("renders ahead in the direction of travel, up to one viewport", () => {
    const virtualizer = createVirtualizer({
      count: 1000,
      size: 20,
      viewportSize: 100,
      overscan: 1,
    });

    virtualizer.setScroll(1000);
    const down = virtualizer.getState();
    // 1000px moved, so the lead is capped at one viewport: 100px.
    expect(down.endIndex).toBe(Math.ceil((1000 + 100 + 100) / 20) + 1);
    expect(down.startIndex).toBe(1000 / 20 - 1);

    virtualizer.setScroll(800);
    const up = virtualizer.getState();
    expect(up.startIndex).toBe(Math.floor((800 - 100) / 20) - 1);
  });

  it("ends the list where the browser stops laying it out", () => {
    const virtualizer = createVirtualizer({
      count: 1_000_000,
      size: 24,
      viewportSize: 400,
      maxSize: 16_000_000,
    });
    const state = virtualizer.getState();
    expect(state.count).toBe(666_666);
    expect(state.totalSize).toBe(666_666 * 24);

    virtualizer.setScroll(state.totalSize - 400);
    expect(virtualizer.getState().endIndex).toBe(666_666);
  });

  it("windows 1,000,000 fixed rows without holding a size per row", () => {
    const virtualizer = createVirtualizer({
      count: 1_000_000,
      size: 24,
      viewportSize: 480,
    });
    virtualizer.setScroll(24_000_000 - 480);
    const state = virtualizer.getState();
    expect(state.endIndex).toBe(1_000_000);
    expect(state.endIndex - state.startIndex).toBeLessThan(40);
    expect(state.atEnd).toBe(true);
  });
});

describe("createVirtualizer measured sizes", () => {
  it("places unmeasured items at the average of the measured ones", () => {
    const virtualizer = createVirtualizer({
      count: 100,
      size: 40,
      measured: true,
      viewportSize: 200,
    });
    expect(virtualizer.getState().totalSize).toBe(4000);

    virtualizer.measure([
      [0, 100],
      [1, 60],
    ]);
    // Average 80: two measured, 98 estimated.
    expect(virtualizer.getState().totalSize).toBe(160 + 98 * 80);
    expect(virtualizer.getMeasuredAverage()).toBe(80);
  });

  it("holds the reader's place when items above them turn out taller", () => {
    const view = scroller();
    const virtualizer = createVirtualizer({
      count: 200,
      size: 40,
      measured: true,
      viewportSize: 200,
      scrollTo: view.scrollTo,
    });
    virtualizer.setScroll(2000);
    expect(virtualizer.getState().startIndex).toBeLessThan(50);

    // Item 10 turns out 100px taller than assumed, and everything after it
    // moves down by as much.
    virtualizer.measure([[10, 140]]);
    // The item at the top of the viewport (50) was at 2000, so it is now at
    // 2000 + 100 + the change in the average on the unmeasured items.
    const shifted = virtualizer.offsetOf(50);
    expect(view.top).toBe(shifted);
    expect(virtualizer.getScrollOffset()).toBe(shifted);
  });

  it("writes nothing when a measurement lands below the reader", () => {
    const view = scroller();
    const virtualizer = createVirtualizer({
      count: 200,
      size: 40,
      measured: true,
      viewportSize: 200,
      scrollTo: view.scrollTo,
    });
    virtualizer.setScroll(0);
    virtualizer.measure([[3, 40]]);
    expect(view.writes).toEqual([]);
  });

  it("scrolls an item into place again as heights arrive", () => {
    const view = scroller();
    const virtualizer = createVirtualizer({
      count: 500,
      size: 40,
      measured: true,
      viewportSize: 200,
      scrollTo: view.scrollTo,
    });

    virtualizer.scrollToIndex(300, { align: "start" });
    expect(view.top).toBe(12_000);
    expect(virtualizer.hasPendingScroll()).toBe(true);

    // The rows between the window and the target are measured taller.
    virtualizer.setScroll(12_000);
    virtualizer.measure([
      [300, 100],
      [299, 100],
    ]);
    expect(virtualizer.getScrollOffset()).toBe(virtualizer.offsetOf(300));
  });

  it("lets the reader's scroll cancel a request that is still waiting", () => {
    const view = scroller();
    const virtualizer = createVirtualizer({
      count: 500,
      size: 40,
      measured: true,
      viewportSize: 200,
      scrollTo: view.scrollTo,
    });
    virtualizer.scrollToIndex(300);
    virtualizer.setScroll(9000);
    expect(virtualizer.hasPendingScroll()).toBe(false);

    // A measurement still shifts what the reader sees, but nothing pulls them
    // back to item 300.
    const anchor = virtualizer.indexAt(9000);
    virtualizer.measure([[300, 100]]);
    expect(virtualizer.getScrollOffset()).toBe(virtualizer.offsetOf(anchor));
    expect(virtualizer.getScrollOffset()).not.toBe(virtualizer.offsetOf(300));
  });

  it("forgets measurements on reset", () => {
    const virtualizer = createVirtualizer({
      count: 10,
      size: 40,
      measured: true,
      viewportSize: 100,
    });
    virtualizer.measure([[0, 100]]);
    virtualizer.resetMeasurements();
    expect(virtualizer.getState().totalSize).toBe(400);
  });

  it("takes sizes from a function", () => {
    const virtualizer = createVirtualizer({
      count: 100,
      size: (index) => (index % 10 === 0 ? 32 : 24),
      viewportSize: 100,
    });
    expect(virtualizer.getState().totalSize).toBe(10 * 32 + 90 * 24);
    expect(virtualizer.offsetOf(11)).toBe(32 + 9 * 24 + 32);
  });
});

describe("createVirtualizer scrollToIndex", () => {
  const options = { count: 1000, size: 20, viewportSize: 100 };

  it.each([
    ["start", 5000],
    ["center", 5000 + 10 - 50],
    ["end", 5000 + 20 - 100],
  ] as const)("aligns to %s", (align, expected) => {
    const view = scroller();
    const virtualizer = createVirtualizer({
      ...options,
      scrollTo: view.scrollTo,
    });
    virtualizer.scrollToIndex(250, { align });
    expect(view.top).toBe(expected);
  });

  it("scrolls to the nearest edge only as far as it has to", () => {
    const view = scroller();
    const virtualizer = createVirtualizer({
      ...options,
      scrollTo: view.scrollTo,
    });
    virtualizer.setScroll(1000);

    // Fully in view: nothing to do.
    expect(virtualizer.scrollToIndex(52, { align: "nearest" })).toBeNull();
    // Below the viewport: the item's end meets the viewport's end.
    expect(virtualizer.scrollToIndex(70, { align: "nearest" })).toBe(
      71 * 20 - 100,
    );
    // Above the viewport: its start meets the viewport's start.
    virtualizer.setScroll(3000);
    expect(virtualizer.scrollToIndex(20, { align: "nearest" })).toBe(400);
  });

  it("treats an item in the overscan as out of view", () => {
    const offsets = createFixedOffsets({ count: 1000, size: 20 });
    // 100px viewport at 1000: rows 50 to 54. Row 55 is overscan only.
    expect(
      getScrollOffsetForIndex({
        offsets,
        count: 1000,
        index: 55,
        align: "nearest",
        scrollOffset: 1000,
        viewportSize: 100,
        overscan: 3,
      }),
    ).toBe(56 * 20 - 100);
  });

  it("clamps to the scrollable range", () => {
    const view = scroller();
    const virtualizer = createVirtualizer({
      ...options,
      scrollTo: view.scrollTo,
    });
    virtualizer.scrollToIndex(999, { align: "start" });
    expect(view.top).toBe(20_000 - 100);
    virtualizer.scrollToIndex(-1);
    expect(view.top).toBe(0);
  });

  it("takes the position the scroller actually took", () => {
    const view = scroller(500);
    const virtualizer = createVirtualizer({
      ...options,
      scrollTo: view.scrollTo,
    });
    virtualizer.scrollToIndex(250);
    expect(virtualizer.getScrollOffset()).toBe(500);
  });
});

describe("createVirtualizer prepend", () => {
  it("moves the scroll position by what was added, so the view stays put", () => {
    const view = scroller();
    const virtualizer = createVirtualizer({
      count: 1000,
      size: 20,
      viewportSize: 100,
      scrollTo: view.scrollTo,
    });
    virtualizer.setScroll(10_010);
    const before = virtualizer.getState();

    virtualizer.prepend(50);
    expect(virtualizer.getState().count).toBe(1050);
    expect(view.top).toBe(10_010 + 50 * 20);
    expect(virtualizer.getState().startIndex).toBe(before.startIndex + 50);
  });

  it("keeps the measured sizes with their items", () => {
    const view = scroller();
    const virtualizer = createVirtualizer({
      count: 200,
      size: 40,
      measured: true,
      viewportSize: 200,
      scrollTo: view.scrollTo,
    });
    virtualizer.measure([
      [0, 100],
      [1, 100],
      [2, 100],
    ]);
    virtualizer.setScroll(0);
    virtualizer.setScroll(250);
    const anchor = virtualizer.indexAt(250);
    const within = 250 - virtualizer.offsetOf(anchor);

    virtualizer.prepend(20);
    expect(virtualizer.getMeasuredSize(22)).toBe(100);
    expect(virtualizer.getMeasuredSize(2)).toBeUndefined();
    expect(virtualizer.offsetOf(anchor + 20) + within).toBe(view.top);
  });

  it("leaves the top alone by default, so new items there come into view", () => {
    const view = scroller();
    const virtualizer = createVirtualizer({
      count: 1000,
      size: 20,
      viewportSize: 100,
      scrollTo: view.scrollTo,
    });
    virtualizer.prepend(5);
    expect(view.writes).toEqual([]);
    expect(virtualizer.getState().startIndex).toBe(0);
  });

  it("holds the place at the top when asked, as when older messages load", () => {
    const view = scroller();
    const virtualizer = createVirtualizer({
      count: 1000,
      size: 20,
      viewportSize: 100,
      scrollTo: view.scrollTo,
    });
    virtualizer.prepend(5, { anchor: true });
    expect(view.top).toBe(100);
  });

  it("never moves the position with anchor false", () => {
    const view = scroller();
    const virtualizer = createVirtualizer({
      count: 1000,
      size: 20,
      viewportSize: 100,
      scrollTo: view.scrollTo,
    });
    virtualizer.setScroll(3000);
    virtualizer.prepend(5, { anchor: false });
    expect(view.writes).toEqual([]);
  });

  it("holds the place when items are dropped from the front", () => {
    const view = scroller();
    const virtualizer = createVirtualizer({
      count: 1000,
      size: 20,
      viewportSize: 100,
      scrollTo: view.scrollTo,
    });
    virtualizer.setScroll(10_000);
    virtualizer.dropFront(100);
    expect(virtualizer.getState().count).toBe(900);
    expect(view.top).toBe(10_000 - 100 * 20);
  });
});

describe("getPrependedCount", () => {
  const list = (from: number, to: number) =>
    Array.from({ length: to - from }, (_, i) => ({ id: from + i }));

  it("counts items put before the old ones", () => {
    const previous = list(10, 110);
    const next = [...list(0, 10), ...previous];
    expect(getPrependedCount(previous, next)).toBe(10);
  });

  it("matches by key when the items are rebuilt", () => {
    const previous = list(10, 110);
    const next = list(0, 110).map((item) => ({ ...item }));
    expect(getPrependedCount(previous, next, (item) => item.id)).toBe(10);
    expect(getPrependedCount(previous, next)).toBe(0);
  });

  it("is zero for an append, a replacement, and the first items", () => {
    const previous = list(0, 100);
    expect(getPrependedCount(previous, list(0, 120))).toBe(0);
    expect(getPrependedCount(previous, list(50, 200))).toBe(0);
    expect(getPrependedCount([], list(0, 5))).toBe(0);
  });
});

describe("getDroppedCount", () => {
  const list = (from: number, to: number) =>
    Array.from({ length: to - from }, (_, i) => ({ id: from + i }));

  it("counts items dropped from the front, with items added at the end", () => {
    const previous = list(0, 100);
    expect(getDroppedCount(previous, list(10, 100))).toBe(0);
    const objects = list(0, 100);
    expect(
      getDroppedCount(objects, [...objects.slice(10), ...list(100, 120)]),
    ).toBe(10);
    expect(getDroppedCount(objects, objects.slice(10))).toBe(10);
  });

  it("matches by key when the items are rebuilt", () => {
    const previous = list(0, 100);
    const next = list(10, 130);
    expect(getDroppedCount(previous, next, (item) => item.id)).toBe(10);
    expect(getDroppedCount(previous, next)).toBe(0);
  });

  it("is zero for an append, a replacement, and a list that starts where it did", () => {
    const previous = list(0, 100);
    expect(getDroppedCount(previous, [...previous, ...list(100, 120)])).toBe(0);
    expect(getDroppedCount(previous, list(500, 600))).toBe(0);
    expect(getDroppedCount([], previous)).toBe(0);
  });
});

describe("createVirtualizer follow", () => {
  it("starts at the end and keeps it there as items arrive", () => {
    const view = scroller();
    const virtualizer = createVirtualizer({
      count: 100,
      size: 20,
      viewportSize: 200,
      follow: "end",
      scrollTo: view.scrollTo,
    });
    expect(virtualizer.getScrollOffset()).toBe(1800);
    expect(virtualizer.getState().following).toBe(true);

    virtualizer.setOptions({ count: 150 });
    expect(view.top).toBe(150 * 20 - 200);
    expect(virtualizer.getState().atEnd).toBe(true);
    expect(virtualizer.getState().endIndex).toBe(150);
  });

  it("stops following when the reader scrolls away, and resumes at the end", () => {
    const view = scroller();
    const virtualizer = createVirtualizer({
      count: 100,
      size: 20,
      viewportSize: 200,
      follow: "end",
      scrollTo: view.scrollTo,
    });

    virtualizer.setScroll(1000);
    expect(virtualizer.getState().following).toBe(false);
    virtualizer.setOptions({ count: 150 });
    expect(view.writes.at(-1)).not.toBe(150 * 20 - 200);
    expect(virtualizer.getState().atEnd).toBe(false);

    virtualizer.setScroll(150 * 20 - 200);
    expect(virtualizer.getState().following).toBe(true);
  });

  it("lets go on release, before any scroll reports where the reader went", () => {
    const view = scroller();
    const virtualizer = createVirtualizer({
      count: 100,
      size: 20,
      viewportSize: 200,
      follow: "end",
      scrollTo: view.scrollTo,
    });
    virtualizer.release();
    expect(virtualizer.getState().following).toBe(false);

    const writes = view.writes.length;
    virtualizer.setOptions({ count: 150 });
    expect(view.writes.length).toBe(writes);
  });

  it("jumps back to the end on request", () => {
    const view = scroller();
    const virtualizer = createVirtualizer({
      count: 100,
      size: 20,
      viewportSize: 200,
      follow: "end",
      scrollTo: view.scrollTo,
    });
    virtualizer.setScroll(0);
    expect(virtualizer.getState().following).toBe(false);

    virtualizer.scrollToEnd();
    expect(view.top).toBe(1800);
    expect(virtualizer.getState().following).toBe(true);
  });

  it("holds the end when a measured item grows", () => {
    const view = scroller();
    const virtualizer = createVirtualizer({
      count: 100,
      size: 20,
      measured: true,
      viewportSize: 200,
      follow: "end",
      scrollTo: view.scrollTo,
    });
    virtualizer.measure([[99, 120]]);
    expect(virtualizer.getState().atEnd).toBe(true);
    expect(virtualizer.getScrollOffset()).toBe(
      virtualizer.getState().totalSize - 200,
    );
  });
});

describe("createVirtualizer keepMounted and stickyIndices", () => {
  it("lists the items to keep mounted, in the window or not", () => {
    const virtualizer = createVirtualizer({
      count: 1000,
      size: 20,
      viewportSize: 100,
      keepMounted: [900, 3, 3, 9999],
    });
    // Item 3 is in the window now and is kept from the start, so its element
    // is the same one when the window leaves it behind.
    expect(virtualizer.getState().kept).toEqual([3, 900]);

    virtualizer.setScroll(10_000);
    expect(virtualizer.getState().kept).toEqual([3, 900]);
  });

  it("drops an item to keep once the list is shorter than its index", () => {
    const virtualizer = createVirtualizer({
      count: 1000,
      size: 20,
      viewportSize: 100,
      keepMounted: [900],
    });
    virtualizer.setOptions({ count: 500 });
    expect(virtualizer.getState().kept).toEqual([]);
  });

  it("tells subscribers when options move the window", () => {
    const virtualizer = createVirtualizer({
      count: 1000,
      size: 20,
      viewportSize: 100,
    });
    const totals: number[] = [];
    virtualizer.subscribe((state) => totals.push(state.totalSize));
    virtualizer.setOptions({ size: 30 });
    virtualizer.setOptions({ count: 10 });
    expect(totals).toEqual([20_000, 30_000, 300]);
  });

  it("pins the last sticky item scrolled past", () => {
    const virtualizer = createVirtualizer({
      count: 1000,
      size: 20,
      viewportSize: 100,
      stickyIndices: [0, 100, 200],
    });
    expect(virtualizer.getState().stickyIndex).toBe(0);
    virtualizer.setScroll(100 * 20 - 1);
    expect(virtualizer.getState().stickyIndex).toBe(0);
    virtualizer.setScroll(100 * 20);
    expect(virtualizer.getState().stickyIndex).toBe(100);
    virtualizer.setScroll(5000);
    expect(virtualizer.getState().stickyIndex).toBe(200);
  });

  it("has no sticky item before the first one", () => {
    const virtualizer = createVirtualizer({
      count: 1000,
      size: 20,
      viewportSize: 100,
      stickyIndices: [10],
    });
    expect(virtualizer.getState().stickyIndex).toBe(-1);
  });
});
