import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import Tabs from "./Tabs.test.svelte";
import Tab from "./Tab.test.svelte";
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

  it("should render container type tabs", () => {
    const { container } = render(Tabs, {
      props: { type: "container" },
    });

    expect(container.querySelector(".bx--tabs--container")).not.toBeNull();
  });

  it("should support auto width", () => {
    const { container } = render(Tabs, {
      props: { autoWidth: true },
    });

    const tabs = container.querySelectorAll(".bx--tabs__nav-item");
    tabs.forEach((tab) => {
      expect(tab).not.toHaveStyle({ width: "10rem" });
    });
  });

  it("should show dropdown on trigger click", async () => {
    const { container } = render(Tabs);

    const trigger = container.querySelector(".bx--tabs-trigger");
    assert(trigger);
    await user.click(trigger);
    expect(container.querySelector(".bx--tabs__nav--hidden")).toBeNull();
  });

  it("should update trigger text when tab changes", async () => {
    const { container } = render(Tabs);

    const tab3 = screen.getByText("Tab 3");
    await user.click(tab3);

    const triggerText = container.querySelector(".bx--tabs-trigger-text");
    expect(triggerText).toHaveTextContent("Tab 3");
  });

  it("should support custom trigger href", () => {
    const { container } = render(Tabs, {
      props: { triggerHref: "#custom" },
    });

    const triggerLink = container.querySelector(".bx--tabs-trigger-text");
    expect(triggerLink).toHaveAttribute("href", "#custom");
  });

  it("should support custom icon description", () => {
    render(Tabs, {
      props: { iconDescription: "Custom description" },
    });

    expect(screen.getByTitle("Custom description")).toBeInTheDocument();
  });

  it("should apply custom class", () => {
    const { container } = render(Tabs, {
      props: { customClass: "custom-tabs" },
    });

    const tabs = container.querySelector(".bx--tabs");
    expect(tabs).toHaveClass("custom-tabs");
  });

  it("should apply custom aria-label", () => {
    const { container } = render(Tabs, {
      props: { ariaLabel: "Custom label" },
    });

    const trigger = container.querySelector(".bx--tabs-trigger");
    expect(trigger).toHaveAttribute("aria-label", "Custom label");
  });

  it("should handle keypress on dropdown trigger", async () => {
    const { container } = render(Tabs);

    const trigger = container.querySelector(".bx--tabs-trigger");
    assert(trigger instanceof HTMLElement);
    trigger.focus();
    await user.keyboard("{Enter}");
    expect(container.querySelector(".bx--tabs__nav--hidden")).toBeNull();
  });
});

describe("Tab", () => {
  it("should render with default props", () => {
    render(Tab);

    const tab = screen.getByRole("tab", { name: "Test Tab" });
    expect(tab).toBeInTheDocument();
    expect(tab).toHaveAttribute("href", "#test");
    expect(tab).toHaveAttribute("tabindex", "0");
    expect(tab).toHaveAttribute("id", "test-tab");
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
    expect(tab).toHaveAttribute("href", "/custom");
  });

  it("should handle disabled state", () => {
    render(Tab, { props: { disabled: true } });

    const tab = screen.getByRole("tab");
    expect(tab).toHaveAttribute("aria-disabled", "true");
    expect(tab).toHaveAttribute("tabindex", "-1");
  });

  it("should handle custom tabindex", () => {
    render(Tab, { props: { tabindex: "1" } });

    const tab = screen.getByRole("tab");
    expect(tab).toHaveAttribute("tabindex", "1");
  });

  it("should handle custom id", () => {
    render(Tab, { props: { id: "custom-id" } });

    const tab = screen.getByRole("tab");
    expect(tab).toHaveAttribute("id", "custom-id");
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
    navItems.forEach((item) => {
      const link = item.querySelector(".bx--tabs__nav-link");
      const span = link?.querySelector("span");

      expect(link).toBeInTheDocument();
      expect(span).toBeInTheDocument();
    });
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
