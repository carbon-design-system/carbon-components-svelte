import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import TreeViewPerformance from "./TreeView.performance.test.svelte";

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
});
