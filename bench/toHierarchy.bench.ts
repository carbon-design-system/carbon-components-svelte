// Pure-logic benchmark: no jsdom, no Svelte, run directly via bun (`bun run bench/<this file>.bench.ts`, optionally filtered — see CONTRIBUTING.md).
// toHierarchy converts a flat array into a hierarchical tree by assigning item.nodes.
// IMPORTANT: toHierarchy mutates its input by assigning `item.nodes`. Each benchmark
// closure must operate on a fresh shallow clone to avoid cross-iteration state pollution.
// The "clone only" baseline lets us subtract clone overhead from the real measurements.
import { bench } from "mitata";
import { toHierarchy } from "../src/utils/toHierarchy.js";
import { runWithFilter } from "./run-with-filter.js";

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
// `.gc("inner")` forces GC before/after every sample instead of batching calls
// with no GC in between. Without it, the clone + toHierarchy allocation-heavy
// operations mis-calibrate and report numbers inflated by 20-60x. See
// CONTRIBUTING.md and dataTableSort.bench.ts for details.
bench("clone only, $size nodes", function* (state) {
  const size = state.get("size");
  const flat = buildFlatNodes(size, flatParent);
  yield () => flat.map((n) => ({ ...n }));
})
  .range("size", 100, 10_000)
  .gc("inner");

// Flat tree: every node a root. Tree has height 1, width = size.
// Exercises the root-only path in toHierarchy.
bench("toHierarchy flat, $size nodes", function* (state) {
  const size = state.get("size");
  const flat = buildFlatNodes(size, flatParent);
  yield () =>
    toHierarchy(
      flat.map((n) => ({ ...n })),
      (n) => n.pid,
    );
})
  .range("size", 100, 10_000)
  .gc("inner");

// Bushy tree: 10 children per node, roughly breadth-first fill.
// Exercises parent-child linking in the typical case.
bench("toHierarchy bushy, $size nodes", function* (state) {
  const size = state.get("size");
  const flat = buildFlatNodes(size, bushyParent);
  yield () =>
    toHierarchy(
      flat.map((n) => ({ ...n })),
      (n) => n.pid,
    );
})
  .range("size", 100, 10_000)
  .gc("inner");

// Chain tree: node i's parent is i - 1, so every node has exactly one child.
// Tree has height = size, width 1. Exercises deep recursion-like behavior
// in data structure with linear parent-child chains.
bench("toHierarchy chain, $size nodes", function* (state) {
  const size = state.get("size");
  const flat = buildFlatNodes(size, chainParent);
  yield () =>
    toHierarchy(
      flat.map((n) => ({ ...n })),
      (n) => n.pid,
    );
})
  .range("size", 100, 10_000)
  .gc("inner");

await runWithFilter();
