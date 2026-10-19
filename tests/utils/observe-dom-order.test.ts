import { observeDomOrder } from "../../src/utils/observe-dom-order.js";

/** Mutation observer callbacks run on a microtask. */
const flushMutations = () => new Promise((resolve) => setTimeout(resolve));

function setup(ids: string[]) {
  const root = document.createElement("div");
  for (const id of ids) {
    const item = document.createElement("button");
    item.id = id;
    item.setAttribute("role", "tab");
    root.append(item);
  }
  document.body.append(root);
  const onReorder = vi.fn();
  observeDomOrder(root, {
    selector: "[role='tab']",
    getItems: () => ids.map((id) => ({ id })),
    onReorder,
  });
  const byId = (id: string) => root.querySelector(`#${id}`) as Element;
  return { root, onReorder, byId };
}

describe("observeDomOrder", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("calls onReorder when a registered element moves", async () => {
    const { root, onReorder, byId } = setup(["a", "b", "c"]);

    root.append(byId("a"));
    await flushMutations();

    expect(onReorder).toHaveBeenCalledTimes(1);
  });

  it("ignores inserts and removals that keep the registered order", async () => {
    const { root, onReorder, byId } = setup(["a", "b", "c"]);

    const unregistered = document.createElement("button");
    unregistered.id = "x";
    unregistered.setAttribute("role", "tab");
    root.prepend(unregistered);
    byId("b").remove();
    await flushMutations();

    expect(onReorder).not.toHaveBeenCalled();
  });
});
