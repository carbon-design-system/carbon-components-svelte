import { render, screen, waitFor } from "@testing-library/svelte";
import type TreeViewComponent from "carbon-components-svelte/TreeView/TreeView.svelte";
import type {
  TreeViewExpandedChange as ExpandedChangeDetail,
  TreeViewSelectionChange as SelectionChangeDetail,
  TreeNode,
} from "carbon-components-svelte/TreeView/TreeView.svelte";
import type { ComponentEvents, ComponentProps } from "svelte";
import { tick } from "svelte";
import { flushMacrotask } from "../utils/flush-macrotask";
import { treeItemById } from "../utils/tree-item-by-id";
import { user } from "../utils/user";
import { cloudProductsSubset } from "./fixtures";
import { expectOneUnhandledRejection, getAllExpandedItems } from "./helpers";
import TreeViewChangeEvents from "./TreeView.changeEvents.test.svelte";
import TreeViewActiveSelect from "./TreeViewActiveSelect.test.svelte";

type ToggleChangeDetail = {
  expandedIds: ReadonlyArray<string | number>;
  added: Array<string | number>;
  removed: Array<string | number>;
};

const renderExpandedChange = (
  props: Partial<ComponentProps<TreeViewChangeEvents>> = {},
) => render(TreeViewChangeEvents, { nodes: cloudProductsSubset(), ...props });

function lastToggleDetail(spy: ReturnType<typeof vi.fn>): ToggleChangeDetail {
  return spy.mock.calls.at(-1)?.[0] as ToggleChangeDetail;
}

describe("TreeView toggle:change", () => {
  it("fires on caret-click expand and collapse with single-id delta", async () => {
    const onToggleChange = vi.fn();
    const onToggle = vi.fn();
    renderExpandedChange({ onToggleChange, onToggle });

    const toggle = treeItemById(1).querySelector(
      ".bx--tree-parent-node__toggle",
    );
    assert(toggle instanceof HTMLElement);

    await user.click(toggle);
    await waitFor(() => expect(onToggleChange).toHaveBeenCalledTimes(1));
    expect(lastToggleDetail(onToggleChange)).toEqual({
      expandedIds: [1],
      added: [1],
      removed: [],
    });
    // Per-node `toggle` still fires (no regression).
    expect(onToggle).toHaveBeenCalledTimes(1);

    await user.click(toggle);
    await waitFor(() => expect(onToggleChange).toHaveBeenCalledTimes(2));
    expect(lastToggleDetail(onToggleChange)).toEqual({
      expandedIds: [],
      added: [],
      removed: [1],
    });
    expect(onToggle).toHaveBeenCalledTimes(2);
  });

  it("expandAll() emits exactly once with expandable ids added", async () => {
    const onToggleChange = vi.fn();
    renderExpandedChange({ onToggleChange });

    await user.click(screen.getByTestId("expand-all"));
    await waitFor(() => expect(onToggleChange).toHaveBeenCalledTimes(1));

    const detail = lastToggleDetail(onToggleChange);
    // Only expandable nodes (loaded children or hasChildren) — leaves are
    // no-ops for descent and are omitted to keep large trees cheap.
    const expandableIds = [1, 2, 7, 9];
    expect(
      [...detail.expandedIds].sort((a, b) => Number(a) - Number(b)),
    ).toEqual(expandableIds);
    expect([...detail.added].sort((a, b) => Number(a) - Number(b))).toEqual(
      expandableIds,
    );
    expect(detail.removed).toEqual([]);
  });

  it("collapseAll() emits once with all ids removed", async () => {
    const onToggleChange = vi.fn();
    renderExpandedChange({
      onToggleChange,
      expandedIds: [1, 2, 7, 9],
    });

    await user.click(screen.getByTestId("collapse-all"));
    await waitFor(() => expect(onToggleChange).toHaveBeenCalledTimes(1));

    const detail = lastToggleDetail(onToggleChange);
    expect(detail.expandedIds).toEqual([]);
    expect(detail.added).toEqual([]);
    expect([...detail.removed].sort()).toEqual([1, 2, 7, 9]);
  });

  it("expandNodes(filter) emits the matched added ids", async () => {
    const onToggleChange = vi.fn();
    renderExpandedChange({ onToggleChange });

    await user.click(screen.getByTestId("expand-nodes"));
    await waitFor(() => expect(onToggleChange).toHaveBeenCalledTimes(1));

    const detail = lastToggleDetail(onToggleChange);
    expect(detail.added).toContain(1);
    expect(detail.expandedIds).toContain(1);
    expect(detail.removed).toEqual([]);
  });

  it("collapseNodes(filter) emits the matched removed ids", async () => {
    const onToggleChange = vi.fn();
    renderExpandedChange({
      onToggleChange,
      expandedIds: [1, 7],
    });

    await user.click(screen.getByTestId("collapse-nodes"));
    await waitFor(() => expect(onToggleChange).toHaveBeenCalledTimes(1));

    const detail = lastToggleDetail(onToggleChange);
    expect(detail.removed).toEqual([1]);
    expect(detail.expandedIds).toEqual([7]);
    expect(detail.added).toEqual([]);
  });

  it("showNode(id, { expand: true }) emits the ancestor ids added", async () => {
    const onToggleChange = vi.fn();
    renderExpandedChange({ onToggleChange });

    await user.click(screen.getByTestId("show-node"));
    await waitFor(() => expect(onToggleChange).toHaveBeenCalledTimes(1));

    const detail = lastToggleDetail(onToggleChange);
    // Apache Spark (id 3) ancestors: Analytics (1) and IBM Analytics Engine (2).
    expect([...detail.added].sort()).toEqual([1, 2]);
    expect([...detail.expandedIds].sort()).toEqual([1, 2]);
    expect(detail.removed).toEqual([]);
  });

  it("autoCollapse sibling collapse includes the sibling in removed", async () => {
    const onToggleChange = vi.fn();
    renderExpandedChange({
      onToggleChange,
      autoCollapse: true,
      expandedIds: [1, 7],
    });

    // Activating a node under Analytics (1) collapses its sibling Blockchain (7).
    await user.click(screen.getByTestId("auto-collapse"));
    await waitFor(() => expect(onToggleChange).toHaveBeenCalledTimes(1));

    const detail = lastToggleDetail(onToggleChange);
    expect(detail.removed).toContain(7);
    expect(detail.expandedIds).not.toContain(7);
  });

  it("external prop change emits once", async () => {
    const onToggleChange = vi.fn();
    renderExpandedChange({ onToggleChange });

    await user.click(screen.getByTestId("set-prop"));
    await waitFor(() => expect(onToggleChange).toHaveBeenCalledTimes(1));

    expect(lastToggleDetail(onToggleChange)).toEqual({
      expandedIds: [1],
      added: [1],
      removed: [],
    });
  });

  it("does not fire on a no-op set", async () => {
    const onToggleChange = vi.fn();
    renderExpandedChange({
      onToggleChange,
      expandedIds: [1],
    });

    await user.click(screen.getByTestId("noop-set"));
    await tick();
    await tick();

    expect(onToggleChange).not.toHaveBeenCalled();
  });

  it("does not fire for selection-only changes", async () => {
    const onToggleChange = vi.fn();
    renderExpandedChange({ onToggleChange });

    await user.click(screen.getByTestId("select-only"));
    await tick();
    await tick();

    expect(onToggleChange).not.toHaveBeenCalled();
  });

  it("does not fire on initial mount", async () => {
    const onToggleChange = vi.fn();
    renderExpandedChange({
      onToggleChange,
      expandedIds: [1, 2],
    });

    await tick();
    await tick();

    expect(onToggleChange).not.toHaveBeenCalled();
  });

  it("a throwing consumer neither wedges the flush nor surfaces a tracked unhandled rejection", async () => {
    // Deferred dispatch turns a consumer throw into an unhandled rejection,
    // so assert it ourselves and that the tree still updated.
    await expectOneUnhandledRejection("consumer boom", async () => {
      const onToggleChange = vi.fn(() => {
        throw new Error("consumer boom");
      });
      renderExpandedChange({ onToggleChange });

      await user.click(screen.getByTestId("expand-all"));
      await waitFor(() => expect(onToggleChange).toHaveBeenCalledTimes(1));

      // The expansion still committed despite the throw.
      expect(getAllExpandedItems()).toHaveLength(4);
    });
  });
});

describe("TreeView toggle:change generics", () => {
  it("defaults the detail ids to string | number", () => {
    type Events = ComponentEvents<TreeViewComponent<TreeNode>>;
    type Detail =
      Events["toggle:change"] extends CustomEvent<infer T> ? T : never;

    expectTypeOf<Detail>().toEqualTypeOf<
      ExpandedChangeDetail<string | number>
    >();
    expectTypeOf<Detail["expandedIds"]>().toEqualTypeOf<
      ReadonlyArray<string | number>
    >();
    expectTypeOf<Detail["added"]>().toEqualTypeOf<Array<string | number>>();
    expectTypeOf<Detail["removed"]>().toEqualTypeOf<Array<string | number>>();
  });

  it("narrows the detail ids to the node id type", () => {
    type StringNode = { id: string; text: string };
    type StringDetail =
      ComponentEvents<
        TreeViewComponent<StringNode>
      >["toggle:change"] extends CustomEvent<infer T>
        ? T
        : never;
    expectTypeOf<StringDetail["expandedIds"]>().toEqualTypeOf<
      ReadonlyArray<string>
    >();
    expectTypeOf<StringDetail["added"]>().toEqualTypeOf<Array<string>>();
    expectTypeOf<StringDetail["removed"]>().toEqualTypeOf<Array<string>>();

    type NumberNode = { id: number; text: string };
    type NumberDetail =
      ComponentEvents<
        TreeViewComponent<NumberNode>
      >["toggle:change"] extends CustomEvent<infer T>
        ? T
        : never;
    expectTypeOf<NumberDetail["expandedIds"]>().toEqualTypeOf<
      ReadonlyArray<number>
    >();
    expectTypeOf<NumberDetail["added"]>().toEqualTypeOf<Array<number>>();

    type UnionId = "a" | "b" | "c";
    type UnionNode = { id: UnionId; text: string };
    type UnionDetail =
      ComponentEvents<
        TreeViewComponent<UnionNode>
      >["toggle:change"] extends CustomEvent<infer T>
        ? T
        : never;
    expectTypeOf<UnionDetail["added"]>().toEqualTypeOf<Array<UnionId>>();
    expectTypeOf<UnionDetail["removed"]>().toEqualTypeOf<Array<UnionId>>();
  });

  it("matches the exported TreeViewExpandedChange type", () => {
    type StringNode = { id: string; text: string };
    type StringDetail =
      ComponentEvents<
        TreeViewComponent<StringNode>
      >["toggle:change"] extends CustomEvent<infer T>
        ? T
        : never;

    // The event detail is exactly the public, reusable typedef.
    expectTypeOf<StringDetail>().toEqualTypeOf<ExpandedChangeDetail<string>>();
    // The exported type defaults its Id parameter to string | number.
    expectTypeOf<ExpandedChangeDetail>().toEqualTypeOf<
      ExpandedChangeDetail<string | number>
    >();
  });
});

type Id = string | number;
type SelectChangeDetail = {
  selectedIds: ReadonlyArray<Id>;
  added: Id[];
  removed: Id[];
};

const byNumber = (a: Id, b: Id) => Number(a) - Number(b);

const lastSelectDetail = (spy: ReturnType<typeof vi.fn>): SelectChangeDetail =>
  spy.mock.calls.at(-1)?.[0] as SelectChangeDetail;

describe("TreeView select:change", () => {
  it("fires on a plain click with the new selection and delta", async () => {
    const onSelectChange = vi.fn();
    render(TreeViewChangeEvents, { onSelectChange });

    await user.click(treeItemById(0));

    await vi.waitFor(() => expect(onSelectChange).toHaveBeenCalledTimes(1));
    expect(lastSelectDetail(onSelectChange)).toEqual({
      selectedIds: [0],
      added: [0],
      removed: [],
    });
  });

  it("does not fire on initial mount", async () => {
    const onSelectChange = vi.fn();
    render(TreeViewChangeEvents, {
      selectedIds: [0, 7],
      onSelectChange,
    });

    // Give any deferred dispatch a chance to run.
    await flushMacrotask();
    expect(onSelectChange).not.toHaveBeenCalled();
  });

  it("flips delta between added and removed on Ctrl+click toggle", async () => {
    const onSelectChange = vi.fn();
    render(TreeViewChangeEvents, {
      multiselect: true,
      selectedIds: [],
      onSelectChange,
    });

    await user.click(treeItemById(0));
    await vi.waitFor(() => expect(onSelectChange).toHaveBeenCalledTimes(1));
    expect(lastSelectDetail(onSelectChange)).toEqual({
      selectedIds: [0],
      added: [0],
      removed: [],
    });

    await user.keyboard("{Control>}");
    await user.click(treeItemById(7));
    await user.keyboard("{/Control}");
    await vi.waitFor(() => expect(onSelectChange).toHaveBeenCalledTimes(2));
    expect(lastSelectDetail(onSelectChange)).toEqual({
      selectedIds: [0, 7],
      added: [7],
      removed: [],
    });

    await user.keyboard("{Control>}");
    await user.click(treeItemById(7));
    await user.keyboard("{/Control}");
    await vi.waitFor(() => expect(onSelectChange).toHaveBeenCalledTimes(3));
    expect(lastSelectDetail(onSelectChange)).toEqual({
      selectedIds: [0],
      added: [],
      removed: [7],
    });
  });

  it("fires for Ctrl+A select-all with every visible non-disabled id added", async () => {
    const onSelectChange = vi.fn();
    render(TreeViewChangeEvents, {
      multiselect: true,
      selectedIds: [],
      onSelectChange,
    });

    treeItemById(0).focus();
    await user.keyboard("{Control>}a{/Control}");

    await vi.waitFor(() => expect(onSelectChange).toHaveBeenCalledTimes(1));
    const detail = lastSelectDetail(onSelectChange);
    // Only top-level rows are visible (children collapsed); node 14 is disabled.
    expect([...detail.added].sort()).toEqual([0, 1, 7, 9]);
    expect([...detail.selectedIds].sort()).toEqual([0, 1, 7, 9]);
    expect(detail.removed).toEqual([]);
  });

  it("excludes nodes under a collapsed subtree while including visible children of an expanded one", async () => {
    const onSelectChange = vi.fn();
    render(TreeViewChangeEvents, {
      multiselect: true,
      selectedIds: [],
      // Expand node 1 (Analytics) only; its child 2 (which has grandchildren
      // 3, 4) stays collapsed, as does node 9 (Databases).
      expandedIds: [1],
      onSelectChange,
    });

    treeItemById(0).focus();
    await user.keyboard("{Control>}a{/Control}");

    await vi.waitFor(() => expect(onSelectChange).toHaveBeenCalledTimes(1));
    const detail = lastSelectDetail(onSelectChange);
    // Top-level rows (0, 1, 7, 9; 14 is disabled) plus the now-visible
    // children of expanded node 1 (2, 5, 6). Node 2's grandchildren (3, 4)
    // and node 9's children (10-13) remain hidden and must be excluded,
    // even though they're still mounted in the DOM.
    expect([...detail.added].sort((a, b) => Number(a) - Number(b))).toEqual([
      0, 1, 2, 5, 6, 7, 9,
    ]);
    expect(
      [...detail.selectedIds].sort((a, b) => Number(a) - Number(b)),
    ).toEqual([0, 1, 2, 5, 6, 7, 9]);
    expect(detail.removed).toEqual([]);
  });

  it("does not duplicate an already-selected id on Ctrl+A select-all", async () => {
    const onSelectChange = vi.fn();
    render(TreeViewChangeEvents, {
      multiselect: true,
      selectedIds: [0],
      onSelectChange,
    });

    treeItemById(0).focus();
    await user.keyboard("{Control>}a{/Control}");

    await vi.waitFor(() => expect(onSelectChange).toHaveBeenCalledTimes(1));
    const detail = lastSelectDetail(onSelectChange);
    expect([...detail.selectedIds].sort()).toEqual([0, 1, 7, 9]);
    expect(detail.selectedIds.length).toBe(new Set(detail.selectedIds).size);
  });

  it("keeps the existing selection on Ctrl+A in single-select mode", async () => {
    const onSelectChange = vi.fn();
    render(TreeViewChangeEvents, { selectedIds: [7], onSelectChange });

    treeItemById(0).focus();
    await user.keyboard("{Control>}a{/Control}");

    await flushMacrotask();
    expect(onSelectChange).not.toHaveBeenCalled();
    const selected = screen.getAllByRole("treeitem", { selected: true });
    expect(selected).toEqual([treeItemById(7)]);
  });

  it("selects numeric node ids on Ctrl+Shift+End", async () => {
    const onSelectChange = vi.fn();
    render(TreeViewChangeEvents, {
      multiselect: true,
      selectedIds: [],
      onSelectChange,
    });

    treeItemById(0).focus();
    await user.keyboard("{Control>}{Shift>}{End}{/Shift}{/Control}");

    await vi.waitFor(() => expect(onSelectChange).toHaveBeenCalledTimes(1));
    const detail = lastSelectDetail(onSelectChange);
    expect([...detail.selectedIds].sort(byNumber)).toEqual([0, 1, 7, 9]);
    expect(detail.selectedIds.every((id) => typeof id === "number")).toBe(true);
    expect(treeItemById(7)).toHaveAttribute("aria-selected", "true");
  });

  it("selects numeric node ids on Ctrl+Shift+Home", async () => {
    const onSelectChange = vi.fn();
    render(TreeViewChangeEvents, {
      multiselect: true,
      selectedIds: [],
      onSelectChange,
    });

    treeItemById(9).focus();
    await user.keyboard("{Control>}{Shift>}{Home}{/Shift}{/Control}");

    await vi.waitFor(() => expect(onSelectChange).toHaveBeenCalledTimes(1));
    expect(
      [...lastSelectDetail(onSelectChange).selectedIds].sort(byNumber),
    ).toEqual([0, 1, 7, 9]);
  });

  it("selects numeric ids for visible children on Ctrl+Shift+End", async () => {
    const onSelectChange = vi.fn();
    render(TreeViewChangeEvents, {
      multiselect: true,
      selectedIds: [],
      expandedIds: [1],
      onSelectChange,
    });

    treeItemById(0).focus();
    await user.keyboard("{Control>}{Shift>}{End}{/Shift}{/Control}");

    await vi.waitFor(() => expect(onSelectChange).toHaveBeenCalledTimes(1));
    expect(
      [...lastSelectDetail(onSelectChange).selectedIds].sort(byNumber),
    ).toEqual([0, 1, 2, 5, 6, 7, 9]);
  });

  it("merges Ctrl+Shift+End into the existing selection without duplicates", async () => {
    const onSelectChange = vi.fn();
    render(TreeViewChangeEvents, {
      multiselect: true,
      selectedIds: [0],
      onSelectChange,
    });

    treeItemById(0).focus();
    await user.keyboard("{Control>}{Shift>}{End}{/Shift}{/Control}");

    await vi.waitFor(() => expect(onSelectChange).toHaveBeenCalledTimes(1));
    const detail = lastSelectDetail(onSelectChange);
    expect(detail.selectedIds.length).toBe(new Set(detail.selectedIds).size);
    expect([...detail.added].sort(byNumber)).toEqual([1, 7, 9]);
  });

  it("fires for the imperative showNode(id, { select: true })", async () => {
    const onSelectChange = vi.fn();
    render(TreeViewChangeEvents, { selectedIds: [], onSelectChange });

    await user.click(screen.getByTestId("show-node-select"));

    await vi.waitFor(() => expect(onSelectChange).toHaveBeenCalledTimes(1));
    expect(lastSelectDetail(onSelectChange)).toEqual({
      selectedIds: [8],
      added: [8],
      removed: [],
    });
  });

  it("fires once for an external bind:selectedIds change", async () => {
    const onSelectChange = vi.fn();
    render(TreeViewChangeEvents, { selectedIds: [9], onSelectChange });

    await user.click(screen.getByTestId("set-selected"));

    await vi.waitFor(() => expect(onSelectChange).toHaveBeenCalledTimes(1));
    expect(lastSelectDetail(onSelectChange)).toEqual({
      selectedIds: [0, 7],
      added: [0, 7],
      removed: [9],
    });
  });

  it("does not fire when the same ids are reassigned (no-op set)", async () => {
    const onSelectChange = vi.fn();
    render(TreeViewChangeEvents, { selectedIds: [0, 7], onSelectChange });

    await user.click(screen.getByTestId("set-same"));

    await flushMacrotask();
    expect(onSelectChange).not.toHaveBeenCalled();
  });

  it("does not fire when only expansion changes (expandAll)", async () => {
    const onSelectChange = vi.fn();
    render(TreeViewChangeEvents, { selectedIds: [0], onSelectChange });

    await user.click(screen.getByTestId("expand-all"));

    await flushMacrotask();
    expect(onSelectChange).not.toHaveBeenCalled();
  });

  it("a throwing consumer neither wedges the flush nor surfaces a tracked unhandled rejection", async () => {
    // Deferred dispatch turns a consumer throw into an unhandled rejection,
    // so assert it ourselves and that the selection still committed.
    await expectOneUnhandledRejection("consumer boom", async () => {
      const onSelectChange = vi.fn(() => {
        throw new Error("consumer boom");
      });
      render(TreeViewChangeEvents, { selectedIds: [], onSelectChange });

      await user.click(treeItemById(0));
      await vi.waitFor(() => expect(onSelectChange).toHaveBeenCalledTimes(1));

      // The selection still committed despite the throw.
      expect(treeItemById(0)).toHaveAttribute("aria-selected", "true");
    });
  });
});

describe("TreeView select:change generics", () => {
  it("defaults the detail ids to string | number", () => {
    type Events = ComponentEvents<TreeViewComponent<TreeNode>>;
    type Detail =
      Events["select:change"] extends CustomEvent<infer T> ? T : never;

    expectTypeOf<Detail>().toEqualTypeOf<
      SelectionChangeDetail<string | number>
    >();
    expectTypeOf<Detail["selectedIds"]>().toEqualTypeOf<
      ReadonlyArray<string | number>
    >();
    expectTypeOf<Detail["added"]>().toEqualTypeOf<Array<string | number>>();
    expectTypeOf<Detail["removed"]>().toEqualTypeOf<Array<string | number>>();
  });

  it("narrows the detail ids to the node id type", () => {
    type StringNode = { id: string; text: string };
    type StringDetail =
      ComponentEvents<
        TreeViewComponent<StringNode>
      >["select:change"] extends CustomEvent<infer T>
        ? T
        : never;
    expectTypeOf<StringDetail["selectedIds"]>().toEqualTypeOf<
      ReadonlyArray<string>
    >();
    expectTypeOf<StringDetail["added"]>().toEqualTypeOf<Array<string>>();
    expectTypeOf<StringDetail["removed"]>().toEqualTypeOf<Array<string>>();

    type NumberNode = { id: number; text: string };
    type NumberDetail =
      ComponentEvents<
        TreeViewComponent<NumberNode>
      >["select:change"] extends CustomEvent<infer T>
        ? T
        : never;
    expectTypeOf<NumberDetail["selectedIds"]>().toEqualTypeOf<
      ReadonlyArray<number>
    >();
    expectTypeOf<NumberDetail["added"]>().toEqualTypeOf<Array<number>>();

    type UnionId = "a" | "b" | "c";
    type UnionNode = { id: UnionId; text: string };
    type UnionDetail =
      ComponentEvents<
        TreeViewComponent<UnionNode>
      >["select:change"] extends CustomEvent<infer T>
        ? T
        : never;
    expectTypeOf<UnionDetail["added"]>().toEqualTypeOf<Array<UnionId>>();
    expectTypeOf<UnionDetail["removed"]>().toEqualTypeOf<Array<UnionId>>();
  });

  it("matches the exported TreeViewSelectionChange type", () => {
    type StringNode = { id: string; text: string };
    type StringDetail =
      ComponentEvents<
        TreeViewComponent<StringNode>
      >["select:change"] extends CustomEvent<infer T>
        ? T
        : never;

    expectTypeOf<StringDetail>().toEqualTypeOf<SelectionChangeDetail<string>>();
    expectTypeOf<SelectionChangeDetail>().toEqualTypeOf<
      SelectionChangeDetail<string | number>
    >();
  });
});

describe("TreeView auto-select on active node", () => {
  it("does not re-select a parent node the consumer has deselected while it stays active", async () => {
    const { component } = render(TreeViewActiveSelect);
    await tick();

    component.activeId = 3;
    await tick();
    expect(component.selectedIds).toEqual([3]);

    component.selectedIds = [];
    await tick();
    expect(component.selectedIds).toEqual([]);
  });

  it("does not re-select a node the consumer has deselected while it stays active", async () => {
    const { component } = render(TreeViewActiveSelect);
    await tick();

    component.activeId = 2;
    await tick();
    expect(component.selectedIds).toEqual([2]);

    component.selectedIds = [];
    await tick();
    expect(component.selectedIds).toEqual([]);
  });

  it("auto-selects a programmatic activeId after a click", async () => {
    const { component } = render(TreeViewActiveSelect);
    await tick();

    await user.click(treeItemById(1));
    expect(component.selectedIds).toEqual([1]);

    component.activeId = 2;
    await tick();
    expect(component.selectedIds).toEqual([2]);
  });
});
