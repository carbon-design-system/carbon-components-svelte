import { fireEvent, render, screen } from "@testing-library/svelte";
import type TabComponent from "carbon-components-svelte/Tabs/Tab.svelte";
import type { ComponentProps } from "svelte";
import { tick } from "svelte";
import Calendar from "../../src/icons/Calendar.svelte";
import { user } from "../utils/user";
import Tab from "./Tab.test.svelte";
import TabIcon from "./TabIcon.test.svelte";
import TabIconSecondaryLabel from "./TabIconSecondaryLabel.test.svelte";
import TabSecondaryLabel from "./TabSecondaryLabel.test.svelte";
import TabSlot from "./TabSlot.test.svelte";
import Tabs from "./Tabs.test.svelte";
import TabsAllDisabled from "./TabsAllDisabled.test.svelte";
import TabsDismissible from "./TabsDismissible.test.svelte";
import TabsDynamic from "./TabsDynamic.test.svelte";
import TabsExtra from "./TabsExtra.test.svelte";
import TabsLazy from "./TabsLazy.test.svelte";
import TabsRegistration from "./TabsRegistration.test.svelte";
import TabsSelectedId from "./TabsSelectedId.test.svelte";
import TabsSkeleton from "./TabsSkeleton.test.svelte";
import TabsOwnPanelId from "./TabsSsrOwnPanelId.test.svelte";
import { expectClass, mockScrollMetrics } from "./helpers";

describe("Tabs", () => {
  it("should render with default props", async () => {
    render(Tabs);
    await tick();

    expect(screen.getByRole("tab", { name: "Tab 1" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Tab 2" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Tab 3" })).toBeInTheDocument();
    expect(screen.getByText("Content 1")).toBeVisible();
    expect(screen.getByText("Content 2")).not.toBeVisible();
    expect(screen.getByText("Content 3")).not.toBeVisible();

    const tabsContainer = screen.getByRole("navigation");
    expect(tabsContainer).not.toHaveClass("bx--tabs--full-width");
  });

  it("applies the flush modifier to the panel with `flush` set, not the others", () => {
    render(Tabs, { props: { flush: true } });

    expect(screen.getByText("Content 1")).toHaveClass(
      "bx--tab-content",
      "bx--tab-content--flush",
    );
    expect(screen.getByText("Content 2")).not.toHaveClass(
      "bx--tab-content--flush",
    );
  });

  it("should point aria-controls at a panel's own id after mount", async () => {
    render(TabsOwnPanelId);
    await tick();

    const tabs = screen.getAllByRole("tab");
    const panels = screen.getAllByRole("tabpanel", { hidden: true });

    expect(panels[1]).toHaveAttribute("id", "own-panel");
    tabs.forEach((tab, index) => {
      expect(tab).toHaveAttribute("aria-controls", panels[index].id);
    });
  });

  it("should not put a tabindex on the presentational <li> wrapper", () => {
    const { container } = render(Tabs);

    const presentationalItems = container.querySelectorAll(
      'li[role="presentation"]',
    );
    expect(presentationalItems.length).toBeGreaterThan(0);
    for (const li of presentationalItems) {
      expect(li).not.toHaveAttribute("tabindex");
    }
  });

  it("moves the tab stop with the selection", async () => {
    render(Tabs);

    const tab1 = screen.getByRole("tab", { name: "Tab 1" });
    const tab3 = screen.getByRole("tab", { name: "Tab 3" });

    await user.click(tab3);
    expect(tab3).toHaveAttribute("tabindex", "0");
    expect(tab1).toHaveAttribute("tabindex", "-1");

    await user.keyboard("{ArrowLeft}");
    expect(tab1).toHaveAttribute("tabindex", "0");
    expect(tab3).toHaveAttribute("tabindex", "-1");
  });

  it("enters and leaves the tab list with one Tab press each", async () => {
    render(Tabs);
    await tick();

    await user.tab();
    expect(screen.getByRole("tab", { name: "Tab 1" })).toHaveFocus();

    await user.tab();
    for (const tab of screen.getAllByRole("tab")) {
      expect(tab).not.toHaveFocus();
    }
  });

  it("puts the tab stop on the initially selected tab", async () => {
    render(Tabs, { props: { selected: 2 } });
    await tick();

    await user.tab();
    expect(screen.getByRole("tab", { name: "Tab 3" })).toHaveFocus();
  });

  it("keeps the tab stop on the selected tab in manual activation", async () => {
    render(Tabs, { props: { activation: "manual" } });

    const tab1 = screen.getByRole("tab", { name: "Tab 1" });
    const tab3 = screen.getByRole("tab", { name: "Tab 3" });
    await user.click(tab1);

    await user.keyboard("{ArrowRight}");
    expect(tab3).toHaveFocus();
    expect(tab3).toHaveAttribute("tabindex", "-1");
    expect(tab1).toHaveAttribute("tabindex", "0");
  });

  it("should pass selected to the Tab default slot", async () => {
    render(TabSlot);
    await tick();

    expect(screen.getByTestId("tab-0")).toHaveAttribute(
      "data-selected",
      "true",
    );
    expect(screen.getByTestId("tab-1")).toHaveAttribute(
      "data-selected",
      "false",
    );

    await user.click(screen.getByRole("tab", { name: "Tab 2" }));

    expect(screen.getByTestId("tab-0")).toHaveAttribute(
      "data-selected",
      "false",
    );
    expect(screen.getByTestId("tab-1")).toHaveAttribute(
      "data-selected",
      "true",
    );
  });

  it("should select initial tab based on selected prop", async () => {
    render(Tabs, { props: { selected: 2 } });
    await tick();

    const tab3 = screen.getByRole("tab", { name: "Tab 3" });
    expect(tab3).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Content 3")).toBeVisible();
    expect(screen.getByText("Content 1")).not.toBeVisible();
    expect(screen.getByText("Content 2")).not.toBeVisible();
  });

  it("does not infinite-loop when all items are disabled", async () => {
    render(TabsAllDisabled);

    const tab1 = screen.getByRole("tab", { name: "Tab 1" });
    await user.click(tab1);
    expect(tab1).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{ArrowRight}");
    await user.keyboard("{ArrowLeft}");
    await user.keyboard("{ArrowRight}");

    expect(screen.getByText("Content 1")).toBeVisible();
    expect(tab1).toHaveAttribute("aria-selected", "true");
  });

  it.each([
    ["container", "bx--tabs--container", "bx--tabs--line", true],
    ["default", "bx--tabs--line", "bx--tabs--container", false],
  ] as const)(
    "applies the %s type classes to the nav, links and items",
    async (type, navClass, otherNavClass, container) => {
      render(Tabs, { props: { type } });
      await tick();

      const nav = screen.getByRole("navigation");
      expect(nav).toHaveClass(navClass);
      expect(nav).not.toHaveClass(otherNavClass);

      // Tab 1 is selected, Tab 2 is disabled and Tab 3 is neither.
      const tabs = screen.getAllByRole("tab");
      tabs.forEach((tab, index) => {
        const item = tab.closest(".bx--tabs__nav-item");
        expectClass(
          tab,
          "bx--tabs__nav-link--container-selected",
          container && index === 0,
        );
        expectClass(item, "bx--tabs__nav-item--container", container);
        expectClass(
          item,
          "bx--tabs__nav-item--container-selected",
          container && index === 0,
        );
      });
    },
  );

  it("toggles the close buttons when dismissible changes after mount", async () => {
    const { rerender } = render(Tabs);
    expect(screen.queryByRole("button", { name: /^Dismiss/ })).toBeNull();

    await rerender({ dismissible: true });
    expect(screen.getAllByRole("button", { name: /^Dismiss/ })).toHaveLength(3);
    expect(screen.getByRole("navigation")).toHaveClass("bx--tabs--dismissible");

    await rerender({ dismissible: false });
    expect(screen.queryByRole("button", { name: /^Dismiss/ })).toBeNull();
  });

  it("applies the container item classes when type changes after mount", async () => {
    const { rerender } = render(Tabs);
    await tick();

    await rerender({ type: "container" });
    for (const tab of screen.getAllByRole("tab")) {
      expect(tab.closest(".bx--tabs__nav-item")).toHaveClass(
        "bx--tabs__nav-item--container",
      );
    }

    await rerender({ type: "default" });
    for (const tab of screen.getAllByRole("tab")) {
      expect(tab.closest(".bx--tabs__nav-item")).not.toHaveClass(
        "bx--tabs__nav-item--container",
      );
    }
  });

  it("sets the default nav-item class only for tabs that are neither selected nor disabled", async () => {
    render(Tabs);
    await tick();

    const tabs = screen.getAllByRole("tab");
    const navItems = tabs.map((tab) => tab.closest(".bx--tabs__nav-item"));

    // Tab 1: selected, Tab 2: disabled, Tab 3: neither.
    expect(navItems[0]).not.toHaveClass("bx--tabs__nav-item--default");
    expect(navItems[1]).not.toHaveClass("bx--tabs__nav-item--default");
    expect(navItems[2]).toHaveClass("bx--tabs__nav-item--default");
  });

  it("does not mark a disabled tab link as selected", async () => {
    render(Tabs, { props: { selected: 1 } });
    await tick();

    const tab2 = screen.getAllByRole("tab")[1];
    expect(tab2).toHaveAttribute("aria-disabled", "true");
    expect(tab2).not.toHaveClass("bx--tabs__nav-link--selected");
    expect(tab2).not.toHaveClass("bx--tabs__nav-link--container-selected");
  });

  it("moves the selected link class when the selection changes", async () => {
    render(Tabs);
    await tick();

    const [tab1, , tab3] = screen.getAllByRole("tab");
    await user.click(tab3);

    expect(tab1).not.toHaveClass("bx--tabs__nav-link--selected");
    expect(tab3).toHaveClass("bx--tabs__nav-link--selected");
  });

  it("moves the container-selected item class when the selection changes", async () => {
    render(Tabs, { props: { type: "container" } });
    await tick();

    const [tab1, , tab3] = screen.getAllByRole("tab");
    await user.click(tab3);

    expect(tab1.closest(".bx--tabs__nav-item")).not.toHaveClass(
      "bx--tabs__nav-item--container-selected",
    );
    expect(tab3.closest(".bx--tabs__nav-item")).toHaveClass(
      "bx--tabs__nav-item--container-selected",
    );
  });

  it.each([
    [{ autoWidth: true }, "auto"],
    [{ fullWidth: true }, "100%"],
    [{}, ""],
  ])("sets the tab link width for %o", async (props, width) => {
    const { rerender } = render(Tabs, { props });

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(3);
    for (const tab of tabs) {
      expect(tab.style.width).toBe(width);
    }

    // Reacts to the prop changing after mount.
    await rerender({ autoWidth: false, fullWidth: false });
    for (const tab of tabs) {
      expect(tab.style.width).toBe("");
    }
  });

  it("should render full-width tabs when fullWidth is true", () => {
    render(Tabs, {
      props: { fullWidth: true },
    });

    const tabsContainer = screen.getByRole("navigation");
    expect(tabsContainer).toHaveClass("bx--tabs--full-width");
  });

  it("does not show the overflow button for a 1px scrollWidth/clientWidth difference", async () => {
    const { container } = render(Tabs);

    const nav = screen.getByRole("tablist");
    mockScrollMetrics(nav, {
      scrollWidth: 101,
      clientWidth: 100,
      scrollLeft: 0,
    });
    await fireEvent.scroll(nav);

    expect(
      container.querySelector(".bx--tab--overflow-nav-button"),
    ).not.toBeInTheDocument();
  });

  describe("extra slot", () => {
    it("renders extra content outside the tab list", () => {
      const { container } = render(TabsExtra);

      const tablist = screen.getByRole("tablist");
      const extra = screen.getByRole("button", { name: "New tab" });

      expect(extra).toBeInTheDocument();
      expect(tablist).not.toContainElement(extra);
      expect(extra.closest(".bx--tabs__extra")).toBeInTheDocument();
      expect(
        container.querySelector(".bx--tabs--with-extra"),
      ).toBeInTheDocument();
    });

    it("does not render the extra wrapper without the slot", () => {
      const { container } = render(TabsExtra, {
        props: { withExtra: false },
      });

      expect(
        container.querySelector(".bx--tabs__extra"),
      ).not.toBeInTheDocument();
      expect(
        container.querySelector(".bx--tabs--with-extra"),
      ).not.toBeInTheDocument();
    });

    // Extra is a sibling of the nav, so overflow still reads only the tablist
    // scroll metrics — extra width does not inflate scrollWidth.
    it("computes overflow from the tablist without including extra width", async () => {
      const { container } = render(TabsExtra);

      const nav = screen.getByRole("tablist");
      const extra = screen.getByRole("button", { name: "New tab" });

      Object.defineProperty(extra, "offsetWidth", {
        configurable: true,
        value: 120,
      });
      Object.defineProperty(nav, "scrollWidth", {
        configurable: true,
        value: 600,
      });
      Object.defineProperty(nav, "clientWidth", {
        configurable: true,
        value: 200,
      });
      Object.defineProperty(nav, "scrollLeft", {
        configurable: true,
        writable: true,
        value: 0,
      });
      await fireEvent.scroll(nav);

      const next = container.querySelector(
        ".bx--tab--overflow-nav-button--next",
      );
      expect(next).toBeInTheDocument();
      expect(next).not.toHaveClass("bx--tab--overflow-nav-button--hidden");
      expect(nav).not.toContainElement(extra);
    });
  });

  it("should apply custom class", () => {
    render(Tabs, {
      props: { customClass: "custom-tabs" },
    });

    const tabsContainer = screen.getByRole("navigation");
    expect(tabsContainer).toHaveClass("custom-tabs");
    expect(tabsContainer).toHaveClass("bx--tabs");
  });

  it("should apply custom aria-label", () => {
    render(Tabs, {
      props: { ariaLabel: "Custom label" },
    });

    const nav = screen.getByRole("navigation", { name: "Custom label" });
    expect(nav).toHaveAttribute("aria-label", "Custom label");
  });

  it("should maintain correct indices when tabs are dynamically removed and re-added", async () => {
    render(TabsDynamic, { props: { showTab1: true } });

    expect(screen.getByRole("tab", { name: "Tab 1" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Tab 2" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Tab 3" })).toBeInTheDocument();

    const toggleButton = screen.getByTestId("toggle-tab1");
    await user.click(toggleButton);

    expect(
      screen.queryByRole("tab", { name: "Tab 1" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Tab 2" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Tab 3" })).toBeInTheDocument();

    await user.click(toggleButton);

    expect(screen.getByRole("tab", { name: "Tab 1" })).toBeInTheDocument();

    // Tab 1 is back at index 0; selecting around it must update the bound index.
    const selectedIndex = screen.getByTestId("selected-index");
    await user.click(screen.getByRole("tab", { name: "Tab 3" }));
    expect(selectedIndex).toHaveTextContent("2");

    const tab1 = screen.getByRole("tab", { name: "Tab 1" });
    await user.click(tab1);
    expect(selectedIndex).toHaveTextContent("0");
    expect(tab1).toHaveAttribute("aria-selected", "true");
  });

  it("should update selected index when active tab is removed", async () => {
    render(TabsDynamic, {
      props: { selected: 1, showTab1: true, showTab2: true },
    });

    const selectedIndex = screen.getByTestId("selected-index");
    expect(selectedIndex).toHaveTextContent("1");

    const toggleTab2Button = screen.getByTestId("toggle-tab2");
    await user.click(toggleTab2Button);

    expect(
      screen.queryByRole("tab", { name: "Tab 2" }),
    ).not.toBeInTheDocument();

    // The index stays put, so the tab that took its place becomes selected.
    expect(selectedIndex).toHaveTextContent("1");
    expect(screen.getByRole("tab", { name: "Tab 3" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Tab 1" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
    expect(screen.getByText("Content 3")).toBeVisible();
    expect(screen.getByText("Content 1")).not.toBeVisible();
  });

  it("should handle multiple tabs being toggled in sequence", async () => {
    render(TabsDynamic, { props: { showTab1: true, showTab2: true } });

    const toggleTab1 = screen.getByTestId("toggle-tab1");
    const toggleTab2 = screen.getByTestId("toggle-tab2");

    await user.click(toggleTab1);
    expect(
      screen.queryByRole("tab", { name: "Tab 1" }),
    ).not.toBeInTheDocument();

    await user.click(toggleTab2);
    expect(
      screen.queryByRole("tab", { name: "Tab 2" }),
    ).not.toBeInTheDocument();

    expect(screen.getByRole("tab", { name: "Tab 3" })).toBeInTheDocument();
    const tab3 = screen.getByRole("tab", { name: "Tab 3" });
    await user.click(tab3);

    const selectedIndex = screen.getByTestId("selected-index");
    expect(selectedIndex).toHaveTextContent("0");

    await user.click(toggleTab1);
    expect(screen.getByRole("tab", { name: "Tab 1" })).toBeInTheDocument();

    // Tab 3 moved to index 1 behind the restored Tab 1.
    const tab1 = screen.getByRole("tab", { name: "Tab 1" });
    await user.click(tab3);
    expect(selectedIndex).toHaveTextContent("1");
    expect(tab3).toHaveAttribute("aria-selected", "true");

    await user.click(tab1);
    expect(selectedIndex).toHaveTextContent("0");
    expect(tab1).toHaveAttribute("aria-selected", "true");
    expect(tab3).toHaveAttribute("aria-selected", "false");
  });

  it("uses the index API when selectedId is unset", async () => {
    render(TabsSelectedId, {
      props: { selected: 2, selectedId: undefined },
    });
    await tick();

    expect(screen.getByRole("tab", { name: "Tab C" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Content C")).toBeVisible();
    expect(screen.getByTestId("selected-index")).toHaveTextContent("2");
    expect(screen.getByTestId("selected-id")).toHaveTextContent("");

    await user.click(screen.getByRole("tab", { name: "Tab A" }));

    expect(screen.getByRole("tab", { name: "Tab A" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByTestId("selected-index")).toHaveTextContent("0");
    expect(screen.getByTestId("selected-id")).toHaveTextContent("");
  });

  it("lets selectedId win over selected", async () => {
    render(TabsSelectedId, {
      props: { selected: 0, selectedId: "tab-c" },
    });
    await tick();

    expect(screen.getByRole("tab", { name: "Tab C" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Content C")).toBeVisible();
    expect(screen.getByTestId("selected-id")).toHaveTextContent("tab-c");
    expect(screen.getByTestId("selected-index")).toHaveTextContent("2");
  });
});

describe("Tabs dismissible", () => {
  it("moves focus to the next tab after Delete on the selected tab", async () => {
    const onDismiss = vi.fn();
    render(TabsDismissible, { props: { onDismiss } });

    await user.click(screen.getByRole("tab", { name: "One" }));
    await user.keyboard("{Delete}");
    await tick();

    expect(onDismiss).toHaveBeenCalledWith(
      expect.objectContaining({ id: "one" }),
    );
    expect(screen.queryByRole("tab", { name: "One" })).not.toBeInTheDocument();
    const two = screen.getByRole("tab", { name: "Two" });
    expect(two).toHaveFocus();
    expect(two).toHaveAttribute("aria-selected", "true");
  });

  it("moves focus to the new last tab after Delete on the last tab", async () => {
    render(TabsDismissible);

    await user.click(screen.getByRole("tab", { name: "Three" }));
    await user.keyboard("{Delete}");
    await tick();

    expect(screen.getByRole("tab", { name: "Two" })).toHaveFocus();
  });

  it("moves focus without changing selection after a close button click", async () => {
    render(TabsDismissible);
    await tick();

    await user.click(screen.getByRole("button", { name: "Dismiss Two" }));
    await tick();

    expect(screen.getByRole("tab", { name: "Three" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "One" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it.each([
    { name: "Enter", key: "{Enter}" },
    { name: "Space", key: " " },
  ])("dismisses with $name on a focused dismiss button", async ({ key }) => {
    const onDismiss = vi.fn();
    render(TabsDismissible, { props: { onDismiss } });
    await tick();

    screen.getByRole("button", { name: "Dismiss Two" }).focus();
    await user.keyboard(key);
    await tick();

    expect(onDismiss).toHaveBeenCalledWith(
      expect.objectContaining({ id: "two" }),
    );
    expect(screen.getByRole("tab", { name: "One" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("leaves focus on the tab when the handler keeps it", async () => {
    const onDismiss = vi.fn();
    render(TabsDismissible, { props: { removeOnDismiss: false, onDismiss } });

    const one = screen.getByRole("tab", { name: "One" });
    await user.click(one);
    await user.keyboard("{Delete}");
    await tick();

    expect(onDismiss).toHaveBeenCalledWith(
      expect.objectContaining({ id: "one" }),
    );
    expect(one).toBeInTheDocument();
    expect(one).toHaveFocus();
  });

  it("does not dismiss a focused disabled tab on Delete", async () => {
    const onDismiss = vi.fn();
    render(TabsRegistration, { props: { onDismiss } });

    // Analyze is disabled; a click still gives its link focus.
    const analyze = screen.getByRole("tab", { name: "Analyze" });
    analyze.focus();
    await user.keyboard("{Delete}");

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("names the close button of an unlabeled tab Dismiss tab", () => {
    render(TabsDismissible, { props: { emptyLabel: true } });

    expect(screen.getByRole("button", { name: "Dismiss tab" })).toBeVisible();
  });

  it("renders a tab icon left of the label, not right, when dismissible", () => {
    const { container } = render(TabsDismissible, {
      props: { withIcon: true },
    });

    const items = container.querySelectorAll(".bx--tabs__nav-item");
    expect(items).toHaveLength(3);
    for (const item of items) {
      expect(
        item.querySelector(".bx--tabs__nav-item--icon-left"),
      ).toBeVisible();
      expect(item.querySelector(".bx--tabs__nav-item--icon")).toBeNull();
    }
  });

  it("dismisses every tab in turn without throwing", async () => {
    render(TabsDismissible);

    await user.click(screen.getByRole("tab", { name: "One" }));
    await user.keyboard("{Delete}");
    await tick();
    expect(screen.getByRole("tab", { name: "Two" })).toHaveFocus();

    await user.keyboard("{Delete}");
    await tick();
    expect(screen.getByRole("tab", { name: "Three" })).toHaveFocus();

    await user.keyboard("{Delete}");
    await tick();
    expect(screen.queryAllByRole("tab")).toHaveLength(0);
  });
});

describe("Tab registration", () => {
  it("drops the tall layout when the secondary label is cleared", async () => {
    render(TabsRegistration);

    await user.click(screen.getByRole("button", { name: "Load count" }));
    await tick();
    expect(screen.getByRole("navigation")).toHaveClass("bx--tabs--tall");

    await user.click(screen.getByRole("button", { name: "Clear count" }));
    await tick();
    expect(screen.getByRole("navigation")).not.toHaveClass("bx--tabs--tall");
  });

  it("reports the current label in the dismiss detail", async () => {
    const onDismiss = vi.fn();
    render(TabsRegistration, { props: { onDismiss } });

    await user.click(screen.getByRole("button", { name: "Rename" }));
    await tick();
    await user.click(screen.getByRole("tab", { name: "Renamed" }));
    await user.keyboard("{Delete}");

    expect(onDismiss).toHaveBeenCalledWith(
      expect.objectContaining({ label: "Renamed", index: 0 }),
    );
  });

  it("reports the current disabled state in the dismiss detail", async () => {
    const onDismiss = vi.fn();
    render(TabsRegistration, { props: { onDismiss } });

    await user.click(screen.getByRole("button", { name: "Enable" }));
    await tick();
    await user.click(screen.getByRole("tab", { name: "Analyze" }));
    await user.keyboard("{Delete}");

    expect(onDismiss).toHaveBeenCalledWith(
      expect.objectContaining({ label: "Analyze", disabled: false, index: 1 }),
    );
  });
});

describe("Tab", () => {
  // A user-provided href should navigate like a link: activation must not be
  // preventDefault-ed (regression for #2165). fireEvent returns false when a
  // handler canceled the event.
  it("should not prevent default activation when a real href is provided", async () => {
    render(Tab, { props: { href: "#custom" } });

    const tab = screen.getByRole("tab");
    expect(await fireEvent.click(tab)).toBe(true);
    expect(await fireEvent.keyDown(tab, { key: "Enter" })).toBe(true);
  });

  // The default "#" href is a placeholder: tabs act as selection controls, so
  // navigation must be suppressed (including Enter, the original concern).
  it("should prevent default activation for the placeholder href", async () => {
    render(Tab, { props: { href: "#" } });

    const tab = screen.getByRole("tab");
    expect(await fireEvent.click(tab)).toBe(false);
    expect(await fireEvent.keyDown(tab, { key: "Enter" })).toBe(false);
  });

  it("should handle disabled state", () => {
    render(Tab, { props: { disabled: true } });

    const tab = screen.getByRole("tab");
    expect(tab).toHaveAttribute("aria-disabled", "true");
    // The lone tab is selected, so it keeps the tab stop.
    expect(tab).toHaveAttribute("tabindex", "0");
  });

  it("should handle custom tabindex", () => {
    render(Tab, { props: { tabindex: "1" } });

    const tab = screen.getByRole("tab");
    expect(tab).toHaveAttribute("tabindex", "1");
  });

  it("should be clickable when enabled", async () => {
    render(Tab, { props: { withSibling: true } });

    const tab = screen.getByRole("tab", { name: "Test Tab" });
    const sibling = screen.getByRole("tab", { name: "Sibling" });
    expect(sibling).toHaveAttribute("aria-selected", "true");
    expect(tab).toHaveAttribute("aria-selected", "false");

    await user.click(tab);

    expect(tab).toHaveAttribute("aria-selected", "true");
    expect(sibling).toHaveAttribute("aria-selected", "false");
  });

  it("should handle keyboard navigation with arrow keys", async () => {
    render(Tab, { props: { withSibling: true } });

    const tab = screen.getByRole("tab", { name: "Test Tab" });
    await user.click(screen.getByRole("tab", { name: "Sibling" }));
    await user.keyboard("{ArrowRight}");

    expect(tab).toHaveFocus();
    expect(tab).toHaveAttribute("aria-selected", "true");
  });

  it.each([
    ["space", " "],
    ["enter", "{Enter}"],
  ])("should handle %s key activation", async (_, key) => {
    render(Tab, { props: { withSibling: true, activation: "manual" } });

    const tab = screen.getByRole("tab", { name: "Test Tab" });
    const sibling = screen.getByRole("tab", { name: "Sibling" });
    await user.click(sibling);
    await user.keyboard("{ArrowRight}");
    expect(tab).toHaveFocus();
    expect(tab).toHaveAttribute("aria-selected", "false");

    await user.keyboard(key);

    expect(tab).toHaveAttribute("aria-selected", "true");
    expect(sibling).toHaveAttribute("aria-selected", "false");
  });

  it("should render no label text when label is empty", () => {
    render(Tab, { props: { label: "" } });

    const tab = screen.getByRole("tab");
    expect(tab).toHaveTextContent("");
  });

  // `data-label` backs the CSS bold-width reservation (::after) that keeps
  // selecting a tab from reflowing its neighbors; empty labels must omit the
  // attribute so slotted custom content isn't measured against blank text.
  // It's on the label span (not the tab link) so the reservation sums
  // correctly with an icon's width on icon tabs.
  it("should reflect label via data-label, omitted when empty", async () => {
    const { container, rerender } = render(Tab, {
      props: { label: "Custom Label" },
    });
    const getLabel = () => container.querySelector(".bx--tabs__nav-item-label");

    expect(getLabel()).toHaveAttribute("data-label", "Custom Label");

    await rerender({ label: "" });
    expect(getLabel()).not.toHaveAttribute("data-label");
  });

  it("should render slot content instead of label", () => {
    render(Tab, { props: { useSlot: true } });

    const tab = screen.getByRole("tab");
    expect(tab).toHaveTextContent("Slot content");
  });
});

describe("Tab icon", () => {
  it("should render icon next to label", () => {
    const { container } = render(TabIcon, { props: { icon: Calendar } });

    const iconWrapper = container.querySelector(".bx--tabs__nav-item--icon");
    expect(iconWrapper).toBeInTheDocument();

    const svg = iconWrapper?.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("width", "16");
    expect(svg).toHaveAttribute("height", "16");
  });

  it("should not render icon wrapper when no icon is provided", () => {
    const { container } = render(TabIcon, { props: { icon: Calendar } });

    const navItems = container.querySelectorAll(".bx--tabs__nav-item");
    const secondTab = navItems[1];
    const iconWrapper = secondTab?.querySelector(".bx--tabs__nav-item--icon");
    expect(iconWrapper).not.toBeInTheDocument();
  });

  it("marks only the icon-bearing nav link with the icon modifier class", () => {
    const { container } = render(TabIcon, { props: { icon: Calendar } });

    const navLinks = container.querySelectorAll(".bx--tabs__nav-link");
    expect(navLinks[0]).toHaveClass("bx--tabs__nav-link--icon");
    expect(navLinks[1]).not.toHaveClass("bx--tabs__nav-link--icon");
  });

  it("should still be clickable with icon when enabled", async () => {
    render(TabIcon, { props: { icon: Calendar } });

    const tab = screen.getByRole("tab", { name: /Test Tab/ });
    await user.click(screen.getByRole("tab", { name: "No Icon" }));
    expect(tab).toHaveAttribute("aria-selected", "false");

    await user.click(tab);

    expect(tab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Icon content")).toBeVisible();
  });
});

describe("Container tabs with icons and secondary label", () => {
  it("should render container type with icon and secondary label on each tab", async () => {
    const { container } = render(TabIconSecondaryLabel);
    await tick();

    const tabsContainer = screen.getByRole("navigation");
    expect(tabsContainer).toHaveClass("bx--tabs--container");

    expect(screen.getByRole("tab", { name: /Calendar/ })).toBeInTheDocument();
    expect(screen.getByText("(12 events)")).toBeInTheDocument();

    expect(
      screen.getByRole("tab", { name: /Information/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("(3 new)")).toBeInTheDocument();

    expect(screen.getByRole("tab", { name: /Settings/ })).toBeInTheDocument();
    expect(screen.getByText("(2 pending)")).toBeInTheDocument();

    const iconWrappers = container.querySelectorAll(
      ".bx--tabs__nav-item--icon",
    );
    expect(iconWrappers).toHaveLength(3);
  });

  it("should have label wrapper and secondary label when tab has icon and secondaryLabel", async () => {
    const { container } = render(TabIconSecondaryLabel);
    await tick();

    const navItems = container.querySelectorAll(".bx--tabs__nav-item");
    const calendarTab = navItems[0];
    const labelWrapper = calendarTab?.querySelector(
      ".bx--tabs__nav-item-label-wrapper",
    );
    const secondaryLabel = calendarTab?.querySelector(
      ".bx--tabs__nav-item-secondary-label",
    );
    const iconWrapper = calendarTab?.querySelector(".bx--tabs__nav-item--icon");

    expect(labelWrapper).toBeInTheDocument();
    expect(secondaryLabel).toBeInTheDocument();
    expect(secondaryLabel).toHaveTextContent("(12 events)");
    expect(iconWrapper).toBeInTheDocument();
  });

  it("should be clickable and show content when tab has icon and secondary label", async () => {
    render(TabIconSecondaryLabel);

    const informationTab = screen.getByRole("tab", { name: /Information/ });
    await user.click(informationTab);

    expect(informationTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Information content")).toBeVisible();
  });

  it("should not select disabled tab with icon and secondary label", async () => {
    render(TabIconSecondaryLabel);

    const settingsTab = screen.getByRole("tab", { name: /Settings/ });
    expect(settingsTab).toHaveAttribute("aria-disabled", "true");
    await user.click(settingsTab);

    expect(settingsTab).toHaveAttribute("aria-selected", "false");
  });
});

describe("Container tabs with secondary label", () => {
  it("should render container with tall class when any tab has secondary label", async () => {
    render(TabSecondaryLabel);
    await tick();

    const tabsContainer = screen.getByRole("navigation");
    expect(tabsContainer).toHaveClass("bx--tabs--container");
    expect(tabsContainer).toHaveClass("bx--tabs--tall");
  });

  it("updates the tall class when type changes after mount", async () => {
    const { rerender } = render(TabSecondaryLabel);
    await tick();
    const nav = screen.getByRole("navigation");

    await rerender({ type: "default" });
    expect(nav).not.toHaveClass("bx--tabs--tall");

    await rerender({ type: "container" });
    expect(nav).toHaveClass("bx--tabs--tall");
  });

  it("should have label wrapper and secondary label element for tab with prop", async () => {
    const { container } = render(TabSecondaryLabel);
    await tick();

    const navItems = container.querySelectorAll(".bx--tabs__nav-item");
    const engageTab = navItems[0];
    const labelWrapper = engageTab?.querySelector(
      ".bx--tabs__nav-item-label-wrapper",
    );
    const secondaryLabel = engageTab?.querySelector(
      ".bx--tabs__nav-item-secondary-label",
    );

    expect(labelWrapper).toBeInTheDocument();
    expect(secondaryLabel).toBeInTheDocument();
    expect(secondaryLabel).toHaveTextContent("(21/25)");
  });

  it("should have label wrapper and secondary label element for tab with slot", async () => {
    const { container } = render(TabSecondaryLabel);
    await tick();

    const navItems = container.querySelectorAll(".bx--tabs__nav-item");
    const analyzeTab = navItems[1];
    const labelWrapper = analyzeTab?.querySelector(
      ".bx--tabs__nav-item-label-wrapper",
    );
    const secondaryLabel = analyzeTab?.querySelector(
      ".bx--tabs__nav-item-secondary-label",
    );

    expect(labelWrapper).toBeInTheDocument();
    expect(secondaryLabel).toBeInTheDocument();
    expect(secondaryLabel).toHaveTextContent("(12/16)");
  });

  it("should render label wrapper and empty spacer for tab without secondary label (for alignment)", async () => {
    const { container } = render(TabSecondaryLabel);
    await tick();

    const navItems = container.querySelectorAll(".bx--tabs__nav-item");
    const plainTab = navItems[2];
    const labelWrapper = plainTab?.querySelector(
      ".bx--tabs__nav-item-label-wrapper",
    );
    const secondaryLabelEl = plainTab?.querySelector(
      ".bx--tabs__nav-item-secondary-label",
    );

    expect(labelWrapper).toBeInTheDocument();
    expect(secondaryLabelEl).toBeInTheDocument();
    expect(secondaryLabelEl).toHaveAttribute("aria-hidden", "true");
    expect(secondaryLabelEl).toHaveTextContent("");
    expect(plainTab).toHaveTextContent("Plain");
  });

  it("should be clickable and show content when tab has secondary label", async () => {
    render(TabSecondaryLabel);

    const engageTab = screen.getByRole("tab", { name: /Engage/ });
    await user.click(screen.getByRole("tab", { name: /Plain/ }));
    expect(engageTab).toHaveAttribute("aria-selected", "false");

    await user.click(engageTab);

    expect(engageTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Engage content")).toBeVisible();
    expect(screen.getByText("Plain content")).not.toBeVisible();
  });

  it("should switch content when clicking tab with slot secondary label", async () => {
    render(TabSecondaryLabel);

    const analyzeTab = screen.getByRole("tab", { name: /Analyze/ });
    await user.click(analyzeTab);

    expect(analyzeTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Analyze content")).toBeVisible();
  });
});

describe.each([
  ["Tabs", Tabs, () => screen.getByRole("navigation")],
  ["TabsSkeleton", TabsSkeleton, () => document.querySelector(".bx--tabs")],
])("%s layout size", (_, Component, getNav) => {
  it.each([
    [undefined, "sm", "sm"],
    ["default", "xl", "lg"],
    ["container", "xl", "xl"],
  ] as const)("type %s with size %s uses size-%s", (type, size, expected) => {
    render(Component, { props: { ...(type && { type }), size } });

    const nav = getNav();
    expect(nav).toHaveClass(`bx--layout--size-${expected}`);
    if (size !== expected) {
      expect(nav).not.toHaveClass(`bx--layout--size-${size}`);
    }
  });
});

describe("TabsSkeleton", () => {
  it("should render with default props", () => {
    const { container } = render(TabsSkeleton);

    const skeleton = container.querySelector(".bx--tabs");
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass("bx--skeleton");
    expect(skeleton).toHaveClass("bx--tabs--scrollable");

    const navItems = container.querySelectorAll(
      ".bx--tabs--scrollable__nav-item",
    );
    expect(navItems).toHaveLength(4);
  });

  it.each([6, 0, 20])("should render %i nav items for count", (count) => {
    const { container } = render(TabsSkeleton, { props: { count } });

    const navItems = container.querySelectorAll(
      ".bx--tabs--scrollable__nav-item",
    );
    expect(navItems).toHaveLength(count);
  });

  it.each([
    ["container", true],
    ["default", false],
  ] as const)("sets the container class for the %s type", (type, expected) => {
    const { container } = render(TabsSkeleton, { props: { type } });

    expectClass(
      container.querySelector(".bx--tabs"),
      "bx--tabs--scrollable--container",
      expected,
    );
  });

  describe("Tab Generics", () => {
    it("should support custom Icon types with generics", () => {
      type CustomIcon = new (...args: unknown[]) => unknown;

      type ComponentType = TabComponent<CustomIcon>;
      type Props = ComponentProps<ComponentType>;

      expectTypeOf<Props["icon"]>().toEqualTypeOf<CustomIcon | undefined>();
    });

    it("should default to any type when generic is not specified", () => {
      type ComponentType = TabComponent;
      type Props = ComponentProps<ComponentType>;

      // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
      expectTypeOf<Props["icon"]>().toEqualTypeOf<any>();
    });
  });

  describe("TabContent lazy and unmountOnHide", () => {
    it("keeps unselected content in the DOM with the hidden attribute by default", async () => {
      render(TabsLazy);
      await tick();

      expect(screen.getByText("Content 1")).toBeVisible();
      expect(screen.getByText("Content 2")).not.toBeVisible();
      expect(screen.getByText("Content 3")).not.toBeVisible();

      const panels = screen.getAllByRole("tabpanel", { hidden: true });
      expect(panels[1]).toHaveAttribute("hidden");
      expect(panels[2]).toHaveAttribute("hidden");
    });

    it("does not mount lazy content until the tab is first selected", async () => {
      render(TabsLazy, { props: { lazy: true } });
      await tick();

      expect(screen.getByText("Content 1")).toBeInTheDocument();
      expect(screen.queryByText("Content 2")).not.toBeInTheDocument();
      expect(screen.queryByText("Content 3")).not.toBeInTheDocument();

      await user.click(screen.getByRole("tab", { name: "Tab 2" }));

      expect(screen.getByText("Content 2")).toBeVisible();
      expect(screen.queryByText("Content 3")).not.toBeInTheDocument();

      await user.click(screen.getByRole("tab", { name: "Tab 1" }));

      expect(screen.getByText("Content 2")).toBeInTheDocument();
      expect(screen.getByText("Content 2")).not.toBeVisible();
    });

    it("unmounts content when deselected with unmountOnHide", async () => {
      render(TabsLazy, { props: { unmountOnHide: true } });
      await tick();

      expect(screen.getByText("Content 1")).toBeVisible();
      expect(screen.queryByText("Content 2")).not.toBeInTheDocument();

      await user.click(screen.getByRole("tab", { name: "Tab 2" }));

      expect(screen.getByText("Content 2")).toBeVisible();
      expect(screen.queryByText("Content 1")).not.toBeInTheDocument();

      await user.click(screen.getByRole("tab", { name: "Tab 1" }));

      expect(screen.getByText("Content 1")).toBeVisible();
      expect(screen.queryByText("Content 2")).not.toBeInTheDocument();
    });

    it("mounts lazy content on the initially selected tab", async () => {
      render(TabsLazy, { props: { selected: 1, lazy: true } });
      await tick();

      expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
      expect(screen.getByText("Content 2")).toBeVisible();
      expect(screen.queryByText("Content 3")).not.toBeInTheDocument();
    });
  });
});
