import { render, waitFor } from "@testing-library/svelte";
import TreeViewShowNode from "./TreeView.deepReveal.test.svelte";

describe("TreeView deep reveal", () => {
  const DEPTH = 200;

  it("showNode reveals and focuses a node 200 levels deep without overflowing the stack", async () => {
    const { component } = render(TreeViewShowNode, { props: { depth: DEPTH } });

    component.showDeepest();

    await waitFor(
      () => {
        const el = document.querySelector(`[data-tree-row-id="${DEPTH - 1}"]`);
        expect(el).toBeInstanceOf(HTMLElement);
        expect(el).toHaveFocus();
      },
      { timeout: 15_000 },
    );
  }, 30_000);
});
