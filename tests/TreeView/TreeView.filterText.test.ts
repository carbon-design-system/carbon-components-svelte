import { render, screen } from "@testing-library/svelte";
import { findRowById, treeItemById } from "../utils/tree-item-by-id";
import { user } from "../utils/user";
import TreeViewFilterTextSlot from "./TreeView.filterText.slot.test.svelte";
import TreeViewFilterText from "./TreeView.filterText.test.svelte";

/** A parent row wraps its descendants' labels, so scope to its own. */
function ownLabelText(row: HTMLElement): HTMLElement | null {
  return row.querySelector(
    ":scope > .bx--tree-node__label .bx--tree-node__label__text",
  );
}

describe("TreeView filterText", () => {
  it("marks non-matching rows as filtered out and leaves the rest alone", () => {
    render(TreeViewFilterText, { filterText: "spark" });

    for (const id of ["1", "1-1", "1-1-1"]) {
      expect(treeItemById(id)).not.toHaveClass("bx--tree-node--filtered-out");
    }
    for (const id of ["1-2", "2"]) {
      expect(treeItemById(id)).toHaveClass("bx--tree-node--filtered-out");
    }
    // Collapsed hidden branches never mount their children.
    for (const id of ["1-2-1", "2-1", "2-2"]) {
      expect(findRowById(id)).toBeNull();
    }
  });

  it("expands the ancestors of a match and collapses them when the filter clears", async () => {
    const { rerender } = render(TreeViewFilterText);

    expect(treeItemById("1")).toHaveAttribute("aria-expanded", "false");

    await rerender({ filterText: "spark" });
    expect(treeItemById("1")).toHaveAttribute("aria-expanded", "true");
    expect(treeItemById("1-1")).toHaveAttribute("aria-expanded", "true");

    await rerender({ filterText: "" });
    expect(treeItemById("1")).toHaveAttribute("aria-expanded", "false");
    expect(treeItemById("1-1")).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps a manual expansion made while filtering after the filter clears", async () => {
    const { rerender } = render(TreeViewFilterText, { filterText: "storage" });

    const storage = treeItemById("2");
    expect(storage).toHaveAttribute("aria-expanded", "false");

    const toggle = storage.querySelector(".bx--tree-parent-node__toggle");
    expect.assert(toggle instanceof HTMLElement);
    await user.click(toggle);
    expect(storage).toHaveAttribute("aria-expanded", "true");

    await rerender({ filterText: "" });
    expect(treeItemById("2")).toHaveAttribute("aria-expanded", "true");
  });

  it("skips filtered-out rows on ArrowDown", async () => {
    render(TreeViewFilterText, { filterText: "spark" });

    treeItemById("1").focus();

    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(treeItemById("1-1"));

    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(treeItemById("1-1-1"));

    // Warehouse (1-2) and Storage (2) come next in DOM order but are hidden.
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(treeItemById("1-1-1"));
  });

  it("does not select filtered-out rows on Ctrl+A", async () => {
    render(TreeViewFilterText, { filterText: "spark" });

    treeItemById("1").focus();
    await user.keyboard("{Control>}a{/Control}");

    const selectedIds = Array.from(
      document.querySelectorAll("[aria-selected='true']"),
      (el) => el.getAttribute("data-tree-row-id"),
    );
    expect(selectedIds.sort()).toEqual(["1", "1-1", "1-1-1"]);
  });

  it("leaves hidden rows out of a virtualized tree", async () => {
    const { rerender } = render(TreeViewFilterText, {
      filterText: "spark",
      virtualize: true,
    });

    for (const id of ["1", "1-1", "1-1-1"]) {
      expect(treeItemById(id)).toBeInTheDocument();
    }
    for (const id of ["1-2", "2"]) {
      expect(findRowById(id)).toBeNull();
    }

    await rerender({ filterText: "" });
    expect(treeItemById("2")).toBeInTheDocument();
  });

  it("wraps the match in a mark and leaves the rest of the label alone", () => {
    // A mid-word match: the surrounding characters must stay flush against the
    // highlight, with no whitespace introduced on either side.
    render(TreeViewFilterText, { filterText: "hous" });

    const label = ownLabelText(treeItemById("1-2"));
    expect.assert(label instanceof HTMLElement);
    expect(label.textContent).toBe("Warehouse");

    const mark = label.querySelector("mark");
    expect.assert(mark instanceof HTMLElement);
    expect(mark).toHaveClass("bx--tree-node__match");
    expect(mark.textContent).toBe("hous");

    // An ancestor row is visible without matching, so it carries no highlight.
    expect(ownLabelText(treeItemById("1"))?.querySelector("mark")).toBeNull();
  });

  it("passes node.match to custom slot content with the matched offsets", () => {
    render(TreeViewFilterTextSlot, { filterText: "spark" });

    expect(screen.getByTestId("label-1-1-1")).toHaveAttribute(
      "data-match",
      "7,12",
    );
    expect(screen.getByTestId("label-1-1")).toHaveAttribute(
      "data-match",
      "none",
    );
  });
});
