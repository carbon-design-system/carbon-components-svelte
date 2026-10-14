import { render, screen } from "@testing-library/svelte";
import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";

describe("TreeView consumer labelling", () => {
  it("lets a consumer aria-label name the tree", () => {
    render(TreeView, {
      props: { labelText: "Files", nodes: [], "aria-label": "Project files" },
    });

    const tree = screen.getByRole("tree");
    expect(tree).toHaveAccessibleName("Project files");
    expect(tree).not.toHaveAttribute("aria-labelledby");
  });

  it("lets a consumer aria-labelledby name the tree", () => {
    render(TreeView, {
      props: {
        labelText: "Files",
        hideLabel: true,
        nodes: [],
        "aria-labelledby": "files-heading",
      },
    });

    expect(screen.getByRole("tree")).toHaveAttribute(
      "aria-labelledby",
      "files-heading",
    );
  });

  it("falls back to the visible label", () => {
    render(TreeView, { props: { labelText: "Files", nodes: [] } });

    expect(screen.getByRole("tree")).toHaveAccessibleName("Files");
  });
});
