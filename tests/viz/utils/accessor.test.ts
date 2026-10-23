import { groupBy, toAccessor } from "../../../src/viz/utils/accessor.js";

describe("toAccessor", () => {
  test("the same key returns the same function identity", () => {
    expect(toAccessor("value")).toBe(toAccessor("value"));
  });

  test("a function passes through untouched", () => {
    const fn = (row: { value: number }) => row.value;
    expect(toAccessor(fn)).toBe(fn);
  });

  test("reading a key from a null or undefined row yields undefined, no throw", () => {
    const accessor = toAccessor<{ value: number }>("value");
    expect(() =>
      accessor(null as unknown as { value: number }, 0),
    ).not.toThrow();
    expect(accessor(null as unknown as { value: number }, 0)).toBeUndefined();
    expect(
      accessor(undefined as unknown as { value: number }, 0),
    ).toBeUndefined();
  });
});

describe("groupBy", () => {
  test("keeps first-seen group order", () => {
    const rows = [{ g: "b" }, { g: "a" }, { g: "b" }, { g: "c" }];
    const groups = groupBy(rows, (row) => row.g);
    expect([...groups.keys()]).toEqual(["b", "a", "c"]);
  });

  test("keeps input row order within groups", () => {
    const rows = [
      { g: "a", v: 1 },
      { g: "b", v: 2 },
      { g: "a", v: 3 },
    ];
    const groups = groupBy(rows, (row) => row.g);
    expect(groups.get("a")).toEqual([
      { g: "a", v: 1 },
      { g: "a", v: 3 },
    ]);
  });

  test("calls the key function exactly once per row (single pass)", () => {
    const rows = [1, 2, 3];
    let calls = 0;
    groupBy(rows, (row) => {
      calls += 1;
      return row % 2;
    });
    expect(calls).toBe(3);
  });
});
