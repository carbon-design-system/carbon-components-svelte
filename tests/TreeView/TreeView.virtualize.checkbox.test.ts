import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import TreeViewVirtualizeCheckbox from "./TreeView.virtualize.checkbox.test.svelte";

function treeItemById(id: string): HTMLElement {
  const el = document.getElementById(id);
  expect.assert(el instanceof HTMLElement);
  return el;
}

function checkboxFor(id: string): HTMLElement {
  const el = treeItemById(id).querySelector(".bx--checkbox-wrapper");
  expect.assert(el instanceof HTMLElement);
  return el;
}

describe("TreeView virtualize + selectionMode=checkbox", () => {
  it("renders checkboxes on windowed rows with correct ARIA", () => {
    render(TreeViewVirtualizeCheckbox);

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
    render(TreeViewVirtualizeCheckbox);

    await user.click(checkboxFor("analytics"));

    expect(treeItemById("analytics")).toHaveAttribute("aria-checked", "true");
    expect(treeItemById("spark")).toHaveAttribute("aria-checked", "true");
    expect(treeItemById("hadoop")).toHaveAttribute("aria-checked", "true");
    expect(treeItemById("legacy")).toHaveAttribute("aria-checked", "false");
  });

  it("does not toggle when the row body is clicked", async () => {
    render(TreeViewVirtualizeCheckbox);

    await user.click(treeItemById("spark"));

    expect(treeItemById("spark")).toHaveAttribute("aria-checked", "false");
  });

  it("flips the branch to mixed when one child is unchecked", async () => {
    render(TreeViewVirtualizeCheckbox);

    await user.click(checkboxFor("analytics"));
    await user.click(checkboxFor("spark"));

    expect(treeItemById("analytics")).toHaveAttribute("aria-checked", "mixed");
    expect(treeItemById("spark")).toHaveAttribute("aria-checked", "false");
    expect(treeItemById("hadoop")).toHaveAttribute("aria-checked", "true");
  });

  it('leaves ancestors untouched with checkMode="node"', async () => {
    render(TreeViewVirtualizeCheckbox, { checkMode: "node" });

    await user.click(checkboxFor("spark"));

    expect(treeItemById("spark")).toHaveAttribute("aria-checked", "true");
    expect(treeItemById("hadoop")).toHaveAttribute("aria-checked", "false");
    expect(treeItemById("analytics")).toHaveAttribute("aria-checked", "false");
  });

  it("toggles with Space without expanding, and Enter expands parents", async () => {
    render(TreeViewVirtualizeCheckbox);

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
    render(TreeViewVirtualizeCheckbox);

    await user.click(checkboxFor("spark"));
    expect(treeItemById("spark")).toHaveAttribute("aria-checked", "true");

    const tree = screen.getByRole("tree");
    // Scroll far enough that the interactive subtree leaves the window.
    tree.scrollTop = 2000;
    tree.dispatchEvent(new Event("scroll"));
    await tick();

    expect(document.getElementById("spark")).toBeNull();

    tree.scrollTop = 0;
    tree.dispatchEvent(new Event("scroll"));
    await tick();

    expect(treeItemById("spark")).toHaveAttribute("aria-checked", "true");
    expect(treeItemById("analytics")).toHaveAttribute("aria-checked", "mixed");
  });

  it("fires check:change once per gesture with the derived state", async () => {
    const onCheckChange = vi.fn();
    render(TreeViewVirtualizeCheckbox, { onCheckChange });

    await user.click(checkboxFor("spark"));

    await vi.waitFor(() => expect(onCheckChange).toHaveBeenCalledTimes(1));
    expect(onCheckChange).toHaveBeenLastCalledWith({
      checkedIds: ["spark"],
      added: ["spark"],
      removed: [],
      indeterminateIds: ["analytics"],
    });
  });
});
