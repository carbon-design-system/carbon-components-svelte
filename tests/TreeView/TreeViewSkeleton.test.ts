import { render } from "@testing-library/svelte";
import TreeViewSkeleton from "carbon-components-svelte/TreeView/TreeViewSkeleton.svelte";

describe("TreeViewSkeleton", () => {
  it("draws four rows by default", () => {
    const { container } = render(TreeViewSkeleton);
    const tree = container.querySelector(".bx--tree");
    expect(tree).toHaveClass("bx--skeleton", "bx--tree--default");
    expect(tree?.querySelectorAll(".bx--tree-node")).toHaveLength(4);
  });

  it("takes the count and size of its tree view", () => {
    const { container } = render(TreeViewSkeleton, {
      props: { count: 6, size: "compact" },
    });
    const tree = container.querySelector(".bx--tree");
    expect(tree).toHaveClass("bx--tree--compact");
    expect(tree?.querySelectorAll(".bx--tree-node")).toHaveLength(6);
  });

  it("draws a label bar unless hideLabel", () => {
    const { container } = render(TreeViewSkeleton);
    expect(container.querySelector(".bx--label.bx--skeleton")).not.toBeNull();

    const hidden = render(TreeViewSkeleton, { props: { hideLabel: true } });
    expect(hidden.container.querySelector(".bx--label")).toBeNull();
  });
});
