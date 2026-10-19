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
  it("should return all items when below threshold", () => {
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
    expect(result.endOffsetY).toBe(2000);
    expect(result.totalHeight).toBe(2000);
    expect(result.isVirtualized).toBe(false);
  });

  it("should virtualize items when above threshold", () => {
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

  it("should apply overscan to render extra items", () => {
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

    // (300px / 40px = 7.5, so ~8 items) + overscan above and below
    expect(result.visibleItems.length).toBeGreaterThan(8);
    // ceil(300 / 40) = 8 visible + 5 overscan; the default of 3 would give 11
    expect(result.endIndex).toBe(13);
    expect(result.startIndex).toBe(0); // With overscan, startIndex can go negative but is clamped to 0
    expect(result.isVirtualized).toBe(true);
  });

  it("renders matching items when a stale deep scrollTop survives a filter narrowing", () => {
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

  it("should preserve item references in visibleItems", () => {
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

    expect(result.visibleItems[0]).toBe(items[result.startIndex]);
    expect(result.visibleItems[result.visibleItems.length - 1]).toBe(
      items[result.endIndex - 1],
    );
  });

  it("should handle maxItems that is smaller than viewport capacity", () => {
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

  it("should handle negative scroll position", () => {
    const items = Array.from({ length: 500 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
    }));
    const result = virtualize({
      items,
      itemHeight: 40,
      containerHeight: 300,
      scrollTop: -100,
      threshold: 100,
    });

    expect(result.startIndex).toBe(0);
    expect(result.offsetY).toBe(0);
    expect(result.isVirtualized).toBe(true);
  });

  it("falls back to unvirtualized for a non-positive item height", () => {
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

  it("should handle zero container height", () => {
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

  it("returns null config and full items when not virtualizing", () => {
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

  it("merges object-virtualize overrides over the defaults", () => {
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

  it("applies caller defaults beneath the virtualize prop", () => {
    const result = virtualListState({
      items: makeItems(500),
      scrollTop: 0,
      shouldVirtualize: true,
      virtualize: true,
      defaults: { containerHeight: 250 },
    });

    expect(result.config?.containerHeight).toBe(250);
  });

  it("renders all items when virtualized but below the threshold", () => {
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

  it("clamps startIndex to 0 with overscan at the top", () => {
    expect(getVisibleRange({ ...base, scrollTop: 0 })).toEqual({
      startIndex: 0,
      endIndex: Math.ceil(300 / 40) + 3,
    });
  });

  it("offsets the range by scroll position", () => {
    // scrollTop 2000 => floor(50) - 3 = 47 start.
    const { startIndex, endIndex } = getVisibleRange({
      ...base,
      scrollTop: 2000,
    });
    expect(startIndex).toBe(47);
    expect(endIndex).toBe(Math.ceil((2000 + 300) / 40) + 3);
  });

  it("clamps endIndex to itemCount", () => {
    const { endIndex } = getVisibleRange({
      ...base,
      scrollTop: 500 * 40,
    });
    expect(endIndex).toBe(500);
  });

  it("caps the window to maxItems", () => {
    expect(getVisibleRange({ ...base, scrollTop: 0, maxItems: 5 })).toEqual({
      startIndex: 0,
      endIndex: 5,
    });
  });

  it("falls back to the full range for a non-positive or NaN itemHeight", () => {
    for (const itemHeight of [0, Number.NaN]) {
      expect(getVisibleRange({ ...base, itemHeight, scrollTop: 100 })).toEqual({
        startIndex: 0,
        endIndex: base.itemCount,
      });
    }
  });
});

describe("getBoundedScrollTop", () => {
  it("returns the exact position for a mid-list item", () => {
    expect(
      getBoundedScrollTop({
        index: 10,
        itemHeight: 40,
        containerHeight: 300,
        itemCount: 100,
      }),
    ).toBe(400);
  });

  it("clamps to 0 for a negative index", () => {
    expect(
      getBoundedScrollTop({
        index: -5,
        itemHeight: 40,
        containerHeight: 300,
        itemCount: 100,
      }),
    ).toBe(0);
  });

  it("clamps to maxScroll when past the end", () => {
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

  it("floors maxScroll at 0 when content is shorter than the container", () => {
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

  it("returns null when the highlighted item is already visible", () => {
    // At scrollTop 0, the visible+overscan range covers the first several items.
    expect(
      scrollHighlightedIntoView({
        ...base,
        highlightedIndex: 2,
        currentScrollTop: 0,
      }),
    ).toBeNull();
  });

  it("brings an item below the viewport to the bottom edge", () => {
    // Item 100 ends at 4040px; the 300px viewport ends there at 3740px.
    expect(
      scrollHighlightedIntoView({
        ...base,
        highlightedIndex: 100,
        currentScrollTop: 0,
      }),
    ).toBe(3740);
  });

  it("returns a bounded scrollTop when the item is above the viewport", () => {
    // Scrolled to item 100; highlight item 10, which is above the range.
    expect(
      scrollHighlightedIntoView({
        ...base,
        highlightedIndex: 10,
        currentScrollTop: 4000,
      }),
    ).toBe(400);
  });

  it("treats rendered overscan rows as out of view", () => {
    // At scrollTop 4000, items 97-99 are rendered as overscan above the
    // viewport, and items 108-110 below it. None of them can be seen.
    expect(
      scrollHighlightedIntoView({
        ...base,
        highlightedIndex: 97,
        currentScrollTop: 4000,
      }),
    ).toBe(3880);
    expect(
      scrollHighlightedIntoView({
        ...base,
        highlightedIndex: 108,
        currentScrollTop: 4000,
      }),
    ).toBe(4060);
  });

  it("goes to the top when the nearest edge leaves the item past maxItems", () => {
    // Item 6 spans 240-280px, fully in view, but a cap of 5 renders [0, 5).
    expect(
      scrollHighlightedIntoView({
        ...base,
        highlightedIndex: 6,
        currentScrollTop: 0,
        maxItems: 5,
      }),
    ).toBe(240);
  });
});

describe("scrollSelectedIntoView", () => {
  it("returns 0 when there is no selection", () => {
    expect(
      scrollSelectedIntoView({
        selectedIndex: -1,
        itemCount: 500,
        itemHeight: 40,
        containerHeight: 300,
      }),
    ).toBe(0);
  });

  it("returns the bounded position for a selected item", () => {
    expect(
      scrollSelectedIntoView({
        selectedIndex: 50,
        itemCount: 500,
        itemHeight: 40,
        containerHeight: 300,
      }),
    ).toBe(2000);
  });
});

describe("resetVirtualScrollOnClose", () => {
  it("returns 0", () => {
    expect(resetVirtualScrollOnClose()).toBe(0);
  });
});

describe("virtualize with measured heights", () => {
  const makeItems = (length: number) =>
    Array.from({ length }, (_, i) => ({ id: i, name: `Item ${i}` }));

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

  it("resolves the visible range mid-list", () => {
    const result = virtualize({ ...alternating, scrollTop: 1000 });

    // Option 20 starts at 1000, less 3 overscan; option 26 starts at 1300,
    // the first past the viewport bottom, plus 3 overscan.
    expect(result.startIndex).toBe(17);
    expect(result.endIndex).toBe(29);
    expect(result.offsetY).toBe(830);
    // Option 29 starts at 1430, where the rendered window ends.
    expect(result.endOffsetY).toBe(1430);
    // 100 options at 30px and 100 at 70px is 10000px, where a uniform 40px
    // item height would report 8000px.
    expect(result.totalHeight).toBe(10_000);
  });

  it("falls back to the supplied item height while nothing is measured", () => {
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
    expect(result.endOffsetY).toBe(1440);
  });

  it("estimates unmeasured options from the measured ones", () => {
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
    it("returns the accumulated position of a mid-list option", () => {
      expect(getBoundedScrollTop({ ...base, index: 20 })).toBe(1000);
    });

    it("clamps an option near the end to maxScroll", () => {
      // Option 199 starts at 9930, past the 10000 - 300 maximum.
      expect(getBoundedScrollTop({ ...base, index: 199 })).toBe(9700);
    });

    it("clamps to 0 for a negative index", () => {
      expect(getBoundedScrollTop({ ...base, index: -5 })).toBe(0);
    });

    it("floors maxScroll at 0 when the list is shorter than the container", () => {
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
    it("returns the accumulated position of the selected option", () => {
      expect(scrollSelectedIntoView({ ...base, selectedIndex: 20 })).toBe(1000);
    });
  });

  describe("scrollHighlightedIntoView", () => {
    it("brings an option below the viewport to the bottom edge", () => {
      // Option 100 spans 5000-5030px.
      expect(
        scrollHighlightedIntoView({
          ...base,
          highlightedIndex: 100,
          currentScrollTop: 0,
        }),
      ).toBe(4730);
    });

    it("returns a bounded position when the option is above the viewport", () => {
      expect(
        scrollHighlightedIntoView({
          ...base,
          highlightedIndex: 10,
          currentScrollTop: 5000,
        }),
      ).toBe(500);
    });
  });
});

describe("getMeasuredScrollCorrection", () => {
  const base = { itemCount: 200, itemHeight: 40, containerHeight: 300 };

  const measureFirst = (count: number, height: number) =>
    Array.from({ length: 200 }, (_, index) =>
      index < count ? height : undefined,
    );

  it("returns 0 at the top of the list, where nothing sits above", () => {
    expect(
      getMeasuredScrollCorrection({
        ...base,
        scrollTop: 0,
        previousHeights: [],
        heights: measureFirst(20, 60),
      }),
    ).toBe(0);
  });

  // 800 sits on the boundary of option 20 and 810 inside it; off-by-one
  // anchor mistakes split between the two.
  it.each([[800], [810]])(
    "anchors on the option at the top of the viewport, not the window (scrollTop %i)",
    (scrollTop) => {
      // scrollTop puts option 20 at the top of the viewport under the 40px
      // seed. Measured at 60px, the twenty options above it sit at 1200 instead
      // of 800, so the anchor has to come down by 400 to stay where it was. An
      // anchor taken from the rendered window would have been three options
      // earlier and asked for 340.
      expect(
        getMeasuredScrollCorrection({
          ...base,
          scrollTop,
          previousHeights: [],
          heights: measureFirst(20, 60),
        }),
      ).toBe(400);
    },
  );

  it("corrects by the delta of the one option whose height changed", () => {
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

  it("ignores a height change below the anchor", () => {
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

  it("measures a windowed list from the supplied heights", () => {
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

  it("ignores supplied heights unless the list opts into measuring", () => {
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

  it("seeds the estimate from the size-based default when none is supplied", () => {
    const result = virtualListState({
      items: makeItems(200),
      scrollTop: 0,
      shouldVirtualize: true,
      virtualize: { measured: true },
      defaults: { itemHeight: 48 },
    });

    expect(result.data?.totalHeight).toBe(9600);
  });

  it("seeds the estimate from the supplied item height over the default", () => {
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

  it("handles a single option measuring zero", () => {
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

  it("renders every option when they all measure zero", () => {
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

  it("treats a negative or non-finite height as unmeasured", () => {
    const results = [-10, Number.POSITIVE_INFINITY].map((bad) => {
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

  it("handles a list shorter than its container", () => {
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

  it("searches accumulated positions rather than dividing by itemHeight", () => {
    expect(getVisibleRange({ ...base, scrollTop: 1000 })).toEqual({
      startIndex: 17,
      endIndex: 29,
    });
  });

  it("clamps startIndex to 0 with overscan at the top", () => {
    expect(getVisibleRange({ ...base, scrollTop: 0 })).toEqual({
      startIndex: 0,
      endIndex: 9,
    });
  });

  it("clamps a negative scroll position to the top", () => {
    // Option 4 starts at 200, the first past a viewport bottom pulled up to
    // 200 by the negative offset, plus 3 overscan.
    expect(getVisibleRange({ ...base, scrollTop: -100 })).toEqual({
      startIndex: 0,
      endIndex: 7,
    });
  });

  it("clamps endIndex to itemCount past the end of the list", () => {
    expect(getVisibleRange({ ...base, scrollTop: 10_000 })).toEqual({
      startIndex: 196,
      endIndex: 200,
    });
  });

  it("caps the window to maxItems", () => {
    expect(getVisibleRange({ ...base, scrollTop: 1000, maxItems: 5 })).toEqual({
      startIndex: 17,
      endIndex: 22,
    });
  });
});

describe("getMeasuredAverage", () => {
  it("averages the measured heights, ignoring the unmeasured", () => {
    // Sparse where nothing has been measured, which is every window that has
    // not been scrolled through yet.
    const heights = [40, undefined, 80, undefined, 120];

    expect(getMeasuredAverage(heights)).toBe(80);
  });

  it("counts a height of zero, since an option can collapse", () => {
    expect(getMeasuredAverage([0, 40])).toBe(20);
  });

  it("reads only as far as asked", () => {
    expect(getMeasuredAverage([40, 40, 400], 2)).toBe(40);
  });

  it("reports nothing to average rather than a number", () => {
    // The caller has to tell "no evidence" from "evidence that says zero",
    // because only one of them is worth keeping as a seed.
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

  it("seeds unmeasured options from the estimate under measured heights", () => {
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

  it("leaves the fixed path's item height alone", () => {
    const { config, data } = virtualListState({
      ...base,
      virtualize: { threshold: 1, itemHeight: 40 },
      estimate: 90,
    });

    // There `itemHeight` is the height of every option, not a guess at one.
    expect(data?.totalHeight).toBe(items.length * 40);
    expect(config?.itemHeight).toBe(40);
  });

  it("ignores an estimate that could not be a height", () => {
    for (const estimate of [0, Number.POSITIVE_INFINITY]) {
      const { data } = virtualListState({
        ...base,
        virtualize: { measured: true, threshold: 1, itemHeight: 40 },
        estimate,
      });

      expect(data?.totalHeight).toBe(items.length * 40);
    }
  });
});

describe("virtualize with a scroll lead", () => {
  const items = Array.from({ length: 500 }, (_, i) => ({ id: i }));
  const base = {
    items,
    itemHeight: 40,
    containerHeight: 300,
    scrollTop: 4000,
    overscan: 3,
  };

  it("renders no lead without a scroll delta", () => {
    const result = virtualize(base);

    expect(result.startIndex).toBe(97);
    expect(result.endIndex).toBe(111);
  });

  it("extends the window below the viewport when scrolling down", () => {
    const result = virtualize({ ...base, scrollDelta: 120 });

    expect(result.startIndex).toBe(97);
    expect(result.endIndex).toBe(114);
  });

  it("extends the window above the viewport when scrolling up", () => {
    const result = virtualize({ ...base, scrollDelta: -120 });

    expect(result.startIndex).toBe(94);
    expect(result.endIndex).toBe(111);
    expect(result.offsetY).toBe(94 * 40);
  });

  it("leads by at most one viewport", () => {
    const down = virtualize({ ...base, scrollDelta: 5000 });
    const up = virtualize({ ...base, scrollDelta: -5000 });

    expect(down.endIndex).toBe(118);
    expect(up.startIndex).toBe(89);
  });

  it("ignores a non-finite scroll delta", () => {
    const result = virtualize({ ...base, scrollDelta: Number.NaN });

    expect(result.startIndex).toBe(97);
    expect(result.endIndex).toBe(111);
  });

  it("trims the lead before the viewport under maxItems", () => {
    const down = virtualize({ ...base, maxItems: 15, scrollDelta: 120 });
    const up = virtualize({ ...base, maxItems: 15, scrollDelta: -120 });

    expect(down.startIndex).toBe(97);
    expect(down.endIndex).toBe(112);
    expect(up.startIndex).toBe(96);
    expect(up.endIndex).toBe(111);
  });

  it("keeps the old cap when maxItems cannot fit the viewport", () => {
    const capped = virtualize({ ...base, maxItems: 5 });
    const up = virtualize({ ...base, maxItems: 5, scrollDelta: -120 });

    expect(up.startIndex).toBe(capped.startIndex);
    expect(up.endIndex).toBe(capped.endIndex);
  });

  it.each([
    ["fixed", undefined],
    ["measured", Array.from({ length: 500 }, (_, i) => 30 + (i % 3) * 10)],
  ])("covers the next viewport at a steady speed (%s)", (_label, heights) => {
    // The browser can paint a scroll before the window moves to it. Each
    // window must cover the viewport one scroll later, or that frame shows
    // blank space.
    const speed = 250;
    let scrollTop = 0;
    let previous = virtualize({
      ...base,
      scrollTop,
      measured: Boolean(heights),
      heights,
    });

    for (let step = 0; step < 20; step++) {
      const next = scrollTop + speed;
      const top = previous.offsetY;
      const bottom = heights
        ? top +
          heights
            .slice(previous.startIndex, previous.endIndex)
            .reduce((sum, height) => sum + height, 0)
        : previous.endIndex * 40;

      if (step > 0) {
        expect(top).toBeLessThanOrEqual(next);
        expect(bottom).toBeGreaterThanOrEqual(next + 300);
      }

      previous = virtualize({
        ...base,
        scrollTop: next,
        scrollDelta: speed,
        measured: Boolean(heights),
        heights,
      });
      scrollTop = next;
    }
  });

  it("passes through virtualListState", () => {
    const { data } = virtualListState({
      items,
      scrollTop: 4000,
      scrollDelta: 120,
      shouldVirtualize: true,
      virtualize: { containerHeight: 300 },
    });

    expect(data?.endIndex).toBe(114);
  });
});
