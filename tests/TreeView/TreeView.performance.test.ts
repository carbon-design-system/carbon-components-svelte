import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../setup-tests";
import TreeViewPerformance from "./TreeView.performance.test.svelte";
import TreeView from "./TreeView.test.svelte";

describe("TreeView Performance Optimizations", () => {
  it("maintains TreeWalker functionality after prop changes", async () => {
    const { rerender } = render(TreeViewPerformance);

    const firstItem = screen.getByRole("treeitem", {
      name: /AI \/ Machine learning/,
    });
    firstItem.focus();

    await rerender({ selectedIds: [0] });
    await tick();
    await rerender({ expandedIds: [1] });
    await tick();

    await user.keyboard("{ArrowDown}");
    const analyticsItems = screen.getAllByRole("treeitem", {
      name: /Analytics/,
      selected: false,
    });
    const secondItem = analyticsItems[0];
    expect(secondItem).toHaveFocus();
  });

  it("handles nodes prop changes correctly", async () => {
    const { rerender } = render(TreeViewPerformance, {
      nodes: [{ id: 0, text: "Node 1" }],
    });

    expect(screen.getByText("Node 1")).toBeInTheDocument();

    await rerender({
      nodes: [
        { id: 0, text: "Node 1" },
        { id: 1, text: "Node 2" },
      ],
    });
    await tick();

    expect(screen.getByText("Node 1")).toBeInTheDocument();
    expect(screen.getByText("Node 2")).toBeInTheDocument();
  });

  it("correctly collapses nodes using Set-based lookup", async () => {
    render(TreeView);

    const expandAllButton = screen.getByText("Expand all");
    await user.click(expandAllButton);

    const initialExpanded = screen.queryAllByRole("treeitem", {
      expanded: true,
    });
    expect(initialExpanded.length).toBeGreaterThan(0);

    const collapseSomeNodesButton = screen.getByText("Collapse some nodes");
    await user.click(collapseSomeNodesButton);

    const afterCollapse = screen.queryAllByRole("treeitem", {
      expanded: true,
    });
    expect(afterCollapse.length).toBeLessThan(initialExpanded.length);
  });

  it("handles rapid prop changes gracefully", async () => {
    const { rerender } = render(TreeViewPerformance);

    for (let i = 0; i < 5; i++) {
      // biome-ignore lint/performance/noAwaitInLoops: sequential execution is intentional
      await rerender({ selectedIds: [i] });
      await tick();
      await rerender({ expandedIds: [i] });
      await tick();
    }

    const firstItem = screen.getByRole("treeitem", {
      name: /AI \/ Machine learning/,
    });
    expect(firstItem).toBeInTheDocument();
  });
});
