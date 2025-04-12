import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import PersistedHamburgerMenuTest from "./PersistedHamburgerMenu.test.svelte";

describe("PersistedHamburgerMenu Example", () => {
  it("renders the complete header structure with persistent hamburger menu", () => {
    render(PersistedHamburgerMenuTest);

    // Verify header and company/platform name
    const header = screen.getByRole("banner");
    expect(header).toBeInTheDocument();
    expect(screen.getByText("IBM")).toBeInTheDocument();
    expect(screen.getByText("Carbon Svelte")).toBeInTheDocument();

    // Verify navigation items
    expect(screen.getAllByRole("link", { name: "Link 1" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Link 2" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Link 3" })).toHaveLength(2);

    // Verify menu
    const menu = screen.getByRole("menuitem", { name: "Menu" });
    expect(menu).toBeInTheDocument();
    expect(menu).toHaveAttribute("aria-haspopup", "menu");
    expect(menu).toHaveAttribute("aria-expanded", "false");

    // Verify skip to content
    expect(
      screen.getByRole("link", { name: "Skip to main content" }),
    ).toBeInTheDocument();

    // Verify content
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Welcome" }),
    ).toBeInTheDocument();
  });

  it("renders side navigation with persistent hamburger menu", () => {
    render(PersistedHamburgerMenuTest);

    // Verify side nav is present
    const sideNav = screen.getByRole("complementary");
    expect(sideNav).toBeInTheDocument();

    // Verify side nav links
    const sideNavItems = sideNav.querySelectorAll(".bx--side-nav__item");
    expect(sideNavItems).toHaveLength(4); // 3 links + 1 menu

    // Verify side nav menu
    const sideNavMenu = sideNav.querySelector(".bx--side-nav__submenu");
    expect(sideNavMenu).toBeInTheDocument();
    expect(sideNavMenu).toHaveAttribute("aria-expanded", "false");
  });

  it("handles side navigation state with persistent hamburger menu", async () => {
    const { component } = render(PersistedHamburgerMenuTest);

    // Initial state
    expect(component.isSideNavOpen).toBe(false);

    // Simulate opening side nav
    component.isSideNavOpen = true;
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Verify header has expanded class
    const header = screen.getByRole("banner");
    expect(header).toHaveClass("bx--header--expanded");

    // Verify side nav is expanded
    const sideNav = screen.getByRole("complementary");
    expect(sideNav).toHaveClass("bx--side-nav--expanded");
  });

  it("handles navigation menu interaction in side nav", async () => {
    render(PersistedHamburgerMenuTest);

    // Open side nav first
    const { component } = render(PersistedHamburgerMenuTest);
    component.isSideNavOpen = true;
    await new Promise((resolve) => setTimeout(resolve, 0));

    const menu = screen
      .getByRole("complementary")
      .querySelector(".bx--side-nav__submenu");
    await user.click(menu!);

    // Verify menu is expanded
    expect(menu).toHaveAttribute("aria-expanded", "true");

    // Verify menu items are visible
    const menuItems = screen
      .getByRole("complementary")
      .querySelectorAll(".bx--side-nav__item");
    expect(menuItems).toHaveLength(7); // 3 main items + menu + 3 submenu items
  });
});
