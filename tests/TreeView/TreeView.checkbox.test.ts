import { render } from "@testing-library/svelte";
import { user } from "../utils/user";
import TreeViewCheckbox from "./TreeView.checkbox.test.svelte";

// Collapsed subtrees stay mounted, so accessible-name computation in jsdom
// picks up descendant text. Look rows up by id instead, matching the
// convention documented in TreeView.lazyLoad.test.ts.
function treeItemById(id: string): HTMLElement {
  const el = document.getElementById(id);
  expect.assert(el instanceof HTMLElement);
  return el;
}

// Click the checkbox wrapper; row clicks outside it do not toggle.
function checkboxFor(id: string): HTMLElement {
  const el = treeItemById(id).querySelector(".bx--checkbox-wrapper");
  expect.assert(el instanceof HTMLElement);
  return el;
}

// The checkbox label contributes empty text nodes, so compare the words the
// tree renders rather than the exact whitespace. Type-ahead trims before it
// matches, so this is the property it depends on.
function normalizeText(text: string | null): string {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

describe("TreeView selectionMode=checkbox", () => {
  it("checks every descendant when a branch is checked", async () => {
    render(TreeViewCheckbox);

    await user.click(checkboxFor("analytics"));

    expect(treeItemById("analytics")).toHaveAttribute("aria-checked", "true");
    expect(treeItemById("spark")).toHaveAttribute("aria-checked", "true");
    expect(treeItemById("hadoop")).toHaveAttribute("aria-checked", "true");
    expect(treeItemById("analytics")).not.toHaveAttribute("aria-selected");
  });

  it("flips the branch to mixed when one child is unchecked", async () => {
    render(TreeViewCheckbox);

    await user.click(checkboxFor("analytics"));
    await user.click(checkboxFor("spark"));

    expect(treeItemById("analytics")).toHaveAttribute("aria-checked", "mixed");
    expect(treeItemById("spark")).toHaveAttribute("aria-checked", "false");
    expect(treeItemById("hadoop")).toHaveAttribute("aria-checked", "true");
  });

  it("skips disabled descendants without blocking the branch", async () => {
    render(TreeViewCheckbox);

    await user.click(checkboxFor("analytics"));

    expect(treeItemById("legacy")).toHaveAttribute("aria-checked", "false");
    expect(treeItemById("analytics")).toHaveAttribute("aria-checked", "true");
  });

  it('leaves ancestors untouched with checkMode="node"', async () => {
    render(TreeViewCheckbox, { checkMode: "node" });

    await user.click(checkboxFor("spark"));

    expect(treeItemById("spark")).toHaveAttribute("aria-checked", "true");
    expect(treeItemById("hadoop")).toHaveAttribute("aria-checked", "false");
    expect(treeItemById("analytics")).toHaveAttribute("aria-checked", "false");
  });

  it("renders no checkbox on a link node", () => {
    render(TreeViewCheckbox);

    expect(treeItemById("docs").querySelector(".bx--checkbox")).toBeNull();
    expect(treeItemById("spark").querySelector(".bx--checkbox")).not.toBeNull();
  });

  it("keeps row text unchanged so type-ahead still matches", async () => {
    const highlight = render(TreeViewCheckbox, { selectionMode: "highlight" });
    const highlightText = normalizeText(highlight.container.textContent);
    highlight.unmount();

    const checkbox = render(TreeViewCheckbox);
    expect(normalizeText(checkbox.container.textContent)).toBe(highlightText);

    treeItemById("analytics").focus();
    await user.keyboard("h");

    expect(treeItemById("hadoop")).toHaveFocus();
  });

  it("ignores multiselect gestures in favor of per-node checks", async () => {
    render(TreeViewCheckbox, { multiselect: true });

    await user.click(checkboxFor("spark"));
    await user.click(checkboxFor("hadoop"));

    expect(treeItemById("spark")).toHaveAttribute("aria-checked", "true");
    expect(treeItemById("hadoop")).toHaveAttribute("aria-checked", "true");
  });

  it("fires check:change once per gesture with the derived state", async () => {
    const onCheckChange = vi.fn();
    render(TreeViewCheckbox, { onCheckChange });

    await user.click(checkboxFor("spark"));

    await vi.waitFor(() => expect(onCheckChange).toHaveBeenCalledTimes(1));
    expect(onCheckChange).toHaveBeenLastCalledWith({
      checkedIds: ["spark"],
      added: ["spark"],
      removed: [],
      indeterminateIds: ["analytics"],
    });

    await user.click(checkboxFor("hadoop"));

    await vi.waitFor(() => expect(onCheckChange).toHaveBeenCalledTimes(2));
    expect(onCheckChange).toHaveBeenLastCalledWith({
      checkedIds: ["analytics", "spark", "hadoop"],
      added: ["analytics", "hadoop"],
      removed: [],
      indeterminateIds: [],
    });
  });
});
