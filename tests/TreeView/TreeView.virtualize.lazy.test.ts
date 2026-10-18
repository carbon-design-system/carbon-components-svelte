import { render, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import { findRowById, treeItemById } from "../utils/tree-item-by-id";
import { user } from "../utils/user";
import TreeViewVirtualizeLazy from "./TreeView.virtualize.lazy.test.svelte";

describe("TreeView virtualize + hasChildren lazy load", () => {
  it("mounts fetched children as virtual rows after expand resolves", async () => {
    const { component } = render(TreeViewVirtualizeLazy);

    const root = treeItemById("root-a");
    const caret = root.querySelector<HTMLElement>(
      ".bx--tree-parent-node__toggle",
    );
    assert(caret instanceof HTMLElement);
    expect(root).toHaveAttribute("aria-expanded", "false");
    expect(findRowById("root-a-child-1")).toBeNull();
    await user.click(caret);
    await tick();

    expect(treeItemById("root-a__loading")).toHaveAttribute(
      "aria-disabled",
      "true",
    );

    component.resolveLoad();
    await waitFor(() => {
      expect(findRowById("root-a__loading")).toBeNull();
      expect(findRowById("root-a-child-1")).not.toBeNull();
      expect(findRowById("root-a-child-2")).not.toBeNull();
    });
    expect(treeItemById("root-a-child-1")).toHaveAttribute("aria-level", "2");
  });
});
