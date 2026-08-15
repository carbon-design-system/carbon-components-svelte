import { render, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import TreeViewShowNode from "./TreeView.deepReveal.test.svelte";

describe("TreeView deep reveal", () => {
  const DEPTH = 200;

  it("showNode reveals and focuses a node 200 levels deep without overflowing the stack", async () => {
    const { component } = render(TreeViewShowNode, { props: { depth: DEPTH } });

    component.showDeepest();

    await waitFor(
      () => {
        const el = document.getElementById(String(DEPTH - 1));
        expect(el).toBeInstanceOf(HTMLElement);
        expect(el).toHaveFocus();
      },
      { timeout: 15_000 },
    );
  }, 30_000);

  it("expandAll mounts a 200-level chain without overflowing the stack", async () => {
    const { component } = render(TreeViewShowNode, { props: { depth: DEPTH } });

    component.expandAll();

    await waitFor(
      () => {
        expect(document.getElementById(String(DEPTH - 1))).toBeInstanceOf(
          HTMLElement,
        );
      },
      { timeout: 15_000 },
    );
  }, 30_000);

  it("expandAll on a wide shallow tree completes in a single flush (no staggering)", async () => {
    const { component } = render(TreeViewShowNode, {
      props: { shape: "bushy" },
    });

    component.expandAll();
    await tick();

    expect(document.querySelectorAll("li").length).toBe(1110);
  });

  it("setting expandedIds directly reveals a deep chain without overflowing the stack", async () => {
    const { component } = render(TreeViewShowNode, { props: { depth: DEPTH } });

    component.expandAllViaProp();

    await waitFor(
      () => {
        expect(document.getElementById(String(DEPTH - 1))).toBeInstanceOf(
          HTMLElement,
        );
      },
      { timeout: 15_000 },
    );
  }, 30_000);
});
