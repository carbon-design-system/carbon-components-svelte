import { render } from "@testing-library/svelte";
import { treeItemById } from "../utils/tree-item-by-id";
import { user } from "../utils/user";
import TreeView from "./TreeView.typeahead.test.svelte";

describe("TreeView type-ahead", () => {
  it("moves focus to the next visible node whose label starts with a digit", async () => {
    render(TreeView);

    const cantaloupe = treeItemById(4);
    cantaloupe.focus();

    await user.keyboard("4");

    expect(treeItemById(5)).toHaveFocus();
  });

  it("skips disabled nodes", async () => {
    render(TreeView);

    // "Cherry" (disabled) sits between "Banana" and "Cantaloupe"; a "c"
    // search from "Banana" must land on "Cantaloupe", not "Cherry".
    const banana = treeItemById(1);
    banana.focus();

    await user.keyboard("c");

    expect(treeItemById(4)).toHaveFocus();
  });

  it("does not match nodes inside a collapsed branch", async () => {
    render(TreeView);

    const apple = treeItemById(0);
    apple.focus();

    // "b" matches "Banana" and moves focus there. The buffered "bo" that
    // follows only matches "Banana"'s collapsed child "Boat", which isn't
    // a valid target while hidden, so focus should stay on "Banana".
    await user.keyboard("bo");

    expect(treeItemById(1)).toHaveFocus();
  });

  it("ignores modifier+letter combinations", async () => {
    render(TreeView);

    const apple = treeItemById(0);
    apple.focus();

    await user.keyboard("{Control>}b{/Control}");

    expect(apple).toHaveFocus();
  });
});
