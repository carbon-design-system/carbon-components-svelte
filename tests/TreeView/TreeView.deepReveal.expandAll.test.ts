import { render, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import { findRowById } from "../utils/tree-item-by-id";
import TreeViewShowNode from "./TreeView.deepReveal.test.svelte";

describe("TreeView deep reveal", () => {
  // Past two stagger boundaries (every 16 levels) so the deferred reveal
  // must resume at each one.
  const DEPTH = 50;

  it("expandAll resumes the staggered reveal until a 50-level chain is mounted", async () => {
    const { component } = render(TreeViewShowNode, { props: { depth: DEPTH } });

    component.expandAll();

    await waitFor(
      () => {
        expect(findRowById(DEPTH - 1)).toBeInstanceOf(HTMLElement);
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
  }, 15_000);
});
