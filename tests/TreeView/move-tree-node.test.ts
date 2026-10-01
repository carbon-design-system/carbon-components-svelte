// @vitest-environment node
import { moveTreeNode } from "../../src/utils/move-tree-node.js";

type Node = { id: string; nodes?: Node[] };

const tree: Node[] = [
  {
    id: "src",
    nodes: [
      { id: "button", nodes: [{ id: "button.svelte" }] },
      { id: "input" },
    ],
  },
  { id: "tests", nodes: [{ id: "button.test" }] },
  { id: "readme" },
];

/** Compact `id(children)` outline for readable assertions. */
function outline(list: ReadonlyArray<Node>): string {
  return list
    .map((node) =>
      node.nodes ? `${node.id}(${outline(node.nodes)})` : node.id,
    )
    .join(" ");
}

describe("moveTreeNode", () => {
  it("moves a node before or after a target", () => {
    expect(
      outline(
        moveTreeNode(tree, "readme", { target: "src", position: "before" }),
      ),
    ).toBe("readme src(button(button.svelte) input) tests(button.test)");
    expect(
      outline(
        moveTreeNode(tree, "input", { target: "tests", position: "after" }),
      ),
    ).toBe("src(button(button.svelte)) tests(button.test) input readme");
  });

  it("appends inside a target, creating its children array", () => {
    expect(
      outline(
        moveTreeNode(tree, "button.test", {
          target: "input",
          position: "inside",
        }),
      ),
    ).toBe("src(button(button.svelte) input(button.test)) tests() readme");
    expect(
      outline(
        moveTreeNode(tree, "readme", { target: "src", position: "inside" }),
      ),
    ).toBe("src(button(button.svelte) input readme) tests(button.test)");
  });

  it("moves several nodes in tree order, carrying descendants with ancestors", () => {
    const moved = moveTreeNode(tree, ["readme", "button.svelte", "button"], {
      target: "tests",
      position: "inside",
    });
    expect(outline(moved)).toBe(
      "src(input) tests(button.test button(button.svelte) readme)",
    );
  });

  it("keeps untouched subtrees by reference and does not mutate the input", () => {
    const snapshot = JSON.stringify(tree);
    const moved = moveTreeNode(tree, "readme", {
      target: "tests",
      position: "before",
    });
    expect(moved[0]).toBe(tree[0]);
    expect(moved[2]).toBe(tree[1]);
    expect(JSON.stringify(tree)).toBe(snapshot);
  });

  it("returns the input unchanged for invalid moves", () => {
    for (const [ids, target] of [
      ["missing", "src"],
      ["readme", "missing"],
      ["src", "src"],
      ["src", "button.svelte"],
      [["readme", "button"], "button.svelte"],
      [[], "src"],
    ] as const) {
      expect(moveTreeNode(tree, ids, { target, position: "inside" })).toBe(
        tree,
      );
    }
  });
});
