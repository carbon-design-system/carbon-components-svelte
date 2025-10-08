import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import TreeViewHierarchy from "./TreeView.hierarchy.test.svelte";
import TreeView from "./TreeView.test.svelte";

const testCases = [
  { name: "TreeView", component: TreeView },
  { name: "TreeView hierarchy", component: TreeViewHierarchy },
];

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

  it("can programmatically select a node without affecting expansion or focus", async () => {
    const consoleLog = vi.spyOn(console, "log");

    render(component);

    noExpandedItems();

    const selectButton = screen.getByText("Select Apache Spark");
    await user.click(selectButton);

    // Should not expand any nodes
    noExpandedItems();

    // Should update selectedIds
    expect(consoleLog).toBeCalledWith("selectedIds", [3]);

    // Should not trigger select event (no user interaction with tree)
    expect(consoleLog).not.toBeCalledWith("select", expect.any(Object));
  });
});
