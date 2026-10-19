import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import { expectClass, mockScrollMetrics, renderManual } from "./helpers";
import TabsRegistration from "./TabsRegistration.test.svelte";
import TabsSelectedId from "./TabsSelectedId.test.svelte";
import TabsVertical from "./TabsVertical.test.svelte";
import TabsVerticalOrientationToggle from "./TabsVerticalOrientationToggle.test.svelte";
import TabsVerticalSkeleton from "./TabsVerticalSkeleton.test.svelte";

describe("TabsVertical", () => {
  it("should render with default props", async () => {
    render(TabsVertical);
    await tick();

    expect(screen.getByRole("navigation")).toHaveClass("bx--tabs--vertical");

    expect(screen.getByRole("tab", { name: "Tab 1" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Content 1")).toBeVisible();
    expect(screen.getByText("Content 2")).not.toBeVisible();
  });

  it("should link each tab to its panel via aria-controls", async () => {
    render(TabsVertical);
    await tick();

    const tabs = screen.getAllByRole("tab");
    const panels = screen.getAllByRole("tabpanel", { hidden: true });

    expect(tabs).toHaveLength(4);
    expect(panels).toHaveLength(4);

    tabs.forEach((tab, index) => {
      const panelId = tab.getAttribute("aria-controls");
      assert(panelId);
      expect(panelId).toBe(panels[index].id);
      expect(panels[index]).toHaveAttribute("aria-labelledby", tab.id);
    });
  });

  it("should default to the xl layout size", () => {
    render(TabsVertical);

    expect(screen.getByRole("navigation")).toHaveClass("bx--layout--size-xl");
  });

  it("should apply the layout size class for the size prop", () => {
    render(TabsVertical, { props: { size: "sm" } });

    const nav = screen.getByRole("navigation");
    expect(nav).toHaveClass("bx--layout--size-sm");
    expect(nav).not.toHaveClass("bx--layout--size-xl");
  });

  describe("breakpoint", () => {
    const BELOW_MD = "(max-width: 41.98rem)";
    let listeners: ((event: { matches: boolean }) => void)[];

    beforeEach(() => {
      listeners = [];
      vi.stubGlobal("matchMedia", (query: string) => ({
        matches: query === BELOW_MD,
        media: query,
        addEventListener: (
          _type: string,
          listener: (event: { matches: boolean }) => void,
        ) => listeners.push(listener),
        removeEventListener: vi.fn(),
      }));
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("renders the row orientation from the first render below md", () => {
      const mutations = new MutationObserver(() => {});
      mutations.observe(document.body, {
        attributes: true,
        attributeFilter: ["aria-orientation"],
        subtree: true,
      });

      render(TabsVertical);

      expect(screen.getByRole("tablist")).toHaveAttribute(
        "aria-orientation",
        "horizontal",
      );
      // No vertical-then-horizontal flip after mount.
      expect(mutations.takeRecords().length).toBe(0);
      mutations.disconnect();
    });

    it("follows the media query when the viewport crosses md", async () => {
      render(TabsVertical);
      const tablist = screen.getByRole("tablist");
      expect(tablist).toHaveAttribute("aria-orientation", "horizontal");

      for (const listener of listeners) listener({ matches: false });
      await tick();
      expect(tablist).toHaveAttribute("aria-orientation", "vertical");
    });

    it("ignores the breakpoint when orientation is pinned", () => {
      render(TabsVertical, { props: { orientation: "vertical" } });

      expect(screen.getByRole("tablist")).toHaveAttribute(
        "aria-orientation",
        "vertical",
      );
    });
  });

  describe("orientation", () => {
    it("updates the layout and keyboard when orientation changes", async () => {
      const { container } = render(TabsVerticalOrientationToggle);
      const nav = screen.getByRole("navigation");
      const tablist = screen.getByRole("tablist");
      const next = screen.getByRole("button", { name: "Next orientation" });

      // Unset, it follows the md breakpoint.
      expect(nav).toHaveClass("bx--tabs--vertical--responsive");
      expect(nav).not.toHaveClass("bx--tabs--vertical--row");
      expect(nav).not.toHaveClass("bx--tabs--vertical--column");
      expect(
        container.querySelector(".bx--tabs--vertical-container"),
      ).toHaveClass("bx--tabs--vertical-container--responsive");
      expect(tablist).toHaveAttribute("aria-orientation", "vertical");

      await user.click(next);
      expect(nav).toHaveClass("bx--tabs--vertical--row");
      expect(nav).not.toHaveClass("bx--tabs--vertical--responsive");
      expect(tablist).toHaveAttribute("aria-orientation", "horizontal");

      await user.click(screen.getByRole("tab", { name: "Tab 1" }));
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("tab", { name: "Tab 2" })).toHaveAttribute(
        "aria-selected",
        "true",
      );

      await user.click(next);
      expect(nav).toHaveClass("bx--tabs--vertical--column");
      expect(nav).not.toHaveClass("bx--tabs--vertical--row");
      expect(tablist).toHaveAttribute("aria-orientation", "vertical");

      await user.click(screen.getByRole("tab", { name: "Tab 2" }));
      await user.keyboard("{ArrowDown}");
      expect(screen.getByRole("tab", { name: "Tab 3" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });

    it.each([
      ["vertical", "column", "vertical"],
      ["horizontal", "row", "horizontal"],
    ] as const)(
      "pins the %s orientation as the %s layout",
      (orientation, modifier, ariaOrientation) => {
        const { container } = render(TabsVertical, {
          props: { orientation },
        });

        const nav = screen.getByRole("navigation");
        expect(nav).toHaveClass(`bx--tabs--vertical--${modifier}`);
        expect(nav).not.toHaveClass("bx--tabs--vertical--responsive");
        expectClass(
          container.querySelector(".bx--tabs--vertical-container"),
          "bx--tabs--vertical-container--column",
          orientation === "vertical",
        );
        expect(screen.getByRole("tablist")).toHaveAttribute(
          "aria-orientation",
          ariaOrientation,
        );
      },
    );

    it('moves with ArrowRight, skipping the disabled tab, for orientation="horizontal"', async () => {
      render(TabsVertical, { props: { orientation: "horizontal" } });

      await user.click(screen.getByRole("tab", { name: "Tab 1" }));
      await user.keyboard("{ArrowRight}");
      // Tab 2 is disabled, so ArrowRight skips to Tab 3.
      expect(screen.getByRole("tab", { name: "Tab 3" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });
  });

  // Selection must be in the first render. Committing it after registration
  // flushes fades the selected tab's color in on mount.
  it("renders the initial selection synchronously on mount", async () => {
    render(TabsVertical, { props: { selected: 2 } });

    const tabs = screen.getAllByRole("tab");
    const panels = screen.getAllByRole("tabpanel", { hidden: true });
    expect(tabs[2]).toHaveAttribute("aria-selected", "true");
    expect(tabs[0]).toHaveAttribute("aria-selected", "false");
    expect(panels[2]).not.toHaveAttribute("hidden");
    expect(panels[0]).toHaveAttribute("hidden");

    // The selection holds once registration flushes.
    await tick();
    expect(tabs[2]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Content 3")).toBeVisible();
  });

  it("renders the initial selectedId synchronously on mount", () => {
    render(TabsSelectedId, {
      props: { selectedId: "tab-c", vertical: true },
    });

    expect(screen.getByRole("tab", { name: "Tab C" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByRole("tabpanel", { hidden: true, name: "Tab C" }),
    ).not.toHaveAttribute("hidden");
  });

  it("should change tab on click and dispatch change", async () => {
    const onChange = vi.fn();
    render(TabsVertical, { props: { onChange } });

    const tab3 = screen.getByRole("tab", { name: "Tab 3" });
    await user.click(tab3);

    expect(tab3).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Content 3")).toBeVisible();
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("should not select disabled tabs", async () => {
    render(TabsVertical);

    const tab2 = screen.getByRole("tab", { name: "Tab 2" });
    expect(tab2).toHaveAttribute("aria-disabled", "true");
    await user.click(tab2);

    expect(tab2).toHaveAttribute("aria-selected", "false");
    expect(screen.getByText("Content 1")).toBeVisible();
  });

  it("should navigate with arrow up/down keys, skipping disabled tabs", async () => {
    const onChange = vi.fn();
    render(TabsVertical, { props: { onChange } });

    const tab1 = screen.getByRole("tab", { name: "Tab 1" });
    await user.click(tab1);

    // Tab 2 is disabled, so ArrowDown moves to Tab 3.
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("tab", { name: "Tab 3" })).toHaveFocus();
    expect(onChange).toHaveBeenCalledWith(2);

    await user.keyboard("{ArrowUp}");
    expect(tab1).toHaveFocus();
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it("moves ArrowUp from the focused tab, not the selected one", async () => {
    const onChange = vi.fn();
    render(TabsVertical, { props: { onChange } });
    await tick();

    const tab3 = screen.getByRole("tab", { name: "Tab 3" });
    const tab4 = screen.getByRole("tab", { name: "Tab 4" });
    tab4.focus();

    await user.keyboard("{ArrowUp}");
    expect(tab3).toHaveFocus();
    expect(tab3).toHaveAttribute("aria-selected", "true");
    expect(onChange).toHaveBeenCalledWith(2);
    expect(onChange).not.toHaveBeenCalledWith(3);
  });

  it("focuses the selected tab when arrowing onto it from another tab", async () => {
    render(TabsVertical);
    await tick();

    const tab1 = screen.getByRole("tab", { name: "Tab 1" });
    screen.getByRole("tab", { name: "Tab 3" }).focus();

    // Tab 2 is disabled, so ArrowUp from Tab 3 lands on the selected Tab 1.
    await user.keyboard("{ArrowUp}");
    expect(tab1).toHaveFocus();
    expect(tab1).toHaveAttribute("aria-selected", "true");
  });

  describe('activation="manual"', () => {
    it("moves from the focused tab after focus returns to another tab", async () => {
      const { tab1, tab3 } = await renderManual(TabsVertical);

      await user.keyboard("{ArrowDown}");
      expect(tab3).toHaveFocus();

      tab1.focus();
      await user.keyboard("{ArrowDown}");
      expect(tab3).toHaveFocus();
      expect(tab1).toHaveAttribute("aria-selected", "true");
    });

    it("ArrowDown moves focus without changing selection", async () => {
      const onChange = vi.fn();
      const { tab1, tab3 } = await renderManual(TabsVertical, { onChange });

      await user.keyboard("{ArrowDown}");
      expect(tab3).toHaveFocus();
      expect(tab1).toHaveAttribute("aria-selected", "true");
      expect(tab3).toHaveAttribute("aria-selected", "false");
      expect(screen.getByText("Content 1")).toBeVisible();
      expect(onChange).not.toHaveBeenCalledWith(2);
    });

    it("Enter selects the focused tab", async () => {
      const onChange = vi.fn();
      const { tab1, tab3 } = await renderManual(TabsVertical, { onChange });

      await user.keyboard("{ArrowDown}");
      expect(tab3).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(tab3).toHaveAttribute("aria-selected", "true");
      expect(tab1).toHaveAttribute("aria-selected", "false");
      expect(screen.getByText("Content 3")).toBeVisible();
      expect(onChange).toHaveBeenCalledWith(2);
    });
  });

  it("should prevent the default scroll on arrow navigation", async () => {
    render(TabsVertical);

    const tab1 = screen.getByRole("tab", { name: "Tab 1" });
    expect(await fireEvent.keyDown(tab1, { key: "ArrowDown" })).toBe(false);
    expect(await fireEvent.keyDown(tab1, { key: "ArrowUp" })).toBe(false);
  });

  it("applies the tall layout for a secondary label set after mount", async () => {
    const { container } = render(TabsRegistration, {
      props: { vertical: true },
    });
    await tick();

    const tabs = container.querySelector(".bx--tabs--vertical");
    expect(tabs).not.toHaveClass("bx--tabs--tall");

    await user.click(screen.getByRole("button", { name: "Load count" }));
    await tick();
    await tick();

    expect(tabs).toHaveClass("bx--tabs--tall");
    expect(screen.getByText("(3/4)")).toBeInTheDocument();
  });

  it("keeps selectedId on the same logical tab when a prior tab is removed", async () => {
    render(TabsSelectedId, {
      props: { selectedId: "tab-b", showTabA: true, vertical: true },
    });
    await tick();

    expect(screen.getByRole("tab", { name: "Tab B" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByTestId("selected-id")).toHaveTextContent("tab-b");
    expect(screen.getByTestId("selected-index")).toHaveTextContent("1");

    await user.click(screen.getByTestId("toggle-tab-a"));
    await tick();

    expect(
      screen.queryByRole("tab", { name: "Tab A" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Tab B" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByTestId("selected-id")).toHaveTextContent("tab-b");
    expect(screen.getByTestId("selected-index")).toHaveTextContent("0");
  });
});

describe("TabsVerticalSkeleton", () => {
  it.each([
    [{}, "bx--tabs--vertical--responsive", 4],
    [{ orientation: "vertical" }, "bx--tabs--vertical--column", 4],
    [{ orientation: "horizontal" }, "bx--tabs--vertical--row", 4],
    [{ count: 0 }, "bx--tabs--vertical--responsive", 0],
  ] as const)(
    "renders %o with %s and %i nav items",
    (props, className, items) => {
      const { container } = render(TabsVerticalSkeleton, { props });

      const skeleton = container.querySelector(".bx--tabs--vertical");
      expect(skeleton).toHaveClass("bx--skeleton", className);
      expect(container.querySelectorAll(".bx--tabs__nav-item")).toHaveLength(
        items,
      );
    },
  );

  describe("shared ResizeObserver", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("shares one ResizeObserver across instances", async () => {
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
      for (let i = 0; i < 3; i++) {
        render(TabsVertical, {
          props: { orientation: "horizontal" },
        });
      }
      await tick();
      expect(created).toBe(1);
    });

    it("measures overflow from the observer's report and stops on unmount", async () => {
      let deliver: ResizeObserverCallback = () => {};
      const observed = new Set<Element>();
      vi.stubGlobal(
        "ResizeObserver",
        class {
          constructor(callback: ResizeObserverCallback) {
            deliver = callback;
          }
          observe(element: Element) {
            observed.add(element);
          }
          unobserve(element: Element) {
            observed.delete(element);
          }
          disconnect() {}
        },
      );
      const { container, unmount } = render(TabsVertical, {
        props: { orientation: "horizontal" },
      });
      await tick();

      const nav = screen.getByRole("tablist");
      expect(observed.has(nav)).toBe(true);
      expect(
        container.querySelector(".bx--tab--overflow-nav-button"),
      ).not.toBeInTheDocument();

      mockScrollMetrics(nav, { scrollWidth: 600, clientWidth: 200 });
      deliver(
        [{ target: nav }] as unknown as ResizeObserverEntry[],
        {} as ResizeObserver,
      );
      await tick();

      expect(
        container.querySelector(".bx--tab--overflow-nav-button--next"),
      ).not.toHaveClass("bx--tab--overflow-nav-button--hidden");

      unmount();
      expect(observed.size).toBe(0);
    });
  });
});
