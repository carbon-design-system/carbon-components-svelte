import { render, screen, waitFor } from "@testing-library/svelte";
import type TreeViewComponent from "carbon-components-svelte/TreeView/TreeView.svelte";
import type {
  TreeViewExpandedChange as ExpandedChangeDetail,
  TreeNode,
} from "carbon-components-svelte/TreeView/TreeView.svelte";
import type { ComponentEvents } from "svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import TreeViewExpandedChange from "./TreeView.expandedChange.test.svelte";

type ToggleChangeDetail = {
  expandedIds: ReadonlyArray<string | number>;
  added: Array<string | number>;
  removed: Array<string | number>;
};

function lastDetail(spy: ReturnType<typeof vi.fn>): ToggleChangeDetail {
  return spy.mock.calls.at(-1)?.[0] as ToggleChangeDetail;
}

describe("TreeView toggle:change", () => {
  it("fires on caret-click expand and collapse with single-id delta", async () => {
    const onToggleChange = vi.fn();
    const onToggle = vi.fn();
    render(TreeViewExpandedChange, { onToggleChange, onToggle });

    const analytics = document.getElementById("1");
    expect.assert(analytics instanceof HTMLElement);
    const toggle = analytics.querySelector(".bx--tree-parent-node__toggle");
    expect.assert(toggle instanceof HTMLElement);

    await user.click(toggle);
    await waitFor(() => expect(onToggleChange).toHaveBeenCalledTimes(1));
    expect(lastDetail(onToggleChange)).toEqual({
      expandedIds: [1],
      added: [1],
      removed: [],
    });
    // Per-node `toggle` still fires (no regression).
    expect(onToggle).toHaveBeenCalledTimes(1);

    await user.click(toggle);
    await waitFor(() => expect(onToggleChange).toHaveBeenCalledTimes(2));
    expect(lastDetail(onToggleChange)).toEqual({
      expandedIds: [],
      added: [],
      removed: [1],
    });
    expect(onToggle).toHaveBeenCalledTimes(2);
  });

  it("expandAll() emits exactly once with every id added", async () => {
    const onToggleChange = vi.fn();
    render(TreeViewExpandedChange, { onToggleChange });

    await user.click(screen.getByTestId("expand-all"));
    await waitFor(() => expect(onToggleChange).toHaveBeenCalledTimes(1));

    const detail = lastDetail(onToggleChange);
    // `expandAll` marks every node id (parents and leaves) as expanded.
    const allIds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    expect(
      [...detail.expandedIds].sort((a, b) => Number(a) - Number(b)),
    ).toEqual(allIds);
    expect([...detail.added].sort((a, b) => Number(a) - Number(b))).toEqual(
      allIds,
    );
    expect(detail.removed).toEqual([]);
  });

  it("collapseAll() emits once with all ids removed", async () => {
    const onToggleChange = vi.fn();
    render(TreeViewExpandedChange, {
      onToggleChange,
      expandedIds: [1, 2, 7, 9],
    });

    await user.click(screen.getByTestId("collapse-all"));
    await waitFor(() => expect(onToggleChange).toHaveBeenCalledTimes(1));

    const detail = lastDetail(onToggleChange);
    expect(detail.expandedIds).toEqual([]);
    expect(detail.added).toEqual([]);
    expect([...detail.removed].sort()).toEqual([1, 2, 7, 9]);
  });

  it("expandNodes(filter) emits the matched added ids", async () => {
    const onToggleChange = vi.fn();
    render(TreeViewExpandedChange, { onToggleChange });

    await user.click(screen.getByTestId("expand-nodes"));
    await waitFor(() => expect(onToggleChange).toHaveBeenCalledTimes(1));

    const detail = lastDetail(onToggleChange);
    expect(detail.added).toContain(1);
    expect(detail.expandedIds).toContain(1);
    expect(detail.removed).toEqual([]);
  });

  it("collapseNodes(filter) emits the matched removed ids", async () => {
    const onToggleChange = vi.fn();
    render(TreeViewExpandedChange, {
      onToggleChange,
      expandedIds: [1, 7],
    });

    await user.click(screen.getByTestId("collapse-nodes"));
    await waitFor(() => expect(onToggleChange).toHaveBeenCalledTimes(1));

    const detail = lastDetail(onToggleChange);
    expect(detail.removed).toEqual([1]);
    expect(detail.expandedIds).toEqual([7]);
    expect(detail.added).toEqual([]);
  });

  it("showNode(id, { expand: true }) emits the ancestor ids added", async () => {
    const onToggleChange = vi.fn();
    render(TreeViewExpandedChange, { onToggleChange });

    await user.click(screen.getByTestId("show-node"));
    await waitFor(() => expect(onToggleChange).toHaveBeenCalledTimes(1));

    const detail = lastDetail(onToggleChange);
    // Apache Spark (id 3) ancestors: Analytics (1) and IBM Analytics Engine (2).
    expect([...detail.added].sort()).toEqual([1, 2]);
    expect([...detail.expandedIds].sort()).toEqual([1, 2]);
    expect(detail.removed).toEqual([]);
  });

  it("autoCollapse sibling collapse includes the sibling in removed", async () => {
    const onToggleChange = vi.fn();
    render(TreeViewExpandedChange, {
      onToggleChange,
      autoCollapse: true,
      expandedIds: [1, 7],
    });

    // Activating a node under Analytics (1) collapses its sibling Blockchain (7).
    await user.click(screen.getByTestId("auto-collapse"));
    await waitFor(() => expect(onToggleChange).toHaveBeenCalledTimes(1));

    const detail = lastDetail(onToggleChange);
    expect(detail.removed).toContain(7);
    expect(detail.expandedIds).not.toContain(7);
  });

  it("external prop change emits once", async () => {
    const onToggleChange = vi.fn();
    render(TreeViewExpandedChange, { onToggleChange });

    await user.click(screen.getByTestId("set-prop"));
    await waitFor(() => expect(onToggleChange).toHaveBeenCalledTimes(1));

    expect(lastDetail(onToggleChange)).toEqual({
      expandedIds: [1],
      added: [1],
      removed: [],
    });
  });

  it("does not fire on a no-op set", async () => {
    const onToggleChange = vi.fn();
    render(TreeViewExpandedChange, {
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
    render(TreeViewExpandedChange, { onToggleChange });

    await user.click(screen.getByTestId("select-only"));
    await tick();
    await tick();

    expect(onToggleChange).not.toHaveBeenCalled();
  });

  it("does not fire on initial mount", async () => {
    const onToggleChange = vi.fn();
    render(TreeViewExpandedChange, {
      onToggleChange,
      expandedIds: [1, 2],
    });

    await tick();
    await tick();

    expect(onToggleChange).not.toHaveBeenCalled();
  });

  it("a throwing consumer neither wedges the flush nor surfaces a tracked unhandled rejection", async () => {
    // Deferred dispatch turns a consumer throw into an unhandled rejection.
    // Swap out the `process` listeners so vitest's collector does not fail the
    // run, capture it ourselves, then assert the tree still updated.
    const priorListeners = process.listeners("unhandledRejection");
    process.removeAllListeners("unhandledRejection");

    const rejections: unknown[] = [];
    const capture = (reason: unknown) => rejections.push(reason);
    process.on("unhandledRejection", capture);

    try {
      const onToggleChange = vi.fn(() => {
        throw new Error("consumer boom");
      });
      render(TreeViewExpandedChange, { onToggleChange });

      await user.click(screen.getByTestId("expand-all"));
      await waitFor(() => expect(onToggleChange).toHaveBeenCalledTimes(1));

      // The expansion still committed despite the throw.
      expect(screen.getAllByRole("treeitem", { expanded: true }).length).toBe(
        4,
      );

      // Let Node emit the rejection from the deferred microtask.
      await new Promise((resolve) => setTimeout(resolve));
      expect(rejections).toHaveLength(1);
      expect((rejections[0] as Error).message).toBe("consumer boom");
    } finally {
      process.removeListener("unhandledRejection", capture);
      for (const listener of priorListeners) {
        process.on("unhandledRejection", listener);
      }
    }
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
