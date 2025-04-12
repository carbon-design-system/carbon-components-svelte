import { render, screen } from "@testing-library/svelte";
import type { TreeNode } from "carbon-components-svelte/TreeView/TreeView.svelte";
import { user } from "../setup-tests";
import TreeViewHierarchy from "./TreeView.hierarchy.test.svelte";
import TreeView from "./TreeView.test.svelte";

const testCases = [
  { name: "TreeView", component: TreeView },
  { name: "TreeView hierarchy", component: TreeViewHierarchy },
] as const;

describe.each(testCases)("$name", ({ component }) => {
  const getItemByName = (name: RegExp) => {
    return screen.getByRole("treeitem", {
      name,
      selected: false,
    });
  };

  const getSelectedItemByName = (name: RegExp) => {
    return screen.getByRole("treeitem", {
      name,
      selected: true,
    });
  };

  const noExpandedItems = () => {
    expect(screen.queryAllByRole("treeitem", { expanded: true })).toHaveLength(
      0,
    );
  };

  const getAllExpandedItems = () => {
    return screen.getAllByRole("treeitem", { expanded: true });
  };

  it("can select a node", async () => {
    const consoleLog = vi.spyOn(console, "log");

    render(component);

    const firstItem = getItemByName(/AI \/ Machine learning/);
    expect(firstItem).toBeInTheDocument();

    await user.click(firstItem);
    expect(getSelectedItemByName(/AI \/ Machine learning/)).toBeInTheDocument();
    expect(consoleLog).toBeCalledWith("selectedIds", [0]);
    expect(consoleLog).toBeCalledWith("select", {
      disabled: false,
      expanded: false,
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

  it("can expand some nodes", async () => {
    render(component);

    noExpandedItems();

    const expandSomeNodesButton = screen.getByText("Expand some nodes");
    await user.click(expandSomeNodesButton);

    expect(getAllExpandedItems()).toHaveLength(2);

    expect(
      screen.getByText("IBM Analytics Engine").parentNode?.parentNode,
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("can set initial active node", () => {
    render(component, { activeId: "0" });
    const activeItem = screen.getByRole("treeitem", {
      name: /AI \/ Machine learning/,
    });
    expect(activeItem).toHaveAttribute("tabindex", "0");
  });

  it("can use compact size variant", () => {
    render(component, { size: "compact" });
    const tree = screen.getByRole("tree");
    expect(tree).toHaveClass("bx--tree--compact");
  });

  it("can render nodes with icons", () => {
    render(component);
    const iconItem = screen.getByRole("treeitem", {
      name: /IBM Analytics Engine/,
    });
    expect(iconItem.querySelector("svg")).toBeInTheDocument();
  });

  it("can set initial expanded nodes", () => {
    render(component, { expandedIds: ["0", "1"] });
    const expandedItems = screen.getAllByRole("treeitem", { expanded: true });
    expect(expandedItems).toHaveLength(2);
  });

  it("can set initial multiple selected nodes", () => {
    render(component, { selectedIds: ["0", "1"] });
    const selectedItems = screen.getAllByRole("treeitem", { selected: true });
    expect(selectedItems).toHaveLength(2);
  });

  it("can programmatically expand all nodes", () => {
    const { component: treeView } = render(component);
    treeView.expandAll();
    const expandedItems = screen.getAllByRole("treeitem", { expanded: true });
    expect(expandedItems).toHaveLength(5);
  });

  it("can programmatically collapse all nodes", () => {
    const { component: treeView } = render(component, {
      expandedIds: ["0", "1", "2", "3", "4"],
    });
    treeView.collapseAll();
    noExpandedItems();
  });

  it("can programmatically expand a subset of nodes", () => {
    const { component: treeView } = render(component);
    treeView.expandNodes((node: TreeNode) => node.text.includes("Analytics"));
    const expandedItems = screen.getAllByRole("treeitem", { expanded: true });
    expect(expandedItems).toHaveLength(2);
  });

  it("can programmatically collapse a subset of nodes", () => {
    const { component: treeView } = render(component, {
      expandedIds: ["0", "1", "2", "3", "4"],
    });
    treeView.collapseNodes((node: TreeNode) => node.text.includes("Analytics"));
    const expandedItems = screen.getAllByRole("treeitem", { expanded: true });
    expect(expandedItems).toHaveLength(3);
  });

  it("can show a specific node", () => {
    const { component: treeView } = render(component);
    treeView.showNode("4");
    const activeItem = screen.getByRole("treeitem", {
      name: /IBM Cloud Pak for Data/,
    });
    expect(activeItem).toHaveAttribute("tabindex", "0");
    expect(activeItem).toHaveAttribute("aria-selected", "true");
  });

  it("can handle keyboard navigation", async () => {
    render(component);
    const firstItem = getItemByName(/AI \/ Machine learning/);
    firstItem.focus();

    await user.keyboard("{ArrowDown}");
    const secondItem = getItemByName(/IBM Analytics Engine/);
    expect(secondItem).toHaveAttribute("tabindex", "0");
    expect(secondItem).toHaveFocus();

    await user.keyboard("{ArrowUp}");
    expect(firstItem).toHaveAttribute("tabindex", "0");
    expect(firstItem).toHaveFocus();
  });

  it.only("can handle disabled nodes", () => {
    render(component);
    const disabledItem = screen.getByRole("treeitem", {
      name: /Disabled Node/,
    });
    expect(disabledItem).toHaveAttribute("aria-disabled", "true");
    expect(disabledItem).toHaveClass("bx--tree-node--disabled");
  });
});
