// @vitest-environment node
import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";
import { render } from "svelte/server";
import { renderSSR } from "../utils/ssr";

const nodes = [
  { id: "a", text: "A", nodes: [{ id: "b", text: "B" }] },
  { id: "c", text: "C" },
];

describe("TreeView server render", () => {
  it("renders a multiselect tree", () => {
    const { document } = renderSSR(TreeView, {
      multiselect: true,
      nodes: [
        { id: "a", text: "A" },
        { id: "b", text: "B" },
      ],
    });

    expect(document.querySelector('[role="tree"]')).toHaveAttribute(
      "aria-multiselectable",
      "true",
    );
  });

  it.each(["highlight", "checkbox"] as const)(
    "renders identical markup for an explicit id (%s)",
    (selectionMode) => {
      const props = {
        id: "files",
        labelText: "Files",
        nodes,
        expandedIds: ["a"],
        selectionMode,
      };
      const renderRaw = () => render(TreeView, { props }).body;

      expect(renderRaw()).toBe(renderRaw());
    },
  );

  it("derives the label, subtree, and checkbox ids from the id", () => {
    const { document } = renderSSR(TreeView, {
      id: "files",
      labelText: "Files",
      nodes,
      expandedIds: ["a"],
      selectionMode: "checkbox",
    });
    const tree = document.querySelector('[role="tree"]');

    expect(tree).toHaveAttribute("id", "files");
    expect(tree).toHaveAttribute("aria-labelledby", "files-label");
    expect(document.getElementById("files-label")).toHaveTextContent("Files");
    expect(document.getElementById("files-a-subtree")).toHaveAttribute(
      "aria-labelledby",
      "files-a__label",
    );
    expect(document.getElementById("files-b-checkbox")).toHaveAttribute(
      "type",
      "checkbox",
    );
  });
});
