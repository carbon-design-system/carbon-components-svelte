import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import TreeViewLazyLoad from "./TreeView.lazyLoad.test.svelte";

// The root row's `aria-owns`-referenced subtree contains the `children` slot
// content once expanded, which pollutes accessible-name computation in jsdom
// (no real stylesheet applies `.bx--tree-node--hidden`). Look it up by id
// instead, matching this suite's existing convention for parent rows.
function treeItemById(id: string): HTMLElement {
  const el = document.getElementById(id);
  expect.assert(el instanceof HTMLElement);
  return el;
}

describe("TreeView lazy loading (hasChildren + children slot)", () => {
  it("renders an expander for a hasChildren node with no nodes yet", () => {
    render(TreeViewLazyLoad);

    const root = treeItemById("root");
    expect(root).toHaveAttribute("aria-expanded", "false");
    expect(
      root.querySelector(".bx--tree-parent-node__toggle"),
    ).toBeInTheDocument();
  });

  it("renders the children slot while unresolved, then swaps in loaded children", async () => {
    const { component } = render(TreeViewLazyLoad);

    const root = treeItemById("root");
    const toggle = root.querySelector(".bx--tree-parent-node__toggle");
    expect.assert(toggle instanceof HTMLElement);

    await user.click(toggle);

    expect(root).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/Loading Root/)).toBeInTheDocument();
    expect(
      screen.queryByRole("treeitem", { name: "Child" }),
    ).not.toBeInTheDocument();

    component.resolveLoad();
    await screen.findByRole("treeitem", { name: "Child" });

    expect(screen.queryByText(/Loading Root/)).not.toBeInTheDocument();
  });
});
