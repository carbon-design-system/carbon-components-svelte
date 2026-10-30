import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import { treeItemById } from "../utils/tree-item-by-id";
import { user } from "../utils/user";
import TreeViewCheckbox from "./TreeView.checkbox.test.svelte";
import { checkboxFor } from "./helpers";

// Collapsed subtrees stay mounted, so accessible-name computation in jsdom
// picks up descendant text. Look rows up by id instead, matching the
// convention documented in TreeView.lazyLoad.test.ts.

// The checkbox label contributes empty text nodes, so compare the words the
// tree renders rather than the exact whitespace. Type-ahead trims before it
// matches, so this is the property it depends on.
function normalizeText(text: string | null): string {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

describe.each([
  ["plain", {}],
  ["virtual", { virtualize: { maxVisibleRows: 10 }, padding: 80 }],
])("TreeView selectionMode=checkbox (%s)", (_variant, variantProps) => {
  it("flips the branch to mixed when one child is unchecked", async () => {
    render(TreeViewCheckbox, variantProps);

    await user.click(checkboxFor("analytics"));
    await user.click(checkboxFor("spark"));

    expect(treeItemById("analytics")).toHaveAttribute("aria-checked", "mixed");
    expect(treeItemById("spark")).toHaveAttribute("aria-checked", "false");
    expect(treeItemById("hadoop")).toHaveAttribute("aria-checked", "true");
  });

  it("marks the parent mixed and binds indeterminateIds for initial checkedIds", () => {
    const { component } = render(TreeViewCheckbox, {
      ...variantProps,
      checkedIds: ["spark"],
    });

    expect(treeItemById("spark")).toHaveAttribute("aria-checked", "true");
    expect(treeItemById("analytics")).toHaveAttribute("aria-checked", "mixed");
    expect(component.indeterminateIds).toEqual(["analytics"]);
  });

  it("checks the enabled descendants of an initially checked branch", () => {
    render(TreeViewCheckbox, { ...variantProps, checkedIds: ["analytics"] });

    expect(treeItemById("spark")).toHaveAttribute("aria-checked", "true");
    expect(treeItemById("hadoop")).toHaveAttribute("aria-checked", "true");
  });

  it("checks the node and its parent state when showNode runs", async () => {
    const { component } = render(TreeViewCheckbox, variantProps);

    component.showNode("spark", { focus: false });
    await tick();

    expect(treeItemById("spark")).toHaveAttribute("aria-checked", "true");
    expect(treeItemById("analytics")).toHaveAttribute("aria-checked", "mixed");
  });

  it('leaves ancestors untouched with checkMode="node"', async () => {
    render(TreeViewCheckbox, { ...variantProps, checkMode: "node" });

    await user.click(checkboxFor("spark"));

    expect(treeItemById("spark")).toHaveAttribute("aria-checked", "true");
    expect(treeItemById("hadoop")).toHaveAttribute("aria-checked", "false");
    expect(treeItemById("analytics")).toHaveAttribute("aria-checked", "false");
  });
});

describe("TreeView selectionMode=checkbox", () => {
  it("checks every descendant when a branch is checked", async () => {
    render(TreeViewCheckbox);

    await user.click(checkboxFor("analytics"));

    expect(treeItemById("analytics")).toHaveAttribute("aria-checked", "true");
    expect(treeItemById("spark")).toHaveAttribute("aria-checked", "true");
    expect(treeItemById("hadoop")).toHaveAttribute("aria-checked", "true");
    expect(treeItemById("analytics")).not.toHaveAttribute("aria-selected");
  });

  it("skips disabled descendants without blocking the branch", async () => {
    render(TreeViewCheckbox);

    await user.click(checkboxFor("analytics"));

    expect(treeItemById("legacy")).toHaveAttribute("aria-checked", "false");
    expect(treeItemById("analytics")).toHaveAttribute("aria-checked", "true");
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

  it("fires check with the live checked state of the clicked node", async () => {
    const onCheck = vi.fn();
    render(TreeViewCheckbox, { onCheck });

    await user.click(checkboxFor("spark"));
    expect(onCheck).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "spark", checked: true }),
    );

    await user.click(checkboxFor("spark"));
    expect(onCheck).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "spark", checked: false }),
    );
  });

  it("fires select for a link row and leaves checkedIds unchanged", async () => {
    const onSelect = vi.fn();
    const { component } = render(TreeViewCheckbox, {
      onSelect,
      checkedIds: ["spark"],
    });

    const docs = treeItemById("docs");
    docs.addEventListener("click", (event) => event.preventDefault());
    await user.click(docs);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "docs" }),
    );
    expect(component.checkedIds).toEqual(["spark"]);
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

  describe("saved checks under a lazy parent", () => {
    const lazyNodes = [
      { id: "loaded", text: "Loaded", nodes: [{ id: "x", text: "X" }] },
      { id: "lazy", text: "Lazy", hasChildren: true },
    ];

    it.each([
      ["deep", ["loaded", "x", "lazy-1"]],
      ["node", ["x", "lazy-1"]],
    ] as const)(
      "keeps them while it has not loaded (checkMode=%s)",
      async (checkMode, expected) => {
        const onCheckChange = vi.fn();
        const { component } = render(TreeViewCheckbox, {
          nodes: lazyNodes,
          checkMode,
          checkedIds: ["lazy-1", "x"],
          onCheckChange,
        });
        await tick();

        expect(component.checkedIds).toEqual(expected);
        for (const call of onCheckChange.mock.calls) {
          expect(call[0].removed).toEqual([]);
        }
      },
    );

    it("resolves them once the children load", async () => {
      const { component, rerender } = render(TreeViewCheckbox, {
        nodes: lazyNodes,
        checkedIds: ["lazy-1"],
      });
      expect(component.checkedIds).toEqual(["lazy-1"]);

      await rerender({
        nodes: [
          lazyNodes[0],
          {
            id: "lazy",
            text: "Lazy",
            hasChildren: true,
            nodes: [
              { id: "lazy-1", text: "Lazy 1" },
              { id: "lazy-2", text: "Lazy 2" },
            ],
          },
        ],
      });

      expect(component.checkedIds).toEqual(["lazy-1"]);
      expect(component.indeterminateIds).toEqual(["lazy"]);
    });

    it("drops an unknown id once every parent has loaded", async () => {
      const { component } = render(TreeViewCheckbox, {
        nodes: [lazyNodes[0]],
        checkedIds: ["gone", "x"],
      });
      await tick();

      expect(component.checkedIds).toEqual(["loaded", "x"]);
    });
  });
});
