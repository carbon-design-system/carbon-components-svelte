import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { findRowById, treeItemById } from "../utils/tree-item-by-id";
import { user } from "../utils/user";
import { checkboxFor } from "./helpers";
import TreeViewCheckbox from "./TreeView.checkbox.test.svelte";

const virtualProps = { virtualize: { maxVisibleRows: 10 }, padding: 80 };

describe("TreeView virtualize + selectionMode=checkbox", () => {
  it("renders checkboxes on windowed rows with correct ARIA", () => {
    render(TreeViewCheckbox, virtualProps);

    expect(
      treeItemById("analytics").querySelector(".bx--checkbox"),
    ).not.toBeNull();
    expect(treeItemById("spark").querySelector(".bx--checkbox")).not.toBeNull();
    expect(treeItemById("analytics")).toHaveAttribute("aria-checked", "false");
    expect(treeItemById("analytics")).not.toHaveAttribute("aria-selected");
    // Link rows still skip the checkbox in the virtual path.
    expect(treeItemById("docs").querySelector(".bx--checkbox")).toBeNull();
  });

  it("checks every descendant when a branch checkbox is clicked", async () => {
    render(TreeViewCheckbox, virtualProps);

    await user.click(checkboxFor("analytics"));

    expect(treeItemById("analytics")).toHaveAttribute("aria-checked", "true");
    expect(treeItemById("spark")).toHaveAttribute("aria-checked", "true");
    expect(treeItemById("hadoop")).toHaveAttribute("aria-checked", "true");
    expect(treeItemById("legacy")).toHaveAttribute("aria-checked", "false");
  });

  it("does not toggle when the row body is clicked", async () => {
    render(TreeViewCheckbox, virtualProps);

    await user.click(treeItemById("spark"));

    expect(treeItemById("spark")).toHaveAttribute("aria-checked", "false");
  });

  it("toggles with Space without expanding, and Enter expands parents", async () => {
    render(TreeViewCheckbox, virtualProps);

    const analytics = treeItemById("analytics");
    analytics.focus();
    expect(analytics).toHaveAttribute("aria-expanded", "true");

    await user.keyboard(" ");
    expect(analytics).toHaveAttribute("aria-checked", "true");
    expect(analytics).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Enter}");
    expect(analytics).toHaveAttribute("aria-expanded", "false");
    expect(analytics).toHaveAttribute("aria-checked", "false");
  });

  it("preserves checked state when the row scrolls out and back in", async () => {
    render(TreeViewCheckbox, virtualProps);

    await user.click(checkboxFor("spark"));
    expect(treeItemById("spark")).toHaveAttribute("aria-checked", "true");

    const tree = screen.getByRole("tree");
    // Scroll far enough that the interactive subtree leaves the window.
    tree.scrollTop = 2000;
    tree.dispatchEvent(new Event("scroll"));
    await tick();

    expect(findRowById("spark")).toBeNull();

    tree.scrollTop = 0;
    tree.dispatchEvent(new Event("scroll"));
    await tick();

    expect(treeItemById("spark")).toHaveAttribute("aria-checked", "true");
    expect(treeItemById("analytics")).toHaveAttribute("aria-checked", "mixed");
  });
});
