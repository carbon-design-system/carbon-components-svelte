// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import JsonViewer from "./JsonViewer.test.svelte";

describe("JsonViewer server render", () => {
  it("renders the expanded rows with their tree metadata", () => {
    const { document } = renderSSR(JsonViewer);
    const rows = [...document.querySelectorAll("[role='treeitem']")];

    expect(rows.map((row) => row.getAttribute("aria-level"))).toEqual([
      "1",
      "2",
      "2",
      "2",
      "2",
    ]);
    expect(rows[2]).toHaveAttribute("aria-posinset", "2");
    expect(rows[2]).toHaveAttribute("aria-setsize", "4");
    expect(rows[2]).toHaveAttribute("aria-expanded", "false");
  });

  it("gives the first row the tab stop before hydration", () => {
    const { document } = renderSSR(JsonViewer);
    const stops = [...document.querySelectorAll("[role='treeitem']")].filter(
      (row) => row.getAttribute("tabindex") === "0",
    );

    expect(stops).toHaveLength(1);
    expect(stops[0]).toHaveAttribute("aria-level", "1");
  });

  it("renders a window of a large tree, not all of it", () => {
    const value = Array.from({ length: 10_000 }, (_, i) => ({ i }));
    const { document } = renderSSR(JsonViewer, {
      value,
      options: { height: 240 },
    });

    const rows = document.querySelectorAll("[role='treeitem']");
    expect(rows.length).toBeLessThan(40);
    expect(rows[1]).toHaveAttribute("aria-setsize", "10000");
  });

  it("finds the matches of a search and opens their ancestors", () => {
    const { document } = renderSSR(JsonViewer, { query: "needle" });

    expect(document.querySelectorAll(".bx--json-viewer__mark")).toHaveLength(1);
    expect(document.querySelector("[aria-current='true']")).toHaveTextContent(
      "deeper",
    );
  });
});
