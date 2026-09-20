import { render, screen } from "@testing-library/svelte";
import Add from "carbon-icons-svelte/lib/Add.svelte";
import Analytics from "carbon-icons-svelte/lib/Analytics.svelte";
import { tick } from "svelte";
import type * as TreeCheckboxStateModule from "../../src/utils/tree-checkbox-state.js";
import type * as TreeVirtualIndexModule from "../../src/utils/tree-virtual-index.js";
import { isSvelte3 } from "../utils/svelte-version";
import TreeViewEqualNodes from "./TreeView.equalNodes.test.svelte";

const resolveCheckboxStateCalls: unknown[][] = [];
const createTreeVirtualIndexCalls: unknown[][] = [];

// Wrap (not replace) the real implementations so checkbox/virtualize
// behavior stays correct; only count calls, matching the
// `DatePickerRedundantSet.test.ts` pattern.
vi.mock("../../src/utils/tree-checkbox-state.js", async (importOriginal) => {
  const mod = await importOriginal<typeof TreeCheckboxStateModule>();
  return {
    ...mod,
    resolveCheckboxState: (
      ...args: Parameters<typeof mod.resolveCheckboxState>
    ) => {
      resolveCheckboxStateCalls.push(args);
      return mod.resolveCheckboxState(...args);
    },
  };
});

vi.mock("../../src/utils/tree-virtual-index.js", async (importOriginal) => {
  const mod = await importOriginal<typeof TreeVirtualIndexModule>();
  return {
    ...mod,
    createTreeVirtualIndex: (
      ...args: Parameters<typeof mod.createTreeVirtualIndex>
    ) => {
      createTreeVirtualIndexCalls.push(args);
      return mod.createTreeVirtualIndex(...args);
    },
  };
});

function observeMutations(target: Node) {
  const records: MutationRecord[] = [];
  const observer = new MutationObserver((list) => records.push(...list));
  observer.observe(target, {
    attributes: true,
    childList: true,
    subtree: true,
    characterData: true,
  });
  return { records, disconnect: () => observer.disconnect() };
}

describe("TreeView new-but-equal `nodes`", () => {
  beforeEach(() => {
    resolveCheckboxStateCalls.length = 0;
    createTreeVirtualIndexCalls.length = 0;
  });

  it("produces no DOM mutations for a new-but-equal nodes array", async () => {
    const buildNodes = () => [
      { id: "a", text: "Alpha" },
      { id: "b", text: "Beta" },
    ];
    const { rerender, container } = render(TreeViewEqualNodes, {
      nodes: buildNodes(),
    });
    const { records, disconnect } = observeMutations(container);

    // New array, same ids/text: new-but-equal.
    await rerender({ nodes: buildNodes() });
    await tick();

    disconnect();
    // Svelte 3's compiled output for `{...$$restProps}` combined with
    // `class:` directives on the same element re-applies the merged
    // `class` attribute (to the SAME value) on every component update,
    // regardless of which prop changed. Verified against the pre-fix
    // commit: it fires identically there, so it predates and is
    // unrelated to the `nodes` guard under test. Svelte 4 and 5 do not
    // reproduce it.
    const relevant = isSvelte3
      ? records.filter((record) => record.attributeName !== "class")
      : records;
    expect(relevant).toHaveLength(0);
  });

  it("keeps the same treeitem element for a new-but-equal update", async () => {
    const buildNodes = () => [
      { id: "a", text: "Alpha" },
      { id: "b", text: "Beta" },
    ];
    const { rerender } = render(TreeViewEqualNodes, { nodes: buildNodes() });
    const before = screen.getByRole("treeitem", { name: /Alpha/ });

    await rerender({ nodes: buildNodes() });
    await tick();

    const after = screen.getByRole("treeitem", { name: /Alpha/ });
    expect(after).toBe(before);
  });

  it("still re-renders when a label genuinely changes", async () => {
    const { rerender, container } = render(TreeViewEqualNodes, {
      nodes: [
        { id: "a", text: "Alpha" },
        { id: "b", text: "Beta" },
      ],
    });
    const { records, disconnect } = observeMutations(container);

    await rerender({
      nodes: [
        { id: "a", text: "Alpha Updated" },
        { id: "b", text: "Beta" },
      ],
    });
    await tick();

    disconnect();
    expect(records.length).toBeGreaterThan(0);
    expect(screen.getByText("Alpha Updated")).toBeInTheDocument();
  });

  it("renders newly lazy-loaded children after `node.nodes = children; nodes = nodes`", async () => {
    const parent: {
      id: string;
      text: string;
      nodes?: Array<{ id: string; text: string }>;
    } = { id: "p", text: "Parent" };
    const initialNodes = [parent];
    const { rerender } = render(TreeViewEqualNodes, {
      nodes: initialNodes,
      expandedIds: ["p"],
    });

    expect(screen.queryByText("Child 1")).toBeNull();

    // Lazy-load idiom: mutate the SAME node object in place, then
    // reassign `nodes` to the SAME top-level array reference. A guard
    // that only compares `nodes !== stableNodes` would wrongly treat
    // this as "nothing to do" and never redo the work.
    parent.nodes = [{ id: "c1", text: "Child 1" }];
    await rerender({ nodes: initialNodes, expandedIds: ["p"] });
    await tick();

    expect(screen.getByText("Child 1")).toBeInTheDocument();
  });

  it("renders a mutated entry after `nodes = [...nodes]`", async () => {
    const nodesArr = [
      { id: "a", text: "Alpha" },
      { id: "b", text: "Beta" },
    ];
    const { rerender } = render(TreeViewEqualNodes, { nodes: nodesArr });

    // Mutate an existing (shared) entry, then hand over a NEW array that
    // still references the SAME mutated object at index 0.
    nodesArr[0].text = "Alpha Mutated";
    await rerender({ nodes: [...nodesArr] });
    await tick();

    expect(screen.getByText("Alpha Mutated")).toBeInTheDocument();
  });

  it("re-renders when only the icon reference changes", async () => {
    const { rerender, container } = render(TreeViewEqualNodes, {
      nodes: [{ id: "a", text: "Alpha", icon: Analytics }],
    });
    const { records, disconnect } = observeMutations(container);

    await rerender({ nodes: [{ id: "a", text: "Alpha", icon: Add }] });
    await tick();

    disconnect();
    expect(records.length).toBeGreaterThan(0);
  });

  it("does not call resolveCheckboxState again for a new-but-equal update", async () => {
    const buildNodes = () => [
      { id: "a", text: "Alpha" },
      { id: "b", text: "Beta" },
    ];
    const { rerender } = render(TreeViewEqualNodes, {
      nodes: buildNodes(),
      selectionMode: "checkbox",
    });
    await tick();
    resolveCheckboxStateCalls.length = 0;

    await rerender({ nodes: buildNodes(), selectionMode: "checkbox" });
    await tick();

    expect(resolveCheckboxStateCalls).toHaveLength(0);
  });

  it("still resolves checkedIds after a genuine change in checkbox mode", async () => {
    const { rerender, component } = render(TreeViewEqualNodes, {
      nodes: [
        { id: "a", text: "Alpha" },
        { id: "b", text: "Beta" },
      ],
      selectionMode: "checkbox",
      checkedIds: ["a"],
    });
    await tick();
    resolveCheckboxStateCalls.length = 0;

    await rerender({
      nodes: [
        { id: "a", text: "Alpha" },
        { id: "b", text: "Beta" },
        { id: "c", text: "Charlie" },
      ],
      selectionMode: "checkbox",
      checkedIds: ["a"],
    });
    await tick();

    expect(resolveCheckboxStateCalls.length).toBeGreaterThan(0);
    expect(component.checkedIds).toEqual(["a"]);
  });

  it("does not call createTreeVirtualIndex again for a new-but-equal update", async () => {
    const buildNodes = () => [
      { id: "a", text: "Alpha" },
      { id: "b", text: "Beta" },
    ];
    const { rerender } = render(TreeViewEqualNodes, {
      nodes: buildNodes(),
      virtualize: true,
    });
    await tick();
    createTreeVirtualIndexCalls.length = 0;

    await rerender({ nodes: buildNodes(), virtualize: true });
    await tick();

    expect(createTreeVirtualIndexCalls).toHaveLength(0);
  });

  it("still rebuilds the virtual index for a genuine change", async () => {
    const { rerender } = render(TreeViewEqualNodes, {
      nodes: [
        { id: "a", text: "Alpha" },
        { id: "b", text: "Beta" },
      ],
      virtualize: true,
    });
    await tick();
    createTreeVirtualIndexCalls.length = 0;

    await rerender({
      nodes: [
        { id: "a", text: "Alpha" },
        { id: "b", text: "Beta" },
        { id: "c", text: "Charlie" },
      ],
      virtualize: true,
    });
    await tick();

    expect(createTreeVirtualIndexCalls.length).toBeGreaterThan(0);
  });
});
