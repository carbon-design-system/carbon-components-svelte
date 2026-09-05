// Pure-logic benchmark: no jsdom, no Svelte, run directly via bun (`bunx ostia bench bench/<this file>.bench.ts`, optionally filtered — see CONTRIBUTING.md).
// TreeView's own virtualization index (src/utils/treeVirtualIndex.js) documents
// specific complexity claims in its module docstring:
//   - build: O(n)
//   - getRowAt / findIndexById: O(siblings along the path) — flat/wide lists
//     are O(index), not O(depth)
//   - collectRows: one cursor walk, O(path-to-start + window), not
//     O(width × window) from independent getRowAt calls
// This verifies those claims empirically rather than trusting the comment,
// and directly validates the collectRows optimization against the naive
// per-row alternative it's documented as improving on.
import { group, range, task } from "ostia";
import { createTreeVirtualIndex } from "../src/utils/treeVirtualIndex.js";

type Node = {
  id: number;
  nodes?: Node[];
};

// Same shape generator as treeCheckboxState.bench.ts: single-root,
// branching-factor-N tree with `totalNodes` nodes total.
function buildTree(totalNodes: number, branching = 4): Node[] {
  let created = 0;

  function makeNode(): Node {
    created += 1;
    return { id: created, nodes: [] };
  }

  const root = makeNode();
  const queue: Node[] = [root];

  while (created < totalNodes && queue.length > 0) {
    const parent = queue.shift();
    if (!parent) break;
    for (let i = 0; i < branching && created < totalNodes; i++) {
      const child = makeNode();
      parent.nodes?.push(child);
      queue.push(child);
    }
  }

  return [root];
}

function allIds(nodes: Node[]): Set<number> {
  const ids = new Set<number>();
  const stack = [...nodes];
  while (stack.length > 0) {
    const node = stack.pop();
    if (!node) continue;
    ids.add(node.id);
    if (node.nodes) stack.push(...node.nodes);
  }
  return ids;
}

// bushy (branching=4, the default TreeView shape) vs flat (branching=size, a
// single level with size-1 direct children) — the two shapes the docstring
// explicitly distinguishes ("flat/wide lists are O(index), not O(depth)").
const SHAPES: Array<[string, (size: number) => number]> = [
  ["bushy", () => 4],
  ["flat", (size) => size],
];

group("createTreeVirtualIndex build — bushy, all expanded", () => {
  for (const size of range(100, 10_000)) {
    const nodes = buildTree(size, 4);
    const expandedIds = allIds(nodes);
    task(`${size} nodes`, () => createTreeVirtualIndex(nodes, expandedIds));
  }
});

for (const [shapeName, branchingFor] of SHAPES) {
  group(`getRowAt(last index) — ${shapeName}, all expanded`, () => {
    for (const size of range(100, 10_000)) {
      const nodes = buildTree(size, branchingFor(size));
      const expandedIds = allIds(nodes);
      const index = createTreeVirtualIndex(nodes, expandedIds);
      task(`${size} nodes`, () => index.getRowAt(index.totalCount - 1));
    }
  });

  group(`findIndexById(last id) — ${shapeName}, all expanded`, () => {
    for (const size of range(100, 10_000)) {
      const nodes = buildTree(size, branchingFor(size));
      const expandedIds = allIds(nodes);
      const index = createTreeVirtualIndex(nodes, expandedIds);
      // The highest BFS-assigned id isn't necessarily last in document
      // order for a bushy tree (only for flat, where BFS insertion order
      // and document order coincide) — derive the true last-in-document-
      // order id from getRowAt so both benches target the same node.
      const lastRow = index.getRowAt(index.totalCount - 1);
      const targetId = lastRow ? lastRow.node.id : size;
      task(`${size} nodes`, () => index.findIndexById(targetId));
    }
  });
}

const WINDOW_SIZE = 30;

// bushy barely benefits (each individual getRowAt call is already cheap on a
// bushy tree — see the getRowAt results above), so this pairing is repeated
// on the flat shape too, where individual getRowAt calls are the expensive
// O(index) case — that's where batching into one cursor walk should actually
// matter.
for (const [shapeName, branchingFor] of SHAPES) {
  // The optimization: one cursor walk collects a 30-row window near the end
  // of the tree in a single pass.
  group(
    `collectRows, 30-row window near end — ${shapeName}, all expanded`,
    () => {
      for (const size of range(100, 10_000)) {
        const nodes = buildTree(size, branchingFor(size));
        const expandedIds = allIds(nodes);
        const index = createTreeVirtualIndex(nodes, expandedIds);
        const start = index.totalCount - WINDOW_SIZE;
        task(`${size} nodes`, () => index.collectRows(start, index.totalCount));
      }
    },
  );

  // The naive alternative collectRows replaces: calling getRowAt
  // independently for each row in the same window. Same window, same tree,
  // same shape — isolates the win from batching into one walk vs. `window`
  // separate calls.
  group(
    `getRowAt loop (naive), 30-row window near end — ${shapeName}, all expanded`,
    () => {
      for (const size of range(100, 10_000)) {
        const nodes = buildTree(size, branchingFor(size));
        const expandedIds = allIds(nodes);
        const index = createTreeVirtualIndex(nodes, expandedIds);
        const start = index.totalCount - WINDOW_SIZE;
        task(`${size} nodes`, () => {
          const rows = [];
          for (let i = start; i < index.totalCount; i++) {
            rows.push(index.getRowAt(i));
          }
          return rows;
        });
      }
    },
  );
}
