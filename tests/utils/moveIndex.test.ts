import { moveIndex, nextEnabledIndex } from "../../src/utils/moveIndex.js";

describe("moveIndex", () => {
  test("moves forward and backward within range", () => {
    expect(moveIndex(0, 1, 3)).toBe(1);
    expect(moveIndex(2, -1, 3)).toBe(1);
  });

  test("wraps from last to first and first to last", () => {
    expect(moveIndex(2, 1, 3)).toBe(0);
    expect(moveIndex(0, -1, 3)).toBe(2);
  });

  test("treats -1 as 'nothing selected': step up lands on last, down on first", () => {
    expect(moveIndex(-1, 1, 3)).toBe(0);
    expect(moveIndex(-1, -1, 3)).toBe(2);
  });

  test("returns -1 for an empty range", () => {
    expect(moveIndex(0, 1, 0)).toBe(-1);
    expect(moveIndex(0, -1, 0)).toBe(-1);
  });
});

describe("nextEnabledIndex", () => {
  const items = (...disabled: boolean[]) =>
    disabled.map((d, i) => ({ id: i, disabled: d }));

  test("moves to the next enabled neighbor", () => {
    const result = nextEnabledIndex({
      items: items(false, false, false),
      index: 0,
      step: 1,
    });
    expect(result).toBe(1);
  });

  test("skips a single disabled neighbor", () => {
    const result = nextEnabledIndex({
      items: items(false, true, false),
      index: 0,
      step: 1,
    });
    expect(result).toBe(2);
  });

  test("skips a run of disabled items", () => {
    const result = nextEnabledIndex({
      items: items(false, true, true, false),
      index: 0,
      step: 1,
    });
    expect(result).toBe(3);
  });

  test("wraps past the end, skipping disabled", () => {
    const result = nextEnabledIndex({
      items: items(false, false, true),
      index: 1,
      step: 1,
    });
    expect(result).toBe(0);
  });

  test("wraps backward past the start", () => {
    const result = nextEnabledIndex({
      items: items(true, false, false),
      index: 1,
      step: -1,
    });
    expect(result).toBe(2);
  });

  test("returns the original index when every item is disabled", () => {
    const result = nextEnabledIndex({
      items: items(true, true, true),
      index: 1,
      step: 1,
    });
    expect(result).toBe(1);
  });

  test("lands on the first enabled item when starting from -1", () => {
    const result = nextEnabledIndex({
      items: items(true, false, false),
      index: -1,
      step: 1,
    });
    expect(result).toBe(1);
  });

  test("lands on the last enabled item when starting from -1 going backward", () => {
    const result = nextEnabledIndex({
      items: items(false, false, true),
      index: -1,
      step: -1,
    });
    expect(result).toBe(1);
  });

  test("supports a custom isDisabled predicate", () => {
    const data = [{ ok: true }, { ok: false }, { ok: true }];
    const result = nextEnabledIndex({
      items: data,
      index: 0,
      step: 1,
      isDisabled: (item) => !item.ok,
    });
    expect(result).toBe(2);
  });

  test("returns the original index for an empty items array", () => {
    expect(nextEnabledIndex({ items: [], index: -1, step: 1 })).toBe(-1);
  });
});
