// Pure-logic benchmark: no jsdom, no Svelte, run directly via bun (`bun run bench/<this file>.bench.ts`, optionally filtered — see CONTRIBUTING.md).
// resolveCheckboxState walks the whole tree on every checkedIds change (see its
// docstring), so it's the hottest path for a large TreeView with checkboxes.
import { bench } from "mitata";
import {
  resolveCheckboxState,
  toggleCheckboxNode,
} from "../src/utils/treeCheckboxState.js";
import { runWithFilter } from "./run-with-filter.js";

type Node = {
  id: number;
  nodes?: Node[];
};

// Single-root, branching-factor-4 tree with `totalNodes` nodes total —
// roughly the shape of a deep file-tree explorer.
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

// ~1/3 of nodes checked, spread through the tree so resolve exercises a mix
// of fully-checked, indeterminate, and unchecked branches.
function pickCheckedIds(totalNodes: number): number[] {
  const ids: number[] = [];
  for (let id = 1; id <= totalNodes; id++) {
    if (id % 3 === 0) ids.push(id);
  }
  return ids;
}

bench("resolveCheckboxState (cascade), $size nodes", function* (state) {
  const size = state.get("size");
  const nodes = buildTree(size);
  const checkedIds = pickCheckedIds(size);
  yield () => resolveCheckboxState(nodes, checkedIds);
}).range("size", 100, 10_000);

bench("resolveCheckboxState (no cascade), $size nodes", function* (state) {
  const size = state.get("size");
  const nodes = buildTree(size);
  const checkedIds = pickCheckedIds(size);
  yield () => resolveCheckboxState(nodes, checkedIds, { cascade: false });
}).range("size", 100, 10_000);

bench("toggleCheckboxNode (cascade check), $size nodes", function* (state) {
  const size = state.get("size");
  const nodes = buildTree(size);
  const checkedIds = pickCheckedIds(size);
  const targetId = Math.floor(size / 2);
  yield () => toggleCheckboxNode(nodes, checkedIds, targetId, true);
}).range("size", 100, 10_000);

// Unchecking walks the target's subtree plus every ancestor (a different
// code path than checking — see toggleCheckboxNode's docstring), so it gets
// its own case rather than assuming symmetric cost with the check above.
bench("toggleCheckboxNode (cascade uncheck), $size nodes", function* (state) {
  const size = state.get("size");
  const nodes = buildTree(size);
  const checkedIds = pickCheckedIds(size);
  const targetId = Math.floor(size / 2);
  yield () => toggleCheckboxNode(nodes, checkedIds, targetId, false);
}).range("size", 100, 10_000);

// Every case above uses a bushy tree (branching=4). walk/findPath/cascadableIds/
// subtreeIds are all recursive, so cost could in principle track *depth* rather
// than node count — a shape the bushy tree never stresses. These two shapes
// isolate that: a chain (branching=1, depth == node count) and a flat tree
// (branching == node count, depth 2). Confirmed safe to 20k depth with no
// stack overflow (see stack-check probe) before picking this range.
bench(
  "resolveCheckboxState (cascade), $size nodes — deep/narrow (chain)",
  function* (state) {
    const size = state.get("size");
    const nodes = buildTree(size, 1);
    const checkedIds = pickCheckedIds(size);
    yield () => resolveCheckboxState(nodes, checkedIds);
  },
).range("size", 100, 10_000);

bench(
  "resolveCheckboxState (cascade), $size nodes — wide/shallow (flat)",
  function* (state) {
    const size = state.get("size");
    const nodes = buildTree(size, size);
    const checkedIds = pickCheckedIds(size);
    yield () => resolveCheckboxState(nodes, checkedIds);
  },
).range("size", 100, 10_000);

// findPath walks root-to-target, so a chain forces it to scan the full depth
// to reach a mid-chain target — the shape most likely to expose a cost
// difference from the bushy case's shallow findPath.
bench(
  "toggleCheckboxNode (cascade check), $size nodes — deep/narrow (chain)",
  function* (state) {
    const size = state.get("size");
    const nodes = buildTree(size, 1);
    const checkedIds = pickCheckedIds(size);
    const targetId = Math.floor(size / 2);
    yield () => toggleCheckboxNode(nodes, checkedIds, targetId, true);
  },
).range("size", 100, 10_000);

await runWithFilter();
