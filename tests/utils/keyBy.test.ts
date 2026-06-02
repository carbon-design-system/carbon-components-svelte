import { keyBy } from "../../src/utils/keyBy.js";

describe("keyBy", () => {
  test("indexes items by their id by default", () => {
    const a = { id: "a", index: 0 };
    const b = { id: "b", index: 1 };
    expect(keyBy([a, b])).toEqual({ a, b });
  });

  test("returns an empty object for an empty array", () => {
    expect(keyBy([])).toEqual({});
  });

  test("supports a custom key selector", () => {
    const items = [
      { name: "x", value: 1 },
      { name: "y", value: 2 },
    ];
    expect(keyBy(items, (item) => item.name)).toEqual({
      x: items[0],
      y: items[1],
    });
  });

  test("last item wins on duplicate keys", () => {
    const first = { id: "dup", index: 0 };
    const second = { id: "dup", index: 1 };
    expect(keyBy([first, second])).toEqual({ dup: second });
  });
});
