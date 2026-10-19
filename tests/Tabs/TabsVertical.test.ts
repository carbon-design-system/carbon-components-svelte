import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import { expectClass, mockScrollMetrics } from "./helpers";
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

  describe("column orientation", () => {
    it("leaves ArrowRight to the browser", async () => {
      render(TabsVertical, { props: { orientation: "vertical" } });

      const tab1 = screen.getByRole("tab", { name: "Tab 1" });
      expect(await fireEvent.keyDown(tab1, { key: "ArrowRight" })).toBe(true);
      expect(tab1).toHaveAttribute("aria-selected", "true");
    });

    it("shows no overflow buttons for an overflowing list", async () => {
      const { container } = render(TabsVertical, {
        props: { orientation: "vertical" },
      });

      const nav = screen.getByRole("tablist");
      mockScrollMetrics(nav, {
        scrollWidth: 600,
        clientWidth: 200,
        scrollLeft: 0,
      });
      await fireEvent.scroll(nav);

      expect(
        container.querySelector(".bx--tab--overflow-nav-button"),
      ).not.toBeInTheDocument();
    });
  });

  it("pairs each tab with its panel after a tab is inserted mid-list", async () => {
    render(TabsSelectedId, { props: { vertical: true } });
    await tick();

    await user.click(screen.getByTestId("toggle-tab-b"));
    await user.click(screen.getByTestId("toggle-tab-b"));
    await tick();

    // Tab B re-registered last but sits between A and C in the DOM.
    const tabs = screen.getAllByRole("tab");
    const panels = screen.getAllByRole("tabpanel", { hidden: true });
    expect(tabs.map((tab) => tab.id)).toEqual(["tab-a", "tab-b", "tab-c"]);
    expect(panels.map((panel) => panel.id)).toEqual([
      "panel-a",
      "panel-b",
      "panel-c",
    ]);
    tabs.forEach((tab, index) => {
      expect(tab).toHaveAttribute("aria-controls", panels[index].id);
      expect(panels[index]).toHaveAttribute("aria-labelledby", tab.id);
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
});
