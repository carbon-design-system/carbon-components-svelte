import {
  insertByDomOrder,
  sortByDomOrder,
} from "../../src/utils/sort-by-dom-order.js";

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

describe("insertByDomOrder", () => {
  function spans(count: number) {
    const container = document.createElement("div");
    const nodes = Array.from({ length: count }, () =>
      document.createElement("span"),
    );
    container.append(...nodes);
    return nodes;
  }

  it("appends an item that follows the last one with a single comparison", () => {
    const nodes = spans(50);
    const spy = vi.spyOn(Node.prototype, "compareDocumentPosition");

    let list: Array<{ id: number; node: HTMLElement }> = [];
    nodes.forEach((node, id) => {
      list = insertByDomOrder(list, { id, node });
    });

    expect(list.map((item) => item.id)).toEqual(nodes.map((_, id) => id));
    expect(spy).toHaveBeenCalledTimes(nodes.length - 1);
    spy.mockRestore();
  });

  it("falls back to a full sort for an item that precedes the last one", () => {
    const [a, b, c] = spans(3);
    let list: Array<{ id: string; node: HTMLElement }> = [];
    list = insertByDomOrder(list, { id: "a", node: a });
    list = insertByDomOrder(list, { id: "c", node: c });
    list = insertByDomOrder(list, { id: "b", node: b });

    expect(list.map((item) => item.id)).toEqual(["a", "b", "c"]);
  });

  it("does not mutate the input list", () => {
    const [a, b] = spans(2);
    const input = [{ id: "a", node: a }];
    const result = insertByDomOrder(input, { id: "b", node: b });

    expect(input).toHaveLength(1);
    expect(result).toHaveLength(2);
  });
});
