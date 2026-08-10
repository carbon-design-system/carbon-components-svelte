import { render, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import TreeViewVirtualizeLazy from "./TreeView.virtualize.lazy.test.svelte";

const findRowById = (id: string) =>
  document.querySelector(
    `[data-tree-row-id="${CSS.escape(id)}"]`,
  ) as HTMLElement | null;

describe("TreeView virtualize + hasChildren lazy load", () => {
  it("renders an expander for unloaded hasChildren parents", () => {
    render(TreeViewVirtualizeLazy);

    const root = findRowById("root-a");
    expect(root).not.toBeNull();
    expect(root).toHaveAttribute("aria-expanded", "false");
    expect(root?.querySelector(".bx--tree-parent-node__toggle")).not.toBeNull();
    expect(findRowById("root-a-child-1")).toBeNull();
  });

  it("mounts fetched children as virtual rows after expand resolves", async () => {
    const { component } = render(TreeViewVirtualizeLazy);

    const root = findRowById("root-a");
    expect.assert(root instanceof HTMLElement);
    const caret = root.querySelector(
      ".bx--tree-parent-node__toggle",
    ) as HTMLElement;
    await user.click(caret);
    await tick();

    expect(findRowById("root-a__loading")).not.toBeNull();
    expect(findRowById("root-a__loading")).toHaveAttribute(
      "aria-disabled",
      "true",
    );

    component.resolveLoad();
    await waitFor(() => {
      expect(findRowById("root-a__loading")).toBeNull();
      expect(findRowById("root-a-child-1")).not.toBeNull();
      expect(findRowById("root-a-child-2")).not.toBeNull();
    });
    expect(findRowById("root-a-child-1")).toHaveAttribute("aria-level", "2");
  });
});
