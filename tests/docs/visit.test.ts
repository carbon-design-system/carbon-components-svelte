// @vitest-environment node
import { type Node, type Parent, visit } from "../../docs/scripts/visit";

describe("visit", () => {
  it("visits a type's nodes in document order, after earlier rewrites", () => {
    const tree: Parent = {
      type: "root",
      children: [
        { type: "paragraph", children: [{ type: "html" }] },
        { type: "blockquote", children: [{ type: "html" }] },
        { type: "html" },
      ] as Node[],
    };
    // Replace the blockquote's children before the walk reaches them.
    visit(tree, "blockquote", (node: Parent) => {
      node.children = [{ type: "html" }, { type: "html" }];
    });
    const seen: string[] = [];
    visit(tree, "html", (_node, index, parent) => {
      seen.push(`${parent?.type}[${index}]`);
    });
    expect(seen).toEqual([
      "paragraph[0]",
      "blockquote[0]",
      "blockquote[1]",
      "root[2]",
    ]);
  });
});
