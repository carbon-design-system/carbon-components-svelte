import { render, screen, waitFor } from "@testing-library/svelte";
import { user } from "../setup-tests";
import TreeViewShowNodeIdEscape from "./TreeView.showNode.idEscape.test.svelte";
import TreeViewShowNode from "./TreeView.showNode.test.svelte";

describe("TreeView.showNode with options", () => {
  const getButton = (testId: string) => screen.getByTestId(testId);

  const getExpandedCount = () => {
    return screen.queryAllByRole("treeitem", { expanded: true }).length;
  };

  const getSelectedItem = () => {
    return screen.queryByRole("treeitem", { selected: true });
  };

  beforeEach(async () => {
    render(TreeViewShowNode);
    await user.click(getButton("reset"));
  });

  it("shows node with default behavior (expand, select, focus)", async () => {
    const consoleLog = vi.spyOn(console, "log");
    await user.click(getButton("show-default"));

    expect(getExpandedCount()).toBe(2);
    expect(getSelectedItem()).toHaveTextContent("Level 3 - Target");
    expect(consoleLog).toHaveBeenCalledWith("activeId", 3);
    expect(consoleLog).toHaveBeenCalledWith("selectedIds", [3]);
    expect(consoleLog).toHaveBeenCalledWith(
      "expandedIds",
      expect.arrayContaining([1, 2]),
    );
  });

  it("expands node without selecting (expand: true, select: false, focus: false)", async () => {
    const consoleLog = vi.spyOn(console, "log");

    await user.click(getButton("expand-only"));
    expect(getExpandedCount()).toBe(2);
    expect(getSelectedItem()).not.toBeInTheDocument();
    expect(consoleLog).toHaveBeenCalledWith("activeId", "");
    expect(consoleLog).toHaveBeenCalledWith("selectedIds", []);
  });

  it("selects node without expanding or focusing (expand: false, select: true, focus: false)", async () => {
    const consoleLog = vi.spyOn(console, "log");

    await user.click(getButton("select-only"));
    expect(getExpandedCount()).toBe(0);
    expect(getSelectedItem()).not.toBeInTheDocument();
    expect(consoleLog).toHaveBeenCalledWith("activeId", "");
    expect(consoleLog).toHaveBeenCalledWith("selectedIds", [3]);
  });
});

describe("TreeView.showNode id selector escaping", () => {
  it("focuses a node whose string id contains characters that must be CSS-escaped", async () => {
    render(TreeViewShowNodeIdEscape);

    await user.click(screen.getByTestId("show-special-id"));

    const target = screen.getByRole("treeitem", { name: /^Leaf$/ });
    await waitFor(() => {
      expect(target).toHaveFocus();
    });
    expect(target).toHaveAttribute("aria-selected", "true");
  });
});
