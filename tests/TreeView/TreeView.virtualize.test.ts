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
  it("windows the DOM to the overscan-bounded slice of a large tree", () => {
    // 500 collapsed roots. itemHeight=32, container=320 (maxVisibleRows=10),
    // overscan=3 → endIndex = ceil(320/32)+3 = 13 at scrollTop=0.
    render(TreeViewVirtualize, { totalRoots: 500, childrenPerRoot: 3 });

    expect(countRows()).toBe(13);
    expect(findRowById(0)).not.toBeNull();
    // Root ids advance by 4 (1 root + 3 children). Row 12 is root #12 → id 48.
    expect(findRowById(48)).not.toBeNull();
    // Row 13 (root #13, id 52) is past the window.
    expect(findRowById(52)).toBeNull();
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

  it("ArrowDown moves focus across the window without mutating activeId", async () => {
    const { component } = render(TreeViewVirtualize, {
      totalRoots: 500,
      childrenPerRoot: 3,
    });

    const first = findRowById(0);
    if (!first) throw new Error("expected first row");
    first.focus();
    expect(first).toHaveFocus();
    expect(component.activeId).toBe("");

    // Press ArrowDown 20 times — crosses past the initial window (~13 rows).
    for (let i = 0; i < 20; i++) {
      // biome-ignore lint/performance/noAwaitInLoops: sequential focus ops
      await user.keyboard("{ArrowDown}");
    }

    // Active row should now be id of root #20 = 20 * 4 = 80.
    const expected = findRowById(80);
    expect(expected).not.toBeNull();
    expect(expected).toHaveFocus();
    // Non-virtual arrows do not mutate activeId; virtual matches that.
    expect(component.activeId).toBe("");
  });

  it("setting activeId externally selects the matching virtual row", async () => {
    render(TreeViewVirtualize, {
      totalRoots: 500,
      childrenPerRoot: 3,
      showNodeId: 4,
    });

    await user.click(screen.getByTestId("set-active"));
    await tick();

    const row = findRowById(4);
    expect(row).not.toBeNull();
    expect(row).toHaveAttribute("aria-selected", "true");
    expect(row).toHaveClass("bx--tree-node--selected");
  });

  it("keeps keyboard navigation after the focused row scrolls out of the window", async () => {
    render(TreeViewVirtualize, { totalRoots: 500, childrenPerRoot: 3 });

    const first = findRowById(0);
    if (!first) throw new Error("expected first row");
    first.focus();
    expect(first).toHaveFocus();

    const ul = screen.getByRole("tree");
    ul.scrollTop = 3200;
    ul.dispatchEvent(new Event("scroll"));
    await tick();
    await tick();

    expect(findRowById(0)).toBeNull();
    expect(document.activeElement).not.toBe(document.body);
    expect(ul.contains(document.activeElement)).toBe(true);

    await user.keyboard("{ArrowDown}");
    const focused = document.activeElement as HTMLElement | null;
    expect(focused?.getAttribute("data-tree-row-id")).toBeTruthy();
  });

  it("does not steal focus when scrolling a never-focused virtualized tree", async () => {
    render(TreeViewVirtualize, { totalRoots: 500, childrenPerRoot: 3 });

    expect(document.activeElement).toBe(document.body);

    const ul = screen.getByRole("tree");
    ul.scrollTop = 3200;
    ul.dispatchEvent(new Event("scroll"));
    await tick();
    await tick();

    expect(document.activeElement).toBe(document.body);
  });

  it("type-ahead jumps to a matching off-window row", async () => {
    // Flat roots: id N has text `root-N`. Id 100 is past the initial window.
    render(TreeViewVirtualize, { totalRoots: 500, childrenPerRoot: 0 });

    const first = findRowById(0);
    if (!first) throw new Error("expected first row");
    first.focus();

    await user.keyboard("root-100");
    await waitFor(() => {
      expect(findRowById(100)).toHaveFocus();
    });
  });

  it("Ctrl+A selects all currently visible (expanded) non-disabled rows", async () => {
    const { component } = render(TreeViewVirtualize, {
      totalRoots: 40,
      childrenPerRoot: 0,
      multiselect: true,
      selectedIds: [],
    });

    const first = findRowById(0);
    if (!first) throw new Error("expected first row");
    first.focus();

    await user.keyboard("{Control>}a{/Control}");
    await tick();

    expect(component.selectedIds).toEqual(
      Array.from({ length: 40 }, (_, i) => i),
    );
  });

  it("Shift+Ctrl+End extends selection toward the end of the visible list", async () => {
    const { component } = render(TreeViewVirtualize, {
      totalRoots: 40,
      childrenPerRoot: 0,
      multiselect: true,
      selectedIds: [],
    });

    const first = findRowById(0);
    if (!first) throw new Error("expected first row");
    first.focus();

    await user.keyboard("{Control>}{Shift>}{End}{/Shift}{/Control}");
    await tick();

    expect(component.selectedIds).toEqual(
      Array.from({ length: 40 }, (_, i) => i),
    );
  });

  it("disconnects ResizeObserver when virtualize is turned off", async () => {
    const disconnect = vi.fn();
    class MockResizeObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = disconnect;
      constructor(cb: ResizeObserverCallback) {
        void cb;
      }
    }
    vi.stubGlobal("ResizeObserver", MockResizeObserver);

    const { rerender } = render(TreeViewVirtualize, {
      totalRoots: 20,
      childrenPerRoot: 0,
      virtualize: { containerHeight: "100%" },
    });
    await tick();

    const callsAfterMount = disconnect.mock.calls.length;
    await rerender({
      totalRoots: 20,
      childrenPerRoot: 0,
      virtualize: undefined,
    });
    await tick();

    expect(disconnect.mock.calls.length).toBeGreaterThan(callsAfterMount);
    vi.unstubAllGlobals();
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

  it("showNode focuses a row at the very end of the list, clamping the scroll position", async () => {
    // Last root (#499) has id 1996; its last child is 1999. Reaching it
    // requires expanding the branch and scrolling past the clamped maximum.
    render(TreeViewVirtualize, {
      totalRoots: 500,
      childrenPerRoot: 3,
      showNodeId: 1999,
    });

    await user.click(screen.getByTestId("show-node"));

    await waitFor(() => {
      expect(findRowById(1999)).not.toBeNull();
      expect(findRowById(1999)).toHaveFocus();
    });

    // 503 visible rows * 32px - 320px container = 15776px max scroll.
    expect(screen.getByRole("tree").scrollTop).toBe(15776);
  });

  it("showNode focuses the target when the consumer expands a branch in the same pass", async () => {
    render(TreeViewVirtualize, {
      totalRoots: 500,
      childrenPerRoot: 3,
      expandBeforeShowId: 1996,
      showNodeId: 1999,
    });

    // Scroll somewhere unrelated first so the target starts far offscreen.
    const ul = screen.getByRole("tree");
    ul.scrollTop = 3200;
    ul.dispatchEvent(new Event("scroll"));
    await tick();

    await user.click(screen.getByTestId("expand-and-show-node"));

    await waitFor(() => {
      expect(findRowById(1999)).not.toBeNull();
      expect(findRowById(1999)).toHaveFocus();
    });
  });

  it("showNode leaves the scroll position alone when the row is already visible", async () => {
    render(TreeViewVirtualize, {
      totalRoots: 500,
      childrenPerRoot: 3,
      showNodeId: 4, // root #1, within the initial window
    });

    await user.click(screen.getByTestId("show-node"));

    await waitFor(() => expect(findRowById(4)).toHaveFocus());
    expect(screen.getByRole("tree").scrollTop).toBe(0);
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
