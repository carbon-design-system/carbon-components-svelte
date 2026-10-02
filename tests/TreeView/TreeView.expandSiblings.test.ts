import { render } from "@testing-library/svelte";
import { treeItemById } from "../utils/tree-item-by-id";
import { user } from "../utils/user";
import { findRowById } from "./helpers";
import TreeViewExpandSiblings from "./TreeView.expandSiblings.test.svelte";

const row = treeItemById;

describe.each([
  ["recursive", undefined],
  ["virtualized", true],
] as const)("TreeView * key (%s)", (_, virtualize) => {
  it("expands every expandable, enabled sibling and fires toggle for each", async () => {
    const onToggle = vi.fn();
    render(TreeViewExpandSiblings, { virtualize, onToggle });

    row("b").focus();
    await user.keyboard("*");

    expect(row("a")).toHaveAttribute("aria-expanded", "true");
    expect(row("b")).toHaveAttribute("aria-expanded", "true");
    expect(row("c")).toHaveAttribute("aria-expanded", "true");
    expect(row("e")).toHaveAttribute("aria-expanded", "false");
    expect(row("b-1")).toHaveAttribute("aria-expanded", "false");
    expect(onToggle.mock.calls.map(([id]) => id)).toEqual(["b", "c"]);
    expect(row("b")).toHaveFocus();
  });

  it("does not type-ahead on *", async () => {
    render(TreeViewExpandSiblings, { virtualize });

    row("d").focus();
    await user.keyboard("*");

    expect(row("d")).toHaveFocus();
  });

  it("does nothing with autoCollapse", async () => {
    const onToggle = vi.fn();
    render(TreeViewExpandSiblings, {
      virtualize,
      autoCollapse: true,
      onToggle,
    });

    row("b").focus();
    await user.keyboard("*");

    expect(row("b")).toHaveAttribute("aria-expanded", "false");
    expect(onToggle).not.toHaveBeenCalled();
  });
});

it("expands only the focused node's level", async () => {
  render(TreeViewExpandSiblings, { virtualize: true });

  findRowById("a-1")?.focus();
  await user.keyboard("*");

  expect(row("b")).toHaveAttribute("aria-expanded", "false");
});
