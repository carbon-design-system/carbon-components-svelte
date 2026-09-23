import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import TreeViewActiveSelect from "./TreeViewActiveSelect.test.svelte";

describe("TreeView auto-select on active node", () => {
  it("auto-selects a node when it becomes active, exactly once", async () => {
    const { component } = render(TreeViewActiveSelect);
    await tick();

    component.activeId = 1;
    await tick();
    expect(component.selectedIds).toEqual([1]);

    component.size = "default";
    await tick();
    expect(component.selectedIds).toEqual([1]);
  });

  it("does not re-select a node the consumer has deselected while it stays active", async () => {
    const { component } = render(TreeViewActiveSelect);
    await tick();

    component.activeId = 2;
    await tick();
    expect(component.selectedIds).toEqual([2]);

    component.selectedIds = [];
    await tick();
    expect(component.selectedIds).toEqual([]);
  });

  it("auto-selects a programmatic activeId after a click", async () => {
    const { component } = render(TreeViewActiveSelect);
    await tick();

    const first = document.getElementById("1");
    if (!first) throw new Error("expected node 1");
    await user.click(first);
    expect(component.selectedIds).toEqual([1]);

    component.activeId = 2;
    await tick();
    expect(component.selectedIds).toEqual([2]);
  });
});
