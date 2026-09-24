import { sortByDomOrder } from "../../src/utils/sort-by-dom-order.js";

describe("sortByDomOrder", () => {
  it("orders items by DOM position", () => {
    const container = document.createElement("div");
    const first = document.createElement("span");
    const second = document.createElement("span");
    container.append(first, second);

    const result = sortByDomOrder([
      { id: "b", node: second },
      { id: "a", node: first },
    ]);

    expect(result.map((item) => item.id)).toEqual(["a", "b"]);
  });

  it("does not mutate the input list", () => {
    const container = document.createElement("div");
    const first = document.createElement("span");
    const second = document.createElement("span");
    container.append(first, second);

    const input = [
      { id: "b", node: second },
      { id: "a", node: first },
    ];
    sortByDomOrder(input);

    expect(input.map((item) => item.id)).toEqual(["b", "a"]);
  });

  it("treats items with a missing node as equal, leaving order unchanged", () => {
    const result = sortByDomOrder([
      { id: "a", node: null },
      { id: "b", node: null },
    ]);

    expect(result.map((item) => item.id)).toEqual(["a", "b"]);
  });
});
