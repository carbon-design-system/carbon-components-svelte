import { virtualize } from "../../src/utils/virtualize.js";

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

  test("should handle scroll position beyond the list", () => {
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

    // When scrollTop is beyond the list, startIndex can be >= items.length
    // which results in an empty visibleItems array
    expect(result.endIndex).toBe(500);
    expect(result.startIndex).toBeGreaterThanOrEqual(0);
    expect(result.visibleItems.length).toBe(0);
    expect(result.isVirtualized).toBe(true);
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

  test("should handle zero item height", () => {
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

    expect(result.totalHeight).toBe(0);
    // Division by zero results in NaN for offsetY (0/0 = NaN)
    expect(Number.isNaN(result.offsetY) || result.offsetY >= 0).toBe(true);
    // With zero height, calculation produces NaN but function still returns
    expect(result.isVirtualized).toBe(true);
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
