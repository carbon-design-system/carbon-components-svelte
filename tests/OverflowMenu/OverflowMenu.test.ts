import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import OverflowMenu from "./OverflowMenu.test.svelte";

describe("OverflowMenu", () => {
  it("renders and functions correctly", async () => {
    render(OverflowMenu);

    const menuButton = screen.getByRole("button");
    expect(menuButton).toHaveAttribute("aria-haspopup", "true");
    expect(menuButton).toHaveAttribute("aria-expanded", "false");

    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    const menuItems = screen.getAllByRole("menuitem");
    expect(menuItems).toHaveLength(3);
    expect(menuItems[0]).toHaveFocus();

    expect(menuItems[0]).toHaveTextContent("Manage credentials");
    expect(menuItems[1]).toHaveTextContent("API documentation");
    expect(menuItems[2]).toHaveTextContent("Delete service");

    expect(menuItems[1]).toHaveAttribute(
      "href",
      "https://cloud.ibm.com/docs/api-gateway/",
    );

    expect(menuItems[2].parentElement).toHaveClass(
      "bx--overflow-menu-options__option--danger",
    );

    const spy = vi.spyOn(console, "log");
    await user.click(menuItems[0]);
    expect(spy).toHaveBeenCalledWith("click", "Manage credentials");

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(spy).toHaveBeenCalledWith("close", {
      index: 0,
      text: "Manage credentials",
    });
  });

  it("handles keyboard navigation", async () => {
    render(OverflowMenu);

    const spy = vi.spyOn(console, "log");

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    let menuItems = screen.getAllByRole("menuitem");
    expect(menuItems[0]).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(menuItems[1]).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(spy).toHaveBeenCalledWith("click", "API documentation");

    await user.click(menuButton);
    menuItems = screen.getAllByRole("menuitem");
    expect(menuItems[0]).toHaveFocus();

    await user.keyboard("{ArrowUp}");
    expect(menuItems[2]).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(spy).toHaveBeenCalledWith("close", null);
  });

  it("closes when clicking outside", async () => {
    render(OverflowMenu);

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    await user.click(document.body);
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
  });

  it("uses CSS custom properties for performance optimization", async () => {
    const { container } = render(OverflowMenu);

    const styleTags = document.querySelectorAll("style");
    const initialStyleCount = styleTags.length;
    expect(styleTags.length).toBe(initialStyleCount);

    await user.click(screen.getByRole("button"));
    expect(container.querySelector(".bx--overflow-menu-options")).toHaveStyle(
      "--overflow-menu-options-after-width: 2rem",
    );
    expect(styleTags.length).toBe(initialStyleCount);
  });

  it("stress test: multiple instances don't create individual style tags", async () => {
    const { container: container1 } = render(OverflowMenu);
    const { container: container2 } = render(OverflowMenu);
    const { container: container3 } = render(OverflowMenu);

    const styleTagsBefore = document.querySelectorAll("style").length;
    const menuButtons1 = container1.querySelectorAll("button");
    const menuButtons2 = container2.querySelectorAll("button");
    const menuButtons3 = container3.querySelectorAll("button");

    await user.click(menuButtons1[0]);
    await user.click(menuButtons2[0]);
    await user.click(menuButtons3[0]);

    const styleTagsAfter = document.querySelectorAll("style").length;

    // Verify no additional style tags created (old approach would create 3+)
    expect(styleTagsAfter).toBe(styleTagsBefore);

    // Verify all menus have CSS custom property set.
    const allMenus = [
      ...container1.querySelectorAll(".bx--overflow-menu-options"),
      ...container2.querySelectorAll(".bx--overflow-menu-options"),
      ...container3.querySelectorAll(".bx--overflow-menu-options"),
    ];

    expect(allMenus.length).toBeGreaterThan(0);
    allMenus.forEach((menu) => {
      expect(menu).toHaveStyle("--overflow-menu-options-after-width: 2rem");
    });
  });

  test.each([
    ["sm", "bx--overflow-menu--sm"],
    ["xl", "bx--overflow-menu--xl"],
  ] as const)("should support %s size", (size, expectedClass) => {
    render(OverflowMenu, { props: { size } });

    const menuButton = screen.getByRole("button");
    expect(menuButton).toHaveClass(expectedClass);
  });

  it("should not apply size classes when size is undefined", () => {
    render(OverflowMenu, { props: { size: undefined } });

    const menuButton = screen.getByRole("button");
    expect(menuButton).not.toHaveClass("bx--overflow-menu--sm");
    expect(menuButton).not.toHaveClass("bx--overflow-menu--xl");
  });

  it("applies light variant styling", () => {
    render(OverflowMenu, { props: { light: true } });

    const menuButton = screen.getByRole("button");
    expect(menuButton).toHaveClass("bx--overflow-menu--light");
  });

  it("applies flipped styling", async () => {
    render(OverflowMenu, { props: { flipped: true } });

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    const menu = screen.getByRole("menu");
    expect(menu).toHaveClass("bx--overflow-menu--flip");
  });

  it("applies direction attribute", async () => {
    render(OverflowMenu, { props: { direction: "top" } });

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    const menu = screen.getByRole("menu");
    expect(menu).toHaveAttribute("data-floating-menu-direction", "top");
  });

  it("applies custom menu options class", async () => {
    render(OverflowMenu, { props: { menuOptionsClass: "custom-class" } });

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    const menu = screen.getByRole("menu");
    expect(menu).toHaveClass("custom-class");
  });

  it("applies custom icon class", () => {
    render(OverflowMenu, { props: { iconClass: "custom-icon-class" } });

    const icon = screen.getByRole("button").querySelector("svg");
    expect(icon).toHaveClass("custom-icon-class");
  });

  it("uses custom icon description", () => {
    render(OverflowMenu, { props: { iconDescription: "Custom description" } });

    const icon = screen.getByRole("button").querySelector("svg");
    expect(icon).toHaveAttribute("aria-label", "Custom description");
  });

  it("uses custom id", () => {
    render(OverflowMenu, { props: { id: "custom-id" } });

    const menuButton = screen.getByRole("button");
    expect(menuButton).toHaveAttribute("id", "custom-id");
  });

  it("applies danger styling to menu items", async () => {
    render(OverflowMenu);

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    const menuItems = screen.getAllByRole("menuitem");
    const dangerItem = menuItems.find(
      (item) => item.textContent === "Delete service",
    );
    expect(dangerItem?.parentElement).toHaveClass(
      "bx--overflow-menu-options__option--danger",
    );
  });

  it("handles link menu items correctly", async () => {
    render(OverflowMenu);

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    const menuItems = screen.getAllByRole("menuitem");
    const linkItem = menuItems.find(
      (item) => item.textContent === "API documentation",
    );
    expect(linkItem).toHaveAttribute(
      "href",
      "https://cloud.ibm.com/docs/api-gateway/",
    );
  });

  it("returns focus to button after menu closes", async () => {
    render(OverflowMenu);

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    const menuItems = screen.getAllByRole("menuitem");
    expect(menuItems[0]).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(menuButton).toHaveFocus();
  });

  it("handles close event with item click", async () => {
    render(OverflowMenu);

    const spy = vi.spyOn(console, "log");
    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    const menuItems = screen.getAllByRole("menuitem");
    await user.click(menuItems[0]);

    expect(spy).toHaveBeenCalledWith("close", {
      index: 0,
      text: "Manage credentials",
    });
  });

  it("handles close event with escape key", async () => {
    render(OverflowMenu);

    const spy = vi.spyOn(console, "log");
    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    await user.keyboard("{Escape}");

    expect(spy).toHaveBeenCalledWith("close", null);
  });

  it("handles close event with outside click", async () => {
    render(OverflowMenu);

    const spy = vi.spyOn(console, "log");
    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    await user.click(document.body);

    expect(spy).toHaveBeenCalledWith("close", null);
  });
});
