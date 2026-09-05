// Pure-logic benchmark: no jsdom, no Svelte, run directly via bun (`bunx ostia bench bench/<this file>.bench.ts`, optionally filtered — see CONTRIBUTING.md).
// toHierarchy converts a flat array into a hierarchical tree by assigning item.nodes.
// IMPORTANT: toHierarchy mutates its input by assigning `item.nodes`. Each benchmark
// closure must operate on a fresh shallow clone to avoid cross-iteration state pollution.
// The "clone only" baseline lets us subtract clone overhead from the real measurements.
import { group, range, task } from "ostia";
import { toHierarchy } from "../src/utils/toHierarchy.js";

type Node = {
  id: number;
  pid: number | null;
  text: string;
  nodes?: Node[];
};

/**
 * Build a flat array of nodes with a given parent structure.
 * Each node is { id, pid, text }.
 * @param totalNodes Total number of nodes to create
 * @param parentFn Function that maps node index i to its parent id (or null for roots)
 */
function buildFlatNodes(
  totalNodes: number,
  parentFn: (i: number) => number | null,
): Node[] {
  const nodes: Node[] = [];
  for (let i = 0; i < totalNodes; i++) {
    nodes.push({
      id: i,
      pid: parentFn(i),
      text: `Node ${i}`,
    });
  }
  return nodes;
}

// Flat shape: every node is a root (pid null)
const flatParent = () => null;

// Bushy shape: each node's parent is Math.floor((i - 1) / 10), node 0 is root
const bushyParent = (i: number) => (i === 0 ? null : Math.floor((i - 1) / 10));

// Chain shape: node i's parent is i - 1, node 0 is root
const chainParent = (i: number) => (i === 0 ? null : i - 1);

// Baseline: clone overhead only (no toHierarchy call).
// `{ gc: true }` on every group forces `Bun.gc(true)` between trials —
// mitata's per-bench `.gc("inner")` equivalent (see CONTRIBUTING.md). Without
// it, the clone + toHierarchy allocation-heavy operations mis-calibrate and
// report numbers inflated by 20-60x. See CONTRIBUTING.md and
// dataTableSort.bench.ts for details.
group(
  "clone only",
  () => {
    for (const size of range(100, 10_000)) {
      const flat = buildFlatNodes(size, flatParent);
      task(`${size} nodes`, () => flat.map((n) => ({ ...n })));
    }
  },
  { gc: true },
);

// Flat tree: every node a root. Tree has height 1, width = size.
// Exercises the root-only path in toHierarchy.
group(
  "toHierarchy flat",
  () => {
    for (const size of range(100, 10_000)) {
      const flat = buildFlatNodes(size, flatParent);
      task(`${size} nodes`, () =>
        toHierarchy(
          flat.map((n) => ({ ...n })),
          (n) => n.pid,
        ),
      );
    }
  },
  { gc: true },
);

// Bushy tree: 10 children per node, roughly breadth-first fill.
// Exercises parent-child linking in the typical case.
group(
  "toHierarchy bushy",
  () => {
    for (const size of range(100, 10_000)) {
      const flat = buildFlatNodes(size, bushyParent);
      task(`${size} nodes`, () =>
        toHierarchy(
          flat.map((n) => ({ ...n })),
          (n) => n.pid,
        ),
      );
    }
  },
  { gc: true },
);

// Chain tree: node i's parent is i - 1, so every node has exactly one child.
// Tree has height = size, width 1. Exercises deep recursion-like behavior
// in data structure with linear parent-child chains.
group(
  "toHierarchy chain",
  () => {
    for (const size of range(100, 10_000)) {
      const flat = buildFlatNodes(size, chainParent);
      task(`${size} nodes`, () =>
        toHierarchy(
          flat.map((n) => ({ ...n })),
          (n) => n.pid,
        ),
      );
    }
  },
  { gc: true },
);
