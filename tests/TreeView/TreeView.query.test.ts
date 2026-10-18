import { render, screen, waitFor } from "@testing-library/svelte";
import { flushMacrotask } from "../utils/flush-macrotask";
import { findRowById, treeItemById } from "../utils/tree-item-by-id";
import { user } from "../utils/user";
import { levelNodes } from "./fixtures";
import TreeViewGetNode from "./TreeView.getNode.test.svelte";
import TreeViewShowNodeIdEscape from "./TreeView.showNode.idEscape.test.svelte";
import TreeViewShowNode from "./TreeView.showNode.test.svelte";

describe("TreeView.getNode / getNodes", () => {
  const getButton = (testId: string) => screen.getByTestId(testId);

  it("returns the matching node for a nested id", async () => {
    const onGetNode = vi.fn();
    render(TreeViewGetNode, { onGetNode });
    await user.click(getButton("get-node"));

    expect(onGetNode).toHaveBeenCalledWith(
      expect.objectContaining({ id: 3, text: "Level 3 - Target" }),
    );
  });

  it("returns null for an id with no matching node", async () => {
    const onGetNode = vi.fn();
    render(TreeViewGetNode, { onGetNode });
    await user.click(getButton("get-missing-node"));

    expect(onGetNode).toHaveBeenCalledWith(null);
  });

  it("finds a node that only exists after nodes is replaced", async () => {
    const onGetNode = vi.fn();
    const { rerender } = render(TreeViewGetNode, { onGetNode });

    await rerender({
      nodes: [...levelNodes(), { id: "late", text: "Loaded later" }],
    });
    await user.click(getButton("get-late-node"));

    expect(onGetNode).toHaveBeenCalledWith(
      expect.objectContaining({ id: "late", text: "Loaded later" }),
    );
  });

  it("resolves multiple ids and omits ids with no matching node", async () => {
    const onGetNodes = vi.fn();
    render(TreeViewGetNode, { onGetNodes });
    await user.click(getButton("get-nodes"));

    expect(onGetNodes).toHaveBeenCalledWith([
      expect.objectContaining({ id: 3 }),
      expect.objectContaining({ id: 0 }),
    ]);
  });
});

describe("TreeView.showNode with options", () => {
  const getButton = (testId: string) => screen.getByTestId(testId);

  const getExpandedCount = () => {
    return screen.queryAllByRole("treeitem", { expanded: true }).length;
  };

  const getSelectedItem = () => {
    return screen.queryByRole("treeitem", { selected: true });
  };

  let component: TreeViewShowNode;

  beforeEach(() => {
    ({ component } = render(TreeViewShowNode));
  });

  it("shows node with default behavior (expand, select, focus)", async () => {
    await user.click(getButton("show-default"));

    expect(getExpandedCount()).toBe(2);
    expect(getSelectedItem()).toHaveTextContent("Level 3 - Target");
    expect(
      screen.getByRole("treeitem", { name: "Level 3 - Target" }),
    ).toHaveFocus();
    expect(component.activeId).toBe(3);
    expect(component.selectedIds).toEqual([3]);
    expect([...component.expandedIds].sort()).toEqual([1, 2]);
  });

  it("expands node without selecting (expand: true, select: false, focus: false)", async () => {
    await user.click(getButton("expand-only"));

    expect(getExpandedCount()).toBe(2);
    expect(getSelectedItem()).not.toBeInTheDocument();
    expect(component.activeId).toBe("");
    expect(component.selectedIds).toEqual([]);
  });

  it("leaves focus where it was with focus: false", async () => {
    await user.click(getButton("expand-only"));
    await flushMacrotask();

    expect(getButton("expand-only")).toHaveFocus();
    expect(treeItemById(3)).not.toHaveFocus();
  });

  it("selects node without expanding or focusing (expand: false, select: true, focus: false)", async () => {
    await user.click(getButton("select-only"));

    expect(getExpandedCount()).toBe(0);
    expect(findRowById(3)).toBeNull();
    expect(screen.queryByRole("treeitem", { selected: true })).toBeNull();
    expect(component.activeId).toBe(3);
    expect(component.selectedIds).toEqual([3]);
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
