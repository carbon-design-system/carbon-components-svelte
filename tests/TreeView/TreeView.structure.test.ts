import { render } from "@testing-library/svelte";
import TreeView from "../../src/TreeView/TreeView.svelte";

const nodes = [
  { id: 0, text: "Root A" },
  {
    id: 1,
    text: "Root B",
    nodes: [
      {
        id: 2,
        text: "Folder",
        nodes: [
          { id: 3, text: "File 1" },
          { id: 4, text: "File 2" },
          { id: 5, text: "File 3" },
        ],
      },
    ],
  },
  { id: 6, text: "Lazy", hasChildren: true },
];

const ids = (list: ReadonlyArray<{ id: string | number }>) =>
  list.map((node) => node.id);

describe("TreeView structural queries", () => {
  it("getParent returns the parent node, or null for roots and unknown ids", () => {
    const { component } = render(TreeView, { nodes });

    expect(component.getParent(4)).toMatchObject({ id: 2, text: "Folder" });
    expect(component.getParent(2)).toMatchObject({ id: 1 });
    expect(component.getParent(1)).toBeNull();
    expect(component.getParent(999)).toBeNull();
  });

  it("getChildren returns loaded children in order", () => {
    const { component } = render(TreeView, { nodes });

    expect(ids(component.getChildren(2))).toEqual([3, 4, 5]);
    expect(component.getChildren(3)).toEqual([]);
    expect(component.getChildren(6)).toEqual([]);
    expect(component.getChildren(999)).toEqual([]);
  });

  it("getAncestors returns nodes from the top level down to the parent", () => {
    const { component } = render(TreeView, { nodes });

    expect(ids(component.getAncestors(4))).toEqual([1, 2]);
    expect(component.getAncestors(1)).toEqual([]);
    expect(component.getAncestors(999)).toEqual([]);
  });

  it("getSiblings excludes the node itself and treats roots as siblings", () => {
    const { component } = render(TreeView, { nodes });

    expect(ids(component.getSiblings(4))).toEqual([3, 5]);
    expect(ids(component.getSiblings(0))).toEqual([1, 6]);
    expect(component.getSiblings(999)).toEqual([]);
  });

  it("reflects a reassigned nodes prop", async () => {
    const { component, rerender } = render(TreeView, { nodes });

    await rerender({
      nodes: [{ id: 1, text: "Root B", nodes: [{ id: 7, text: "New" }] }],
    });

    expect(component.getParent(7)).toMatchObject({ id: 1 });
    expect(component.getParent(4)).toBeNull();
  });
});
