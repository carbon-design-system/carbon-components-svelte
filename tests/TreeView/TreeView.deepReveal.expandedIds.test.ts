import { render, waitFor } from "@testing-library/svelte";
import { findRowById } from "../utils/tree-item-by-id";
import TreeViewShowNode from "./TreeView.deepReveal.test.svelte";

describe("TreeView deep reveal", () => {
  const DEPTH = 200;

  it("setting expandedIds on a 200-level chain mounts it in time (guards against the unstaggered Svelte 5 blowup)", async () => {
    const { component } = render(TreeViewShowNode, { props: { depth: DEPTH } });

    component.expandAllViaProp();

    await waitFor(
      () => {
        expect(findRowById(DEPTH - 1)).toBeInstanceOf(HTMLElement);
      },
      { timeout: 15_000 },
    );
  }, 30_000);
});
