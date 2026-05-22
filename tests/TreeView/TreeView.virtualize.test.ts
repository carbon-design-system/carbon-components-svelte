import { render, screen, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import TreeViewVirtualize from "./TreeView.virtualize.test.svelte";

const countRows = () => screen.queryAllByRole("treeitem").length;

const findRowById = (id: number | string) =>
  document.querySelector(
    `[data-tree-row-id="${CSS.escape(String(id))}"]`,
  ) as HTMLElement | null;

describe("TreeView (virtualize)", () => {
  it("windows the DOM to a small slice of a large tree", () => {
    // 500 collapsed roots => 500 visible rows. itemHeight=32, container=320,
    // overscan=3. Expected visible window ~ ceil(320/32)+overscan*2 = 16.
    render(TreeViewVirtualize, { totalRoots: 500, childrenPerRoot: 3 });

    const rows = countRows();
    expect(rows).toBeGreaterThan(0);
    expect(rows).toBeLessThan(40); // far fewer than the 500 visible roots
    expect(rows).toBeLessThan(500);
  });

  it("renders spacer <li>s above/below the visible window", () => {
    render(TreeViewVirtualize, { totalRoots: 500, childrenPerRoot: 3 });

    const ul = screen.getByRole("tree");
    const spacers = ul.querySelectorAll(':scope > li[aria-hidden="true"]');
    // At scrollTop=0 there's no leading spacer, only a trailing one.
    expect(spacers.length).toBe(1);
    const trailing = spacers[0] as HTMLElement;
    const trailingHeight = Number.parseFloat(trailing.style.height);
    expect(trailingHeight).toBeGreaterThan(0);
  });

  it("renders rows with the expected ARIA tree metadata", () => {
    render(TreeViewVirtualize, { totalRoots: 500, childrenPerRoot: 3 });

    const firstRow = findRowById(0);
    expect(firstRow).not.toBeNull();
    if (!firstRow) throw new Error("expected first row");
    expect(firstRow).toHaveAttribute("aria-level", "1");
    expect(firstRow).toHaveAttribute("aria-posinset", "1");
    expect(firstRow).toHaveAttribute("aria-setsize", "500");
    // Roots are parents (have children) → aria-expanded is present.
    expect(firstRow.getAttribute("aria-expanded")).toBe("false");
  });

  it("shifts the windowed slice when the container is scrolled", async () => {
    render(TreeViewVirtualize, { totalRoots: 500, childrenPerRoot: 3 });

    // Initially: row 0 mounted, row ~200 not mounted.
    expect(findRowById(0)).not.toBeNull();
    expect(findRowById(200)).toBeNull();

    const ul = screen.getByRole("tree");
    // Each root id is `next++` and root 0 takes ids 0..3 (1 root + 3 leaves).
    // Roots are collapsed so visible row index === root index. Scroll to put
    // root #100 in the window (row 100 * 32 = 3200px).
    ul.scrollTop = 3200;
    ul.dispatchEvent(new Event("scroll"));
    await tick();

    expect(findRowById(0)).toBeNull(); // scrolled out
    // root #100's id = 100 * (1 + 3) = 400.
    expect(findRowById(400)).not.toBeNull();
  });

  it("expand/collapse refilters the visible flat list", async () => {
    render(TreeViewVirtualize, { totalRoots: 500, childrenPerRoot: 3 });

    // Root #0 has id=0; its children have ids 1, 2, 3. Children should not
    // be mounted while their parent is collapsed.
    expect(findRowById(1)).toBeNull();
    expect(findRowById(2)).toBeNull();

    // Click the caret on the root row to toggle expansion (matches the
    // non-virtualized behavior where row-body click only selects).
    const root = findRowById(0);
    if (!root) throw new Error("expected root row");
    const caret = root.querySelector(
      ".bx--tree-parent-node__toggle",
    ) as HTMLElement;
    await user.click(caret);
    await tick();

    expect(findRowById(0)).toHaveAttribute("aria-expanded", "true");
    expect(findRowById(1)).not.toBeNull();
    expect(findRowById(2)).not.toBeNull();
    expect(findRowById(3)).not.toBeNull();

    // Children show aria-level=2.
    expect(findRowById(1)).toHaveAttribute("aria-level", "2");
  });

  it("ArrowDown moves focus across the window, scrolling as needed", async () => {
    render(TreeViewVirtualize, { totalRoots: 500, childrenPerRoot: 3 });

    const first = findRowById(0);
    if (!first) throw new Error("expected first row");
    first.focus();
    expect(first).toHaveFocus();

    // Press ArrowDown 20 times — crosses past the initial window (~16 rows).
    for (let i = 0; i < 20; i++) {
      // biome-ignore lint/performance/noAwaitInLoops: sequential focus ops
      await user.keyboard("{ArrowDown}");
    }

    // Active row should now be id of root #20 = 20 * 4 = 80.
    const expected = findRowById(80);
    expect(expected).not.toBeNull();
    expect(expected).toHaveFocus();
  });

  it("clamps scrollTop when the visible list shrinks past the current scroll position", async () => {
    const { rerender } = render(TreeViewVirtualize, {
      totalRoots: 500,
      childrenPerRoot: 3,
    });

    // Scroll near the end of the original 500-row list.
    const ul = screen.getByRole("tree");
    ul.scrollTop = 14000;
    ul.dispatchEvent(new Event("scroll"));
    await tick();

    // Re-render with a much smaller tree — the prior scrollTop is far past
    // the new max. Without clamping, the visible window would slice past
    // the end of the array and the tree would render blank.
    await rerender({ totalRoots: 5, childrenPerRoot: 3 });
    await tick();

    expect(countRows()).toBeGreaterThan(0);
    // The first root of the new tree should be mounted.
    expect(findRowById(0)).not.toBeNull();
  });

  it("showNode scrolls a deep, offscreen node into view and focuses it", async () => {
    // root #300's id = 1200; target one of its children (id 1201).
    render(TreeViewVirtualize, {
      totalRoots: 500,
      childrenPerRoot: 3,
      showNodeId: 1201,
    });

    await user.click(screen.getByTestId("show-node"));

    await waitFor(() => {
      expect(findRowById(1201)).not.toBeNull();
      expect(findRowById(1201)).toHaveFocus();
    });
  });
});
