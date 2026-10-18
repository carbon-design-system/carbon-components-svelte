import { render, waitFor } from "@testing-library/svelte";
import TreeViewShowNode from "./TreeView.deepReveal.test.svelte";

describe("TreeView deep reveal", () => {
  // Past two stagger boundaries (every 16 levels) so showNode must wait
  // through the deferred reveal before it can focus the target.
  const DEPTH = 50;

  it("showNode waits through the staggered reveal to focus a node 50 levels deep", async () => {
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
