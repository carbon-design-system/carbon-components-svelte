import {
  getBoundedScrollTop,
  getMeasuredAverage,
  getMeasuredScrollCorrection,
  getVisibleRange,
  resetVirtualScrollOnClose,
  scrollHighlightedIntoView,
  scrollSelectedIntoView,
  virtualize,
  virtualListState,
} from "../../src/utils/virtualize.js";

describe("virtualize", () => {
  test("should return all items when below threshold", () => {
    const items = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
    }));
    const result = virtualize({
      items,
      itemHeight: 40,
      containerHeight: 300,
      scrollTop: 0,
      threshold: 100,
    });

    expect(result.visibleItems).toEqual(items);
    expect(result.startIndex).toBe(0);
    expect(result.endIndex).toBe(50);
    expect(result.offsetY).toBe(0);
    expect(result.totalHeight).toBe(2000);
    expect(result.isVirtualized).toBe(false);
  });

  test("should virtualize items when above threshold", () => {
    const items = Array.from({ length: 500 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
    }));
    const result = virtualize({
      items,
      itemHeight: 40,
      containerHeight: 300,
      scrollTop: 0,
      threshold: 100,
    });

    expect(result.visibleItems.length).toBeLessThan(500);
    expect(result.startIndex).toBe(0);
    expect(result.endIndex).toBeGreaterThan(0);
    expect(result.endIndex).toBeLessThan(500);
    expect(result.offsetY).toBe(0);
    expect(result.totalHeight).toBe(20000);
    expect(result.isVirtualized).toBe(true);
  });

  test("should calculate visible range based on scroll position", () => {
    const items = Array.from({ length: 500 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
    }));
    const result = virtualize({
      items,
      itemHeight: 40,
      containerHeight: 300,
      scrollTop: 2000, // Scrolled to item 50
      threshold: 100,
    });

    expect(result.startIndex).toBeGreaterThan(0);
    expect(result.visibleItems[0].id).toBeGreaterThanOrEqual(50 - 3); // overscan of 3
    expect(result.offsetY).toBe(result.startIndex * 40);
    expect(result.isVirtualized).toBe(true);
  });

  test("should apply overscan to render extra items", () => {
    const items = Array.from({ length: 500 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
    }));
    const overscan = 5;
    const result = virtualize({
      items,
      itemHeight: 40,
      containerHeight: 300,
      scrollTop: 0,
      overscan,
      threshold: 100,
    });

    // Should render visible items (300px / 40px = 7.5, so ~8 items) + overscan above and below
    expect(result.visibleItems.length).toBeGreaterThan(8);
    expect(result.startIndex).toBe(0); // With overscan, startIndex can go negative but is clamped to 0
    expect(result.isVirtualized).toBe(true);
  });

  test("should cap maximum rendered items when maxItems is specified", () => {
    const items = Array.from({ length: 500 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
    }));
    const result = virtualize({
      items,
      itemHeight: 40,
      containerHeight: 300,
      scrollTop: 0,
      maxItems: 10,
      threshold: 100,
    });

    expect(result.visibleItems.length).toBeLessThanOrEqual(10);
    expect(result.endIndex - result.startIndex).toBeLessThanOrEqual(10);
    expect(result.isVirtualized).toBe(true);
  });

  test("should handle scroll position at the end of the list", () => {
    const items = Array.from({ length: 500 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
    }));
    const totalHeight = 500 * 40; // 20000px
    const scrollTop = totalHeight - 300; // Near the end
    const result = virtualize({
      items,
      itemHeight: 40,
      containerHeight: 300,
      scrollTop,
      threshold: 100,
    });

    expect(result.endIndex).toBe(500);
    expect(result.visibleItems[result.visibleItems.length - 1].id).toBe(499);
    expect(result.isVirtualized).toBe(true);
  });

  test("should clamp scroll position beyond the list to the last page", () => {
    const items = Array.from({ length: 500 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
    }));
    const result = virtualize({
      items,
      itemHeight: 40,
      containerHeight: 300,
      scrollTop: 50000, // Way beyond the list
      threshold: 100,
    });

    // A scrollTop beyond the scrollable range is clamped to maxScroll, so the
    // last page of items renders rather than an empty slice.
    expect(result.endIndex).toBe(500);
    expect(result.startIndex).toBeGreaterThanOrEqual(0);
    expect(result.visibleItems.length).toBeGreaterThan(0);
    expect(result.visibleItems[result.visibleItems.length - 1].id).toBe(499);
    expect(result.isVirtualized).toBe(true);
  });

  test("renders matching items when a stale deep scrollTop survives a filter narrowing", () => {
    // Reproduces the blank-menu bug: a list of 500 is scrolled deep, then the
    // filter narrows it to 150 items (still above the threshold) while the old
    // scrollTop lingers. Without clamping, startIndex (~397) exceeds the new
    // length and the slice is empty.
    const narrowed = Array.from({ length: 150 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
    }));
    const staleScrollTop = 400 * 40; // scrolled to ~item 400 of the old 500

    const result = virtualize({
      items: narrowed,
      itemHeight: 40,
      containerHeight: 300,
      scrollTop: staleScrollTop,
      threshold: 100,
    });

    expect(result.isVirtualized).toBe(true);
    expect(result.visibleItems.length).toBeGreaterThan(0);
    // Last page of the narrowed list, not a blank menu.
    expect(result.endIndex).toBe(150);
    expect(result.visibleItems[result.visibleItems.length - 1].id).toBe(149);
    expect(result.offsetY).toBe(result.startIndex * 40);
  });

  test("should handle empty items array", () => {
    const result = virtualize({
      items: [],
      itemHeight: 40,
      containerHeight: 300,
      scrollTop: 0,
      threshold: 100,
    });

    expect(result.visibleItems).toEqual([]);
    expect(result.startIndex).toBe(0);
    expect(result.endIndex).toBe(0);
    expect(result.offsetY).toBe(0);
    expect(result.totalHeight).toBe(0);
    expect(result.isVirtualized).toBe(false);
  });

  test("should handle custom threshold", () => {
    const items = Array.from({ length: 150 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
    }));

    // With threshold 200, should not virtualize
    const result1 = virtualize({
      items,
      itemHeight: 40,
      containerHeight: 300,
      scrollTop: 0,
      threshold: 200,
    });
    expect(result1.isVirtualized).toBe(false);
    expect(result1.visibleItems.length).toBe(150);

    // With threshold 100, should virtualize
    const result2 = virtualize({
      items,
      itemHeight: 40,
      containerHeight: 300,
      scrollTop: 0,
      threshold: 100,
    });
    expect(result2.isVirtualized).toBe(true);
    expect(result2.visibleItems.length).toBeLessThan(150);
  });

  test("should calculate correct offsetY for positioning", () => {
    const items = Array.from({ length: 500 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
    }));
    const itemHeight = 40;
    const startIndex = 25;
    const scrollTop = startIndex * itemHeight;

    const result = virtualize({
      items,
      itemHeight,
      containerHeight: 300,
      scrollTop,
      threshold: 100,
    });

    expect(result.offsetY).toBe(result.startIndex * itemHeight);
    expect(result.offsetY).toBeGreaterThanOrEqual(0);
  });

  test("should handle different item heights", () => {
    const items = Array.from({ length: 500 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
    }));

    const result1 = virtualize({
      items,
      itemHeight: 20,
      containerHeight: 300,
      scrollTop: 0,
      threshold: 100,
    });

    const result2 = virtualize({
      items,
      itemHeight: 60,
      containerHeight: 300,
      scrollTop: 0,
      threshold: 100,
    });

    // With smaller item height, more items fit in viewport
    expect(result1.visibleItems.length).toBeGreaterThan(
      result2.visibleItems.length,
    );
    expect(result1.totalHeight).toBe(10000);
    expect(result2.totalHeight).toBe(30000);
  });

  test("should handle different container heights", () => {
    const items = Array.from({ length: 500 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
    }));

    const result1 = virtualize({
      items,
      itemHeight: 40,
      containerHeight: 200,
      scrollTop: 0,
      threshold: 100,
    });

    const result2 = virtualize({
      items,
      itemHeight: 40,
      containerHeight: 600,
      scrollTop: 0,
      threshold: 100,
    });

    // Larger container should show more items
    expect(result2.visibleItems.length).toBeGreaterThan(
      result1.visibleItems.length,
    );
  });

  test("should preserve item references in visibleItems", () => {
    const items = Array.from({ length: 500 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
    }));
    const result = virtualize({
      items,
      itemHeight: 40,
      containerHeight: 300,
      scrollTop: 0,
      threshold: 100,
    });

    // visibleItems should be a slice of the original items array
    expect(result.visibleItems[0]).toBe(items[result.startIndex]);
    expect(result.visibleItems[result.visibleItems.length - 1]).toBe(
      items[result.endIndex - 1],
    );
  });

  test("should handle maxItems that is smaller than viewport capacity", () => {
    const items = Array.from({ length: 500 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
    }));
    const result = virtualize({
      items,
      itemHeight: 40,
      containerHeight: 300, // Can fit ~7-8 items
      scrollTop: 0,
      maxItems: 5,
      threshold: 100,
    });

    expect(result.visibleItems.length).toBe(5);
    expect(result.endIndex - result.startIndex).toBe(5);
  });

  test("should handle negative scroll position", () => {
    const items = Array.from({ length: 500 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
    }));
    const result = virtualize({
      items,
      itemHeight: 40,
      containerHeight: 300,
      scrollTop: -100, // Negative scroll
      threshold: 100,
    });

    expect(result.startIndex).toBe(0); // Should be clamped to 0
    expect(result.offsetY).toBe(0);
    expect(result.isVirtualized).toBe(true);
  });

  test("falls back to unvirtualized for a non-positive item height", () => {
    const items = Array.from({ length: 500 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
    }));
    const result = virtualize({
      items,
      itemHeight: 0,
      containerHeight: 300,
      scrollTop: 0,
      threshold: 100,
    });

    // A zero height can't be virtualized, so render every item with no offset
    // rather than producing NaN indices and a blank slice.
    expect(result.isVirtualized).toBe(false);
    expect(result.visibleItems).toBe(items);
    expect(result.startIndex).toBe(0);
    expect(result.endIndex).toBe(500);
    expect(result.offsetY).toBe(0);
    expect(result.totalHeight).toBe(0);
  });

  test("should handle zero container height", () => {
    const items = Array.from({ length: 500 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
    }));
    const result = virtualize({
      items,
      itemHeight: 40,
      containerHeight: 0,
      scrollTop: 0,
      threshold: 100,
    });

    expect(result.isVirtualized).toBe(true);
    // With zero container height, should still calculate based on overscan
    expect(result.visibleItems.length).toBeGreaterThan(0);
  });
});

describe("virtualListState", () => {
  const makeItems = (length: number) =>
    Array.from({ length }, (_, i) => ({ id: i, name: `Item ${i}` }));

  test("returns null config and full items when not virtualizing", () => {
    const items = makeItems(10);
    const result = virtualListState({
      items,
      scrollTop: 0,
      shouldVirtualize: false,
      virtualize: undefined,
    });

    expect(result.config).toBeNull();
    expect(result.data).toBeNull();
    expect(result.itemsToRender).toBe(items);
  });

  test("merges object-virtualize overrides over the defaults", () => {
    const result = virtualListState({
      items: makeItems(500),
      scrollTop: 0,
      shouldVirtualize: true,
      virtualize: { itemHeight: 50, containerHeight: 400 },
    });

    expect(result.config).toMatchObject({
      itemHeight: 50,
      containerHeight: 400,
      overscan: 3,
      threshold: 100,
    });
  });

  test("applies caller defaults beneath the virtualize prop", () => {
    const result = virtualListState({
      items: makeItems(500),
      scrollTop: 0,
      shouldVirtualize: true,
      virtualize: true,
      defaults: { containerHeight: 250 },
    });

    expect(result.config?.containerHeight).toBe(250);
  });

  test("returns a visible slice when virtualized above the threshold", () => {
    const items = makeItems(500);
    const result = virtualListState({
      items,
      scrollTop: 0,
      shouldVirtualize: true,
      virtualize: true,
    });

    expect(result.data?.isVirtualized).toBe(true);
    expect(result.itemsToRender.length).toBeLessThan(items.length);
  });

  test("renders all items when virtualized but below the threshold", () => {
    const items = makeItems(50);
    const result = virtualListState({
      items,
      scrollTop: 0,
      shouldVirtualize: true,
      virtualize: true,
    });

    expect(result.data?.isVirtualized).toBe(false);
    expect(result.itemsToRender).toBe(items);
  });
});

describe("getVisibleRange", () => {
  const base = {
    itemHeight: 40,
    containerHeight: 300,
    itemCount: 500,
  };

  test("clamps startIndex to 0 with overscan at the top", () => {
    expect(getVisibleRange({ ...base, scrollTop: 0 })).toEqual({
      startIndex: 0,
      endIndex: Math.ceil(300 / 40) + 3,
    });
  });

  test("offsets the range by scroll position", () => {
    // scrollTop 2000 => floor(50) - 3 = 47 start.
    const { startIndex, endIndex } = getVisibleRange({
      ...base,
      scrollTop: 2000,
    });
    expect(startIndex).toBe(47);
    expect(endIndex).toBe(Math.ceil((2000 + 300) / 40) + 3);
  });

  test("clamps endIndex to itemCount", () => {
    const { endIndex } = getVisibleRange({
      ...base,
      scrollTop: 500 * 40,
    });
    expect(endIndex).toBe(500);
  });

  test("caps the window to maxItems", () => {
    expect(getVisibleRange({ ...base, scrollTop: 0, maxItems: 5 })).toEqual({
      startIndex: 0,
      endIndex: 5,
    });
  });

  test("falls back to the full range for a non-positive or NaN itemHeight", () => {
    for (const itemHeight of [0, -1, Number.NaN]) {
      expect(getVisibleRange({ ...base, itemHeight, scrollTop: 100 })).toEqual({
        startIndex: 0,
        endIndex: base.itemCount,
      });
    }
  });
});

describe("getBoundedScrollTop", () => {
  test("returns the exact position for a mid-list item", () => {
    expect(
      getBoundedScrollTop({
        index: 10,
        itemHeight: 40,
        containerHeight: 300,
        itemCount: 100,
      }),
    ).toBe(400);
  });

  test("clamps to 0 for a negative index", () => {
    expect(
      getBoundedScrollTop({
        index: -5,
        itemHeight: 40,
        containerHeight: 300,
        itemCount: 100,
      }),
    ).toBe(0);
  });

  test("clamps to maxScroll when past the end", () => {
    // maxScroll = 100 * 40 - 300 = 3700
    expect(
      getBoundedScrollTop({
        index: 99,
        itemHeight: 40,
        containerHeight: 300,
        itemCount: 100,
      }),
    ).toBe(3700);
  });

  test("floors maxScroll at 0 when content is shorter than the container", () => {
    expect(
      getBoundedScrollTop({
        index: 4,
        itemHeight: 40,
        containerHeight: 300,
        itemCount: 5,
      }),
    ).toBe(0);
  });
});

describe("scrollHighlightedIntoView", () => {
  const base = {
    itemCount: 500,
    itemHeight: 40,
    containerHeight: 300,
    overscan: 3,
  };

  test("returns null when the highlighted item is already visible", () => {
    // At scrollTop 0, the visible+overscan range covers the first several items.
    expect(
      scrollHighlightedIntoView({
        ...base,
        highlightedIndex: 2,
        currentScrollTop: 0,
      }),
    ).toBeNull();
  });

  test("returns a bounded scrollTop when the item is below the viewport", () => {
    expect(
      scrollHighlightedIntoView({
        ...base,
        highlightedIndex: 100,
        currentScrollTop: 0,
      }),
    ).toBe(4000);
  });

  test("returns a bounded scrollTop when the item is above the viewport", () => {
    // Scrolled to item 100; highlight item 10, which is above the range.
    expect(
      scrollHighlightedIntoView({
        ...base,
        highlightedIndex: 10,
        currentScrollTop: 4000,
      }),
    ).toBe(400);
  });

  test("respects overscan when deciding visibility", () => {
    // scrollTop 4000 => floor(100) - 3 = 97 start. Item 96 is just outside.
    expect(
      scrollHighlightedIntoView({
        ...base,
        highlightedIndex: 96,
        currentScrollTop: 4000,
      }),
    ).toBe(3840);
    // Item 97 is within overscan, so no scroll.
    expect(
      scrollHighlightedIntoView({
        ...base,
        highlightedIndex: 97,
        currentScrollTop: 4000,
      }),
    ).toBeNull();
  });

  test("scrolls to an item inside the raw viewport but beyond the maxItems cap", () => {
    // scrollTop 0 raw range is [0, 11), but maxItems caps the rendered window
    // to [0, 5). Item 7 looks visible to the raw formula yet is not rendered.
    expect(
      scrollHighlightedIntoView({
        ...base,
        highlightedIndex: 7,
        currentScrollTop: 0,
        maxItems: 5,
      }),
    ).toBe(280);
    // Without the cap the same item is treated as already visible.
    expect(
      scrollHighlightedIntoView({
        ...base,
        highlightedIndex: 7,
        currentScrollTop: 0,
      }),
    ).toBeNull();
  });
});

describe("scrollSelectedIntoView", () => {
  test("returns 0 when there is no selection", () => {
    expect(
      scrollSelectedIntoView({
        selectedIndex: -1,
        itemCount: 500,
        itemHeight: 40,
        containerHeight: 300,
      }),
    ).toBe(0);
  });

  test("returns the bounded position for a selected item", () => {
    expect(
      scrollSelectedIntoView({
        selectedIndex: 50,
        itemCount: 500,
        itemHeight: 40,
        containerHeight: 300,
      }),
    ).toBe(2000);
  });

  test("clamps the selected position to maxScroll near the end", () => {
    // maxScroll = 500 * 40 - 300 = 19700
    expect(
      scrollSelectedIntoView({
        selectedIndex: 499,
        itemCount: 500,
        itemHeight: 40,
        containerHeight: 300,
      }),
    ).toBe(19700);
  });
});

describe("resetVirtualScrollOnClose", () => {
  test("returns 0", () => {
    expect(resetVirtualScrollOnClose()).toBe(0);
  });
});

describe("virtualize with measured heights", () => {
  const makeItems = (length: number) =>
    Array.from({ length }, (_, i) => ({ id: i, name: `Item ${i}` }));

  test("derives total height from the supplied heights", () => {
    // 100 options at 30px and 100 at 70px is 10000px, where a uniform 40px
    // item height would report 8000px.
    const items = makeItems(200);
    const heights = items.map((_, index) => (index % 2 === 0 ? 30 : 70));

    const result = virtualize({
      items,
      itemHeight: 40,
      containerHeight: 300,
      scrollTop: 0,
      threshold: 100,
      measured: true,
      heights,
    });

    expect(result.isVirtualized).toBe(true);
    expect(result.totalHeight).toBe(10_000);
  });

  // Alternating 30px/70px options: option 2k starts at 100k, option 2k+1 at
  // 100k + 30. Every expectation below is read off that pattern by hand.
  const alternating = {
    items: makeItems(200),
    heights: Array.from({ length: 200 }, (_, index) =>
      index % 2 === 0 ? 30 : 70,
    ),
    itemHeight: 40,
    containerHeight: 300,
    threshold: 100,
    measured: true,
  };

  test("resolves the visible range at the start of the list", () => {
    const result = virtualize({ ...alternating, scrollTop: 0 });

    // Option 6 starts at 300, the first past the viewport, plus 3 overscan.
    expect(result.startIndex).toBe(0);
    expect(result.endIndex).toBe(9);
    expect(result.offsetY).toBe(0);
  });

  test("resolves the visible range mid-list", () => {
    const result = virtualize({ ...alternating, scrollTop: 1000 });

    // Option 20 starts at 1000, less 3 overscan; option 26 starts at 1300,
    // the first past the viewport bottom, plus 3 overscan.
    expect(result.startIndex).toBe(17);
    expect(result.endIndex).toBe(29);
    expect(result.offsetY).toBe(830);
  });

  test("resolves the visible range at the end of the list", () => {
    // maxScroll is 10000 - 300; option 194 starts at 9700.
    const result = virtualize({ ...alternating, scrollTop: 50_000 });

    expect(result.startIndex).toBe(191);
    expect(result.endIndex).toBe(200);
    expect(result.offsetY).toBe(9530);
    expect(result.visibleItems[result.visibleItems.length - 1].id).toBe(199);
  });

  test("falls back to the supplied item height while nothing is measured", () => {
    const result = virtualize({
      items: makeItems(200),
      itemHeight: 40,
      containerHeight: 300,
      scrollTop: 1000,
      threshold: 100,
      measured: true,
      heights: [],
    });

    // Identical to the fixed-height numbers for 200 options of 40px.
    expect(result.totalHeight).toBe(8000);
    expect(result.startIndex).toBe(22);
    expect(result.endIndex).toBe(36);
    expect(result.offsetY).toBe(880);
  });

  test("estimates unmeasured options from the measured ones", () => {
    const heights = Array.from({ length: 200 }, (_, index) =>
      index < 10 ? 100 : undefined,
    );

    const result = virtualize({
      items: makeItems(200),
      itemHeight: 40,
      containerHeight: 300,
      scrollTop: 0,
      threshold: 100,
      measured: true,
      heights,
    });

    // Every option is assumed 100px tall, not the 40px seed, so the list is
    // 20000px rather than the 8600px a seed-only estimate would report.
    expect(result.totalHeight).toBe(20_000);
  });

  test("sharpens the estimate as more options are measured", () => {
    const heights = Array.from({ length: 200 }, (_, index) => {
      if (index < 10) return 100;
      if (index < 20) return 20;
      return undefined;
    });

    const result = virtualize({
      items: makeItems(200),
      itemHeight: 40,
      containerHeight: 300,
      scrollTop: 0,
      threshold: 100,
      measured: true,
      heights,
    });

    // 20 measured options total 1200px and average 60px, so the 180
    // unmeasured ones contribute 10800px.
    expect(result.totalHeight).toBe(12_000);
  });
});

describe("scroll positions with measured heights", () => {
  // Alternating 30px/70px options: option 2k starts at 100k, option 2k+1 at
  // 100k + 30, and the list totals 10000px.
  const base = {
    itemCount: 200,
    itemHeight: 40,
    containerHeight: 300,
    heights: Array.from({ length: 200 }, (_, index) =>
      index % 2 === 0 ? 30 : 70,
    ),
  };

  describe("getBoundedScrollTop", () => {
    test("returns the accumulated position of a mid-list option", () => {
      expect(getBoundedScrollTop({ ...base, index: 20 })).toBe(1000);
    });

    test("clamps an option near the end to maxScroll", () => {
      // Option 199 starts at 9930, past the 10000 - 300 maximum.
      expect(getBoundedScrollTop({ ...base, index: 199 })).toBe(9700);
    });

    test("clamps to 0 for a negative index", () => {
      expect(getBoundedScrollTop({ ...base, index: -5 })).toBe(0);
    });

    test("floors maxScroll at 0 when the list is shorter than the container", () => {
      expect(
        getBoundedScrollTop({
          index: 2,
          itemCount: 3,
          itemHeight: 40,
          containerHeight: 300,
          heights: [30, 70, 30],
        }),
      ).toBe(0);
    });
  });

  describe("scrollSelectedIntoView", () => {
    test("returns 0 when there is no selection", () => {
      expect(scrollSelectedIntoView({ ...base, selectedIndex: -1 })).toBe(0);
    });

    test("returns the accumulated position of the selected option", () => {
      expect(scrollSelectedIntoView({ ...base, selectedIndex: 20 })).toBe(1000);
    });

    test("clamps a selection near the end to maxScroll", () => {
      expect(scrollSelectedIntoView({ ...base, selectedIndex: 199 })).toBe(
        9700,
      );
    });
  });

  describe("scrollHighlightedIntoView", () => {
    test("returns null when the highlighted option is already visible", () => {
      expect(
        scrollHighlightedIntoView({
          ...base,
          highlightedIndex: 2,
          currentScrollTop: 0,
        }),
      ).toBeNull();
    });

    test("returns a bounded position when the option is below the viewport", () => {
      expect(
        scrollHighlightedIntoView({
          ...base,
          highlightedIndex: 100,
          currentScrollTop: 0,
        }),
      ).toBe(5000);
    });

    test("returns a bounded position when the option is above the viewport", () => {
      expect(
        scrollHighlightedIntoView({
          ...base,
          highlightedIndex: 10,
          currentScrollTop: 5000,
        }),
      ).toBe(500);
    });

    test("respects overscan when deciding visibility", () => {
      // At scrollTop 5000 the range starts at option 100 less 3 overscan.
      expect(
        scrollHighlightedIntoView({
          ...base,
          highlightedIndex: 96,
          currentScrollTop: 5000,
        }),
      ).toBe(4800);
      expect(
        scrollHighlightedIntoView({
          ...base,
          highlightedIndex: 97,
          currentScrollTop: 5000,
        }),
      ).toBeNull();
    });
  });
});

/**
 * The anchor arithmetic, reached through `getMeasuredScrollCorrection` because
 * that is the only way in: a caller knows the position it is holding, not which
 * option that position anchors on. Each `scrollTop` below sits inside the option
 * named as the anchor, under the heights the position was computed against.
 */
describe("getMeasuredScrollCorrection: the anchor arithmetic", () => {
  const base = { itemCount: 200, itemHeight: 40, containerHeight: 300 };

  const measureFirst = (count: number, height: number) =>
    Array.from({ length: 200 }, (_, index) =>
      index < count ? height : undefined,
    );

  test("returns 0 at the top of the list, where nothing sits above", () => {
    expect(
      getMeasuredScrollCorrection({
        ...base,
        scrollTop: 0,
        previousHeights: [],
        heights: measureFirst(20, 60),
      }),
    ).toBe(0);
  });

  test("returns 0 when the options above turn out to be the assumed height", () => {
    expect(
      getMeasuredScrollCorrection({
        ...base,
        // Inside option 20, which sits at 800 under the 40px seed.
        scrollTop: 810,
        previousHeights: [],
        heights: measureFirst(20, 40),
      }),
    ).toBe(0);
  });

  test("pushes the anchor down when options above it are taller than assumed", () => {
    // 20 options assumed at the 40px seed sat at 800; measured at 60px they
    // sit at 1200.
    expect(
      getMeasuredScrollCorrection({
        ...base,
        scrollTop: 810,
        previousHeights: [],
        heights: measureFirst(20, 60),
      }),
    ).toBe(400);
  });

  test("pulls the anchor up when options above it are shorter than assumed", () => {
    expect(
      getMeasuredScrollCorrection({
        ...base,
        scrollTop: 810,
        previousHeights: [],
        heights: measureFirst(20, 20),
      }),
    ).toBe(-400);
  });

  test("corrects by the delta of the one option whose height changed", () => {
    const previousHeights = measureFirst(20, 50);
    const heights = measureFirst(20, 50);
    heights[5] = 90;

    expect(
      // Inside option 20, which sits at 1000 once the options above it
      // measure 50 apiece.
      getMeasuredScrollCorrection({
        ...base,
        scrollTop: 1010,
        previousHeights,
        heights,
      }),
    ).toBe(40);
  });

  test("ignores an option measured below the anchor", () => {
    const previousHeights = measureFirst(20, 50);
    const heights = measureFirst(20, 50);
    heights[100] = 90;

    expect(
      getMeasuredScrollCorrection({
        ...base,
        scrollTop: 1010,
        previousHeights,
        heights,
      }),
    ).toBe(0);
  });
});

describe("getMeasuredScrollCorrection", () => {
  const base = { itemCount: 200, itemHeight: 40, containerHeight: 300 };

  const measureFirst = (count: number, height: number) =>
    Array.from({ length: 200 }, (_, index) =>
      index < count ? height : undefined,
    );

  test("returns 0 at the top of the list, where nothing sits above", () => {
    expect(
      getMeasuredScrollCorrection({
        ...base,
        scrollTop: 0,
        previousHeights: [],
        heights: measureFirst(20, 60),
      }),
    ).toBe(0);
  });

  test("returns 0 when the options above turn out to be the assumed height", () => {
    expect(
      getMeasuredScrollCorrection({
        ...base,
        scrollTop: 800,
        previousHeights: [],
        heights: measureFirst(20, 40),
      }),
    ).toBe(0);
  });

  test("anchors on the option at the top of the viewport, not the window", () => {
    // scrollTop 800 puts option 20 at the top of the viewport under the 40px
    // seed. Measured at 60px, the twenty options above it sit at 1200 instead
    // of 800, so the anchor has to come down by 400 to stay where it was. An
    // anchor taken from the rendered window would have been three options
    // earlier and asked for 340.
    expect(
      getMeasuredScrollCorrection({
        ...base,
        scrollTop: 800,
        previousHeights: [],
        heights: measureFirst(20, 60),
      }),
    ).toBe(400);
  });

  test("pulls back when the options above turn out shorter than assumed", () => {
    expect(
      getMeasuredScrollCorrection({
        ...base,
        scrollTop: 800,
        previousHeights: [],
        heights: measureFirst(20, 20),
      }),
    ).toBe(-400);
  });

  test("corrects by the delta of the one option whose height changed", () => {
    const previousHeights = measureFirst(20, 50);
    const heights = measureFirst(20, 50);
    heights[5] = 90;

    expect(
      getMeasuredScrollCorrection({
        ...base,
        scrollTop: 1000,
        previousHeights,
        heights,
      }),
    ).toBe(40);
  });

  test("ignores a height change below the anchor", () => {
    const previousHeights = measureFirst(40, 50);
    const heights = measureFirst(40, 50);
    heights[30] = 200;

    expect(
      getMeasuredScrollCorrection({
        ...base,
        scrollTop: 500,
        previousHeights,
        heights,
      }),
    ).toBe(0);
  });
});

describe("virtualListState with measured heights", () => {
  const makeItems = (length: number) =>
    Array.from({ length }, (_, i) => ({ id: i, name: `Item ${i}` }));

  const tallHeights = (length: number) => Array.from({ length }, () => 100);

  test("measures a windowed list from the supplied heights", () => {
    const result = virtualListState({
      items: makeItems(200),
      scrollTop: 0,
      shouldVirtualize: true,
      virtualize: { measured: true },
      heights: tallHeights(200),
    });

    expect(result.data?.isVirtualized).toBe(true);
    expect(result.data?.totalHeight).toBe(20_000);
  });

  test("does not window a list below the threshold that opts into measuring", () => {
    const items = makeItems(50);
    const result = virtualListState({
      items,
      scrollTop: 0,
      shouldVirtualize: true,
      virtualize: { measured: true },
      heights: tallHeights(50),
    });

    // Opting in resolves a full config, but the threshold still decides
    // whether the list is windowed at all.
    expect(result.config?.measured).toBe(true);
    expect(result.data?.isVirtualized).toBe(false);
    expect(result.itemsToRender).toBe(items);
  });

  test("ignores supplied heights unless the list opts into measuring", () => {
    const result = virtualListState({
      items: makeItems(200),
      scrollTop: 0,
      shouldVirtualize: true,
      virtualize: true,
      heights: tallHeights(200),
    });

    expect(result.config?.measured).toBe(false);
    expect(result.data?.totalHeight).toBe(8000);
  });

  test("seeds the estimate from the size-based default when none is supplied", () => {
    const result = virtualListState({
      items: makeItems(200),
      scrollTop: 0,
      shouldVirtualize: true,
      virtualize: { measured: true },
      defaults: { itemHeight: 48 },
    });

    expect(result.data?.totalHeight).toBe(9600);
  });

  test("seeds the estimate from the supplied item height over the default", () => {
    const result = virtualListState({
      items: makeItems(200),
      scrollTop: 0,
      shouldVirtualize: true,
      virtualize: { measured: true, itemHeight: 64 },
      defaults: { itemHeight: 48 },
    });

    expect(result.data?.totalHeight).toBe(12_800);
  });
});

describe("virtualize with degenerate measured heights", () => {
  const makeItems = (length: number) =>
    Array.from({ length }, (_, i) => ({ id: i, name: `Item ${i}` }));

  const base = {
    itemHeight: 40,
    containerHeight: 300,
    scrollTop: 0,
    measured: true,
  };

  test("handles an empty list", () => {
    const result = virtualize({
      ...base,
      items: [],
      heights: [],
      threshold: 0,
    });

    expect(result.visibleItems).toEqual([]);
    expect(result.startIndex).toBe(0);
    expect(result.endIndex).toBe(0);
    expect(result.offsetY).toBe(0);
    expect(result.totalHeight).toBe(0);
  });

  test("handles a single option", () => {
    const items = makeItems(1);
    const result = virtualize({
      ...base,
      items,
      heights: [90],
      threshold: 0,
    });

    expect(result.visibleItems).toEqual(items);
    expect(result.startIndex).toBe(0);
    expect(result.endIndex).toBe(1);
    expect(result.offsetY).toBe(0);
    expect(result.totalHeight).toBe(90);
  });

  test("handles every option measuring the same height", () => {
    const result = virtualize({
      ...base,
      items: makeItems(200),
      heights: Array.from({ length: 200 }, () => 55),
      scrollTop: 1100,
      threshold: 100,
    });

    // Option 20 starts at 1100, less 3 overscan; option 26 starts at 1430,
    // the first past the 1400 viewport bottom, plus 3 overscan.
    expect(result.totalHeight).toBe(11_000);
    expect(result.startIndex).toBe(17);
    expect(result.endIndex).toBe(29);
    expect(result.offsetY).toBe(935);
  });

  test("handles a single option measuring zero", () => {
    const heights = Array.from({ length: 200 }, () => 50);
    heights[5] = 0;

    const result = virtualize({
      ...base,
      items: makeItems(200),
      heights,
      scrollTop: 450,
      threshold: 100,
    });

    // The collapsed option takes no space, so everything after it sits 50px
    // higher than an all-50px list would put it.
    expect(result.totalHeight).toBe(9950);
    expect(result.startIndex).toBe(7);
    expect(result.endIndex).toBe(19);
    expect(result.offsetY).toBe(300);
  });

  test("renders every option when they all measure zero", () => {
    const result = virtualize({
      ...base,
      items: makeItems(200),
      heights: Array.from({ length: 200 }, () => 0),
      threshold: 100,
    });

    // Nothing to search: every option shares offset 0, so window nothing out.
    expect(result.totalHeight).toBe(0);
    expect(result.startIndex).toBe(0);
    expect(result.endIndex).toBe(200);
    expect(result.offsetY).toBe(0);
  });

  test("treats a negative or non-finite height as unmeasured", () => {
    const results = [-10, Number.NaN, Number.POSITIVE_INFINITY].map((bad) => {
      const heights = Array.from({ length: 200 }, () => 50);
      heights[5] = bad;

      return virtualize({
        ...base,
        items: makeItems(200),
        heights,
        scrollTop: 500,
        threshold: 100,
      });
    });

    for (const result of results) {
      // The rejected entry falls back to the estimate, which the other 199
      // measured options put at 50, so the list reads as 200 options of 50px.
      expect(result.totalHeight).toBe(10_000);
      expect(result.startIndex).toBe(7);
      expect(result.offsetY).toBe(350);
    }
  });

  test("handles a list shorter than its container", () => {
    const items = makeItems(200);
    const result = virtualize({
      ...base,
      items,
      heights: Array.from({ length: 200 }, () => 1),
      scrollTop: 500,
      threshold: 100,
    });

    expect(result.totalHeight).toBe(200);
    expect(result.startIndex).toBe(0);
    expect(result.endIndex).toBe(200);
    expect(result.offsetY).toBe(0);
    expect(result.visibleItems).toEqual(items);
  });
});

describe("getVisibleRange with measured heights", () => {
  // Alternating 30px/70px options: option 2k starts at 100k.
  const base = {
    itemHeight: 40,
    containerHeight: 300,
    itemCount: 200,
    heights: Array.from({ length: 200 }, (_, index) =>
      index % 2 === 0 ? 30 : 70,
    ),
  };

  test("searches accumulated positions rather than dividing by itemHeight", () => {
    expect(getVisibleRange({ ...base, scrollTop: 1000 })).toEqual({
      startIndex: 17,
      endIndex: 29,
    });
  });

  test("clamps startIndex to 0 with overscan at the top", () => {
    expect(getVisibleRange({ ...base, scrollTop: 0 })).toEqual({
      startIndex: 0,
      endIndex: 9,
    });
  });

  test("clamps a negative scroll position to the top", () => {
    // Option 4 starts at 200, the first past a viewport bottom pulled up to
    // 200 by the negative offset, plus 3 overscan.
    expect(getVisibleRange({ ...base, scrollTop: -100 })).toEqual({
      startIndex: 0,
      endIndex: 7,
    });
  });

  test("clamps endIndex to itemCount past the end of the list", () => {
    expect(getVisibleRange({ ...base, scrollTop: 10_000 })).toEqual({
      startIndex: 196,
      endIndex: 200,
    });
  });

  test("caps the window to maxItems", () => {
    expect(getVisibleRange({ ...base, scrollTop: 1000, maxItems: 5 })).toEqual({
      startIndex: 17,
      endIndex: 22,
    });
  });
});

describe("getMeasuredAverage", () => {
  test("averages the measured heights, ignoring the unmeasured", () => {
    // Sparse where nothing has been measured, which is every window that has
    // not been scrolled through yet.
    const heights = [40, undefined, 80, undefined, 120];

    expect(getMeasuredAverage(heights)).toBe(80);
  });

  test("counts a height of zero, since an option can collapse", () => {
    expect(getMeasuredAverage([0, 40])).toBe(20);
  });

  test("reads only as far as asked", () => {
    expect(getMeasuredAverage([40, 40, 400], 2)).toBe(40);
  });

  test("reports nothing to average rather than a number", () => {
    // The caller has to tell "no evidence" from "evidence that says zero",
    // because only one of them is worth keeping as a seed.
    expect(getMeasuredAverage([])).toBeNull();
    expect(getMeasuredAverage([undefined, undefined])).toBeNull();
    expect(getMeasuredAverage(undefined)).toBeNull();
  });
});

describe("virtualListState estimate", () => {
  const items = Array.from({ length: 10 }, (_, index) => ({ id: index }));
  const base = {
    items,
    scrollTop: 0,
    shouldVirtualize: true,
  };

  test("seeds unmeasured options from the estimate under measured heights", () => {
    const { config, data } = virtualListState({
      ...base,
      virtualize: { measured: true, threshold: 1, itemHeight: 40 },
      estimate: 90,
    });

    // Nothing measured, so every option takes the estimate rather than the
    // consumer's seed, and the config reports the seed actually used. An offset
    // and a scroll position computed against different seeds would describe
    // different lists.
    expect(data?.totalHeight).toBe(items.length * 90);
    expect(config?.itemHeight).toBe(90);
  });

  test("leaves the fixed path's item height alone", () => {
    const { config, data } = virtualListState({
      ...base,
      virtualize: { threshold: 1, itemHeight: 40 },
      estimate: 90,
    });

    // There `itemHeight` is the height of every option, not a guess at one.
    expect(data?.totalHeight).toBe(items.length * 40);
    expect(config?.itemHeight).toBe(40);
  });

  test("yields to a real measurement", () => {
    const heights = Array.from({ length: items.length }, () => 50);
    const { data } = virtualListState({
      ...base,
      virtualize: { measured: true, threshold: 1, itemHeight: 40 },
      heights,
      estimate: 90,
    });

    expect(data?.totalHeight).toBe(items.length * 50);
  });

  test("ignores an estimate that could not be a height", () => {
    for (const estimate of [0, -10, Number.NaN, Number.POSITIVE_INFINITY]) {
      const { data } = virtualListState({
        ...base,
        virtualize: { measured: true, threshold: 1, itemHeight: 40 },
        estimate,
      });

      expect(data?.totalHeight).toBe(items.length * 40);
    }
  });
});
