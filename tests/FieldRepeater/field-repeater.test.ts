import {
  createKeyer,
  moveInArray,
  padItems,
} from "carbon-components-svelte/FieldRepeater/field-repeater.js";

describe("createKeyer", () => {
  it("keeps a row's key through an insert, a move and a remove", () => {
    const keyer = createKeyer();
    const [a, b] = keyer.sync(["a", "b"]);

    keyer.insert(2);
    keyer.move(0, 1);
    keyer.remove(2);

    expect(keyer.sync(["b", "a"])).toEqual([b, a]);
  });

  it("grows and shrinks at the end for an outside change", () => {
    const keyer = createKeyer();
    const [a, b] = keyer.sync(["a", "b"]);

    expect(keyer.sync(["a", "b", "c"]).slice(0, 2)).toEqual([a, b]);
    expect(keyer.sync(["a"])).toEqual([a]);
  });

  it("derives keys from the data, and tells repeated keys apart", () => {
    const keyer = createKeyer();
    const itemKey = (item: { id: string }) => item.id;

    const keys = keyer.sync([{ id: "x" }, { id: "y" }, { id: "x" }], itemKey);

    expect(keys.slice(0, 2)).toEqual(["x", "y"]);
    expect(new Set(keys).size).toBe(3);
    expect(keyer.sync([{ id: "y" }, { id: "x" }], itemKey)).toEqual(["y", "x"]);
  });
});

describe("moveInArray", () => {
  it("returns a moved copy and ignores an index out of range", () => {
    const array = [1, 2, 3];

    expect(moveInArray(array, 0, 2)).toEqual([2, 3, 1]);
    expect(moveInArray(array, 1, 5)).toEqual([1, 2, 3]);
    expect(array).toEqual([1, 2, 3]);
  });
});

describe("padItems", () => {
  it("fills to min and otherwise returns the same array", () => {
    const items = ["a"];

    expect(padItems(items, 3, (index) => `new${index}`)).toEqual([
      "a",
      "new1",
      "new2",
    ]);
    expect(padItems(items, 1, () => "x")).toBe(items);
  });
});
