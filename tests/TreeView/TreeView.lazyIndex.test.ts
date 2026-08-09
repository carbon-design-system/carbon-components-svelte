import { render, screen, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import TreeViewLazyIndex from "./TreeView.lazyIndex.test.svelte";

describe("TreeView lazy flat index", () => {
  it("getNode / showNode work before expandAll builds the full flat index", async () => {
    // Every node is mounted; keep the tree small. We only care about lazy indexing.
    render(TreeViewLazyIndex, {
      totalRoots: 20,
      childrenPerRoot: 3,
      showNodeId: 3,
    });

    await tick();

    // getNode / showNode use the maps and must not force a full flatten.
    await user.click(screen.getByTestId("get-node"));
    expect(screen.getByTestId("get-node-result").dataset.nodeId).toBe("3");

    await user.click(screen.getByTestId("show-node"));
    await waitFor(() => {
      expect(document.getElementById("3")).toHaveFocus();
    });

    expect(screen.getByTestId("expanded-count").textContent).not.toBe(
      screen.getByTestId("total-count").textContent,
    );

    await user.click(screen.getByTestId("expand-all"));
    expect(screen.getByTestId("expanded-count").textContent).toBe(
      screen.getByTestId("total-count").textContent,
    );
  });
});
