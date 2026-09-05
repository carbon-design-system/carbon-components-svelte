// Pure-logic benchmark: no jsdom, no Svelte, run directly via bun (`bunx ostia bench bench/<this file>.bench.ts`, optionally filtered — see CONTRIBUTING.md).
// filterTreeNodes filters a hierarchical tree by a predicate function, with options
// to include/exclude children and ancestors of matching nodes.
import { group, range, task } from "ostia";
import { filterTreeNodes } from "../src/utils/filterTreeNodes.js";

type TreeNode = {
  id: number;
  text: string;
  nodes?: TreeNode[];
};

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

/**
 * Build a chain (single-path) tree: node 0 -> node 1 -> node 2 -> ... -> node N-1.
 * @param totalNodes Number of nodes in the chain
 */
function buildChainTree(totalNodes: number): TreeNode[] {
  if (totalNodes <= 0) return [];

  let current: TreeNode = { id: 0, text: "Node 0" };
  const root = current;

  for (let i = 1; i < totalNodes; i++) {
    const child: TreeNode = { id: i, text: `Node ${i}` };
    current.nodes = [child];
    current = child;
  }

  return [root];
}

// Predicates (deterministic, used across multiple cases)
const predicateMatchNone = (n: TreeNode) => n.text.includes("zzz");
const predicateMatchFew = (n: TreeNode) => n.id % 100 === 0;
const predicateMatchAll = (_n: TreeNode) => true;

// `{ gc: true }` on every group forces `Bun.gc(true)` between trials —
// mitata's per-bench `.gc("inner")` equivalent (see CONTRIBUTING.md).
// filterTreeNodes does recursive cloning and filtering, which is
// allocation-heavy, so without it numbers inflate by 20-60x. See
// CONTRIBUTING.md and dataTableSort.bench.ts for details.

// Bushy tree, match-none predicate, default options (includeAncestors: true)
group(
  "filterTreeNodes bushy, match none",
  () => {
    for (const size of range(100, 10_000)) {
      const tree = buildBushyTree(size);
      task(`${size} nodes`, () => filterTreeNodes(tree, predicateMatchNone));
    }
  },
  { gc: true },
);

// Bushy tree, match-few predicate, default options
group(
  "filterTreeNodes bushy, match few",
  () => {
    for (const size of range(100, 10_000)) {
      const tree = buildBushyTree(size);
      task(`${size} nodes`, () => filterTreeNodes(tree, predicateMatchFew));
    }
  },
  { gc: true },
);

// Bushy tree, match-all predicate, default options
group(
  "filterTreeNodes bushy, match all",
  () => {
    for (const size of range(100, 10_000)) {
      const tree = buildBushyTree(size);
      task(`${size} nodes`, () => filterTreeNodes(tree, predicateMatchAll));
    }
  },
  { gc: true },
);

// Bushy tree, match-few predicate, with includeChildren and includeAncestors
group(
  "filterTreeNodes bushy, match few, includeChildren",
  () => {
    for (const size of range(100, 10_000)) {
      const tree = buildBushyTree(size);
      task(`${size} nodes`, () =>
        filterTreeNodes(tree, predicateMatchFew, {
          includeChildren: true,
          includeAncestors: true,
        }),
      );
    }
  },
  { gc: true },
);

// Bushy tree, match root only, with includeChildren and includeAncestors.
// Matching the root with includeChildren deep-clones the entire subtree via cloneNode,
// so a single match near the root approaches match-all cost — this is the worst-case allocation path.
group(
  "filterTreeNodes bushy, match root only, includeChildren",
  () => {
    for (const size of range(100, 10_000)) {
      const tree = buildBushyTree(size);
      task(`${size} nodes`, () =>
        filterTreeNodes(tree, (n: TreeNode) => n.id === 0, {
          includeChildren: true,
          includeAncestors: true,
        }),
      );
    }
  },
  { gc: true },
);

// Chain tree, match-few predicate, default options.
// Tests filterTreeNodes on deep/narrow structure (opposite of bushy).
group(
  "filterTreeNodes chain, match few",
  () => {
    for (const size of range(100, 10_000)) {
      const tree = buildChainTree(size);
      task(`${size} nodes`, () => filterTreeNodes(tree, predicateMatchFew));
    }
  },
  { gc: true },
);
