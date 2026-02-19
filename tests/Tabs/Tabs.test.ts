import { render, screen, within } from "@testing-library/svelte";
import { user } from "../setup-tests";
import Tab from "./Tab.test.svelte";
import Tabs from "./Tabs.test.svelte";
import TabsDynamic from "./TabsDynamic.test.svelte";
import TabsSkeleton from "./TabsSkeleton.test.svelte";

describe("Tabs", () => {
  let consoleLog: Console["log"];

  beforeEach(() => {
    consoleLog = vi.spyOn(console, "log");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render with default props", () => {
    render(Tabs);

    expect(screen.getByRole("tab", { name: "Tab 1" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Tab 2" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Tab 3" })).toBeInTheDocument();
    expect(screen.getByText("Content 1")).toBeVisible();
    expect(screen.getByText("Content 2")).not.toBeVisible();
    expect(screen.getByText("Content 3")).not.toBeVisible();
  });

  it("should select initial tab based on selected prop", () => {
    render(Tabs, { props: { selected: 2 } });

    const tab3 = screen.getByRole("tab", { name: "Tab 3" });
    expect(tab3).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Content 3")).toBeVisible();
    expect(screen.getByText("Content 1")).not.toBeVisible();
    expect(screen.getByText("Content 2")).not.toBeVisible();
  });

  it("should change tab on click", async () => {
    render(Tabs);

    const tab3 = screen.getByRole("tab", { name: "Tab 3" });
    await user.click(tab3);

    expect(tab3.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("Content 3")).toBeVisible();
    expect(consoleLog).toHaveBeenCalledWith("change event", 2);
  });

  it("should not select disabled tabs", async () => {
    render(Tabs);

    const tab2 = screen.getByRole("tab", { name: "Tab 2" });
    expect(tab2).toHaveAttribute("aria-disabled", "true");
    await user.click(tab2);

    expect(tab2).toHaveAttribute("aria-selected", "false");
    expect(screen.getByText("Content 1")).toBeVisible();
  });

  it("should support keyboard navigation", async () => {
    render(Tabs);

    const tab1 = screen.getByRole("tab", { name: "Tab 1" });
    await user.click(tab1);

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Tab 3" })).toHaveFocus();
    expect(consoleLog).toHaveBeenCalledWith("change event", 2);

    await user.keyboard("{ArrowLeft}");
    expect(tab1).toHaveFocus();
    expect(consoleLog).toHaveBeenCalledWith("change event", 0);
  });

  // Regression: ?? for aria-label so empty string is used (not fallback)
  it("uses empty aria-label when passed (nullish coalescing)", () => {
    render(Tabs, { props: { ariaLabel: "" } });
    const listbox = screen.getByRole("listbox");
    expect(listbox).toHaveAttribute("aria-label", "");
  });

  it("should render container type tabs", () => {
    render(Tabs, {
      props: { type: "container" },
    });

    const tabsContainer = screen.getByRole("navigation");
    expect(tabsContainer).toHaveClass("bx--tabs--container");
  });

  it("should support auto width", () => {
    render(Tabs, {
      props: { autoWidth: true },
    });

    const tabs = screen.getAllByRole("tab");
    for (const tab of tabs) {
      const navItem = tab.closest(".bx--tabs__nav-item");
      expect(navItem).not.toHaveStyle({ width: "10rem" });
    }
  });

  it("should show dropdown on trigger click", async () => {
    render(Tabs);

    const trigger = screen.getByRole("listbox");
    await user.click(trigger);
    const tablist = screen.getByRole("tablist");
    expect(tablist).not.toHaveClass("bx--tabs__nav--hidden");
  });

  it("should update trigger text when tab changes", async () => {
    render(Tabs);

    const tab3 = screen.getByText("Tab 3");
    await user.click(tab3);

    const trigger = screen.getByRole("listbox");
    const triggerText = within(trigger).getByRole("link");
    expect(triggerText).toHaveTextContent("Tab 3");
  });

  it("should support custom trigger href", () => {
    render(Tabs, {
      props: { triggerHref: "#custom" },
    });

    const trigger = screen.getByRole("listbox");
    const triggerLink = within(trigger).getByRole("link");
    expect(triggerLink).toHaveAttribute("href", "#custom");
  });

  it("should support custom icon description", () => {
    render(Tabs, {
      props: { iconDescription: "Custom description" },
    });

    expect(screen.getByTitle("Custom description")).toBeInTheDocument();
  });

  it("should apply custom class", () => {
    render(Tabs, {
      props: { customClass: "custom-tabs" },
    });

    const tabsContainer = screen.getByRole("navigation");
    expect(tabsContainer).toHaveClass("custom-tabs");
  });

  it("should apply custom aria-label", () => {
    render(Tabs, {
      props: { ariaLabel: "Custom label" },
    });

    const trigger = screen.getByRole("listbox", { name: "Custom label" });
    expect(trigger).toHaveAttribute("aria-label", "Custom label");
  });

  it("should handle keypress on dropdown trigger", async () => {
    render(Tabs);

    const trigger = screen.getByRole("listbox");
    trigger.focus();
    await user.keyboard("{Enter}");
    const tablist = screen.getByRole("tablist");
    expect(tablist).not.toHaveClass("bx--tabs__nav--hidden");
  });

  it("should maintain correct indices when tabs are dynamically removed and re-added", async () => {
    render(TabsDynamic, { props: { showTab1: true } });

    // Initial state: Tab 1, Tab 2, Tab 3
    expect(screen.getByRole("tab", { name: "Tab 1" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Tab 2" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Tab 3" })).toBeInTheDocument();

    // Toggle Tab 1 off
    const toggleButton = screen.getByTestId("toggle-tab1");
    await user.click(toggleButton);

    // Tab 1 should be removed
    expect(
      screen.queryByRole("tab", { name: "Tab 1" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Tab 2" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Tab 3" })).toBeInTheDocument();

    // Toggle Tab 1 back on
    await user.click(toggleButton);

    // Tab 1 should be back at index 0
    expect(screen.getByRole("tab", { name: "Tab 1" })).toBeInTheDocument();

    // Click Tab 1 and verify it has the correct index (0)
    const tab1 = screen.getByRole("tab", { name: "Tab 1" });
    await user.click(tab1);

    const selectedIndex = screen.getByTestId("selected-index");
    expect(selectedIndex).toHaveTextContent("0");
  });

  it("should update selected index when active tab is removed", async () => {
    render(TabsDynamic, {
      props: { selected: 1, showTab1: true, showTab2: true },
    });

    // Initial state: Tab 1 (0), Tab 2 (1), Tab 3 (2) - Tab 2 is selected
    const selectedIndex = screen.getByTestId("selected-index");
    expect(selectedIndex).toHaveTextContent("1");

    // Toggle Tab 2 off (the currently selected tab)
    const toggleTab2Button = screen.getByTestId("toggle-tab2");
    await user.click(toggleTab2Button);

    // Tab 2 should be removed
    expect(
      screen.queryByRole("tab", { name: "Tab 2" }),
    ).not.toBeInTheDocument();

    // Only Tab 1 and Tab 3 should remain
    expect(screen.getByRole("tab", { name: "Tab 1" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Tab 3" })).toBeInTheDocument();
  });

  it("should handle multiple tabs being toggled in sequence", async () => {
    render(TabsDynamic, { props: { showTab1: true, showTab2: true } });

    const toggleTab1 = screen.getByTestId("toggle-tab1");
    const toggleTab2 = screen.getByTestId("toggle-tab2");

    // Remove Tab 1
    await user.click(toggleTab1);
    expect(
      screen.queryByRole("tab", { name: "Tab 1" }),
    ).not.toBeInTheDocument();

    // Remove Tab 2
    await user.click(toggleTab2);
    expect(
      screen.queryByRole("tab", { name: "Tab 2" }),
    ).not.toBeInTheDocument();

    // Only Tab 3 should remain and it should be at index 0
    expect(screen.getByRole("tab", { name: "Tab 3" })).toBeInTheDocument();
    const tab3 = screen.getByRole("tab", { name: "Tab 3" });
    await user.click(tab3);

    const selectedIndex = screen.getByTestId("selected-index");
    expect(selectedIndex).toHaveTextContent("0");

    // Add Tab 1 back - it should get index 0 and Tab 3 should move to index 1
    await user.click(toggleTab1);
    expect(screen.getByRole("tab", { name: "Tab 1" })).toBeInTheDocument();

    const tab1 = screen.getByRole("tab", { name: "Tab 1" });
    await user.click(tab1);
    expect(selectedIndex).toHaveTextContent("0");
  });
});

describe("Tab", () => {
  it("should render with default props", () => {
    render(Tab);

    const tab = screen.getByRole("tab", { name: "Test Tab" });
    expect(tab).toBeInTheDocument();
    expect(tab).toHaveAttribute("aria-selected", "true");

    const link = tab.querySelector("a");
    expect(link).toHaveAttribute("href", "#test");
    expect(link).toHaveAttribute("tabindex", "0");
    expect(link).toHaveAttribute("id", "test-tab");
  });

  it("should render with custom label", () => {
    render(Tab, { props: { label: "Custom Label" } });

    expect(
      screen.getByRole("tab", { name: "Custom Label" }),
    ).toBeInTheDocument();
  });

  it("should render with custom href", () => {
    render(Tab, { props: { href: "/custom" } });

    const tab = screen.getByRole("tab");
    const link = tab.querySelector("a");
    expect(link).toHaveAttribute("href", "/custom");
  });

  it("should handle disabled state", () => {
    render(Tab, { props: { disabled: true } });

    const tab = screen.getByRole("tab");
    expect(tab).toHaveAttribute("aria-disabled", "true");

    const link = tab.querySelector("a");
    expect(link).toHaveAttribute("tabindex", "-1");
  });

  it("should handle custom tabindex", () => {
    render(Tab, { props: { tabindex: "1" } });

    const tab = screen.getByRole("tab");
    const link = tab.querySelector("a");
    expect(link).toHaveAttribute("tabindex", "1");
  });

  it("should handle custom id", () => {
    render(Tab, { props: { id: "custom-id" } });

    const tab = screen.getByRole("tab");
    const link = tab.querySelector("a");
    expect(link).toHaveAttribute("id", "custom-id");
  });

  it("should be clickable when enabled", async () => {
    render(Tab);

    const tab = screen.getByRole("tab");
    await user.click(tab);

    expect(tab).toHaveAttribute("aria-selected", "true");
  });

  it("should handle keyboard navigation with arrow keys", async () => {
    render(Tab);

    const tab = screen.getByRole("tab");
    await user.click(tab);
    await user.keyboard("{ArrowRight}");

    expect(tab).toHaveFocus();
  });

  it("should handle space key activation", async () => {
    render(Tab);

    const tab = screen.getByRole("tab");
    await user.click(tab);
    await user.keyboard(" ");

    expect(tab).toHaveAttribute("aria-selected", "true");
  });

  it("should handle enter key activation", async () => {
    render(Tab);

    const tab = screen.getByRole("tab");
    await user.click(tab);
    await user.keyboard("{Enter}");

    expect(tab).toHaveAttribute("aria-selected", "true");
  });

  it("should render slot content when no label provided", () => {
    render(Tab, { props: { label: "" } });

    const tab = screen.getByRole("tab");
    expect(tab).toHaveTextContent("");
  });

  it("should render slot content instead of label", () => {
    render(Tab, { props: { useSlot: true } });

    const tab = screen.getByRole("tab");
    expect(tab).toHaveTextContent("Slot content");
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

  it("should render with custom count", () => {
    const { container } = render(TabsSkeleton, { props: { count: 6 } });

    const navItems = container.querySelectorAll(
      ".bx--tabs--scrollable__nav-item",
    );
    expect(navItems).toHaveLength(6);
  });

  it("should render with container type", () => {
    const { container } = render(TabsSkeleton, {
      props: { type: "container" },
    });

    const skeleton = container.querySelector(".bx--tabs");
    expect(skeleton).toHaveClass("bx--tabs--scrollable--container");
  });

  it("should render with default type", () => {
    const { container } = render(TabsSkeleton, { props: { type: "default" } });

    const skeleton = container.querySelector(".bx--tabs");
    expect(skeleton).not.toHaveClass("bx--tabs--scrollable--container");
  });

  it("should render skeleton nav items with correct structure", () => {
    const { container } = render(TabsSkeleton);

    const navItems = container.querySelectorAll(
      ".bx--tabs--scrollable__nav-item",
    );
    for (const item of navItems) {
      const link = item.querySelector(".bx--tabs__nav-link");
      const span = link?.querySelector("span");

      expect(link).toBeInTheDocument();
      expect(span).toBeInTheDocument();
    }
  });

  it("should handle zero count", () => {
    const { container } = render(TabsSkeleton, { props: { count: 0 } });

    const navItems = container.querySelectorAll(
      ".bx--tabs--scrollable__nav-item",
    );
    expect(navItems).toHaveLength(0);
  });

  it("should handle large count", () => {
    const { container } = render(TabsSkeleton, { props: { count: 20 } });

    const navItems = container.querySelectorAll(
      ".bx--tabs--scrollable__nav-item",
    );
    expect(navItems).toHaveLength(20);
  });
});
