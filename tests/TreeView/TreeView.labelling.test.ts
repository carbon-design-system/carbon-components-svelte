import { render, screen } from "@testing-library/svelte";
import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";

describe("TreeView consumer labelling", () => {
  it("falls back to the visible label", () => {
    render(TreeView, { props: { labelText: "Files", nodes: [] } });

    expect(screen.getByRole("tree")).toHaveAccessibleName("Files");
  });
});
