import { render, screen, within } from "@testing-library/svelte";
import type TreeViewComponent from "carbon-components-svelte/TreeView/TreeView.svelte";
import type { TreeNode } from "carbon-components-svelte/TreeView/TreeView.svelte";
import type TreeViewNodeComponent from "carbon-components-svelte/TreeView/TreeViewNode.svelte";
import { findParentTreeNode } from "carbon-components-svelte/TreeView/TreeViewNode.svelte";
import type TreeViewNodeListComponent from "carbon-components-svelte/TreeView/TreeViewNodeList.svelte";
import type { ComponentEvents, ComponentProps } from "svelte";
import { tick } from "svelte";
import { findRowById, treeItemById } from "../utils/tree-item-by-id";
import { user } from "../utils/user";
import { getAllExpandedItems } from "./helpers";
import TreeViewAutoCollapse from "./TreeView.autoCollapse.test.svelte";
import TreeViewHierarchy from "./TreeView.hierarchy.test.svelte";
import TreeViewHref from "./TreeView.href.test.svelte";
import TreeViewMultiselect from "./TreeView.multiselect.test.svelte";
import TreeViewPerformance from "./TreeView.performance.test.svelte";
import TreeViewProps from "./TreeView.props.test.svelte";
import TreeViewSlot from "./TreeView.slot.test.svelte";
import TreeView from "./TreeView.test.svelte";
import TreeViewDuplicateIds from "./TreeViewDuplicateIds.test.svelte";
import TreeViewGenerics from "./TreeViewGenerics.test.svelte";

/**
 * Primary row label: parent markup uses `.bx--tree-node__label__text`.
 * Leaves use `.bx--tree-node__label` only (#3007).
 */
function treeitemPrimaryLabel(el: HTMLElement): string {
  const labelled = el.querySelector(".bx--tree-node__label__text");
  if (labelled?.textContent) {
    return labelled.textContent.replace(/\s+/g, " ").trim();
  }
  const label = el.querySelector(".bx--tree-node__label");
  return label?.textContent?.replace(/\s+/g, " ").trim() ?? "";
}

/**
 * `getByRole({ name })` matches descendant text (#3007).
 * Pick the expandable parent row.
 */
function getNamedParentTreeitem(name: RegExp): HTMLElement {
  const found = screen
    .getAllByRole("treeitem", { name })
    .find(
      (n) =>
        n instanceof HTMLElement &&
        n.classList.contains("bx--tree-parent-node"),
    );
  assert(found instanceof HTMLElement);
  return found;
}

describe("TreeView", () => {
  const noExpandedItems = () => {
    expect(screen.queryAllByRole("treeitem", { expanded: true })).toHaveLength(
      0,
    );
  };

  const getItemByName = (name: string | RegExp) =>
    screen.getByRole("treeitem", { name });

  it("can select a node", async () => {
    const onSelect = vi.fn();
    const onSelectedIds = vi.fn();

    render(TreeView, { onSelect, onSelectedIds });

    const firstItem = treeItemById(0);
    expect(firstItem).toBeInTheDocument();

    await user.click(firstItem);
    expect(firstItem).toHaveAttribute("aria-selected", "true");
    expect(onSelectedIds).toBeCalledWith([0]);
    expect(onSelect).toBeCalledWith({
      checked: false,
      disabled: false,
      expanded: false,
      icon: expect.anything(),
      id: 0,
      indeterminate: false,
      leaf: true,
      selected: true,
      text: "AI / Machine learning",
    });
  });

  it("moves selection to the newly active node", async () => {
    render(TreeView);

    const firstItem = treeItemById(0);
    await user.click(firstItem);
    expect(firstItem).toHaveAttribute("aria-selected", "true");

    const secondItem = treeItemById(1);
    await user.click(secondItem);
    expect(secondItem).toHaveAttribute("aria-selected", "true");
    expect(firstItem).toHaveAttribute("aria-selected", "false");
  });

  it("can expand all nodes", async () => {
    render(TreeView);

    noExpandedItems();

    const expandAllButton = screen.getByText("Expand all");
    await user.click(expandAllButton);

    expect(getAllExpandedItems()).toHaveLength(5);
  });

  it("expandNodes() with no arguments expands all nodes", async () => {
    render(TreeView);

    noExpandedItems();

    const expandNodesButton = screen.getByText("Expand nodes (no filter)");
    await user.click(expandNodesButton);

    expect(getAllExpandedItems()).toHaveLength(5);
  });

  it("can expand some nodes", async () => {
    render(TreeView);

    noExpandedItems();

    const expandSomeNodesButton = screen.getByText("Expand some nodes");
    await user.click(expandSomeNodesButton);

    expect(getAllExpandedItems()).toHaveLength(2);

    const tree = screen.getByRole("tree");
    const expandedItems = within(tree).getAllByRole("treeitem", {
      expanded: true,
    });
    expect(
      expandedItems.some((el) =>
        el.textContent?.includes("IBM Analytics Engine"),
      ),
    ).toBe(true);
  });

  it("can collapse all nodes", async () => {
    render(TreeView);

    const expandAllButton = screen.getByText("Expand all");
    await user.click(expandAllButton);
    expect(getAllExpandedItems().length).toBeGreaterThan(0);

    const collapseAllButton = screen.getByText("Collapse all");
    await user.click(collapseAllButton);

    noExpandedItems();
  });

  it("can collapse some nodes", async () => {
    render(TreeView);

    const expandAllButton = screen.getByText("Expand all");
    await user.click(expandAllButton);
    const initialExpandedCount = getAllExpandedItems().length;
    expect(initialExpandedCount).toBeGreaterThan(0);

    const collapseSomeNodesButton = screen.getByText("Collapse some nodes");
    await user.click(collapseSomeNodesButton);

    const expandedCount = getAllExpandedItems().length;
    expect(expandedCount).toBeLessThan(initialExpandedCount);
    expect(expandedCount).toBeGreaterThan(0);
  });

  it("dispatches toggle event when node is toggled", async () => {
    const onToggle = vi.fn();

    render(TreeView, { onToggle });

    const analyticsNode = treeItemById(1);
    const toggleButton = analyticsNode.querySelector(
      ".bx--tree-parent-node__toggle",
    );

    expect(toggleButton).toBeInTheDocument();

    assert(toggleButton instanceof HTMLElement);

    const lastToggleDetail = () => onToggle.mock.lastCall?.[0];

    await user.click(toggleButton);

    expect(lastToggleDetail()).toEqual(
      expect.objectContaining({
        id: 1,
        text: "Analytics",
        leaf: false,
        expanded: true,
      }),
    );
    expect(analyticsNode).toHaveAttribute("aria-expanded", "true");

    await user.click(toggleButton);
    expect(lastToggleDetail()).toEqual(
      expect.objectContaining({
        id: 1,
        text: "Analytics",
        leaf: false,
        expanded: false,
      }),
    );
    expect(analyticsNode).toHaveAttribute("aria-expanded", "false");
  });

  it("dispatches focus event when node receives focus", () => {
    const onFocus = vi.fn();

    render(TreeView, { onFocus });

    const firstItem = treeItemById(0);
    firstItem.focus();

    expect(onFocus).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 0,
        text: "AI / Machine learning",
        leaf: true,
      }),
    );
  });

  it("handles disabled nodes correctly", async () => {
    render(TreeView);

    const disabledNode = treeItemById(14);
    expect(disabledNode).toHaveAttribute("aria-disabled", "true");
    expect(disabledNode).toHaveClass("bx--tree-node--disabled");

    await user.click(disabledNode);
    expect(disabledNode).not.toHaveClass("bx--tree-node--selected");
    expect(disabledNode).not.toHaveClass("bx--tree-node--active");
  });

  it("re-applies tabindex=0 to the new first focusable when nodes change", async () => {
    const { rerender } = render(TreeViewProps, {
      nodes: [
        { id: "a", text: "Alpha" },
        { id: "b", text: "Beta" },
      ],
    });

    expect(screen.getByRole("treeitem", { name: /Alpha/ })).toHaveAttribute(
      "tabindex",
      "0",
    );

    await rerender({
      nodes: [
        { id: "x", text: "Xray" },
        { id: "y", text: "Yankee" },
      ],
    });

    expect(screen.getByRole("treeitem", { name: /Xray/ })).toHaveAttribute(
      "tabindex",
      "0",
    );
    expect(screen.queryByRole("treeitem", { name: /Alpha/ })).toBeNull();
  });

  it("keeps a single tab stop when nodes arrives new-but-equal after arrow navigation", async () => {
    const buildNodes = () => [
      { id: "a", text: "Alpha" },
      { id: "b", text: "Beta" },
      { id: "c", text: "Charlie" },
    ];
    const { rerender } = render(TreeViewProps, { nodes: buildNodes() });

    const alpha = screen.getByRole("treeitem", { name: /Alpha/ });
    alpha.focus();
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{ArrowDown}");

    const charlie = screen.getByRole("treeitem", { name: /Charlie/ });
    expect(charlie).toHaveFocus();
    expect(charlie).toHaveAttribute("tabindex", "0");

    // New array, same ids/text/shape: a "new but equal" `nodes` update.
    await rerender({ nodes: buildNodes() });

    const tree = screen.getByRole("tree");
    expect(tree.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
    expect(charlie).toHaveAttribute("tabindex", "0");
  });

  it("does not query the tree for a new tab stop when one is already connected", async () => {
    const buildNodes = () => [
      { id: "a", text: "Alpha" },
      { id: "b", text: "Beta" },
    ];
    const { rerender } = render(TreeViewProps, { nodes: buildNodes() });

    const querySelector = vi.spyOn(Element.prototype, "querySelector");
    querySelector.mockClear();

    // New array, same ids/text/shape, and the first node is already the
    // (default) tab stop: the redundant re-query/rewrite case.
    await rerender({ nodes: buildNodes() });

    const treeNodeQueries = querySelector.mock.calls.filter(([selector]) =>
      String(selector).includes("bx--tree-node"),
    );
    querySelector.mockRestore();
    expect(treeNodeQueries).toHaveLength(0);
  });

  it("moves tabindex=0 along with focus (roving tabindex)", async () => {
    render(TreeView);

    const firstItem = getItemByName(/AI \/ Machine learning/);
    expect(firstItem).toHaveAttribute("tabindex", "0");

    firstItem.focus();
    await user.keyboard("{ArrowDown}");

    const analyticsItems = screen.getAllByRole("treeitem", {
      name: /Analytics/,
      selected: false,
    });
    const nextItem = analyticsItems[0];

    expect(nextItem).toHaveFocus();
    expect(nextItem).toHaveAttribute("tabindex", "0");
    expect(firstItem).toHaveAttribute("tabindex", "-1");

    const tree = screen.getByRole("tree");
    expect(tree.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
  });

  it("moves the roving tab stop without querying the whole tree", async () => {
    render(TreeView);

    const firstItem = treeItemById(0);
    firstItem.focus();
    const tree = screen.getByRole("tree");
    const querySelectorAll = vi.spyOn(Element.prototype, "querySelectorAll");

    await user.keyboard("{ArrowDown}");
    await user.keyboard("{ArrowDown}");

    const tabStopQueries = querySelectorAll.mock.calls.filter(([selector]) =>
      String(selector).includes("tabindex"),
    );
    querySelectorAll.mockRestore();
    expect(tabStopQueries).toHaveLength(0);
    const focused = document.activeElement;
    expect(focused).not.toBe(firstItem);
    expect(tree.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
    expect(tree.querySelector('[tabindex="0"]')).toBe(focused);
  });

  it("navigates with ArrowUp key", async () => {
    render(TreeView);

    const secondItem = treeItemById(1);
    secondItem.focus();

    await user.keyboard("{ArrowUp}");

    const firstItem = treeItemById(0);
    expect(firstItem).toHaveFocus();
  });

  it("skips descendants under a re-collapsed subtree in keyboard navigation", async () => {
    render(TreeView);

    const analytics = treeItemById(1);
    analytics.focus();

    await user.keyboard("{ArrowRight}");
    expect(analytics).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{ArrowLeft}");
    expect(analytics).toHaveAttribute("aria-expanded", "false");

    // The collapsed children stay mounted but hidden; they must be skipped.
    await user.keyboard("{ArrowDown}");

    expect(treeItemById(7)).toHaveFocus();
  });

  it("End key moves focus to the last non-disabled treeitem", async () => {
    render(TreeView);

    const firstItem = getItemByName(/AI \/ Machine learning/);
    firstItem.focus();

    await user.keyboard("{End}");

    expect(getNamedParentTreeitem(/Databases/)).toHaveFocus();
  });

  it("Home key moves focus to the first treeitem", async () => {
    render(TreeView);

    const databases = getNamedParentTreeitem(/Databases/);
    databases.focus();

    await user.keyboard("{Home}");

    const firstItem = getItemByName(/AI \/ Machine learning/);
    expect(firstItem).toHaveFocus();
  });

  it("expands parent node with ArrowRight key", async () => {
    render(TreeView);

    const analyticsNode = treeItemById(1);
    analyticsNode.focus();

    await user.keyboard("{ArrowRight}");

    expect(analyticsNode).toHaveAttribute("aria-expanded", "true");
  });

  it("collapses parent node with ArrowLeft key", async () => {
    render(TreeView);

    const analyticsNode = treeItemById(1);
    analyticsNode.focus();

    await user.keyboard("{ArrowRight}");
    expect(analyticsNode).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{ArrowLeft}");
    expect(analyticsNode).toHaveAttribute("aria-expanded", "false");
  });

  it("selects node with Enter key", async () => {
    const onSelect = vi.fn();
    const onSelectedIds = vi.fn();

    render(TreeView, { onSelect, onSelectedIds });

    const firstItem = treeItemById(0);
    firstItem.focus();

    await user.keyboard("{Enter}");

    expect(onSelectedIds).toHaveBeenCalledWith([0]);
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 0,
        text: "AI / Machine learning",
      }),
    );
  });

  it("selects node with Space key", async () => {
    const onSelect = vi.fn();
    const onSelectedIds = vi.fn();

    render(TreeView, { onSelect, onSelectedIds });

    const firstItem = treeItemById(0);
    firstItem.focus();

    await user.keyboard(" ");

    expect(onSelectedIds).toHaveBeenCalledWith([0]);
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 0,
        text: "AI / Machine learning",
      }),
    );
  });
});

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

describe("TreeView hierarchy", () => {
  it("renders the same nodes as the flat fixture when built with toHierarchy", async () => {
    render(TreeViewHierarchy);

    await user.click(screen.getByText("Expand all"));

    expect(getAllExpandedItems()).toHaveLength(5);
    expect(document.querySelectorAll("[data-tree-row-id]")).toHaveLength(16);
    expect(treeItemById(3)).toHaveAttribute("aria-level", "3");
  });
});

describe("TreeView Props", () => {
  it("applies compact size class", () => {
    render(TreeViewProps, { size: "compact" });

    const tree = screen.getByRole("tree");
    expect(tree).toHaveClass("bx--tree--compact");
  });

  it("displays label text", () => {
    render(TreeViewProps, { labelText: "Test Label" });

    const label = screen.getByText("Test Label");
    expect(label).toBeInTheDocument();
    expect(label).toHaveClass("bx--label");
  });

  it("hides label when hideLabel is true", () => {
    render(TreeViewProps, { labelText: "Test Label", hideLabel: true });

    expect(screen.queryByText("Test Label")).not.toBeInTheDocument();
    const tree = screen.getByRole("tree");
    expect(tree).toHaveAttribute("aria-label", "Test Label");
  });

  it("sets activeId correctly", () => {
    render(TreeViewProps, { activeId: 1 });

    const node2 = screen.getByRole("treeitem", { name: /Node 2/ });
    expect(node2).toHaveAttribute("aria-current", "true");
    expect(node2).toHaveClass("bx--tree-node--active");
  });

  describe("active node label indentation regression", () => {
    it("applies correct offset to root-level leaf node label (prevents active indicator clipping)", () => {
      render(TreeViewProps, { activeId: 1 });

      const activeNode = screen.getByRole("treeitem", { name: /Node 2/ });
      const label = activeNode.querySelector(".bx--tree-node__label");
      assert(label instanceof HTMLElement);
      expect(label.style.paddingInlineStart).toBe("2.5rem");
      expect(label.style.marginInlineStart).toBe("-2.5rem");
    });

    it("applies correct offset to nested leaf node label when expanded", () => {
      render(TreeViewProps, {
        activeId: 5,
        expandedIds: [1],
        nodes: [
          { id: 0, text: "Node 1" },
          {
            id: 1,
            text: "Node 2",
            nodes: [
              { id: 2, text: "Node 2a" },
              { id: 5, text: "Node 2b" },
            ],
          },
        ],
      });

      const activeNode = screen.getByRole("treeitem", { current: true });
      const label = activeNode.querySelector(".bx--tree-node__label");
      assert(label instanceof HTMLElement);
      // Nested at depth 2: offset = (2 - 1) + 2.5 = 3.5rem
      expect(label.style.paddingInlineStart).toBe("3.5rem");
      expect(label.style.marginInlineStart).toBe("-3.5rem");
    });

    it("applies correct offset to root-level parent node label", () => {
      render(TreeViewProps, {
        activeId: 1,
        nodes: [
          { id: 0, text: "Node 1" },
          {
            id: 1,
            text: "Node 2",
            nodes: [{ id: 2, text: "Node 2a" }],
          },
        ],
      });

      const activeNode = treeItemById(1);
      const label = activeNode.querySelector(".bx--tree-node__label");
      assert(label instanceof HTMLElement);
      // Root parent: offset = (1 - 1) + 1 = 1rem
      expect(label.style.paddingInlineStart).toBe("1rem");
      expect(label.style.marginInlineStart).toBe("-1rem");
    });
  });

  it.each(["Control", "Meta"])(
    "%s+A selects every non-disabled visible row in multiselect mode",
    async (modifier) => {
      const { component } = render(TreeViewMultiselect, {
        multiselect: true,
        selectedIds: [],
      });

      const aiItem = screen.getByRole("treeitem", {
        name: /AI \/ Machine learning/,
      });
      aiItem.focus();

      await user.keyboard(`{${modifier}>}a{/${modifier}}`);

      expect(
        [...(component.selectedIds ?? [])].sort(
          (a, b) => Number(a) - Number(b),
        ),
      ).toEqual([0, 1, 7, 9]);
      const selectedItems = screen.getAllByRole("treeitem", { selected: true });
      const names = selectedItems.map(treeitemPrimaryLabel).sort();
      expect(names).toEqual([
        "AI / Machine learning",
        "Analytics",
        "Blockchain",
        "Databases",
      ]);
    },
  );

  it("handles multiple selectedIds with multiselect", () => {
    render(TreeViewMultiselect, {
      multiselect: true,
      selectedIds: [0, 7, 9],
    });

    const tree = screen.getByRole("tree");
    expect(tree).toHaveAttribute("aria-multiselectable", "true");

    const aiItem = treeItemById(0);
    const blockchainItem = treeItemById(7);
    const databasesItem = treeItemById(9);

    expect(aiItem).toHaveAttribute("aria-selected", "true");
    expect(blockchainItem).toHaveAttribute("aria-selected", "true");
    expect(databasesItem).toHaveAttribute("aria-selected", "true");
  });

  it("reports `selected` correctly in the focus dispatch payload after many nodes are selected", () => {
    const onFocus = vi.fn();

    // A broad initial `selectedIds` set exercises the Set-based lookup
    // `withLiveState` uses to compute `selected` for the dispatch payload
    // (perf/tree-view-dispatch-set-lookup), rather than an O(n) `.includes`.
    // `7` (Blockchain) is left out of `selectedIds` so it can serve as the
    // "focused but not selected" control, both enabled and top-level (so it
    // renders regardless of `expandedIds`).
    render(TreeViewMultiselect, {
      multiselect: true,
      selectedIds: [0, 1, 9],
      onFocus,
    });

    const lastFocusDetail = () => onFocus.mock.lastCall?.[0];

    const selectedItem = treeItemById(9);
    selectedItem.focus();
    expect(lastFocusDetail()).toEqual(
      expect.objectContaining({ id: 9, selected: true }),
    );

    const unselectedItem = treeItemById(7);
    unselectedItem.focus();
    expect(lastFocusDetail()).toEqual(
      expect.objectContaining({ id: 7, selected: false }),
    );
  });

  it("ctrl+click toggles selection in multiselect mode", async () => {
    render(TreeViewMultiselect, {
      multiselect: true,
      selectedIds: [],
    });

    const aiItem = treeItemById(0);
    const blockchainItem = treeItemById(7);

    await user.click(aiItem);
    expect(aiItem).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{Control>}");
    await user.click(blockchainItem);
    await user.keyboard("{/Control}");

    expect(aiItem).toHaveAttribute("aria-selected", "true");
    expect(blockchainItem).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{Control>}");
    await user.click(blockchainItem);
    await user.keyboard("{/Control}");

    expect(aiItem).toHaveAttribute("aria-selected", "true");
    expect(blockchainItem).toHaveAttribute("aria-selected", "false");
  });

  it("cmd+click toggles selection in multiselect mode", async () => {
    const { component } = render(TreeViewMultiselect, {
      multiselect: true,
      selectedIds: [],
    });

    await user.click(treeItemById(0));
    await user.keyboard("{Meta>}");
    await user.click(treeItemById(7));
    await user.keyboard("{/Meta}");

    expect(component.selectedIds).toEqual([0, 7]);
  });

  it("ctrl+click deselects a selected row that is not active", async () => {
    const onSelect = vi.fn();
    const { component } = render(TreeViewMultiselect, {
      multiselect: true,
      activeId: 0,
      selectedIds: [0, 7, 9],
      onSelect,
    });

    await user.keyboard("{Control>}");
    await user.click(treeItemById(7));
    await user.keyboard("{/Control}");

    expect(treeItemById(7)).toHaveAttribute("aria-selected", "false");
    expect(treeItemById(0)).toHaveAttribute("aria-selected", "true");
    expect(treeItemById(9)).toHaveAttribute("aria-selected", "true");
    expect(
      [...(component.selectedIds ?? [])].sort((a, b) => Number(a) - Number(b)),
    ).toEqual([0, 9]);
    expect(onSelect).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: 7, selected: false }),
    );

    await user.keyboard("{Control>}");
    await user.click(treeItemById(7));
    await user.keyboard("{/Control}");

    expect(treeItemById(7)).toHaveAttribute("aria-selected", "true");
  });

  it("ctrl+space deselects a selected row that is not active", async () => {
    render(TreeViewMultiselect, {
      multiselect: true,
      activeId: 0,
      selectedIds: [0, 7, 9],
    });

    treeItemById(9).focus();
    await user.keyboard("{Control>} {/Control}");

    expect(treeItemById(9)).toHaveAttribute("aria-selected", "false");
    expect(treeItemById(0)).toHaveAttribute("aria-selected", "true");
  });

  describe("Shift+Up/Down in multiselect", () => {
    it("toggles rows as focus moves", async () => {
      const onSelect = vi.fn();
      render(TreeViewMultiselect, {
        multiselect: true,
        activeId: "",
        selectedIds: [],
        onSelect,
      });

      treeItemById(0).focus();
      await user.keyboard("{Shift>}{ArrowDown}{/Shift}");

      expect(treeItemById(1)).toHaveFocus();
      expect(treeItemById(1)).toHaveAttribute("aria-selected", "true");
      expect(treeItemById(0)).toHaveAttribute("aria-selected", "false");
      expect(onSelect).toHaveBeenLastCalledWith(
        expect.objectContaining({ id: 1, selected: true }),
      );

      await user.keyboard("{Shift>}{ArrowDown}{/Shift}");
      expect(treeItemById(7)).toHaveFocus();
      expect(treeItemById(1)).toHaveAttribute("aria-selected", "true");
      expect(treeItemById(7)).toHaveAttribute("aria-selected", "true");

      await user.keyboard("{Shift>}{ArrowUp}{/Shift}");
      expect(treeItemById(1)).toHaveFocus();
      expect(treeItemById(1)).toHaveAttribute("aria-selected", "false");
      expect(treeItemById(7)).toHaveAttribute("aria-selected", "true");
    });

    it("does not move onto or select a disabled row", async () => {
      const { component } = render(TreeViewMultiselect, {
        multiselect: true,
        activeId: "",
        selectedIds: [],
      });

      treeItemById(9).focus();
      await user.keyboard("{Shift>}{ArrowDown}{/Shift}");

      expect(treeItemById(9)).toHaveFocus();
      expect(component.selectedIds).toEqual([]);
    });

    it("toggles the shallow unit in shallow mode", async () => {
      const { component } = render(TreeViewMultiselect, {
        multiselect: true,
        multiselectMode: "shallow",
        activeId: "",
        selectedIds: [],
      });

      treeItemById(0).focus();
      await user.keyboard("{Shift>}{ArrowDown}{/Shift}");

      expect(
        [...(component.selectedIds ?? [])].sort(
          (a, b) => Number(a) - Number(b),
        ),
      ).toEqual([1, 2, 5, 6]);
    });

    it("only moves focus when multiselect is off", async () => {
      const { component } = render(TreeViewMultiselect, {
        multiselect: false,
        activeId: "",
        selectedIds: [],
      });

      treeItemById(0).focus();
      await user.keyboard("{Shift>}{ArrowDown}{/Shift}");

      expect(treeItemById(1)).toHaveFocus();
      expect(component.selectedIds).toEqual([]);
    });
  });

  it("ctrl+click has no effect when multiselect is false", async () => {
    render(TreeViewMultiselect, {
      multiselect: false,
      selectedIds: [],
    });

    const aiItem = treeItemById(0);
    const blockchainItem = treeItemById(7);

    await user.click(aiItem);
    expect(aiItem).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{Control>}");
    await user.click(blockchainItem);
    await user.keyboard("{/Control}");

    expect(aiItem).toHaveAttribute("aria-selected", "false");
    expect(blockchainItem).toHaveAttribute("aria-selected", "true");
  });

  it("multiselectMode shallow selects parent and direct children only", async () => {
    const { component } = render(TreeViewMultiselect, {
      multiselect: true,
      multiselectMode: "shallow",
      selectedIds: [],
      expandedIds: [1],
    });

    const analyticsItem = treeItemById(1);
    const engineItem = treeItemById(2);
    const sqlItem = treeItemById(5);
    const db2Item = treeItemById(6);

    await user.click(analyticsItem);

    expect(analyticsItem).toHaveAttribute("aria-selected", "true");
    expect(engineItem).toHaveAttribute("aria-selected", "true");
    expect(sqlItem).toHaveAttribute("aria-selected", "true");
    expect(db2Item).toHaveAttribute("aria-selected", "true");

    expect(findRowById(3)).toBeNull();
    expect(component.selectedIds).not.toContain(3);
  });

  it("multiselectMode deep selects all descendants", async () => {
    render(TreeViewMultiselect, {
      multiselect: true,
      multiselectMode: "deep",
      selectedIds: [],
      expandedIds: [1, 2],
    });

    const analyticsItem = treeItemById(1);
    const sparkItem = treeItemById(3);
    const hadoopItem = treeItemById(4);

    await user.click(analyticsItem);

    expect(analyticsItem).toHaveAttribute("aria-selected", "true");
    expect(sparkItem).toHaveAttribute("aria-selected", "true");
    expect(hadoopItem).toHaveAttribute("aria-selected", "true");
  });

  it("ctrl+click removes deep subtree when multiselectMode is deep", async () => {
    render(TreeViewMultiselect, {
      multiselect: true,
      multiselectMode: "deep",
      selectedIds: [],
      expandedIds: [1, 2],
    });

    const analyticsItem = treeItemById(1);
    const sparkItem = treeItemById(3);

    await user.click(analyticsItem);
    expect(sparkItem).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{Control>}");
    await user.click(analyticsItem);
    await user.keyboard("{/Control}");

    expect(analyticsItem).toHaveAttribute("aria-selected", "false");
    expect(sparkItem).toHaveAttribute("aria-selected", "false");
  });

  it("handles empty nodes array", () => {
    render(TreeViewProps, { nodes: [] });

    const tree = screen.getByRole("tree");
    expect(tree).toBeInTheDocument();
    expect(screen.queryAllByRole("treeitem")).toHaveLength(0);
  });

  it("shift+click selects range between anchor and target (node mode)", async () => {
    const { component } = render(TreeViewMultiselect, {
      multiselect: true,
      multiselectMode: "node",
      selectedIds: [],
    });

    const aiItem = treeItemById(0);
    const blockchainItem = treeItemById(7);
    const analyticsItem = treeItemById(1);

    await user.click(aiItem);
    expect(aiItem).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{Shift>}");
    await user.click(blockchainItem);
    await user.keyboard("{/Shift}");

    expect(aiItem).toHaveAttribute("aria-selected", "true");
    expect(analyticsItem).toHaveAttribute("aria-selected", "true");
    expect(blockchainItem).toHaveAttribute("aria-selected", "true");

    // Children of collapsed parents are not visible, so they are not in the
    // range (id=2 is a child of collapsed Analytics).
    expect(findRowById(2)).toBeNull();
    expect(component.selectedIds).not.toContain(2);
  });

  it("shift+click falls back to a single selection when the anchor is no longer visible", async () => {
    const { component, rerender } = render(TreeViewMultiselect, {
      multiselect: true,
      multiselectMode: "node",
      selectedIds: [],
      expandedIds: [1],
    });

    await user.click(treeItemById(2));
    await rerender({ expandedIds: [] });

    await user.keyboard("{Shift>}");
    await user.click(treeItemById(7));
    await user.keyboard("{/Shift}");

    expect(component.selectedIds).toEqual([7]);
  });

  it("shift+click range includes children when parent is expanded", async () => {
    render(TreeViewMultiselect, {
      multiselect: true,
      multiselectMode: "node",
      selectedIds: [],
      expandedIds: [1], // Analytics is expanded
    });

    const aiItem = treeItemById(0);
    const blockchainItem = treeItemById(7);

    await user.click(aiItem);

    await user.keyboard("{Shift>}");
    await user.click(blockchainItem);
    await user.keyboard("{/Shift}");

    // Analytics' children are visible, so they should be in the range
    const engineItem = treeItemById(2);
    const sqlItem = treeItemById(5);
    const db2Item = treeItemById(6);

    expect(engineItem).toHaveAttribute("aria-selected", "true");
    expect(sqlItem).toHaveAttribute("aria-selected", "true");
    expect(db2Item).toHaveAttribute("aria-selected", "true");
  });

  it("plain click resets anchor and replaces selection in multiselect mode", async () => {
    render(TreeViewMultiselect, {
      multiselect: true,
      multiselectMode: "node",
      selectedIds: [],
    });

    const aiItem = treeItemById(0);
    const blockchainItem = treeItemById(7);
    const databasesItem = treeItemById(9);

    // Resets anchor to Databases
    await user.click(aiItem);
    await user.click(databasesItem);

    expect(aiItem).toHaveAttribute("aria-selected", "false");
    expect(databasesItem).toHaveAttribute("aria-selected", "true");

    // Shift+click Blockchain should range from Databases anchor
    // Since Databases (id=9) comes after Blockchain (id=7) in the tree,
    // the range should include Blockchain and Databases
    await user.keyboard("{Shift>}");
    await user.click(blockchainItem);
    await user.keyboard("{/Shift}");

    expect(blockchainItem).toHaveAttribute("aria-selected", "true");
    expect(databasesItem).toHaveAttribute("aria-selected", "true");
    // AI should NOT be selected (anchor was reset to Databases)
    expect(aiItem).toHaveAttribute("aria-selected", "false");
  });

  it("ctrl+click in shallow mode toggles parent and direct children", async () => {
    render(TreeViewMultiselect, {
      multiselect: true,
      multiselectMode: "shallow",
      selectedIds: [],
      expandedIds: [1],
    });

    const aiItem = treeItemById(0);
    const analyticsItem = treeItemById(1);
    const engineItem = treeItemById(2);
    const sqlItem = treeItemById(5);
    const db2Item = treeItemById(6);

    await user.click(aiItem);
    expect(aiItem).toHaveAttribute("aria-selected", "true");

    // Ctrl+click Analytics adds it and its direct children
    await user.keyboard("{Control>}");
    await user.click(analyticsItem);
    await user.keyboard("{/Control}");

    expect(aiItem).toHaveAttribute("aria-selected", "true");
    expect(analyticsItem).toHaveAttribute("aria-selected", "true");
    expect(engineItem).toHaveAttribute("aria-selected", "true");
    expect(sqlItem).toHaveAttribute("aria-selected", "true");
    expect(db2Item).toHaveAttribute("aria-selected", "true");

    // Ctrl+click Analytics again removes it and its direct children
    await user.keyboard("{Control>}");
    await user.click(analyticsItem);
    await user.keyboard("{/Control}");

    expect(aiItem).toHaveAttribute("aria-selected", "true");
    expect(analyticsItem).toHaveAttribute("aria-selected", "false");
    expect(engineItem).toHaveAttribute("aria-selected", "false");
    expect(sqlItem).toHaveAttribute("aria-selected", "false");
    expect(db2Item).toHaveAttribute("aria-selected", "false");
  });

  it("clicking a disabled node in multiselect mode leaves the selection unchanged", async () => {
    const { component } = render(TreeViewMultiselect, {
      multiselect: true,
      multiselectMode: "node",
      selectedIds: [0],
    });

    const disabledNode = treeItemById(14);

    await user.click(disabledNode);

    expect(component.selectedIds).toEqual([0]);
    expect(disabledNode).not.toHaveClass("bx--tree-node--selected");
  });

  it("shift+click skips disabled nodes in range selection", async () => {
    const { component } = render(TreeViewMultiselect, {
      multiselect: true,
      multiselectMode: "node",
      selectedIds: [],
      expandedIds: [],
      nodes: [
        { id: 0, text: "First" },
        { id: 1, text: "Middle", disabled: true },
        { id: 2, text: "Last" },
      ],
    });

    await user.click(treeItemById(0));

    await user.keyboard("{Shift>}");
    await user.click(treeItemById(2));
    await user.keyboard("{/Shift}");

    expect(component.selectedIds).toEqual([0, 2]);
  });

  it("shift+click range selection in shallow mode expands each ranged node to its direct children", async () => {
    const { component } = render(TreeViewMultiselect, {
      multiselect: true,
      multiselectMode: "shallow",
      selectedIds: [],
      expandedIds: [],
    });

    const aiItem = treeItemById(0);
    const blockchainItem = treeItemById(7);

    await user.click(aiItem);

    await user.keyboard("{Shift>}");
    await user.click(blockchainItem);
    await user.keyboard("{/Shift}");

    // Range covers AI (0), Analytics (1), Blockchain (7); each expands to
    // itself plus its direct (non-disabled) children.
    for (const id of [0, 1, 7]) {
      expect(treeItemById(id)).toHaveAttribute("aria-selected", "true");
    }
    expect(component.selectedIds).toEqual(
      expect.arrayContaining([0, 1, 2, 5, 6, 7, 8]),
    );

    // Nodes outside the range are not selected, and shallow mode does not
    // recurse past direct children (id 3 is a grandchild of Analytics).
    expect(treeItemById(9)).toHaveAttribute("aria-selected", "false");
    expect(component.selectedIds).not.toContain(9);
    expect(component.selectedIds).not.toContain(3);
  });
});

describe("TreeView Generics", () => {
  it("should enforce TreeNode constraint on generic type", () => {
    type CustomNode = {
      id: string;
      text: string;
      metadata?: { count: number };
      nodes?: CustomNode[];
    };

    type ComponentType = TreeViewComponent<CustomNode>;
    type Props = ComponentProps<ComponentType>;

    expectTypeOf<NonNullable<Props["nodes"]>>().toEqualTypeOf<
      readonly CustomNode[]
    >();

    type BaseComponentType = TreeViewComponent<TreeNode>;
    type BaseProps = ComponentProps<BaseComponentType>;
    expectTypeOf<NonNullable<BaseProps["nodes"]>>().toEqualTypeOf<
      readonly TreeNode[]
    >();
  });

  describe("discriminated union fixture", () => {
    it("renders leaf price in the slot after expanding a category", async () => {
      render(TreeViewGenerics);

      const electronics = treeItemById("electronics");
      const toggle = electronics.querySelector(".bx--tree-parent-node__toggle");
      assert(toggle instanceof HTMLElement);

      await user.click(toggle);
      expect(electronics).toHaveAttribute("aria-expanded", "true");

      const laptop = treeItemById("laptop");
      const phone = treeItemById("phone");

      expect(laptop).toHaveTextContent("Laptop");
      expect(laptop).toHaveTextContent("- $999");
      expect(phone).toHaveTextContent("Phone");
      expect(phone).toHaveTextContent("- $599");
    });

    it("dispatches select detail with leaf price for product nodes", async () => {
      const onselect = vi.fn();
      render(TreeViewGenerics, { props: { onselect } });

      await user.click(treeItemById("electronics"));

      const toggle = treeItemById("electronics").querySelector(
        ".bx--tree-parent-node__toggle",
      );
      assert(toggle instanceof HTMLElement);
      await user.click(toggle);

      await user.click(treeItemById("laptop"));

      expect(onselect).toHaveBeenLastCalledWith(
        expect.objectContaining({
          id: "laptop",
          text: "Laptop",
          price: 999,
          category: "Electronics",
          leaf: true,
        }),
      );
    });
  });

  describe("Id generic parameter", () => {
    it("should default Id to string | number when not specified", () => {
      type ComponentType = TreeViewComponent<TreeNode>;
      type Props = ComponentProps<ComponentType>;
      type Events = ComponentEvents<ComponentType>;

      expectTypeOf<Props["activeId"]>().toEqualTypeOf<
        string | number | undefined
      >();
      expectTypeOf<Props["selectedIds"]>().toEqualTypeOf<
        ReadonlyArray<string | number> | undefined
      >();
      expectTypeOf<Props["expandedIds"]>().toEqualTypeOf<
        ReadonlyArray<string | number> | undefined
      >();

      type SelectEvent = Events["select"];
      type SelectEventDetail =
        SelectEvent extends CustomEvent<infer T> ? T : never;
      expectTypeOf<SelectEventDetail>().toEqualTypeOf<
        TreeNode & {
          expanded: boolean;
          leaf: boolean;
          selected: boolean;
          checked: boolean;
          indeterminate: boolean;
        }
      >();
    });

    it("should support different ID types (string, number, union)", () => {
      type StringNode = { id: string; text: string };
      type StringComponent = TreeViewComponent<StringNode>;
      type StringProps = ComponentProps<StringComponent>;
      type StringEvents = ComponentEvents<StringComponent>;

      expectTypeOf<StringProps["activeId"]>().toEqualTypeOf<
        string | undefined
      >();
      expectTypeOf<StringProps["selectedIds"]>().toEqualTypeOf<
        ReadonlyArray<string> | undefined
      >();
      expectTypeOf<StringProps["expandedIds"]>().toEqualTypeOf<
        ReadonlyArray<string> | undefined
      >();

      type StringSelectEvent = StringEvents["select"];
      type StringSelectDetail =
        StringSelectEvent extends CustomEvent<infer T> ? T : never;
      expectTypeOf<StringSelectDetail>().toEqualTypeOf<
        StringNode & {
          expanded: boolean;
          leaf: boolean;
          selected: boolean;
          checked: boolean;
          indeterminate: boolean;
        }
      >();

      type NumberNode = { id: number; text: string };
      type NumberComponent = TreeViewComponent<NumberNode>;
      type NumberProps = ComponentProps<NumberComponent>;

      expectTypeOf<NumberProps["activeId"]>().toEqualTypeOf<
        number | undefined
      >();
      expectTypeOf<NumberProps["selectedIds"]>().toEqualTypeOf<
        ReadonlyArray<number> | undefined
      >();
      expectTypeOf<NumberProps["expandedIds"]>().toEqualTypeOf<
        ReadonlyArray<number> | undefined
      >();

      type NumberEvents = ComponentEvents<NumberComponent>;
      type NumberSelectDetail =
        NumberEvents["select"] extends CustomEvent<infer T> ? T : never;
      type NumberToggleDetail =
        NumberEvents["toggle"] extends CustomEvent<infer T> ? T : never;
      type NumberFocusDetail =
        NumberEvents["focus"] extends CustomEvent<infer T> ? T : never;
      expectTypeOf<NumberSelectDetail>().toEqualTypeOf<
        NumberNode & {
          expanded: boolean;
          leaf: boolean;
          selected: boolean;
          checked: boolean;
          indeterminate: boolean;
        }
      >();
      expectTypeOf<NumberToggleDetail["id"]>().toEqualTypeOf<number>();
      expectTypeOf<NumberFocusDetail["id"]>().toEqualTypeOf<number>();

      type UnionId = "a" | "b" | "c";
      type UnionNode = { id: UnionId; text: string };
      type UnionComponent = TreeViewComponent<UnionNode>;
      type UnionProps = ComponentProps<UnionComponent>;
      type UnionEvents = ComponentEvents<UnionComponent>;

      expectTypeOf<UnionProps["activeId"]>().toEqualTypeOf<
        UnionId | undefined
      >();
      expectTypeOf<UnionProps["selectedIds"]>().toEqualTypeOf<
        ReadonlyArray<UnionId> | undefined
      >();
      expectTypeOf<UnionProps["expandedIds"]>().toEqualTypeOf<
        ReadonlyArray<UnionId> | undefined
      >();

      type UnionSelectEvent = UnionEvents["select"];
      type UnionSelectDetail =
        UnionSelectEvent extends CustomEvent<infer T> ? T : never;
      expectTypeOf<UnionSelectDetail>().toEqualTypeOf<
        UnionNode & {
          expanded: boolean;
          leaf: boolean;
          selected: boolean;
          checked: boolean;
          indeterminate: boolean;
        }
      >();
    });

    it("should work with 'as const' for literal type inference", () => {
      const nodes = [
        { id: "node1", text: "Node 1" },
        { id: "node2", text: "Node 2" },
        { id: "node3", text: "Node 3" },
      ] as const;

      type InferredNode = (typeof nodes)[number];
      type InferredId = InferredNode["id"];

      expectTypeOf<InferredId>().toEqualTypeOf<"node1" | "node2" | "node3">();

      type ComponentType = TreeViewComponent<InferredNode>;
      type Props = ComponentProps<ComponentType>;
      type Events = ComponentEvents<ComponentType>;

      expectTypeOf<Props["activeId"]>().toEqualTypeOf<InferredId | undefined>();
      expectTypeOf<Props["selectedIds"]>().toEqualTypeOf<
        ReadonlyArray<InferredId> | undefined
      >();
      expectTypeOf<Props["expandedIds"]>().toEqualTypeOf<
        ReadonlyArray<InferredId> | undefined
      >();

      type SelectEvent = Events["select"];
      type SelectEventDetail =
        SelectEvent extends CustomEvent<infer T> ? T : never;
      expectTypeOf<SelectEventDetail>().toEqualTypeOf<
        InferredNode & {
          expanded: boolean;
          leaf: boolean;
          selected: boolean;
          checked: boolean;
          indeterminate: boolean;
        }
      >();
      expectTypeOf<SelectEventDetail["id"]>().toEqualTypeOf<InferredId>();
    });
  });

  it("supports custom label slot", () => {
    render(TreeViewSlot);

    expect(screen.getByText("Custom label content")).toBeVisible();
    expect(screen.queryByText("Default label")).not.toBeInTheDocument();
  });
});

describe.each([
  ["plain", {}],
  ["virtual", { virtualize: { maxVisibleRows: 10 }, padding: 80 }],
])("TreeViewNode href (%s)", (_variant, variantProps) => {
  it("renders a regular li when href is not set", () => {
    render(TreeViewHref, variantProps);

    const plainNode = screen.getByRole("treeitem", { name: /Plain Node/ });
    expect(plainNode.tagName).toBe("LI");
    expect(plainNode).not.toHaveAttribute("href");
  });

  it("uses aria-current='page' instead of 'true' for active link nodes", () => {
    render(TreeViewHref, { ...variantProps, activeId: "link-1" });

    const linkNode = screen.getByRole("treeitem", { name: /Link Node/ });
    expect(linkNode).toHaveAttribute("aria-current", "page");
  });

  it("does not set aria-selected on link nodes", () => {
    render(TreeViewHref, { ...variantProps, selectedIds: ["link-1"] });

    const linkNode = screen.getByRole("treeitem", { name: /Link Node/ });
    expect(linkNode).not.toHaveAttribute("aria-selected");
  });

  it("does not cancel Enter on an enabled link node", () => {
    render(TreeViewHref, variantProps);

    const linkNode = screen.getByRole("treeitem", { name: /Link Node/ });
    linkNode.focus();

    const event = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
    });
    linkNode.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });

  it("selects a link node exactly once on Enter", async () => {
    const onSelect = vi.fn();

    render(TreeViewHref, { ...variantProps, onSelect });

    const linkNode = screen.getByRole("treeitem", { name: /Link Node/ });
    linkNode.focus();

    await user.keyboard("{Enter}");

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "link-1" }),
    );
  });
});

describe("TreeViewNode href", () => {
  it("renders an anchor element with role='treeitem' when href is set", () => {
    render(TreeViewHref);

    const linkNode = screen.getByRole("treeitem", { name: /Link Node/ });
    expect(linkNode.tagName).toBe("A");
    expect(linkNode).toHaveAttribute("href", "/page-1");
  });

  it("wraps the anchor in a li with role='none'", () => {
    render(TreeViewHref);

    const linkNode = screen.getByRole("treeitem", { name: /Link Node/ });
    const parentLi = linkNode.closest("li");
    expect(parentLi).toHaveAttribute("role", "none");
  });

  it("does not set href on disabled link nodes", () => {
    render(TreeViewHref);

    const disabledLink = screen.getByRole("treeitem", {
      name: /Disabled Link/,
    });
    expect(disabledLink.tagName).toBe("A");
    expect(disabledLink).not.toHaveAttribute("href");
    expect(disabledLink).toHaveAttribute("aria-disabled", "true");
  });

  it("ArrowLeft on a nested link leaf moves focus to its parent", async () => {
    render(TreeViewHref, {
      expandedIds: ["folder"],
      nodes: [
        {
          id: "folder",
          text: "Folder",
          nodes: [{ id: "nested-link", text: "Nested Link", href: "/nested" }],
        },
      ],
    });

    treeItemById("nested-link").focus();
    await user.keyboard("{ArrowLeft}");

    expect(treeItemById("folder")).toHaveFocus();
  });

  it("can select a link node via click", async () => {
    const onSelect = vi.fn();

    render(TreeViewHref, { onSelect });

    const linkNode = screen.getByRole("treeitem", { name: /Link Node/ });
    await user.click(linkNode);

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "link-1",
        text: "Link Node",
        href: "/page-1",
      }),
    );
  });

  it("does not select a disabled link node via click", async () => {
    const onSelect = vi.fn();

    render(TreeViewHref, { onSelect });

    const disabledLink = screen.getByRole("treeitem", {
      name: /Disabled Link/,
    });
    await user.click(disabledLink);

    expect(onSelect).not.toHaveBeenCalledWith(
      expect.objectContaining({ id: "link-disabled" }),
    );
  });

  it("dispatches focus event for link nodes", () => {
    const onFocus = vi.fn();

    render(TreeViewHref, { onFocus });

    const linkNode = screen.getByRole("treeitem", { name: /Link Node/ });
    linkNode.focus();

    expect(onFocus).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "link-1",
        text: "Link Node",
        href: "/page-1",
      }),
    );
  });

  it("does not click a link node on Space", async () => {
    const onSelect = vi.fn();

    render(TreeViewHref, { onSelect });

    const linkNode = screen.getByRole("treeitem", { name: /Link Node/ });
    let clicks = 0;
    linkNode.addEventListener("click", () => clicks++, { capture: true });
    linkNode.focus();

    await user.keyboard(" ");

    expect(clicks).toBe(0);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("sets target attribute on the anchor element", () => {
    render(TreeViewHref);

    const blankLink = screen.getByRole("treeitem", { name: /Blank Target/ });
    expect(blankLink.tagName).toBe("A");
    expect(blankLink).toHaveAttribute("target", "_blank");
  });

  it("adds rel='noopener noreferrer' when target is '_blank'", () => {
    render(TreeViewHref);

    const blankLink = screen.getByRole("treeitem", { name: /Blank Target/ });
    expect(blankLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("does not set target on disabled link nodes", () => {
    render(TreeViewHref);

    const disabledLink = screen.getByRole("treeitem", {
      name: /Disabled Link/,
    });
    expect(disabledLink).not.toHaveAttribute("target");
  });

  it("ArrowDown/ArrowUp navigate between link rows", async () => {
    render(TreeViewHref);

    const first = screen.getByRole("treeitem", { name: /Link Node/ });
    const second = screen.getByRole("treeitem", { name: /Another Link/ });
    expect(first.tagName).toBe("A");
    expect(second.tagName).toBe("A");

    first.focus();
    await user.keyboard("{ArrowDown}");
    expect(second).toHaveFocus();

    await user.keyboard("{ArrowUp}");
    expect(first).toHaveFocus();
  });
});

describe("TreeView autoCollapse", () => {
  const getToggleButton = (node: HTMLElement) => {
    const button = node.querySelector(".bx--tree-parent-node__toggle");
    assert(button instanceof HTMLElement);
    return button;
  };

  it("collapses sibling nodes when autoCollapse is true", async () => {
    render(TreeViewAutoCollapse, { autoCollapse: true });

    const folder1 = treeItemById("folder1");
    const folder2 = treeItemById("folder2");

    await user.click(getToggleButton(folder1));
    expect(folder1).toHaveAttribute("aria-expanded", "true");
    expect(getAllExpandedItems()).toHaveLength(1);

    await user.click(getToggleButton(folder2));
    expect(folder2).toHaveAttribute("aria-expanded", "true");
    expect(folder1).toHaveAttribute("aria-expanded", "false");
    expect(getAllExpandedItems()).toHaveLength(1);
  });

  it("keeps siblings expanded when autoCollapse is false", async () => {
    render(TreeViewAutoCollapse, { autoCollapse: false });

    const folder1 = treeItemById("folder1");
    const folder2 = treeItemById("folder2");

    await user.click(getToggleButton(folder1));
    expect(folder1).toHaveAttribute("aria-expanded", "true");
    expect(getAllExpandedItems()).toHaveLength(1);

    await user.click(getToggleButton(folder2));
    expect(folder2).toHaveAttribute("aria-expanded", "true");
    expect(folder1).toHaveAttribute("aria-expanded", "true");
    expect(getAllExpandedItems()).toHaveLength(2);
  });

  it("only collapses siblings at the same level, not parent or cousins", async () => {
    render(TreeViewAutoCollapse, { autoCollapse: true });

    const folder3 = treeItemById("folder3");

    await user.click(getToggleButton(folder3));
    expect(folder3).toHaveAttribute("aria-expanded", "true");

    const subfolder1 = treeItemById("subfolder1");
    await user.click(getToggleButton(subfolder1));
    expect(subfolder1).toHaveAttribute("aria-expanded", "true");
    expect(folder3).toHaveAttribute("aria-expanded", "true");

    const subfolder2 = treeItemById("subfolder2");
    await user.click(getToggleButton(subfolder2));
    expect(subfolder2).toHaveAttribute("aria-expanded", "true");
    expect(subfolder1).toHaveAttribute("aria-expanded", "false");
    expect(folder3).toHaveAttribute("aria-expanded", "true");
  });

  it("ArrowLeft on a collapsed parent moves focus to its ancestor", async () => {
    render(TreeViewAutoCollapse, { autoCollapse: false });

    const folder3 = screen.getByRole("treeitem", { name: /Folder 3/ });
    await user.click(getToggleButton(folder3));

    const subfolder1 = within(folder3).getByRole("treeitem", {
      name: /^Subfolder 1\b/,
    });
    expect(subfolder1).toHaveAttribute("aria-expanded", "false");

    subfolder1.focus();
    await user.keyboard("{ArrowLeft}");

    expect(folder3).toHaveFocus();
  });

  it("Enter toggles parent expansion; Space selects without toggling", async () => {
    render(TreeViewAutoCollapse, { autoCollapse: true });

    const folder1 = treeItemById("folder1");
    const folder2 = treeItemById("folder2");

    folder1.focus();
    await user.keyboard("{Enter}");
    expect(folder1).toHaveAttribute("aria-expanded", "true");

    folder2.focus();
    await user.keyboard(" ");
    // Space selects but does NOT toggle expand on parent rows (Carbon parity).
    expect(folder2).toHaveAttribute("aria-expanded", "false");
    expect(folder2).toHaveAttribute("aria-selected", "true");
    // Folder1 is unaffected (still expanded; autoCollapse hasn't fired since
    // folder2 isn't being expanded).
    expect(folder1).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Enter}");
    expect(folder2).toHaveAttribute("aria-expanded", "true");
    // Now autoCollapse kicks in.
    expect(folder1).toHaveAttribute("aria-expanded", "false");
  });

  it("applies autoCollapse across 4 levels of nesting and top-level root siblings when activeId changes", async () => {
    // Exercises the precomputed sibling cache (perf/tree-view-autocollapse-sibling-cache):
    // a chain of ancestors 4 levels deep, a sibling collapse at a *nested* level,
    // and a sibling collapse at the *top-level root* (whose "parent" is the
    // implicit forest root, not a real node).
    const { rerender } = render(TreeViewAutoCollapse, { autoCollapse: true });

    const folder1 = treeItemById("folder1");
    const folder2 = treeItemById("folder2");
    const folder3 = treeItemById("folder3");

    // Start with a top-level root sibling (folder2) expanded so the later
    // root-sibling collapse is observable.
    await user.click(getToggleButton(folder2));
    expect(folder2).toHaveAttribute("aria-expanded", "true");

    // Activate a leaf 4 levels deep: folder3 > subfolder1 > subitem1 > subsubitem1.
    await rerender({ activeId: "subsubitem1" });

    expect(folder2).toHaveAttribute("aria-expanded", "false");
    expect(folder3).toHaveAttribute("aria-expanded", "true");
    const subfolder1 = treeItemById("subfolder1");
    const subfolder2 = treeItemById("subfolder2");
    expect(subfolder1).toHaveAttribute("aria-expanded", "true");
    expect(subfolder2).toHaveAttribute("aria-expanded", "false");
    const subitem1 = treeItemById("subitem1");
    expect(subitem1).toHaveAttribute("aria-expanded", "true");

    // Move to the sibling deep branch: subfolder1 (and its expanded child
    // subitem1) must collapse, while the shared ancestor folder3 stays expanded.
    await rerender({ activeId: "subsubitem2" });
    expect(folder3).toHaveAttribute("aria-expanded", "true");
    expect(subfolder2).toHaveAttribute("aria-expanded", "true");
    expect(subfolder1).toHaveAttribute("aria-expanded", "false");

    // Jump to a leaf under a different top-level root (folder1): its root-level
    // siblings folder2 and folder3 must collapse (root-parent edge case).
    await rerender({ activeId: "item1" });
    expect(folder1).toHaveAttribute("aria-expanded", "true");
    expect(folder3).toHaveAttribute("aria-expanded", "false");
  });

  describe("TreeViewNode Generics", () => {
    it("should support custom Icon types with generics", () => {
      type CustomIcon = new (...args: unknown[]) => unknown;

      type ComponentType = TreeViewNodeComponent<TreeNode, CustomIcon>;
      type Props = ComponentProps<ComponentType>;

      expectTypeOf<Props["icon"]>().toEqualTypeOf<CustomIcon | undefined>();
    });

    it("should default Icon to any when not specified", () => {
      type ComponentType = TreeViewNodeComponent<TreeNode>;
      type Props = ComponentProps<ComponentType>;

      // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
      expectTypeOf<Props["icon"]>().toEqualTypeOf<any>();
    });
  });

  it("wires aria-owns and aria-labelledby for expanded subtrees", () => {
    const { container } = render(TreeViewProps, {
      expandedIds: ["parent"],
      nodes: [
        {
          id: "parent",
          text: "Top Parent",
          nodes: [{ id: "child", text: "Child" }],
        },
      ],
    });

    const treeId = container.querySelector('[role="tree"]')?.id;
    expect(treeId).toBeTruthy();
    const subtreeId = treeItemById("parent").getAttribute("aria-owns");
    expect(subtreeId).toBe(`${treeId}-parent-subtree`);

    const subtree = document.getElementById(subtreeId as string);
    expect(subtree?.getAttribute("role")).toBe("group");

    const labelledBy = subtree?.getAttribute("aria-labelledby");
    expect(labelledBy).toBe(`${treeId}-parent__label`);

    const labelEl = document.getElementById(labelledBy as string);
    expect(labelEl?.textContent?.trim()).toBe("Top Parent");
  });

  it("ArrowRight on an expanded parent focuses link-first-child treeitem", async () => {
    render(TreeViewProps, {
      expandedIds: ["p"],
      nodes: [
        {
          id: "p",
          text: "Parent",
          nodes: [
            { id: "child-link", text: "Link Child", href: "/x" },
            { id: "child-leaf", text: "Leaf Child" },
          ],
        },
      ],
    });

    treeItemById("p").focus();

    await user.keyboard("{ArrowRight}");

    const linkChild = treeItemById("child-link");
    expect(linkChild.tagName).toBe("A");
    expect(linkChild).toHaveFocus();
  });

  describe("findParentTreeNode", () => {
    it("walks up to the nearest bx--tree-parent-node", () => {
      const tree = document.createElement("ul");
      tree.classList.add("bx--tree");

      const parent = document.createElement("li");
      parent.classList.add("bx--tree-node", "bx--tree-parent-node");
      tree.appendChild(parent);

      const group = document.createElement("ul");
      parent.appendChild(group);

      const child = document.createElement("li");
      child.classList.add("bx--tree-node");
      group.appendChild(child);

      expect(findParentTreeNode(child.parentElement)).toBe(parent);
    });

    it("returns null when there is no enclosing parent tree node", () => {
      const tree = document.createElement("ul");
      tree.classList.add("bx--tree");
      const leaf = document.createElement("li");
      leaf.classList.add("bx--tree-node");
      tree.appendChild(leaf);

      expect(findParentTreeNode(leaf.parentElement)).toBeNull();
    });
  });

  describe("TreeViewNodeList Generics", () => {
    it("should support custom Icon types with generics", () => {
      type CustomIcon = new (...args: unknown[]) => unknown;

      type ComponentType = TreeViewNodeListComponent<string, CustomIcon>;
      type Props = ComponentProps<ComponentType>;

      expectTypeOf<Props["icon"]>().toEqualTypeOf<CustomIcon | undefined>();
    });

    it("should default Icon to any when not specified", () => {
      type ComponentType = TreeViewNodeListComponent<string>;
      type Props = ComponentProps<ComponentType>;

      // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
      expectTypeOf<Props["icon"]>().toEqualTypeOf<any>();
    });
  });
});

describe("TreeView duplicate ids", () => {
  it("keeps internal ids unique when two trees share node ids", () => {
    const { container } = render(TreeViewDuplicateIds);
    const ids = Array.from(container.querySelectorAll("[id]"), (el) => el.id);

    expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);

    const trees = container.querySelectorAll<HTMLElement>('[role="tree"]');
    expect(trees).toHaveLength(2);

    for (const tree of trees) {
      const rows = tree.querySelectorAll('[role="treeitem"]');
      expect(
        Array.from(rows, (row) => row.getAttribute("data-tree-row-id")),
      ).toEqual(["0", "1", "2"]);

      expect(Array.from(rows, (row) => row.id)).toEqual(
        ["0", "1", "2"].map((nodeId) => `${tree.id}-${nodeId}`),
      );
      expect(rows[0]).toHaveAttribute("aria-owns", `${tree.id}-0-subtree`);

      const subtree = tree.querySelector<HTMLElement>('[role="group"]');
      expect(subtree).not.toBeNull();

      const labelledby = subtree?.getAttribute("aria-labelledby");
      expect(labelledby).toBeTruthy();

      const referenced = document.getElementById(labelledby as string);
      expect(referenced).not.toBeNull();
      expect(tree.contains(referenced)).toBe(true);
    }
  });
});
