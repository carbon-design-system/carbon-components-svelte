import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import TreeView from "./TreeView.test.svelte";
import TreeViewFlatArray from "./TreeViewFlatArray.test.svelte";

describe("TreeView", () => {
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

  it("can select a node", async () => {
    const consoleLog = vi.spyOn(console, "log");

    render(TreeView);

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

  it("can turn flat array into nested array", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(TreeViewFlatArray);
    const firstItem = getItemByName(/Blockchain/);
    expect(firstItem).toBeInTheDocument();
    await user.click(firstItem);
    expect(getSelectedItemByName(/Blockchain/)).toBeInTheDocument();
    expect(consoleLog).toBeCalledWith("selectedIds", [7]);
  });
});
