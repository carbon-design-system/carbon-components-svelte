import { fireEvent, render, screen } from "@testing-library/svelte";
import Calendar from "../../src/icons/Calendar.svelte";
import { user } from "../utils/user";
import TabsVertical from "./TabsVertical.test.svelte";

describe("TabsVertical", () => {
  let consoleLog: Console["log"];

  beforeEach(() => {
    consoleLog = vi.spyOn(console, "log");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render with default props", () => {
    render(TabsVertical);

    expect(screen.getByRole("navigation")).toHaveClass("bx--tabs--vertical");

    expect(screen.getByRole("tab", { name: "Tab 1" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Content 1")).toBeVisible();
    expect(screen.getByText("Content 2")).not.toBeVisible();
  });

  it("should render a vertically-oriented tablist", () => {
    render(TabsVertical);

    expect(screen.getByRole("tablist")).toHaveAttribute(
      "aria-orientation",
      "vertical",
    );
  });

  it("should select the initial tab from the selected prop", () => {
    render(TabsVertical, { props: { selected: 2 } });

    expect(screen.getByRole("tab", { name: "Tab 3" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Content 3")).toBeVisible();
  });

  it("should change tab on click and dispatch change", async () => {
    render(TabsVertical);

    const tab3 = screen.getByRole("tab", { name: "Tab 3" });
    await user.click(tab3);

    expect(tab3).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Content 3")).toBeVisible();
    expect(consoleLog).toHaveBeenCalledWith("change event", 2);
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
    render(TabsVertical);

    const tab1 = screen.getByRole("tab", { name: "Tab 1" });
    await user.click(tab1);

    // Tab 2 is disabled, so ArrowDown moves to Tab 3.
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("tab", { name: "Tab 3" })).toHaveFocus();
    expect(consoleLog).toHaveBeenCalledWith("change event", 2);

    await user.keyboard("{ArrowUp}");
    expect(tab1).toHaveFocus();
    expect(consoleLog).toHaveBeenCalledWith("change event", 0);
  });

  it("should prevent the default scroll on arrow navigation", async () => {
    render(TabsVertical);

    const tab1 = screen.getByRole("tab", { name: "Tab 1" });
    expect(await fireEvent.keyDown(tab1, { key: "ArrowDown" })).toBe(false);
    expect(await fireEvent.keyDown(tab1, { key: "ArrowUp" })).toBe(false);
  });

  it("should render an icon for the tab", () => {
    const { container } = render(TabsVertical, { props: { icon: Calendar } });

    const navLink = container.querySelector(".bx--tabs__nav-link--icon");
    expect(navLink).toBeInTheDocument();
    expect(
      navLink?.querySelector(".bx--tabs__nav-item--icon svg"),
    ).toBeInTheDocument();
  });
});
