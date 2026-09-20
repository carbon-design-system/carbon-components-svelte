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

  it("compares non-plain objects by identity", () => {
    // None of these expose their state as own enumerable keys, so walking
    // keys would call two different ones equal.
    expect(deepEqual(new Map([[1, 2]]), new Map())).toBe(false);
    expect(deepEqual(new Set([1]), new Set([2]))).toBe(false);
    expect(
      deepEqual(document.createElement("div"), document.createElement("div")),
    ).toBe(false);

    const element = document.createElement("div");
    expect(deepEqual({ anchor: element }, { anchor: element })).toBe(true);

    class Money {
      #cents: number;
      constructor(cents: number) {
        this.#cents = cents;
      }
      get cents() {
        return this.#cents;
      }
    }
    expect(deepEqual(new Money(1), new Money(2))).toBe(false);
  });

  it("still walks objects without a prototype", () => {
    const a = Object.assign(Object.create(null), { id: 1 });
    const b = Object.assign(Object.create(null), { id: 1 });
    expect(deepEqual(a, b)).toBe(true);
  });

  it("handles circular references", () => {
    const a: Record<string, unknown> = { name: "a" };
    a.self = a;
    const b: Record<string, unknown> = { name: "a" };
    b.self = b;
    expect(deepEqual(a, b)).toBe(true);
  });
});
