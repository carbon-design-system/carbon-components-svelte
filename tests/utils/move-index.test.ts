import { moveIndex, nextEnabledIndex } from "../../src/utils/move-index.js";

describe("moveIndex", () => {
  it("moves forward and backward within range", () => {
    expect(moveIndex(0, 1, 3)).toBe(1);
    expect(moveIndex(2, -1, 3)).toBe(1);
  });

  it("wraps from last to first and first to last", () => {
    expect(moveIndex(2, 1, 3)).toBe(0);
    expect(moveIndex(0, -1, 3)).toBe(2);
  });

  it("treats -1 as 'nothing selected': step up lands on last, down on first", () => {
    expect(moveIndex(-1, 1, 3)).toBe(0);
    expect(moveIndex(-1, -1, 3)).toBe(2);
  });

  it("returns -1 for an empty range", () => {
    expect(moveIndex(0, 1, 0)).toBe(-1);
    expect(moveIndex(0, -1, 0)).toBe(-1);
  });
});

describe("nextEnabledIndex", () => {
  const items = (...disabled: boolean[]) =>
    disabled.map((d, i) => ({ id: i, disabled: d }));

  it("moves to the next enabled neighbor", () => {
    const result = nextEnabledIndex({
      items: items(false, false, false),
      index: 0,
      step: 1,
    });
    expect(result).toBe(1);
  });

  it("skips a single disabled neighbor", () => {
    const result = nextEnabledIndex({
      items: items(false, true, false),
      index: 0,
      step: 1,
    });
    expect(result).toBe(2);
  });

  it("skips a run of disabled items", () => {
    const result = nextEnabledIndex({
      items: items(false, true, true, false),
      index: 0,
      step: 1,
    });
    expect(result).toBe(3);
  });

  it("wraps past the end, skipping disabled", () => {
    const result = nextEnabledIndex({
      items: items(false, false, true),
      index: 1,
      step: 1,
    });
    expect(result).toBe(0);
  });

  it("wraps backward past the start", () => {
    const result = nextEnabledIndex({
      items: items(true, false, false),
      index: 1,
      step: -1,
    });
    expect(result).toBe(2);
  });

  it("returns the original index when every item is disabled", () => {
    const result = nextEnabledIndex({
      items: items(true, true, true),
      index: 1,
      step: 1,
    });
    expect(result).toBe(1);
  });

  it("lands on the first enabled item when starting from -1", () => {
    const result = nextEnabledIndex({
      items: items(true, false, false),
      index: -1,
      step: 1,
    });
    expect(result).toBe(1);
  });

  it("lands on the last enabled item when starting from -1 going backward", () => {
    const result = nextEnabledIndex({
      items: items(false, false, true),
      index: -1,
      step: -1,
    });
    expect(result).toBe(1);
  });

  it("supports a custom isDisabled predicate", () => {
    const data = [{ ok: true }, { ok: false }, { ok: true }];
    const result = nextEnabledIndex({
      items: data,
      index: 0,
      step: 1,
      isDisabled: (item) => !item.ok,
    });
    expect(result).toBe(2);
  });

  it("returns the original index for an empty items array", () => {
    expect(nextEnabledIndex({ items: [], index: -1, step: 1 })).toBe(-1);
  });

  it("clamps at the end instead of wrapping when wrap is false", () => {
    const result = nextEnabledIndex({
      items: items(false, false, false),
      index: 2,
      step: 1,
      wrap: false,
    });
    expect(result).toBe(2);
  });

  it("skips disabled items while clamping when wrap is false", () => {
    const result = nextEnabledIndex({
      items: items(false, true, false),
      index: 0,
      step: 1,
      wrap: false,
    });
    expect(result).toBe(2);
  });

  it("returns the original index when clamping finds no enabled item", () => {
    const result = nextEnabledIndex({
      items: items(false, true, true),
      index: 1,
      step: 1,
      wrap: false,
    });
    expect(result).toBe(1);
  });
});
