import { cleanup, render } from "@testing-library/svelte";
import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";
import { group, range, task } from "ostia";

// Bridges the gap the pure-logic tier left open: treeVirtualIndex.bench.ts
// already confirmed the *windowing math* is O(1) in tree size, but that
// doesn't prove TreeView.svelte's actual mount cost benefits — Svelte still
// has to create and diff whatever DOM the component asks for. This mounts
// the real component both ways to check.
type TreeNode = { id: number; text: string; nodes?: TreeNode[] };

// Matches tests/TreeView/TreeView.virtualize.test.svelte's fixture shape:
// `totalRoots` collapsed roots, each with `childrenPerRoot` leaf children
// (not mounted until expanded, so collapsed root count is what drives
// non-virtualized DOM node count here).
function buildTree(totalRoots: number, childrenPerRoot = 3): TreeNode[] {
  const out: TreeNode[] = [];
  let next = 0;
  for (let r = 0; r < totalRoots; r++) {
    const rootId = next++;
    const children: TreeNode[] = [];
    for (let c = 0; c < childrenPerRoot; c++) {
      children.push({ id: next++, text: `root-${rootId}-child-${c}` });
    }
    out.push({ id: rootId, text: `root-${rootId}`, nodes: children });
  }
  return out;
}

// No forced GC here, unlike the pure-logic tier's allocation-heavy cases:
// forcing a real GC after every iteration over a large jsdom DOM object
// graph (not plain JS objects/arrays) induced sustained thermal throttling
// in testing — mitata's own reported CPU clock collapsed from ~3GHz to
// ~0.01GHz partway through, invalidating every number after that point
// (including the unrelated Dropdown case earlier in the same run). Default
// batching is what dropdown.dom.bench.ts already uses successfully.

// Every collapsed root becomes a real jsdom DOM node — jsdom element
// creation is slow, so this range is capped well below the virtualized
// one below. Growing cost here (unlike the flat case below) is the point.
group("mount TreeView, roots (collapsed), no virtualization", () => {
  for (const totalRoots of range(20, 300)) {
    const nodes = buildTree(totalRoots);
    task(`${totalRoots} roots`, () => {
      render(TreeView, { props: { nodes, labelText: "Tree" } });
      cleanup();
    });
  }
});

// Virtualized: only the visible window (~13 rows at default settings)
// mounts regardless of totalRoots — should stay flatter than the
// no-virtualization case above, though the underlying treeVirtualIndex
// build is still O(n) in total node count (see treeVirtualIndex.bench.ts)
// so this isn't expected to be perfectly flat either.
group("mount TreeView, roots (collapsed), virtualized", () => {
  for (const totalRoots of range(100, 3000)) {
    const nodes = buildTree(totalRoots);
    task(`${totalRoots} roots`, () => {
      render(TreeView, {
        props: { nodes, labelText: "Tree", virtualize: true },
      });
      cleanup();
    });
  }
});
