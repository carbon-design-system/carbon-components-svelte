// @vitest-environment node
import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";
import { renderSSR } from "../utils/ssr";

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
});
