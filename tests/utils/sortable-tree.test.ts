import { applyTreeMove, sortableTree } from "../../src/utils/sortable-tree.js";
import type {
  SortableTreeOptions,
  TreeMoveDetail,
} from "../../src/utils/sortable-tree.js";

type Node = { id: string; text: string; nodes?: Node[] };

const tree = (): Node[] => [
  {
    id: "a",
    text: "Alpha",
    nodes: [
      { id: "a1", text: "Alpha one" },
      { id: "a2", text: "Alpha two" },
    ],
  },
  { id: "b", text: "Bravo" },
  { id: "c", text: "Charlie", nodes: [{ id: "c1", text: "Charlie one" }] },
];

const ids = (nodes: Node[]): unknown =>
  nodes.map((n) => (n.nodes ? [n.id, ids(n.nodes)] : n.id));

describe("applyTreeMove", () => {
  const move = (
    id: string,
    targetId: string,
    position: TreeMoveDetail["position"],
  ) => applyTreeMove(tree(), { id, targetId, position, source: "pointer" });

  it("moves a node before or after a sibling", () => {
    expect(ids(move("c", "a", "before"))).toEqual([
      ["c", ["c1"]],
      ["a", ["a1", "a2"]],
      "b",
    ]);
    expect(ids(move("a", "b", "after"))).toEqual([
      "b",
      ["a", ["a1", "a2"]],
      ["c", ["c1"]],
    ]);
  });

  it("moves a node inside another as its last child", () => {
    expect(ids(move("b", "a", "inside"))).toEqual([
      ["a", ["a1", "a2", "b"]],
      ["c", ["c1"]],
    ]);
  });

  it("reparents across levels", () => {
    expect(ids(move("a2", "b", "before"))).toEqual([
      ["a", ["a1"]],
      "a2",
      "b",
      ["c", ["c1"]],
    ]);
  });

  it("does not mutate its input", () => {
    const nodes = tree();
    const copy = JSON.stringify(nodes);
    applyTreeMove(nodes, {
      id: "b",
      targetId: "a",
      position: "inside",
      source: "keyboard",
    });
    expect(JSON.stringify(nodes)).toBe(copy);
  });

  it("leaves the nodes alone for an unknown id or a target inside the moved node", () => {
    expect(ids(move("zz", "a", "before"))).toEqual(ids(tree()));
    expect(ids(move("a", "a1", "inside"))).toEqual(ids(tree()));
    expect(ids(move("a", "a", "after"))).toEqual(ids(tree()));
  });
});

// The markup `TreeView` renders: a row is an `li`, its label a `div`, and a
// parent's children sit in a nested group.
function buildTree(nodes: Node[], expanded: string[] = ["a", "c"]) {
  const root = document.createElement("ul");
  root.setAttribute("role", "tree");
  const render = (list: Node[], parent: HTMLElement) => {
    for (const node of list) {
      const li = document.createElement("li");
      li.setAttribute("role", "treeitem");
      li.setAttribute("data-tree-row-id", node.id);
      const label = document.createElement("div");
      label.className = "bx--tree-node__label";
      const grip = document.createElement("button");
      grip.type = "button";
      label.append(grip, node.text);
      li.append(label);
      if (node.nodes) {
        li.setAttribute("aria-expanded", String(expanded.includes(node.id)));
        if (expanded.includes(node.id)) {
          const group = document.createElement("ul");
          group.setAttribute("role", "group");
          render(node.nodes, group);
          li.append(group);
        }
      }
      parent.append(li);
    }
  };
  render(nodes, root);
  document.body.append(root);
  return root;
}

const status = () =>
  document.querySelector("[role='status']")?.textContent?.replace(/​/g, "");

function press(target: Element, key: string, init: KeyboardEventInit = {}) {
  target.dispatchEvent(
    new KeyboardEvent("keydown", {
      key,
      bubbles: true,
      cancelable: true,
      ...init,
    }),
  );
}

describe("sortableTree", () => {
  const cleanups: Array<() => void> = [];

  function mount(
    root: HTMLElement,
    options: SortableTreeOptions = { handleSelector: "button" },
  ) {
    const action = sortableTree(root, options);
    cleanups.push(() => action.destroy());
    const moves: TreeMoveDetail[] = [];
    root.addEventListener("move", (event) =>
      moves.push((event as CustomEvent<TreeMoveDetail>).detail),
    );
    return { action, moves };
  }

  const grip = (root: HTMLElement, id: string) =>
    root.querySelector<HTMLElement>(
      `[data-tree-row-id="${id}"] > div > button`,
    )!;

  afterEach(() => {
    for (const cleanup of cleanups.splice(0)) cleanup();
    document.body.innerHTML = "";
  });

  it("names each handle and keeps it out of the tab order", () => {
    const root = buildTree(tree());
    mount(root);

    expect(grip(root, "b").getAttribute("aria-label")).toBe("Move Bravo");
    expect(grip(root, "b").getAttribute("aria-roledescription")).toBe(
      "movable item",
    );
    expect(grip(root, "b").getAttribute("tabindex")).toBe("-1");
    expect(
      root
        .querySelector("[data-tree-row-id='b']")
        ?.getAttribute("aria-keyshortcuts"),
    ).toBe("Alt+M");
  });

  it("steps through the places and drops with a cancelable move", () => {
    const root = buildTree(tree());
    const { moves } = mount(root);
    const handle = grip(root, "b");
    handle.focus();

    press(handle, " ");
    expect(status()).toBe("Picked up Bravo.");
    // Up from Bravo: after Alpha, then into the end of its group.
    press(handle, "ArrowUp");
    expect(status()).toBe("Bravo moved after Alpha.");
    press(handle, "ArrowUp");
    expect(status()).toBe("Bravo moved after Alpha two.");
    press(handle, "ArrowUp");
    expect(status()).toBe("Bravo moved inside Alpha two.");
    press(handle, " ");

    expect(moves).toEqual([
      { id: "b", targetId: "a2", position: "inside", source: "keyboard" },
    ]);
    expect(status()).toBe("Dropped Bravo inside Alpha two.");
  });

  it("can leave a group, and enter one as its first child", () => {
    const root = buildTree(tree());
    const { moves } = mount(root);
    const handle = grip(root, "a2");
    handle.focus();

    press(handle, " ");
    press(handle, "ArrowDown");
    // After Alpha two, outside its group: after Alpha.
    expect(status()).toBe("Alpha two moved after Alpha.");
    press(handle, " ");
    expect(moves.at(-1)).toMatchObject({ targetId: "a", position: "after" });
  });

  it("skips the places inside the moving row", () => {
    const root = buildTree(tree());
    mount(root);
    const handle = grip(root, "a");
    handle.focus();

    press(handle, " ");
    press(handle, "ArrowDown");
    // Past Alpha's own children to Bravo, not into them.
    expect(status()).toMatch(/^Alpha moved inside Bravo/);
  });

  it("cancels with Escape and says where the row is", () => {
    const root = buildTree(tree());
    const { moves } = mount(root);
    const handle = grip(root, "b");
    handle.focus();

    press(handle, " ");
    press(handle, "ArrowDown");
    press(document.body, "Escape");

    expect(moves).toEqual([]);
    expect(status()).toBe("Cancelled. Bravo is back in its place.");
  });

  it("does not report a move that is refused", () => {
    const root = buildTree(tree());
    const { moves } = mount(root);
    root.addEventListener("move", (event) => event.preventDefault());
    const handle = grip(root, "b");
    handle.focus();

    press(handle, " ");
    press(handle, "ArrowDown");
    press(handle, " ");

    expect(moves).toHaveLength(1);
    expect(status()).toMatch(/^Cancelled/);
  });

  it("skips places that canDrop vetoes", () => {
    const root = buildTree(tree());
    const { moves } = mount(root, {
      handleSelector: "button",
      canDrop: ({ targetId, position }) =>
        !(targetId === "a2" && position === "inside"),
    });
    const handle = grip(root, "b");
    handle.focus();

    press(handle, " ");
    press(handle, "ArrowUp");
    press(handle, "ArrowUp");
    press(handle, "ArrowUp");
    press(handle, " ");

    // "Inside Alpha two" is vetoed, so the third step passes it.
    expect(moves.at(-1)).toMatchObject({ targetId: "a1", position: "after" });
  });

  it("lifts a focused row with Alt+M and ignores a bare Space on it", () => {
    const root = buildTree(tree());
    const { moves } = mount(root);
    const row = root.querySelector<HTMLElement>("[data-tree-row-id='b']")!;
    row.setAttribute("tabindex", "0");
    row.focus();

    press(row, " ");
    expect(status()).toBe("");

    row.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "µ",
        code: "KeyM",
        altKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(status()).toBe("Picked up Bravo.");
    press(row, "ArrowDown");
    press(row, "Enter");
    expect(moves).toHaveLength(1);
  });

  it("removes what it added on destroy", () => {
    const root = buildTree(tree());
    const { action } = mount(root);
    const handle = grip(root, "b");
    handle.focus();
    press(handle, " ");

    action.destroy();

    expect(document.querySelector("[role='status']")).toBeNull();
    expect(handle.hasAttribute("aria-roledescription")).toBe(false);
    expect(handle.hasAttribute("aria-label")).toBe(false);
    expect(
      root
        .querySelector("[data-tree-row-id='b']")
        ?.hasAttribute("aria-keyshortcuts"),
    ).toBe(false);
  });
});
