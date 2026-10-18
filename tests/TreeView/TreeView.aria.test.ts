import { render } from "@testing-library/svelte";
import { treeItemById } from "../utils/tree-item-by-id";
import { user } from "../utils/user";
import TreeView from "./TreeView.test.svelte";

describe("TreeView WAI-ARIA completeness", () => {
  it("sets aria-level, aria-posinset, and aria-setsize on root-level nodes", () => {
    render(TreeView);

    // Top-level nodes: AI/ML(0), Analytics(1), Blockchain(7), Databases(9), Integration(14)
    const aiItem = treeItemById(0);
    expect(aiItem).toHaveAttribute("aria-level", "1");
    expect(aiItem).toHaveAttribute("aria-posinset", "1");
    expect(aiItem).toHaveAttribute("aria-setsize", "5");

    const analyticsItem = treeItemById(1);
    expect(analyticsItem).toHaveAttribute("aria-level", "1");
    expect(analyticsItem).toHaveAttribute("aria-posinset", "2");
    expect(analyticsItem).toHaveAttribute("aria-setsize", "5");
  });

  it("sets aria-level, aria-posinset, and aria-setsize on nested nodes", async () => {
    render(TreeView);

    const analyticsToggle = treeItemById(1).querySelector(
      ".bx--tree-parent-node__toggle",
    );
    assert(analyticsToggle instanceof HTMLElement);
    await user.click(analyticsToggle);

    // Analytics' children: IBM Analytics Engine(2), IBM Cloud SQL Query(5), IBM Db2 Warehouse(6)
    const engineItem = treeItemById(2);
    expect(engineItem).toHaveAttribute("aria-level", "2");
    expect(engineItem).toHaveAttribute("aria-posinset", "1");
    expect(engineItem).toHaveAttribute("aria-setsize", "3");

    const db2Item = treeItemById(6);
    expect(db2Item).toHaveAttribute("aria-level", "2");
    expect(db2Item).toHaveAttribute("aria-posinset", "3");
    expect(db2Item).toHaveAttribute("aria-setsize", "3");
  });
});

describe("TreeView type-ahead", () => {
  it("cycles through repeated-character matches like native <select> type-ahead", async () => {
    render(TreeView);

    const aiItem = treeItemById(0);
    aiItem.focus();

    await user.keyboard("a");
    const analyticsItem = treeItemById(1);
    expect(analyticsItem).toHaveFocus();

    await user.keyboard("a");
    expect(aiItem).toHaveFocus();
  });
});
