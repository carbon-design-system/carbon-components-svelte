import { render, screen, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import { findRowById, treeItemById } from "../utils/tree-item-by-id";
import { user } from "../utils/user";
import TreeViewCheckbox from "./TreeView.checkbox.test.svelte";
import TreeViewHref from "./TreeView.href.test.svelte";
import TreeViewVirtualizeLazy from "./TreeView.virtualize.lazy.test.svelte";
import TreeViewVirtualize from "./TreeView.virtualize.test.svelte";
import { checkboxFor } from "./helpers";

const countRows = () => screen.queryAllByRole("treeitem").length;

const virtualProps = { virtualize: { maxVisibleRows: 10 }, padding: 80 };

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
    const trailing = spacers[0];
    assert(trailing instanceof HTMLElement);
    const trailingHeight = Number.parseFloat(trailing.style.height);
    // (500 roots - 13 rendered) rows x 32px.
    expect(trailingHeight).toBe(15_584);
  });

  it("renders rows with the expected ARIA tree metadata", () => {
    render(TreeViewVirtualize, { totalRoots: 500, childrenPerRoot: 3 });

    const firstRow = treeItemById(0);
    expect(firstRow).toHaveAttribute("aria-level", "1");
    expect(firstRow).toHaveAttribute("aria-posinset", "1");
    expect(firstRow).toHaveAttribute("aria-setsize", "500");
    // Roots are parents (have children) → aria-expanded is present.
    expect(firstRow.getAttribute("aria-expanded")).toBe("false");
  });

  it("shifts the windowed slice when the container is scrolled", async () => {
    render(TreeViewVirtualize, { totalRoots: 500, childrenPerRoot: 3 });

    expect(findRowById(0)).not.toBeNull();
    expect(findRowById(200)).toBeNull();

    const ul = screen.getByRole("tree");
    // Each root id is `next++` and root 0 takes ids 0..3 (1 root + 3 leaves).
    // Roots are collapsed so visible row index === root index. Scroll to put
    // root #100 in the window (row 100 * 32 = 3200px).
    ul.scrollTop = 3200;
    ul.dispatchEvent(new Event("scroll"));
    await tick();

    expect(findRowById(0)).toBeNull();
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
    const root = treeItemById(0);
    const caret = root.querySelector<HTMLElement>(
      ".bx--tree-parent-node__toggle",
    );
    assert(caret instanceof HTMLElement);
    await user.click(caret);
    await tick();

    expect(treeItemById(0)).toHaveAttribute("aria-expanded", "true");
    expect(findRowById(1)).not.toBeNull();
    expect(findRowById(2)).not.toBeNull();
    expect(findRowById(3)).not.toBeNull();

    expect(treeItemById(1)).toHaveAttribute("aria-level", "2");
  });

  it("ArrowDown moves focus across the window without mutating activeId", async () => {
    const { component } = render(TreeViewVirtualize, {
      totalRoots: 500,
      childrenPerRoot: 3,
    });

    const first = treeItemById(0);
    first.focus();
    expect(first).toHaveFocus();
    expect(component.activeId).toBe("");

    // Press ArrowDown 20 times — crosses past the initial window (~13 rows).
    for (let i = 0; i < 20; i++) {
      // eslint-disable-next-line no-await-in-loop -- sequential focus ops
      await user.keyboard("{ArrowDown}");
    }

    // Active row should now be id of root #20 = 20 * 4 = 80.
    expect(treeItemById(80)).toHaveFocus();
    // Non-virtual arrows do not mutate activeId; virtual matches that.
    expect(component.activeId).toBe("");
  });

  it("ArrowLeft on a nested row moves focus to its parent", async () => {
    render(TreeViewVirtualize, { totalRoots: 500, childrenPerRoot: 3 });

    const caret = treeItemById(0).querySelector<HTMLElement>(
      ".bx--tree-parent-node__toggle",
    );
    assert(caret instanceof HTMLElement);
    await user.click(caret);
    await tick();

    treeItemById(2).focus();
    await user.keyboard("{ArrowLeft}");

    await waitFor(() => expect(treeItemById(0)).toHaveFocus());
  });

  it.each([
    ["End", 38],
    ["Home", 1],
  ])("%s skips a disabled boundary row", async (key, expectedId) => {
    render(TreeViewVirtualize, {
      totalRoots: 40,
      childrenPerRoot: 0,
      disabledIds: [0, 39],
    });

    treeItemById(5).focus();
    await user.keyboard(`{${key}}`);

    await waitFor(() => expect(treeItemById(expectedId)).toHaveFocus());
  });

  it("setting activeId externally selects the matching virtual row", async () => {
    render(TreeViewVirtualize, {
      totalRoots: 500,
      childrenPerRoot: 3,
      showNodeId: 4,
    });

    await user.click(screen.getByTestId("set-active"));
    await tick();

    const row = treeItemById(4);
    expect(row).toHaveAttribute("aria-selected", "true");
    expect(row).toHaveClass("bx--tree-node--selected");
  });

  it("keeps keyboard navigation after the focused row scrolls out of the window", async () => {
    render(TreeViewVirtualize, { totalRoots: 500, childrenPerRoot: 3 });

    const first = treeItemById(0);
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
    const focused = document.activeElement;
    // Focus was on row 0 (id 0), so ArrowDown lands on row 1 (id 4).
    expect(focused?.getAttribute("data-tree-row-id")).toBe("4");
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

    const first = treeItemById(0);
    first.focus();

    await user.keyboard("root-100");
    await waitFor(() => {
      expect(treeItemById(100)).toHaveFocus();
    });
  });

  it.each(["Control", "Meta"])(
    "%s+A selects all currently visible (expanded) non-disabled rows",
    async (modifier) => {
      const { component } = render(TreeViewVirtualize, {
        totalRoots: 40,
        childrenPerRoot: 0,
        multiselect: true,
        selectedIds: [],
      });

      const first = treeItemById(0);
      first.focus();

      await user.keyboard(`{${modifier}>}a{/${modifier}}`);
      await tick();

      expect(component.selectedIds).toEqual(
        Array.from({ length: 40 }, (_, i) => i),
      );
    },
  );

  it("Ctrl+click deselects a selected row that is not active", async () => {
    const { component } = render(TreeViewVirtualize, {
      totalRoots: 10,
      childrenPerRoot: 0,
      multiselect: true,
      activeId: 0,
      selectedIds: [0, 1, 2],
    });

    const row = treeItemById(1);

    await user.keyboard("{Control>}");
    await user.click(row);
    await user.keyboard("{/Control}");
    await tick();

    expect(
      [...component.selectedIds].sort((a, b) => Number(a) - Number(b)),
    ).toEqual([0, 2]);
  });

  it("Shift+Down toggles each row focus moves to", async () => {
    const { component } = render(TreeViewVirtualize, {
      totalRoots: 40,
      childrenPerRoot: 0,
      multiselect: true,
      selectedIds: [],
    });

    const first = treeItemById(0);
    first.focus();

    await user.keyboard("{Shift>}{ArrowDown}{/Shift}");
    await tick();
    await user.keyboard("{Shift>}{ArrowDown}{/Shift}");
    await tick();

    expect(component.selectedIds).toEqual([1, 2]);
  });

  it("Ctrl+A does nothing when multiselect is off", async () => {
    const { component } = render(TreeViewVirtualize, {
      totalRoots: 40,
      childrenPerRoot: 0,
      selectedIds: [],
    });

    const first = treeItemById(0);
    first.focus();

    await user.keyboard("{Control>}a{/Control}");
    await tick();

    expect(component.selectedIds).toEqual([]);
  });

  it.each(["Control", "Meta"])(
    "Shift+%s+End extends selection toward the end of the visible list",
    async (modifier) => {
      const { component } = render(TreeViewVirtualize, {
        totalRoots: 40,
        childrenPerRoot: 0,
        multiselect: true,
        selectedIds: [],
      });

      const first = treeItemById(0);
      first.focus();

      await user.keyboard(`{${modifier}>}{Shift>}{End}{/Shift}{/${modifier}}`);
      await tick();

      expect(component.selectedIds).toEqual(
        Array.from({ length: 40 }, (_, i) => i),
      );
    },
  );

  it("keeps a single virtual tab stop when nodes arrives new-but-equal after arrow navigation", async () => {
    const { rerender } = render(TreeViewVirtualize, {
      totalRoots: 5,
      childrenPerRoot: 0,
    });

    const first = treeItemById(0);
    first.focus();
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{ArrowDown}");

    const focused = document.activeElement;
    expect(focused).not.toBe(first);
    expect(focused?.getAttribute("tabindex")).toBe("0");
    const focusedRowId = focused?.getAttribute("data-tree-row-id");

    // The fixture's `$: nodes = buildTree(...)` re-runs on every rerender,
    // producing a new-but-equal tree of node objects (same ids/text/shape).
    await rerender({ totalRoots: 5, childrenPerRoot: 0 });
    await tick();

    const tree = screen.getByRole("tree");
    expect(tree.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
    expect(treeItemById(focusedRowId ?? "")).toHaveAttribute("tabindex", "0");
  });

  it("stops observing the container when virtualize is turned off", async () => {
    const unobserve = vi.fn();
    class MockResizeObserver {
      observe = vi.fn();
      unobserve = unobserve;
      disconnect = vi.fn();
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

    const callsAfterMount = unobserve.mock.calls.length;
    await rerender({
      totalRoots: 20,
      childrenPerRoot: 0,
      virtualize: undefined,
    });
    await tick();

    expect(unobserve.mock.calls.length).toBeGreaterThan(callsAfterMount);
    vi.unstubAllGlobals();
  });

  it("shares one ResizeObserver across trees with a relative container height", async () => {
    let created = 0;
    const Base = globalThis.ResizeObserver;
    vi.stubGlobal(
      "ResizeObserver",
      class extends Base {
        constructor(callback: ResizeObserverCallback) {
          super(callback);
          created++;
        }
      },
    );
    try {
      for (let i = 0; i < 3; i++) {
        render(TreeViewVirtualize, {
          totalRoots: 20,
          childrenPerRoot: 0,
          virtualize: { containerHeight: "100%" },
        });
      }
      await tick();
      expect(created).toBe(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("windows rows to the measured height of a relative container", async () => {
    let deliver: ResizeObserverCallback = () => {};
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: ResizeObserverCallback) {
          deliver = callback;
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    try {
      render(TreeViewVirtualize, {
        totalRoots: 500,
        childrenPerRoot: 0,
        virtualize: { containerHeight: "100%", maxVisibleRows: 10 },
      });
      await tick();
      // Until measured, the window falls back to maxVisibleRows.
      expect(countRows()).toBe(13);

      deliver(
        [
          {
            target: screen.getByRole("tree"),
            contentRect: { height: 640 },
          },
        ] as unknown as ResizeObserverEntry[],
        {} as ResizeObserver,
      );
      await tick();

      // The window is recomputed on the next scroll: ceil(641 / 32) + the
      // overscan of 3.
      const tree = screen.getByRole("tree");
      tree.scrollTop = 1;
      tree.dispatchEvent(new Event("scroll"));
      await tick();
      expect(countRows()).toBe(24);
    } finally {
      vi.unstubAllGlobals();
    }
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
      expect(treeItemById(1999)).toHaveFocus();
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
      expect(treeItemById(1999)).toHaveFocus();
    });
  });

  it("showNode leaves the scroll position alone when the row is already visible", async () => {
    render(TreeViewVirtualize, {
      totalRoots: 500,
      childrenPerRoot: 3,
      showNodeId: 4, // root #1, within the initial window
    });

    await user.click(screen.getByTestId("show-node"));

    await waitFor(() => expect(treeItemById(4)).toHaveFocus());
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
      expect(treeItemById(1201)).toHaveFocus();
    });
  });
});

describe("TreeView virtualize + selectionMode=checkbox", () => {
  it("renders checkboxes on windowed rows with correct ARIA", () => {
    render(TreeViewCheckbox, virtualProps);

    expect(
      treeItemById("analytics").querySelector(".bx--checkbox"),
    ).not.toBeNull();
    expect(treeItemById("spark").querySelector(".bx--checkbox")).not.toBeNull();
    expect(treeItemById("analytics")).toHaveAttribute("aria-checked", "false");
    expect(treeItemById("analytics")).not.toHaveAttribute("aria-selected");
    // Link rows still skip the checkbox in the virtual path.
    expect(treeItemById("docs").querySelector(".bx--checkbox")).toBeNull();
  });

  it("checks every descendant when a branch checkbox is clicked", async () => {
    render(TreeViewCheckbox, virtualProps);

    await user.click(checkboxFor("analytics"));

    expect(treeItemById("analytics")).toHaveAttribute("aria-checked", "true");
    expect(treeItemById("spark")).toHaveAttribute("aria-checked", "true");
    expect(treeItemById("hadoop")).toHaveAttribute("aria-checked", "true");
    expect(treeItemById("legacy")).toHaveAttribute("aria-checked", "false");
  });

  it("does not toggle when the row body is clicked", async () => {
    render(TreeViewCheckbox, virtualProps);

    await user.click(treeItemById("spark"));

    expect(treeItemById("spark")).toHaveAttribute("aria-checked", "false");
  });

  it("toggles with Space without expanding, and Enter expands parents", async () => {
    render(TreeViewCheckbox, virtualProps);

    const analytics = treeItemById("analytics");
    analytics.focus();
    expect(analytics).toHaveAttribute("aria-expanded", "true");

    await user.keyboard(" ");
    expect(analytics).toHaveAttribute("aria-checked", "true");
    expect(analytics).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Enter}");
    expect(analytics).toHaveAttribute("aria-expanded", "false");
    expect(analytics).toHaveAttribute("aria-checked", "false");
  });

  it("preserves checked state when the row scrolls out and back in", async () => {
    render(TreeViewCheckbox, virtualProps);

    await user.click(checkboxFor("spark"));
    expect(treeItemById("spark")).toHaveAttribute("aria-checked", "true");

    const tree = screen.getByRole("tree");
    // Scroll far enough that the interactive subtree leaves the window.
    tree.scrollTop = 2000;
    tree.dispatchEvent(new Event("scroll"));
    await tick();

    expect(findRowById("spark")).toBeNull();

    tree.scrollTop = 0;
    tree.dispatchEvent(new Event("scroll"));
    await tick();

    expect(treeItemById("spark")).toHaveAttribute("aria-checked", "true");
    expect(treeItemById("analytics")).toHaveAttribute("aria-checked", "mixed");
  });
});

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

  it("does not select a disabled link row on click", async () => {
    const onSelect = vi.fn();
    render(TreeViewHref, { ...virtualProps, onSelect });

    await user.click(screen.getByRole("treeitem", { name: /Disabled Link/ }));

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("dispatches focus when a link row receives focus", () => {
    const onFocus = vi.fn();
    render(TreeViewHref, { ...virtualProps, onFocus });

    treeItemById("link-1").focus();

    expect(onFocus).toHaveBeenCalledWith(
      expect.objectContaining({ id: "link-1", href: "/page-1" }),
    );
  });

  it("keeps aria-selected on plain rows", () => {
    render(TreeViewHref, { ...virtualProps, selectedIds: ["plain-1"] });

    const plainNode = screen.getByRole("treeitem", { name: /Plain Node/ });
    expect(plainNode).toHaveAttribute("aria-selected", "true");
  });
});

describe("TreeView virtualize + hasChildren lazy load", () => {
  it("mounts fetched children as virtual rows after expand resolves", async () => {
    const { component } = render(TreeViewVirtualizeLazy);

    const root = treeItemById("root-a");
    const caret = root.querySelector<HTMLElement>(
      ".bx--tree-parent-node__toggle",
    );
    assert(caret instanceof HTMLElement);
    expect(root).toHaveAttribute("aria-expanded", "false");
    expect(findRowById("root-a-child-1")).toBeNull();
    await user.click(caret);
    await tick();

    expect(treeItemById("root-a__loading")).toHaveAttribute(
      "aria-disabled",
      "true",
    );

    component.resolveLoad();
    await waitFor(() => {
      expect(findRowById("root-a__loading")).toBeNull();
      expect(findRowById("root-a-child-1")).not.toBeNull();
      expect(findRowById("root-a-child-2")).not.toBeNull();
    });
    expect(treeItemById("root-a-child-1")).toHaveAttribute("aria-level", "2");
  });
});
