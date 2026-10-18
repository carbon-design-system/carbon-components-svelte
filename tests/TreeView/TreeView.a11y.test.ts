import { render, screen } from "@testing-library/svelte";
import TreeViewComponent from "carbon-components-svelte/TreeView/TreeView.svelte";
import { treeItemById } from "../utils/tree-item-by-id";
import { user } from "../utils/user";
import TreeView from "./TreeView.test.svelte";
import TreeViewTypeahead from "./TreeView.typeahead.test.svelte";

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

describe("TreeView type-ahead cycling", () => {
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

describe("TreeView type-ahead", () => {
  it("moves focus to the next visible node whose label starts with a digit", async () => {
    render(TreeViewTypeahead);

    const cantaloupe = treeItemById(4);
    cantaloupe.focus();

    await user.keyboard("4");

    expect(treeItemById(5)).toHaveFocus();
  });

  it("skips disabled nodes", async () => {
    render(TreeViewTypeahead);

    // "Cherry" (disabled) sits between "Banana" and "Cantaloupe"; a "c"
    // search from "Banana" must land on "Cantaloupe", not "Cherry".
    const banana = treeItemById(1);
    banana.focus();

    await user.keyboard("c");

    expect(treeItemById(4)).toHaveFocus();
  });

  it("does not match nodes inside a collapsed branch", async () => {
    render(TreeViewTypeahead);

    const apple = treeItemById(0);
    apple.focus();

    // "b" matches "Banana" and moves focus there. The buffered "bo" that
    // follows only matches "Banana"'s collapsed child "Boat", which isn't
    // a valid target while hidden, so focus should stay on "Banana".
    await user.keyboard("bo");

    expect(treeItemById(1)).toHaveFocus();
  });

  it("ignores modifier+letter combinations", async () => {
    render(TreeViewTypeahead);

    const apple = treeItemById(0);
    apple.focus();

    await user.keyboard("{Control>}b{/Control}");

    expect(apple).toHaveFocus();
  });
});

describe("TreeView consumer labelling", () => {
  it("falls back to the visible label", () => {
    render(TreeViewComponent, { props: { labelText: "Files", nodes: [] } });

    expect(screen.getByRole("tree")).toHaveAccessibleName("Files");
  });
});
