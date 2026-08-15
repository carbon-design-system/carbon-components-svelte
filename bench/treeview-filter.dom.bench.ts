import { cleanup, render } from "@testing-library/svelte";
import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";
import { bench, run } from "mitata";
import { tick } from "svelte";
import { filterTreeNodes } from "../src/utils/filterTreeNodes.js";

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
const tree10k = buildBushyTree(10_000);
const tree1k = buildBushyTree(1_000);

it("benchmarks TreeView filtering during search keystroke", async () => {
  // No `.gc("inner")` on DOM benches: forcing GC after every iteration over
  // a large jsdom DOM object graph can induce thermal throttling that
  // invalidates all numbers (including unrelated cases in the same run).
  // See CONTRIBUTING.md for details.

  bench("filter keystroke, TreeView 10000 nodes (virtualized)", function* () {
    const fullTree = tree10k;
    const predicateA = (node: TreeNode) => node.text.includes("1");
    const predicateB = (node: TreeNode) => node.text.includes("2");

    // Pre-compute both filtered variants to measure only component update cost,
    // not filterTreeNodes cost
    const filteredA = filterTreeNodes(fullTree, predicateA);
    const filteredB = filterTreeNodes(fullTree, predicateB);

    // Alternating predicates guarantee the prop genuinely changes every
    // iteration — without this, the framework might short-circuit updates.
    let predicateCount = 0;

    const result = render(TreeView, {
      props: { nodes: filteredA, labelText: "Tree", virtualize: true },
    });

    yield async () => {
      const filtered = predicateCount++ % 2 === 0 ? filteredA : filteredB;
      result.rerender({
        nodes: filtered,
        labelText: "Tree",
        virtualize: true,
      });
      await tick();
    };

    cleanup();
  });

  bench(
    "filter keystroke, TreeView 1000 nodes (not virtualized)",
    function* () {
      const fullTree = tree1k;
      const predicateA = (node: TreeNode) => node.text.includes("1");
      const predicateB = (node: TreeNode) => node.text.includes("2");

      const filteredA = filterTreeNodes(fullTree, predicateA);
      const filteredB = filterTreeNodes(fullTree, predicateB);

      let predicateCount = 0;

      const result = render(TreeView, {
        props: { nodes: filteredA, labelText: "Tree" },
      });

      yield async () => {
        const filtered = predicateCount++ % 2 === 0 ? filteredA : filteredB;
        result.rerender({ nodes: filtered, labelText: "Tree" });
        await tick();
      };

      cleanup();
    },
  );

  await run({ print: (line) => process.stdout.write(`${line}\n`) });
}, 180_000);
