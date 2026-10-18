import { render, screen } from "@testing-library/svelte";
import TreeViewHref from "./TreeView.href.test.svelte";

const virtualProps = { virtualize: { maxVisibleRows: 10 }, padding: 80 };

describe("TreeView virtualize + href", () => {
  it("renders an anchor with role=treeitem inside a role=none li when href is set", () => {
    render(TreeViewHref, virtualProps);

    const linkNode = screen.getByRole("treeitem", { name: /Link Node/ });
    expect(linkNode.tagName).toBe("A");
    expect(linkNode).toHaveAttribute("href", "/page-1");
    expect(linkNode).toHaveAttribute("data-tree-row-id", "link-1");
    expect(linkNode.closest("li")).toHaveAttribute("role", "none");
  });

  it("does not set href or target on disabled link nodes", () => {
    render(TreeViewHref, virtualProps);

    const disabledLink = screen.getByRole("treeitem", {
      name: /Disabled Link/,
    });
    expect(disabledLink.tagName).toBe("A");
    expect(disabledLink).not.toHaveAttribute("href");
    expect(disabledLink).not.toHaveAttribute("target");
  });

  it("sets target and rel=noopener noreferrer for _blank", () => {
    render(TreeViewHref, virtualProps);

    const blankLink = screen.getByRole("treeitem", { name: /Blank Target/ });
    expect(blankLink).toHaveAttribute("target", "_blank");
    expect(blankLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("does not add rel when target is not _blank", () => {
    render(TreeViewHref, virtualProps);

    const selfLink = screen.getByRole("treeitem", { name: /Self Target/ });
    expect(selfLink).toHaveAttribute("target", "_self");
    expect(selfLink).not.toHaveAttribute("rel");
  });

  it("keeps aria-selected on plain rows", () => {
    render(TreeViewHref, { ...virtualProps, selectedIds: ["plain-1"] });

    const plainNode = screen.getByRole("treeitem", { name: /Plain Node/ });
    expect(plainNode).toHaveAttribute("aria-selected", "true");
  });
});
