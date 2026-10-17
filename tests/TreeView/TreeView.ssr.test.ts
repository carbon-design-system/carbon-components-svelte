// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import TreeViewSsr from "./TreeViewSsr.test.svelte";

describe("TreeView server render", () => {
  it("gives the first row the tab stop before hydration", () => {
    const { document } = renderSSR(TreeViewSsr);
    const rows = [...document.querySelectorAll("[role='treeitem']")];

    expect(rows[0]).toHaveAttribute("tabindex", "0");
    for (const row of rows.slice(1)) {
      expect(row).toHaveAttribute("tabindex", "-1");
    }
  });

  it("skips a disabled first row", () => {
    const { document } = renderSSR(TreeViewSsr, { firstDisabled: true });
    const stops = [...document.querySelectorAll("[role='treeitem']")].filter(
      (row) => row.getAttribute("tabindex") === "0",
    );

    expect(stops).toHaveLength(1);
    expect(stops[0]).toHaveAttribute("data-tree-row-id", "b");
  });
});
