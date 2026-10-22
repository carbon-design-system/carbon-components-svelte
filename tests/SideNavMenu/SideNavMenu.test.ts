import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { isSideNavCollapsed, isSideNavRail } from "../../src/UIShell/nav-store";
import { user } from "../utils/user";
import SideNavMenuRail from "./SideNavMenu.rail.test.svelte";

// Regression tests for https://github.com/carbon-design-system/carbon-components-svelte/issues/746
describe("SideNavMenu", () => {
  // A closed non-rail SideNav is aria-hidden, which empties the button's
  // accessible name, so look the button up by its text instead of by role name.
  const getMenuButton = () =>
    screen.getByText("Menu").closest("button") as HTMLButtonElement;

  beforeEach(() => {
    // Reset global nav store state to ensure test isolation.
    // SideNavMenu collapses when rail is used and nav is collapsed.
    isSideNavCollapsed.set(false);
    isSideNavRail.set(false);
  });

  it("collapses expanded menus when rail is collapsed", () => {
    render(SideNavMenuRail, { props: { rail: true, isOpen: false } });

    expect(getMenuButton()).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps a menu holding the current page collapsed in a collapsed rail", async () => {
    render(SideNavMenuRail, {
      props: { rail: true, isOpen: false, expanded: false, isSelected: true },
    });
    await tick();
    await tick();

    expect(getMenuButton()).toHaveAttribute("aria-expanded", "false");
    expect(getMenuButton().closest("li")).toHaveClass(
      "bx--side-nav__item--active",
    );
  });

  it("makes the links of a collapsed menu inert and frees them when expanded", async () => {
    // Svelte 5 sets the `inert` property, which dom-env doesn't reflect to
    // the attribute; Svelte 3 and 4 set the attribute.
    const isInert = (element: Element) =>
      Boolean((element as HTMLElement).inert) || element.hasAttribute("inert");

    render(SideNavMenuRail, {
      props: { rail: true, isOpen: true, expanded: false },
    });

    const submenu = getMenuButton().closest("li")?.querySelector("ul");
    assert(submenu);
    expect(isInert(submenu)).toBe(true);

    await user.click(getMenuButton());

    expect(isInert(submenu)).toBe(false);
  });

  it("allows expanded menus when rail is not used", () => {
    render(SideNavMenuRail, { props: { rail: false, isOpen: false } });

    expect(getMenuButton()).toHaveAttribute("aria-expanded", "true");
  });

  it("can expand a menu by clicking when rail is open", async () => {
    render(SideNavMenuRail, { props: { rail: true, isOpen: true } });

    const menuButton = getMenuButton();

    // Menu starts expanded (from the `expanded` prop).
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "false");

    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");
  });
});
