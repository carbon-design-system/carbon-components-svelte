import { render, waitFor } from "@testing-library/svelte";
import TreeViewShowNode from "./TreeView.deepReveal.test.svelte";

describe("TreeView deep reveal", () => {
  const DEPTH = 200;

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
