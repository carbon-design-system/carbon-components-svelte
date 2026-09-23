import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import TreeViewVirtualizeHref from "./TreeView.virtualize.href.test.svelte";

describe("TreeView virtualize + href", () => {
  it("renders an anchor with role=treeitem when href is set", () => {
    render(TreeViewVirtualizeHref);

    const linkNode = screen.getByRole("treeitem", { name: /Link Node/ });
    expect(linkNode.tagName).toBe("A");
    expect(linkNode).toHaveAttribute("href", "/page-1");
    expect(linkNode).toHaveAttribute("data-tree-row-id", "link-1");
  });

  it("wraps the anchor in a li with role=none", () => {
    render(TreeViewVirtualizeHref);

    const linkNode = screen.getByRole("treeitem", { name: /Link Node/ });
    expect(linkNode.closest("li")).toHaveAttribute("role", "none");
  });

  it("renders a regular li when href is not set", () => {
    render(TreeViewVirtualizeHref);

    const plainNode = screen.getByRole("treeitem", { name: /Plain Node/ });
    expect(plainNode.tagName).toBe("LI");
    expect(plainNode).not.toHaveAttribute("href");
  });

  it("does not set href or target on disabled link nodes", () => {
    render(TreeViewVirtualizeHref);

    const disabledLink = screen.getByRole("treeitem", {
      name: /Disabled Link/,
    });
    expect(disabledLink.tagName).toBe("A");
    expect(disabledLink).not.toHaveAttribute("href");
    expect(disabledLink).not.toHaveAttribute("target");
  });

  it("sets target and rel=noopener noreferrer for _blank", () => {
    render(TreeViewVirtualizeHref);

    const blankLink = screen.getByRole("treeitem", { name: /Blank Target/ });
    expect(blankLink).toHaveAttribute("target", "_blank");
    expect(blankLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("does not add rel when target is not _blank", () => {
    render(TreeViewVirtualizeHref);

    const selfLink = screen.getByRole("treeitem", { name: /Self Target/ });
    expect(selfLink).toHaveAttribute("target", "_self");
    expect(selfLink).not.toHaveAttribute("rel");
  });

  it("does not cancel Enter on a focused link row", () => {
    render(TreeViewVirtualizeHref);

    const linkNode = screen.getByRole("treeitem", { name: /Link Node/ });
    linkNode.focus();

    const event = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
    });
    linkNode.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });

  it("selects a link row exactly once on Enter", async () => {
    const consoleLog = vi.spyOn(console, "log");

    render(TreeViewVirtualizeHref);

    const linkNode = screen.getByRole("treeitem", { name: /Link Node/ });
    linkNode.focus();

    await user.keyboard("{Enter}");

    const selectCalls = consoleLog.mock.calls.filter(
      (call) => call[0] === "select",
    );
    expect(selectCalls).toHaveLength(1);
    expect(selectCalls[0][1]).toEqual(
      expect.objectContaining({ id: "link-1" }),
    );
  });

  it("does not set aria-selected on a selected link row", () => {
    render(TreeViewVirtualizeHref, { selectedIds: ["link-1"] });

    const linkNode = screen.getByRole("treeitem", { name: /Link Node/ });
    expect(linkNode).not.toHaveAttribute("aria-selected");
  });

  it("does not set aria-selected on an unselected link row", () => {
    render(TreeViewVirtualizeHref);

    const blankLink = screen.getByRole("treeitem", { name: /Blank Target/ });
    expect(blankLink).not.toHaveAttribute("aria-selected");
  });

  it("keeps aria-selected on plain rows", () => {
    render(TreeViewVirtualizeHref, { selectedIds: ["plain-1"] });

    const plainNode = screen.getByRole("treeitem", { name: /Plain Node/ });
    expect(plainNode).toHaveAttribute("aria-selected", "true");
  });

  it("uses aria-current='page' for the active link row", () => {
    render(TreeViewVirtualizeHref, { activeId: "link-1" });

    const linkNode = screen.getByRole("treeitem", { name: /Link Node/ });
    expect(linkNode).toHaveAttribute("aria-current", "page");
  });
});
