// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import TreeViewGridSsr from "./TreeViewGridSsr.test.svelte";

const rows = (document: Document) => [
  ...document.querySelectorAll("tbody tr[data-tree-row-id]"),
];

describe("TreeViewGrid server render", () => {
  it("gives the first row the only tab stop before hydration", () => {
    const { document } = renderSSR(TreeViewGridSsr);
    const stops = document.querySelectorAll("tbody [tabindex='0']");

    expect(stops).toHaveLength(1);
    expect(stops[0]).toBe(rows(document)[0]);
  });

  it("skips a disabled first row", () => {
    const { document } = renderSSR(TreeViewGridSsr, { firstDisabled: true });
    const stops = document.querySelectorAll("tbody [tabindex='0']");

    expect(stops).toHaveLength(1);
    expect(stops[0]).toHaveAttribute("data-tree-row-id", "b");
  });

  it("gives the active row the tab stop", () => {
    const { document } = renderSSR(TreeViewGridSsr, { activeId: "c" });

    expect(document.querySelector("tbody [tabindex='0']")).toHaveAttribute(
      "data-tree-row-id",
      "c",
    );
  });

  it("renders the rows of an initially expanded node, indented by level", () => {
    const { document } = renderSSR(TreeViewGridSsr, { expandedIds: ["b"] });
    const child = document.querySelector("[data-tree-row-id='b1']");

    expect(rows(document)).toHaveLength(4);
    expect(child).toHaveAttribute("aria-level", "2");
    expect(child).toHaveAttribute(
      "style",
      expect.stringContaining("--ccs-tree-grid-level: 2"),
    );
  });

  it("renders no undefined in the markup", () => {
    const { document } = renderSSR(TreeViewGridSsr, { expandedIds: ["b"] });

    expect(document.body.innerHTML).not.toContain("undefined");
  });
});
