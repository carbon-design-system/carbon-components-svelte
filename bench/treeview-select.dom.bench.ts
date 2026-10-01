import { fireEvent, render } from "@testing-library/svelte";
import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";
import { task } from "ostia";
import { tick } from "svelte";

type TreeNode = { id: number; text: string; nodes?: TreeNode[] };

/** `roots` folders of `perRoot` leaves each; every folder expanded. */
function buildTree(roots: number, perRoot: number) {
  let nextId = 0;
  const nodes: TreeNode[] = [];
  const expandedIds: number[] = [];
  for (let r = 0; r < roots; r++) {
    const id = nextId++;
    const children: TreeNode[] = [];
    for (let c = 0; c < perRoot; c++) {
      children.push({ id: nextId, text: `Node ${nextId}` });
      nextId++;
    }
    nodes.push({ id, text: `Folder ${id}`, nodes: children });
    expandedIds.push(id);
  }
  return { nodes, expandedIds };
}

// Every row stays mounted in the non-virtual tree, so a selection change
// reaches each row's context-store subscriptions. Alternate between two
// rows so every iteration deselects one and selects another.
const { nodes, expandedIds } = buildTree(100, 19);
const result = render(TreeView, {
  props: { nodes, expandedIds, labelText: "Tree" },
});
const rows = [
  result.container.querySelector('[id="1"]'),
  result.container.querySelector('[id="1981"]'),
];
let next = 0;

task("select a row, TreeView 2000 mounted rows (not virtualized)", async () => {
  await fireEvent.click(rows[next]);
  next = 1 - next;
  await tick();
});
