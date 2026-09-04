import { fireEvent, render } from "@testing-library/svelte";
import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";
import { task } from "ostia";
import { tick } from "svelte";

type TreeNode = { id: number; text: string; nodes?: TreeNode[] };

/**
 * Build a bushy hierarchical tree with ~branching children per node, filled
 * level by level using BFS until totalNodes is reached.
 * @param totalNodes Total number of nodes to create
 * @param branching Number of children per node (default 10)
 */
function buildBushyTree(totalNodes: number, branching = 10): TreeNode[] {
  if (totalNodes <= 0) return [];

  let nextId = 0;
  const root: TreeNode = { id: nextId++, text: `Node ${nextId - 1}` };
  const queue: TreeNode[] = [root];

  while (nextId < totalNodes && queue.length > 0) {
    const parent = queue.shift();
    if (!parent) break;

    parent.nodes = [];
    for (let i = 0; i < branching && nextId < totalNodes; i++) {
      const child: TreeNode = { id: nextId, text: `Node ${nextId}` };
      parent.nodes.push(child);
      queue.push(child);
      nextId++;
    }
  }

  return [root];
}

// Module-level fixtures: build trees once, reuse across iterations
// Two separate 1000-node trees, one per TreeView instance
const treeA = buildBushyTree(1_000);
const treeB = buildBushyTree(1_000);

// No forced GC on DOM benches: forcing GC after every iteration over a
// large jsdom DOM object graph can induce thermal throttling that
// invalidates all numbers (including unrelated cases in the same run). See
// CONTRIBUTING.md for details.
//
// Both instances persist for the whole file's run (ostia's suite files
// register every task up front; there's no per-task teardown hook the way
// mitata's run() drove one generator to completion, with its own cleanup(),
// before the next started). Each case's query is scoped to its own
// `result.container`, so having both TreeView instances mounted
// simultaneously doesn't create any query ambiguity.

const resultA = render(TreeView, {
  props: { nodes: treeA, labelText: "Tree" },
});

task(
  "toggle root expand/collapse, TreeView 1000 nodes (not virtualized)",
  async () => {
    // Each iteration alternates expand/collapse by clicking the toggle
    const toggle = resultA.container.querySelector(
      ".bx--tree-parent-node__toggle",
    );
    await fireEvent.click(toggle);
    await tick();
  },
);

const resultB = render(TreeView, {
  props: { nodes: treeB, labelText: "Tree", virtualize: true },
});

task(
  "toggle root expand/collapse, TreeView 1000 nodes (virtualized)",
  async () => {
    // Each iteration alternates expand/collapse by clicking the toggle
    const toggle = resultB.container.querySelector(
      ".bx--tree-parent-node__toggle",
    );
    await fireEvent.click(toggle);
    await tick();
  },
);
