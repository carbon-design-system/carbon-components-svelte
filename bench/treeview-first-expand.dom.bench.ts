import { fireEvent, render } from "@testing-library/svelte";
import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";
import { bench, run } from "mitata";
import { tick } from "svelte";

type TreeNode = { id: number; text: string; nodes?: TreeNode[] };

// One root -> one "big" node with `childCount` flat leaf children. Isolates
// the cost the lazy-subtree-mount fix (perf(tree-view): mount collapsed
// subtrees lazily on first expansion, eabe9c3dc) moved from initial mount to
// first expansion: a huge collapsed subtree no longer pays for itself until
// someone actually opens it, but that first open now pays a real,
// previously-hidden mount cost of its own. This measures that cost
// directly, and contrasts it with steady-state re-toggling of the same
// already-mounted subtree.
function buildBigChildTree(childCount: number): TreeNode[] {
  const children: TreeNode[] = [];
  for (let i = 0; i < childCount; i++) {
    children.push({ id: i + 2, text: `Leaf ${i}` });
  }
  return [
    {
      id: 0,
      text: "Root",
      nodes: [{ id: 1, text: "Big Node", nodes: children }],
    },
  ];
}

const CHILD_COUNT = 5000;

it("benchmarks first-expansion vs steady-state toggle of a huge TreeView subtree", async () => {
  // No `.gc("inner")` — component-tier DOM bench, see CONTRIBUTING.md.

  // "First expansion" only happens once per TreeView instance by
  // definition, so — unlike a steady-state interaction bench — each
  // iteration needs a genuinely fresh, never-expanded tree. render() is
  // INSIDE the timed closure here on purpose (the mount itself is cheap and
  // not what's being isolated; a persistent instance can't be reused across
  // iterations for a "first time" event the way treeview-toggle.dom.bench.ts's
  // persistent instance can for repeated toggles).
  //
  // Uses the per-call `unmount()` render() returns, NOT testing-library's
  // global `cleanup()` — cleanup() tears down every instance rendered so
  // far in the test, including the persistent steady-state instances below,
  // not just this iteration's. (First draft used cleanup() here and it
  // silently deleted the steady-state instances before their own bench
  // cases ran, since all four cases execute inside the same it() block.)
  bench("first expand, 5000-child node (not virtualized)", function* () {
    yield async () => {
      const { container, unmount } = render(TreeView, {
        props: {
          nodes: buildBigChildTree(CHILD_COUNT),
          labelText: "Tree",
          expandedIds: [0], // root pre-expanded so "Big Node" is visible; "Big Node" itself is collapsed and never mounted its children yet
        },
      });

      const toggle = container.querySelector(
        '[id="1"] .bx--tree-parent-node__toggle',
      );
      await fireEvent.click(toggle);
      await tick();

      unmount();
    };
  });

  bench("first expand, 5000-child node (virtualized)", function* () {
    yield async () => {
      const { container, unmount } = render(TreeView, {
        props: {
          nodes: buildBigChildTree(CHILD_COUNT),
          labelText: "Tree",
          expandedIds: [0],
          virtualize: true,
        },
      });

      const toggle = container.querySelector(
        '[id="1"] .bx--tree-parent-node__toggle',
      );
      await fireEvent.click(toggle);
      await tick();

      unmount();
    };
  });

  // Steady-state: "Big Node" is expanded from the very first render (via
  // expandedIds including id 1), so it mounts immediately — same timing as
  // pre-lazy-mount-fix behavior — and stays mounted. The persistent
  // instances below are built once, OUTSIDE the timed closures, per
  // CONTRIBUTING's interaction-bench rule; each closure only fires the
  // collapse/expand click.
  const steadyNotVirtualized = render(TreeView, {
    props: {
      nodes: buildBigChildTree(CHILD_COUNT),
      labelText: "Tree",
      expandedIds: [0, 1],
    },
  });
  const steadyVirtualized = render(TreeView, {
    props: {
      nodes: buildBigChildTree(CHILD_COUNT),
      labelText: "Tree",
      expandedIds: [0, 1],
      virtualize: true,
    },
  });

  bench(
    "steady-state re-toggle, 5000-child node (not virtualized)",
    function* () {
      yield async () => {
        const toggle = steadyNotVirtualized.container.querySelector(
          '[id="1"] .bx--tree-parent-node__toggle',
        );
        await fireEvent.click(toggle);
        await tick();
      };
    },
  );

  bench("steady-state re-toggle, 5000-child node (virtualized)", function* () {
    yield async () => {
      const toggle = steadyVirtualized.container.querySelector(
        '[id="1"] .bx--tree-parent-node__toggle',
      );
      await fireEvent.click(toggle);
      await tick();
    };
  });

  // mitata defaults `print` to console.log, which vitest swallows for
  // passing tests. process.stdout.write always reaches the terminal.
  await run({ print: (line) => process.stdout.write(`${line}\n`) });

  steadyNotVirtualized.unmount();
  steadyVirtualized.unmount();
}, 180_000);
