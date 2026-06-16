import { render, screen } from "@testing-library/svelte";
import type TreeViewComponent from "carbon-components-svelte/TreeView/TreeView.svelte";
import type {
  TreeViewSelectionChange as SelectionChangeDetail,
  TreeNode,
} from "carbon-components-svelte/TreeView/TreeView.svelte";
import type { ComponentEvents } from "svelte";
import { user } from "../utils/user";
import TreeViewSelectionChange from "./TreeViewSelectionChange.test.svelte";

type Id = string | number;
type SelectChangeDetail = {
  selectedIds: ReadonlyArray<Id>;
  added: Id[];
  removed: Id[];
};

function treeItemById(id: Id): HTMLElement {
  const el = document.getElementById(String(id));
  expect.assert(el instanceof HTMLElement);
  return el;
}

const lastDetail = (spy: ReturnType<typeof vi.fn>): SelectChangeDetail =>
  spy.mock.calls.at(-1)?.[0] as SelectChangeDetail;

describe("TreeView select:change", () => {
  it("fires on a plain click with the new selection and delta", async () => {
    const onSelectChange = vi.fn();
    render(TreeViewSelectionChange, { onSelectChange });

    await user.click(treeItemById(0));

    await vi.waitFor(() => expect(onSelectChange).toHaveBeenCalledTimes(1));
    expect(lastDetail(onSelectChange)).toEqual({
      selectedIds: [0],
      added: [0],
      removed: [],
    });
  });

  it("does not fire on initial mount", async () => {
    const onSelectChange = vi.fn();
    render(TreeViewSelectionChange, {
      selectedIds: [0, 7],
      onSelectChange,
    });

    // Give any deferred dispatch a chance to run.
    await new Promise((resolve) => setTimeout(resolve));
    expect(onSelectChange).not.toHaveBeenCalled();
  });

  it("does not corrupt selectedIds on mount when activeId is unset", async () => {
    const onSelectChange = vi.fn();
    render(TreeViewSelectionChange, { selectedIds: [], onSelectChange });

    await new Promise((resolve) => setTimeout(resolve));
    expect(onSelectChange).not.toHaveBeenCalled();
    expect(screen.queryAllByRole("treeitem", { selected: true })).toHaveLength(
      0,
    );
  });

  it("flips delta between added and removed on Ctrl+click toggle", async () => {
    const onSelectChange = vi.fn();
    render(TreeViewSelectionChange, {
      multiselect: true,
      selectedIds: [],
      onSelectChange,
    });

    // Plain click selects node 0.
    await user.click(treeItemById(0));
    await vi.waitFor(() => expect(onSelectChange).toHaveBeenCalledTimes(1));
    expect(lastDetail(onSelectChange)).toEqual({
      selectedIds: [0],
      added: [0],
      removed: [],
    });

    // Ctrl+click adds node 7.
    await user.keyboard("{Control>}");
    await user.click(treeItemById(7));
    await user.keyboard("{/Control}");
    await vi.waitFor(() => expect(onSelectChange).toHaveBeenCalledTimes(2));
    expect(lastDetail(onSelectChange)).toEqual({
      selectedIds: [0, 7],
      added: [7],
      removed: [],
    });

    // Ctrl+click again removes node 7.
    await user.keyboard("{Control>}");
    await user.click(treeItemById(7));
    await user.keyboard("{/Control}");
    await vi.waitFor(() => expect(onSelectChange).toHaveBeenCalledTimes(3));
    expect(lastDetail(onSelectChange)).toEqual({
      selectedIds: [0],
      added: [],
      removed: [7],
    });
  });

  it("fires for Ctrl+A select-all with every visible non-disabled id added", async () => {
    const onSelectChange = vi.fn();
    render(TreeViewSelectionChange, {
      multiselect: true,
      selectedIds: [],
      onSelectChange,
    });

    treeItemById(0).focus();
    await user.keyboard("{Control>}a{/Control}");

    await vi.waitFor(() => expect(onSelectChange).toHaveBeenCalledTimes(1));
    const detail = lastDetail(onSelectChange);
    // Only top-level rows are visible (children collapsed); node 14 is disabled.
    expect([...detail.added].sort()).toEqual([0, 1, 7, 9]);
    expect([...detail.selectedIds].sort()).toEqual([0, 1, 7, 9]);
    expect(detail.removed).toEqual([]);
  });

  it("fires for Ctrl+Shift+End range-extend", async () => {
    const onSelectChange = vi.fn();
    render(TreeViewSelectionChange, {
      multiselect: true,
      selectedIds: [0],
      onSelectChange,
    });

    treeItemById(0).focus();
    await user.keyboard("{Control>}{Shift>}{End}{/Shift}{/Control}");

    await vi.waitFor(() => expect(onSelectChange).toHaveBeenCalledTimes(1));
    const detail = lastDetail(onSelectChange);
    // Extends from the focused row through the last visible non-disabled row.
    expect(detail.added.length).toBeGreaterThan(0);
    expect(detail.removed).toEqual([]);
    expect(detail.selectedIds).toContain(0);
  });

  it("fires for the imperative showNode(id, { select: true })", async () => {
    const onSelectChange = vi.fn();
    render(TreeViewSelectionChange, { selectedIds: [], onSelectChange });

    await user.click(screen.getByTestId("show-node-select"));

    await vi.waitFor(() => expect(onSelectChange).toHaveBeenCalledTimes(1));
    expect(lastDetail(onSelectChange)).toEqual({
      selectedIds: [8],
      added: [8],
      removed: [],
    });
  });

  it("fires once for an external bind:selectedIds change", async () => {
    const onSelectChange = vi.fn();
    render(TreeViewSelectionChange, { selectedIds: [9], onSelectChange });

    await user.click(screen.getByTestId("set-selected"));

    await vi.waitFor(() => expect(onSelectChange).toHaveBeenCalledTimes(1));
    expect(lastDetail(onSelectChange)).toEqual({
      selectedIds: [0, 7],
      added: [0, 7],
      removed: [9],
    });
  });

  it("does not fire when the same ids are reassigned (no-op set)", async () => {
    const onSelectChange = vi.fn();
    render(TreeViewSelectionChange, { selectedIds: [0, 7], onSelectChange });

    await user.click(screen.getByTestId("set-same"));

    await new Promise((resolve) => setTimeout(resolve));
    expect(onSelectChange).not.toHaveBeenCalled();
  });

  it("does not fire when only expansion changes (expandAll)", async () => {
    const onSelectChange = vi.fn();
    render(TreeViewSelectionChange, { selectedIds: [0], onSelectChange });

    await user.click(screen.getByTestId("expand-all"));

    await new Promise((resolve) => setTimeout(resolve));
    expect(onSelectChange).not.toHaveBeenCalled();
  });

  it("a throwing consumer neither wedges the flush nor surfaces a tracked unhandled rejection", async () => {
    // Deferred dispatch turns a consumer throw into an unhandled rejection.
    // Swap out the `process` listeners so vitest's collector does not fail the
    // run, capture it ourselves, then assert the selection still committed.
    const priorListeners = process.listeners("unhandledRejection");
    process.removeAllListeners("unhandledRejection");

    const rejections: unknown[] = [];
    const capture = (reason: unknown) => rejections.push(reason);
    process.on("unhandledRejection", capture);

    try {
      const onSelectChange = vi.fn(() => {
        throw new Error("consumer boom");
      });
      render(TreeViewSelectionChange, { selectedIds: [], onSelectChange });

      await user.click(treeItemById(0));
      await vi.waitFor(() => expect(onSelectChange).toHaveBeenCalledTimes(1));

      // The selection still committed despite the throw.
      expect(treeItemById(0)).toHaveAttribute("aria-selected", "true");

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
