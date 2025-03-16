import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import Tabs from "./Tabs.test.svelte";

describe("Tabs", () => {
  let consoleLog: ReturnType<typeof vi.spyOn>;

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
    if (!trigger) throw new Error("Trigger element not found");

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
});
