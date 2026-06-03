import { render, screen, within } from "@testing-library/svelte";
import type TreeViewComponent from "carbon-components-svelte/TreeView/TreeView.svelte";
import type { TreeNode } from "carbon-components-svelte/TreeView/TreeView.svelte";
import type TreeViewNodeComponent from "carbon-components-svelte/TreeView/TreeViewNode.svelte";
import { findParentTreeNode } from "carbon-components-svelte/TreeView/TreeViewNode.svelte";
import type TreeViewNodeListComponent from "carbon-components-svelte/TreeView/TreeViewNodeList.svelte";
import type {
  ComponentEvents,
  ComponentProps,
  ComponentType as SvelteComponentType,
} from "svelte";
import { user } from "../utils/user";
import TreeViewAutoCollapse from "./TreeView.autoCollapse.test.svelte";
import TreeViewHierarchy from "./TreeView.hierarchy.test.svelte";
import TreeViewHref from "./TreeView.href.test.svelte";
import TreeViewMultiselect from "./TreeView.multiselect.test.svelte";
import TreeViewProps from "./TreeView.props.test.svelte";
import TreeViewSlot from "./TreeView.slot.test.svelte";
import TreeView from "./TreeView.test.svelte";
import TreeViewGenerics from "./TreeViewGenerics.test.svelte";

function treeItemById(id: string | number): HTMLElement {
  const el = document.getElementById(String(id));
  expect.assert(el instanceof HTMLElement);
  return el;
}

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
  expect.assert(found instanceof HTMLElement);
  return found;
}

const testCases = [
  { name: "TreeView", component: TreeView },
  { name: "TreeView hierarchy", component: TreeViewHierarchy },
];

describe.each(testCases)("$name", ({ component }) => {
  const noExpandedItems = () => {
    expect(screen.queryAllByRole("treeitem", { expanded: true })).toHaveLength(
      0,
    );
  };

  const getAllExpandedItems = () => {
    return screen.getAllByRole("treeitem", { expanded: true });
  };

  const getItemByName = (name: string | RegExp): HTMLElement =>
    screen.getByRole("treeitem", { name }) as HTMLElement;

  it("can select a node", async () => {
    const consoleLog = vi.spyOn(console, "log");

    render(component);

    const firstItem = treeItemById(0);
    expect(firstItem).toBeInTheDocument();

    await user.click(firstItem);
    expect(firstItem).toHaveAttribute("aria-selected", "true");
    expect(consoleLog).toBeCalledWith("selectedIds", [0]);
    expect(consoleLog).toBeCalledWith("select", {
      disabled: false,
      expanded: false,
      icon: expect.anything(),
      id: 0,
      leaf: true,
      selected: false,
      text: "AI / Machine learning",
    });
  });

  it("can expand all nodes", async () => {
    render(component);

    noExpandedItems();

    const expandAllButton = screen.getByText("Expand all");
    await user.click(expandAllButton);

    expect(getAllExpandedItems()).toHaveLength(5);
  });

  it("expandNodes() with no arguments expands all nodes", async () => {
    render(component);

    noExpandedItems();

    const expandNodesButton = screen.getByText("Expand nodes (no filter)");
    await user.click(expandNodesButton);

    expect(getAllExpandedItems()).toHaveLength(5);
  });

  it("can expand some nodes", async () => {
    render(component);

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
    render(component);

    const expandAllButton = screen.getByText("Expand all");
    await user.click(expandAllButton);
    expect(getAllExpandedItems().length).toBeGreaterThan(0);

    const collapseAllButton = screen.getByText("Collapse all");
    await user.click(collapseAllButton);

    noExpandedItems();
  });

  it("can collapse some nodes", async () => {
    render(component);

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
    const consoleLog = vi.spyOn(console, "log");

    render(component);

    const analyticsNode = treeItemById(1);
    const toggleButton = analyticsNode.querySelector(
      ".bx--tree-parent-node__toggle",
    );

    expect(toggleButton).toBeInTheDocument();

    expect.assert(toggleButton instanceof HTMLElement);
    await user.click(toggleButton);

    expect(consoleLog).toHaveBeenCalledWith(
      "toggle",
      expect.objectContaining({
        id: 1,
        text: "Analytics",
        leaf: false,
      }),
    );
  });

  it("dispatches focus event when node receives focus", () => {
    const consoleLog = vi.spyOn(console, "log");

    render(component);

    const firstItem = treeItemById(0);
    firstItem.focus();

    expect(consoleLog).toHaveBeenCalledWith(
      "focus",
      expect.objectContaining({
        id: 0,
        text: "AI / Machine learning",
        leaf: true,
      }),
    );
  });

  it("handles disabled nodes correctly", async () => {
    render(component);

    const disabledNode = treeItemById(14);
    expect(disabledNode).toHaveAttribute("aria-disabled", "true");
    expect(disabledNode).toHaveClass("bx--tree-node--disabled");

    await user.click(disabledNode);
    expect(disabledNode).not.toHaveAttribute("aria-selected", "true");
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

  it("moves tabindex=0 along with focus (roving tabindex)", async () => {
    render(component);

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

  it("navigates with ArrowDown key", async () => {
    render(component);

    const firstItem = treeItemById(0);
    firstItem.focus();

    await user.keyboard("{ArrowDown}");

    const nextItem = treeItemById(1);
    expect(nextItem).toHaveFocus();
  });

  it("navigates with ArrowUp key", async () => {
    render(component);

    const secondItem = treeItemById(1);
    secondItem.focus();

    await user.keyboard("{ArrowUp}");

    const firstItem = treeItemById(0);
    expect(firstItem).toHaveFocus();
  });

  it("skips disabled nodes in keyboard navigation", async () => {
    render(component);

    const expandAllButton = screen.getByText("Expand all");
    await user.click(expandAllButton);

    const databasesNode = treeItemById(9);
    databasesNode.focus();

    await user.keyboard("{ArrowDown}");

    const disabledNode = treeItemById(14);
    expect(disabledNode).not.toHaveFocus();
  });

  it("skips descendants under collapsed subtree in keyboard navigation", async () => {
    render(component);

    const firstItem = treeItemById(0);
    const analytics = treeItemById(1);
    const ibmEngine = treeItemById(2); // descendant of collapsed Analytics
    const apacheSpark = treeItemById(3); // leaf, descendant of collapsed IBM Engine

    // Both descendants stay in the DOM but inside `ul.bx--tree-node--hidden`.
    expect(ibmEngine.closest("ul.bx--tree-node--hidden")).not.toBeNull();
    expect(apacheSpark.closest("ul.bx--tree-node--hidden")).not.toBeNull();

    firstItem.focus();
    await user.keyboard("{ArrowDown}");

    expect(analytics).toHaveFocus();
    expect(ibmEngine).not.toHaveFocus();
    expect(apacheSpark).not.toHaveFocus();
  });

  it("End key moves focus to the last non-disabled treeitem", async () => {
    render(component);

    const firstItem = getItemByName(/AI \/ Machine learning/);
    firstItem.focus();

    await user.keyboard("{End}");

    expect(getNamedParentTreeitem(/Databases/)).toHaveFocus();
  });

  it("Home key moves focus to the first treeitem", async () => {
    render(component);

    const databases = getNamedParentTreeitem(/Databases/);
    databases.focus();

    await user.keyboard("{Home}");

    const firstItem = getItemByName(/AI \/ Machine learning/);
    expect(firstItem).toHaveFocus();
  });

  it("expands parent node with ArrowRight key", async () => {
    render(component);

    const analyticsNode = treeItemById(1);
    analyticsNode.focus();

    await user.keyboard("{ArrowRight}");

    expect(analyticsNode).toHaveAttribute("aria-expanded", "true");
  });

  it("collapses parent node with ArrowLeft key", async () => {
    render(component);

    const analyticsNode = treeItemById(1);
    analyticsNode.focus();

    await user.keyboard("{ArrowRight}");
    expect(analyticsNode).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{ArrowLeft}");
    expect(analyticsNode).toHaveAttribute("aria-expanded", "false");
  });

  it("selects node with Enter key", async () => {
    const consoleLog = vi.spyOn(console, "log");

    render(component);

    const firstItem = treeItemById(0);
    firstItem.focus();

    await user.keyboard("{Enter}");

    expect(consoleLog).toHaveBeenCalledWith("selectedIds", [0]);
    expect(consoleLog).toHaveBeenCalledWith(
      "select",
      expect.objectContaining({
        id: 0,
        text: "AI / Machine learning",
      }),
    );
  });

  it("selects node with Space key", async () => {
    const consoleLog = vi.spyOn(console, "log");

    render(component);

    const firstItem = treeItemById(0);
    firstItem.focus();

    await user.keyboard(" ");

    expect(consoleLog).toHaveBeenCalledWith("selectedIds", [0]);
    expect(consoleLog).toHaveBeenCalledWith(
      "select",
      expect.objectContaining({
        id: 0,
        text: "AI / Machine learning",
      }),
    );
  });
});

describe("TreeView Props", () => {
  it("applies default size class", () => {
    render(TreeViewProps);

    const tree = screen.getByRole("tree");
    expect(tree).toHaveClass("bx--tree--default");
  });

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
      expect.assert(label instanceof HTMLElement);
      expect(label.style.paddingLeft).toBe("2.5rem");
      expect(label.style.marginLeft).toBe("-2.5rem");
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
      expect.assert(label instanceof HTMLElement);
      // Nested at depth 2: offset = (2 - 1) + 2.5 = 3.5rem
      expect(label.style.paddingLeft).toBe("3.5rem");
      expect(label.style.marginLeft).toBe("-3.5rem");
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
      expect.assert(label instanceof HTMLElement);
      // Root parent: offset = (1 - 1) + 1 = 1rem
      expect(label.style.paddingLeft).toBe("1rem");
      expect(label.style.marginLeft).toBe("-1rem");
    });
  });

  it("Ctrl+A selects every non-disabled visible row in multiselect mode", async () => {
    render(TreeViewMultiselect, {
      multiselect: true,
      selectedIds: [],
    });

    const aiItem = screen.getByRole("treeitem", {
      name: /AI \/ Machine learning/,
    });
    aiItem.focus();

    await user.keyboard("{Control>}a{/Control}");

    const selectedItems = screen.getAllByRole("treeitem", { selected: true });
    const names = selectedItems.map(treeitemPrimaryLabel).sort();
    expect(names).toEqual([
      "AI / Machine learning",
      "Analytics",
      "Blockchain",
      "Databases",
    ]);
    // Integration is disabled and excluded.
    expect(
      screen.getByRole("treeitem", { name: /Integration/ }),
    ).toHaveAttribute("aria-disabled", "true");
  });

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

  it("does not set aria-multiselectable when multiselect is false", () => {
    render(TreeViewMultiselect, {
      multiselect: false,
      selectedIds: [0, 7, 9],
    });

    const tree = screen.getByRole("tree");
    expect(tree).not.toHaveAttribute("aria-multiselectable");
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

    // Ctrl+click again to deselect
    await user.keyboard("{Control>}");
    await user.click(blockchainItem);
    await user.keyboard("{/Control}");

    expect(aiItem).toHaveAttribute("aria-selected", "true");
    expect(blockchainItem).toHaveAttribute("aria-selected", "false");
  });

  it("plain click replaces selection in multiselect mode", async () => {
    render(TreeViewMultiselect, {
      multiselect: true,
      selectedIds: [0, 7, 9],
    });

    const blockchainItem = treeItemById(7);

    await user.click(blockchainItem);

    expect(blockchainItem).toHaveAttribute("aria-selected", "true");

    const aiItem = treeItemById(0);
    const databasesItem = treeItemById(9);

    expect(aiItem).toHaveAttribute("aria-selected", "false");
    expect(databasesItem).toHaveAttribute("aria-selected", "false");
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

    // Should replace, not toggle
    expect(aiItem).toHaveAttribute("aria-selected", "false");
    expect(blockchainItem).toHaveAttribute("aria-selected", "true");
  });

  it("multiselectMode shallow selects parent and direct children only", async () => {
    render(TreeViewMultiselect, {
      multiselect: true,
      multiselectMode: "shallow",
      selectedIds: [],
      expandedIds: [1],
    });

    const analyticsItem = document.getElementById("1");
    const engineItem = document.getElementById("2");
    const sqlItem = document.getElementById("5");
    const db2Item = document.getElementById("6");
    expect.assert(analyticsItem instanceof HTMLElement);
    expect.assert(engineItem instanceof HTMLElement);
    expect.assert(sqlItem instanceof HTMLElement);
    expect.assert(db2Item instanceof HTMLElement);

    await user.click(analyticsItem);

    expect(analyticsItem).toHaveAttribute("aria-selected", "true");
    expect(engineItem).toHaveAttribute("aria-selected", "true");
    expect(sqlItem).toHaveAttribute("aria-selected", "true");
    expect(db2Item).toHaveAttribute("aria-selected", "true");

    expect(treeItemById(3)).toHaveAttribute("aria-selected", "false");
  });

  it("multiselectMode deep selects all descendants", async () => {
    render(TreeViewMultiselect, {
      multiselect: true,
      multiselectMode: "deep",
      selectedIds: [],
      expandedIds: [1, 2],
    });

    const analyticsItem = document.getElementById("1");
    const sparkItem = document.getElementById("3");
    const hadoopItem = document.getElementById("4");
    expect.assert(analyticsItem instanceof HTMLElement);
    expect.assert(sparkItem instanceof HTMLElement);
    expect.assert(hadoopItem instanceof HTMLElement);

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

    const analyticsItem = document.getElementById("1");
    const sparkItem = document.getElementById("3");
    expect.assert(analyticsItem instanceof HTMLElement);
    expect.assert(sparkItem instanceof HTMLElement);

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
    render(TreeViewMultiselect, {
      multiselect: true,
      multiselectMode: "node",
      selectedIds: [],
    });

    const aiItem = treeItemById(0);
    const blockchainItem = treeItemById(7);
    const analyticsItem = treeItemById(1);

    // Plain click sets anchor on AI
    await user.click(aiItem);
    expect(aiItem).toHaveAttribute("aria-selected", "true");

    // Shift+click on Blockchain selects range: AI, Analytics, Blockchain
    await user.keyboard("{Shift>}");
    await user.click(blockchainItem);
    await user.keyboard("{/Shift}");

    expect(aiItem).toHaveAttribute("aria-selected", "true");
    expect(analyticsItem).toHaveAttribute("aria-selected", "true");
    expect(blockchainItem).toHaveAttribute("aria-selected", "true");
  });

  it("shift+click range only includes visible (expanded) nodes", async () => {
    render(TreeViewMultiselect, {
      multiselect: true,
      multiselectMode: "node",
      selectedIds: [],
      expandedIds: [], // All collapsed - children are not visible
    });

    const aiItem = treeItemById(0);
    const databasesItem = treeItemById(9);

    await user.click(aiItem);

    await user.keyboard("{Shift>}");
    await user.click(databasesItem);
    await user.keyboard("{/Shift}");

    // With all nodes collapsed, only top-level nodes are visible in the range
    expect(aiItem).toHaveAttribute("aria-selected", "true");
    expect(databasesItem).toHaveAttribute("aria-selected", "true");

    // Children of collapsed parents should NOT be selected
    // (e.g., id=2 "IBM Analytics Engine" is a child of collapsed Analytics)
    expect(treeItemById(2)).toHaveAttribute("aria-selected", "false");
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
    const engineItem = document.getElementById("2");
    const sqlItem = document.getElementById("5");
    const db2Item = document.getElementById("6");
    expect.assert(engineItem instanceof HTMLElement);
    expect.assert(sqlItem instanceof HTMLElement);
    expect.assert(db2Item instanceof HTMLElement);

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

    // Click AI, then plain click Databases (resets anchor to Databases)
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
    const analyticsItem = document.getElementById("1");
    const engineItem = document.getElementById("2");
    const sqlItem = document.getElementById("5");
    const db2Item = document.getElementById("6");
    expect.assert(analyticsItem instanceof HTMLElement);
    expect.assert(engineItem instanceof HTMLElement);
    expect.assert(sqlItem instanceof HTMLElement);
    expect.assert(db2Item instanceof HTMLElement);

    // Click AI first
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

  it("disabled nodes are skipped in multiselect expansion", async () => {
    render(TreeViewMultiselect, {
      multiselect: true,
      multiselectMode: "node",
      selectedIds: [],
    });

    const disabledNode = treeItemById(14);

    await user.click(disabledNode);

    // Disabled node should not become selected
    expect(disabledNode).not.toHaveAttribute("aria-selected", "true");
  });

  it("shift+click skips disabled nodes in range selection", async () => {
    render(TreeViewMultiselect, {
      multiselect: true,
      multiselectMode: "node",
      selectedIds: [],
      expandedIds: [],
    });

    const aiItem = treeItemById(0);

    // Click AI first
    await user.click(aiItem);

    // Shift+click to select range to Databases (Integration is disabled in between)
    const databasesItem = treeItemById(9);

    await user.keyboard("{Shift>}");
    await user.click(databasesItem);
    await user.keyboard("{/Shift}");

    expect(aiItem).toHaveAttribute("aria-selected", "true");
    expect(databasesItem).toHaveAttribute("aria-selected", "true");

    // Integration is disabled and should not be selected
    const disabledNode = treeItemById(14);
    expect(disabledNode).not.toHaveAttribute("aria-selected", "true");
  });

  it("multiselect tree has bx--tree--multiselect class", () => {
    render(TreeViewMultiselect, {
      multiselect: true,
      selectedIds: [],
    });

    const tree = screen.getByRole("tree");
    expect(tree).toHaveClass("bx--tree--multiselect");
  });

  it("non-multiselect tree does not have bx--tree--multiselect class", () => {
    render(TreeViewMultiselect, {
      multiselect: false,
      selectedIds: [],
    });

    const tree = screen.getByRole("tree");
    expect(tree).not.toHaveClass("bx--tree--multiselect");
  });
});

describe("TreeView Generics", () => {
  it("should support custom node types with generics", () => {
    type CustomNode = {
      id: string;
      text: string;
      icon?: SvelteComponentType;
      disabled?: boolean;
      metadata?: { count: number; tags: string[] };
      nodes?: CustomNode[];
    };

    const customNodes: CustomNode[] = [
      {
        id: "1",
        text: "Node 1",
        metadata: { count: 5, tags: ["a", "b"] },
      },
    ];

    expectTypeOf<typeof customNodes>().toEqualTypeOf<CustomNode[]>();

    type SelectEventDetail = CustomNode & {
      expanded: boolean;
      leaf: boolean;
      selected: boolean;
    };

    expectTypeOf<SelectEventDetail>().toEqualTypeOf<
      CustomNode & {
        expanded: boolean;
        leaf: boolean;
        selected: boolean;
      }
    >();

    const testDetail: SelectEventDetail = {
      id: "1",
      text: "test",
      metadata: { count: 5, tags: ["a"] },
      expanded: false,
      leaf: true,
      selected: false,
    };
    if (testDetail.metadata) {
      expectTypeOf(testDetail.metadata.count).toEqualTypeOf<number>();
      expectTypeOf(testDetail.metadata.tags).toEqualTypeOf<string[]>();
    }
  });

  it("should default to TreeNode type when generic is not specified", () => {
    type DefaultTreeNode = {
      id: string | number;
      text: unknown;
      icon?: unknown;
      disabled?: boolean;
      nodes?: DefaultTreeNode[];
    };

    const defaultNodes: DefaultTreeNode[] = [{ id: "1", text: "Node 1" }];

    expectTypeOf<typeof defaultNodes>().toEqualTypeOf<DefaultTreeNode[]>();

    type DefaultEventDetail = DefaultTreeNode & {
      expanded: boolean;
      leaf: boolean;
      selected: boolean;
    };

    expectTypeOf<DefaultEventDetail>().toEqualTypeOf<
      DefaultTreeNode & {
        expanded: boolean;
        leaf: boolean;
        selected: boolean;
      }
    >();
  });

  it("should provide type-safe access to custom node properties in event handlers", () => {
    type CustomNode = {
      id: string;
      text: string;
      metadata?: { count: number; tags: string[] };
      nodes?: CustomNode[];
    };

    const handleSelect = (
      node: CustomNode & {
        expanded: boolean;
        leaf: boolean;
        selected: boolean;
      },
    ) => {
      expectTypeOf(node).toEqualTypeOf<
        CustomNode & { expanded: boolean; leaf: boolean; selected: boolean }
      >();
      if (node.metadata) {
        expectTypeOf(node.metadata.count).toEqualTypeOf<number>();
        expectTypeOf(node.metadata.tags).toEqualTypeOf<string[]>();
      }
    };

    expectTypeOf(handleSelect)
      .parameter(0)
      .toEqualTypeOf<
        CustomNode & { expanded: boolean; leaf: boolean; selected: boolean }
      >();

    type SelectEventDetail = CustomNode & {
      expanded: boolean;
      leaf: boolean;
      selected: boolean;
    };
    const testEventDetail: SelectEventDetail = {
      id: "1",
      text: "test",
      metadata: { count: 5, tags: ["a"] },
      expanded: false,
      leaf: true,
      selected: false,
    };
    expectTypeOf(testEventDetail).toEqualTypeOf<
      Parameters<typeof handleSelect>[0]
    >();
  });

  it("should provide type-safe access in expandNodes and collapseNodes filter functions", () => {
    type CustomNode = {
      id: string;
      text: string;
      category?: "folder" | "file";
      nodes?: CustomNode[];
    };

    const filterFolders = (node: CustomNode) => {
      expectTypeOf(node).toEqualTypeOf<CustomNode>();
      if (node.category) {
        expectTypeOf(node.category).toEqualTypeOf<"folder" | "file">();
        return node.category === "folder";
      }
      return false;
    };

    expectTypeOf(filterFolders).parameter(0).toEqualTypeOf<CustomNode>();
    expectTypeOf<
      Parameters<typeof filterFolders>[0]
    >().toEqualTypeOf<CustomNode>();
  });

  it("should support recursive node types with custom properties", () => {
    type FileNode = {
      id: string;
      text: string;
      fileSize?: number;
      fileType?: string;
      nodes?: FileNode[];
    };

    const fileNodes: FileNode[] = [
      {
        id: "1",
        text: "Documents",
        nodes: [
          {
            id: "2",
            text: "file.txt",
            fileSize: 1024,
            fileType: "text/plain",
          },
        ],
      },
    ];

    expectTypeOf<typeof fileNodes>().toEqualTypeOf<FileNode[]>();

    const firstNode = fileNodes[0];
    if (firstNode.nodes) {
      expectTypeOf<typeof firstNode.nodes>().toEqualTypeOf<FileNode[]>();
      const childNode = firstNode.nodes[0];
      if (childNode.fileSize) {
        expectTypeOf<typeof childNode.fileSize>().toEqualTypeOf<number>();
      }
    }
  });

  it("should work with nodes that have icon property typed correctly", () => {
    type IconNode = {
      id: string;
      text: string;
      icon?: SvelteComponentType;
      nodes?: IconNode[];
    };

    const iconNodes: IconNode[] = [
      { id: "1", text: "Node with icon", icon: undefined },
    ];

    expectTypeOf<typeof iconNodes>().toEqualTypeOf<IconNode[]>();

    const nodeWithIcon: IconNode = {
      id: "2",
      text: "Node",
      icon: undefined as SvelteComponentType | undefined,
    };
    expectTypeOf(nodeWithIcon.icon).toEqualTypeOf<
      SvelteComponentType | undefined
    >();
  });

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
    it("renders categories with custom label slot content", () => {
      render(TreeViewGenerics);

      expect(screen.getByText("Products")).toHaveClass("bx--label");
      expect(screen.getByRole("tree")).toHaveClass("bx--tree");

      const electronics = treeItemById("electronics");
      const furniture = treeItemById("furniture");

      expect(electronics).toHaveClass("bx--tree-parent-node");
      expect(treeitemPrimaryLabel(electronics)).toContain("Electronics");
      expect(furniture).toHaveClass("bx--tree-parent-node");
      expect(treeitemPrimaryLabel(furniture)).toContain("Furniture");
    });

    it("renders leaf price in the slot after expanding a category", async () => {
      render(TreeViewGenerics);

      const electronics = treeItemById("electronics");
      const toggle = electronics.querySelector(".bx--tree-parent-node__toggle");
      expect.assert(toggle instanceof HTMLElement);

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

    it("dispatches select detail without price for category nodes", async () => {
      const onselect = vi.fn();
      render(TreeViewGenerics, { props: { onselect } });

      await user.click(treeItemById("furniture"));

      expect(onselect).toHaveBeenLastCalledWith(
        expect.objectContaining({
          id: "furniture",
          text: "Furniture",
          category: "Furniture",
          leaf: false,
        }),
      );
      expect(onselect.mock.calls.at(-1)?.[0]).not.toHaveProperty("price");
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
        TreeNode & { expanded: boolean; leaf: boolean; selected: boolean }
      >();
    });

    it("should support different ID types (string, number, union)", () => {
      // String ID
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
        StringNode & { expanded: boolean; leaf: boolean; selected: boolean }
      >();

      // Number ID
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

      // Union ID
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
        UnionNode & { expanded: boolean; leaf: boolean; selected: boolean }
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
        InferredNode & { expanded: boolean; leaf: boolean; selected: boolean }
      >();
      expectTypeOf<SelectEventDetail["id"]>().toEqualTypeOf<InferredId>();
    });

    it("should type showNode method correctly with different ID types", () => {
      // String ID - verify the component accepts string IDs
      type StringNode = { id: string; text: string };
      type StringComponent = TreeViewComponent<StringNode>;
      type StringProps = ComponentProps<StringComponent>;
      // Test that showNode accepts string by checking the prop types
      expectTypeOf<StringProps["activeId"]>().toEqualTypeOf<
        string | undefined
      >();

      // Number ID
      type NumberNode = { id: number; text: string };
      type NumberComponent = TreeViewComponent<NumberNode>;
      type NumberProps = ComponentProps<NumberComponent>;
      expectTypeOf<NumberProps["activeId"]>().toEqualTypeOf<
        number | undefined
      >();

      // Union ID
      type UnionId = "folder1" | "folder2" | "file1";
      type UnionNode = { id: UnionId; text: string };
      type UnionComponent = TreeViewComponent<UnionNode>;
      type UnionProps = ComponentProps<UnionComponent>;
      expectTypeOf<UnionProps["activeId"]>().toEqualTypeOf<
        UnionId | undefined
      >();
    });

    it("should type context properties correctly with different ID types", () => {
      type CustomNode = { id: string; text: string };
      type ComponentType = TreeViewComponent<CustomNode>;
      type Props = ComponentProps<ComponentType>;

      // These props use Node["id"] which should be inferred as string
      expectTypeOf<Props["activeId"]>().toEqualTypeOf<string | undefined>();
      expectTypeOf<Props["selectedIds"]>().toEqualTypeOf<
        ReadonlyArray<string> | undefined
      >();
      expectTypeOf<Props["expandedIds"]>().toEqualTypeOf<
        ReadonlyArray<string> | undefined
      >();
    });

    it("should type event details correctly with different ID types", () => {
      type CustomNode = {
        id: number;
        text: string;
        metadata?: { count: number };
      };
      type ComponentType = TreeViewComponent<CustomNode>;
      type Events = ComponentEvents<ComponentType>;

      type SelectEvent = Events["select"];
      type SelectDetail = SelectEvent extends CustomEvent<infer T> ? T : never;
      expectTypeOf<SelectDetail["id"]>().toEqualTypeOf<number>();
      expectTypeOf<SelectDetail>().toEqualTypeOf<
        CustomNode & { expanded: boolean; leaf: boolean; selected: boolean }
      >();

      type ToggleEvent = Events["toggle"];
      type ToggleDetail = ToggleEvent extends CustomEvent<infer T> ? T : never;
      expectTypeOf<ToggleDetail["id"]>().toEqualTypeOf<number>();

      type FocusEvent = Events["focus"];
      type FocusDetail = FocusEvent extends CustomEvent<infer T> ? T : never;
      expectTypeOf<FocusDetail["id"]>().toEqualTypeOf<number>();
    });
  });

  it("supports custom label slot", () => {
    render(TreeViewSlot);

    const customLabel = screen.getByText("Custom label content");
    expect(customLabel).toBeInTheDocument();
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

  it("renders a regular li when href is not set", () => {
    render(TreeViewHref);

    const plainNode = screen.getByRole("treeitem", { name: /Plain Node/ });
    expect(plainNode.tagName).toBe("LI");
    expect(plainNode).not.toHaveAttribute("href");
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

  it("uses aria-current='page' instead of 'true' for active link nodes", () => {
    render(TreeViewHref, { activeId: "link-1" });

    const linkNode = screen.getByRole("treeitem", { name: /Link Node/ });
    expect(linkNode).toHaveAttribute("aria-current", "page");
  });

  it("does not set aria-selected on link nodes", () => {
    render(TreeViewHref, { selectedIds: ["link-1"] });

    const linkNode = screen.getByRole("treeitem", { name: /Link Node/ });
    expect(linkNode).not.toHaveAttribute("aria-selected");
  });

  it("can select a link node via click", async () => {
    const consoleLog = vi.spyOn(console, "log");

    render(TreeViewHref);

    const linkNode = screen.getByRole("treeitem", { name: /Link Node/ });
    await user.click(linkNode);

    expect(consoleLog).toHaveBeenCalledWith(
      "select",
      expect.objectContaining({
        id: "link-1",
        text: "Link Node",
        href: "/page-1",
      }),
    );
  });

  it("does not select a disabled link node via click", async () => {
    const consoleLog = vi.spyOn(console, "log");

    render(TreeViewHref);

    const disabledLink = screen.getByRole("treeitem", {
      name: /Disabled Link/,
    });
    await user.click(disabledLink);

    expect(consoleLog).not.toHaveBeenCalledWith(
      "select",
      expect.objectContaining({ id: "link-disabled" }),
    );
  });

  it("dispatches focus event for link nodes", () => {
    const consoleLog = vi.spyOn(console, "log");

    render(TreeViewHref);

    const linkNode = screen.getByRole("treeitem", { name: /Link Node/ });
    linkNode.focus();

    expect(consoleLog).toHaveBeenCalledWith(
      "focus",
      expect.objectContaining({
        id: "link-1",
        text: "Link Node",
        href: "/page-1",
      }),
    );
  });

  it("selects link node with Enter key", async () => {
    const consoleLog = vi.spyOn(console, "log");

    render(TreeViewHref);

    const linkNode = screen.getByRole("treeitem", { name: /Link Node/ });
    linkNode.focus();

    await user.keyboard("{Enter}");

    expect(consoleLog).toHaveBeenCalledWith(
      "select",
      expect.objectContaining({
        id: "link-1",
        text: "Link Node",
      }),
    );
  });

  it("selects link node with Space key", async () => {
    const consoleLog = vi.spyOn(console, "log");

    render(TreeViewHref);

    const linkNode = screen.getByRole("treeitem", { name: /Link Node/ });
    linkNode.focus();

    await user.keyboard(" ");

    expect(consoleLog).toHaveBeenCalledWith(
      "select",
      expect.objectContaining({
        id: "link-1",
        text: "Link Node",
      }),
    );
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

  it("does not add rel when target is not '_blank'", () => {
    render(TreeViewHref);

    const selfLink = screen.getByRole("treeitem", { name: /Self Target/ });
    expect(selfLink).toHaveAttribute("target", "_self");
    expect(selfLink).not.toHaveAttribute("rel");
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
    expect.assert(button instanceof HTMLElement);
    return button;
  };

  const getAllExpandedItems = () => {
    return screen.queryAllByRole("treeitem", { expanded: true });
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

  it("works with keyboard navigation (ArrowRight to expand)", async () => {
    render(TreeViewAutoCollapse, { autoCollapse: true });

    const folder1 = treeItemById("folder1");
    const folder2 = treeItemById("folder2");

    folder1.focus();
    await user.keyboard("{ArrowRight}");
    expect(folder1).toHaveAttribute("aria-expanded", "true");

    folder2.focus();
    await user.keyboard("{ArrowRight}");
    expect(folder2).toHaveAttribute("aria-expanded", "true");
    expect(folder1).toHaveAttribute("aria-expanded", "false");
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

  it("applies autoCollapse when activeId changes programmatically", async () => {
    const { rerender } = render(TreeViewAutoCollapse, { autoCollapse: true });

    const folder1 = treeItemById("folder1");
    const folder2 = treeItemById("folder2");

    // Manually expand folder1 via click
    await user.click(getToggleButton(folder1));
    expect(folder1).toHaveAttribute("aria-expanded", "true");

    // Programmatically set activeId to an item in folder2
    // This should: 1) expand folder2, 2) collapse folder1 (autoCollapse)
    await rerender({ activeId: "item3" });
    expect(folder2).toHaveAttribute("aria-expanded", "true");
    expect(folder1).toHaveAttribute("aria-expanded", "false");
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

    const parent = container.querySelector("#parent");
    const subtreeId = parent?.getAttribute("aria-owns");
    expect(subtreeId).toBe("parent-subtree");

    const subtree = container.querySelector(`#${subtreeId}`);
    expect(subtree?.getAttribute("role")).toBe("group");

    const labelledBy = subtree?.getAttribute("aria-labelledby");
    expect(labelledBy).toBe("parent__label");

    const labelEl = container.querySelector(`#${labelledBy}`);
    expect(labelEl?.textContent?.trim()).toBe("Top Parent");
  });

  it("ArrowRight on an expanded parent focuses link-first-child treeitem", async () => {
    const { container } = render(TreeViewProps, {
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

    const parent = container.querySelector("#p");
    expect.assert(parent instanceof HTMLElement);
    parent.focus();

    await user.keyboard("{ArrowRight}");

    const linkChild = container.querySelector("#child-link");
    expect(linkChild?.tagName).toBe("A");
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
