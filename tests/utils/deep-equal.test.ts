import { deepEqual } from "../../src/utils/deep-equal.js";

describe("deepEqual", () => {
  it.each([
    [1, 1],
    ["a", "a"],
    [null, null],
    [undefined, undefined],
    [Number.NaN, Number.NaN],
    [new Date(2024, 0, 1), new Date(2024, 0, 1)],
    [/a/gi, /a/gi],
    [
      [1, [2, 3]],
      [1, [2, 3]],
    ],
    [{ a: { b: [1] } }, { a: { b: [1] } }],
    [
      [{ from: "01/01/2024", to: new Date(2024, 0, 5) }],
      [{ from: "01/01/2024", to: new Date(2024, 0, 5) }],
    ],
  ])("treats %j and %j as equal", (a, b) => {
    expect(deepEqual(a, b)).toBe(true);
  });

  it.each([
    [1, 2],
    [1, "1"],
    [null, undefined],
    [0, Number.NaN],
    [new Date(2024, 0, 1), new Date(2024, 0, 2)],
    [/a/g, /a/i],
    [
      [1, 2],
      [1, 2, 3],
    ],
    [{ a: 1 }, { a: 1, b: 2 }],
    [{ a: 1 }, { b: 1 }],
  ])("treats %j and %j as different", (a, b) => {
    expect(deepEqual(a, b)).toBe(false);
  });

  it("compares functions by identity", () => {
    const rule = () => true;
    expect(deepEqual([rule], [rule])).toBe(true);
    expect(deepEqual([rule], [() => true])).toBe(false);
  });

  it("handles circular references", () => {
    const a: Record<string, unknown> = { name: "a" };
    a.self = a;
    const b: Record<string, unknown> = { name: "a" };
    b.self = b;
    expect(deepEqual(a, b)).toBe(true);
  });
});
