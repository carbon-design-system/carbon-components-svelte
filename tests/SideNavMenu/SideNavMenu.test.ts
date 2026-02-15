import { render, screen } from "@testing-library/svelte";
import { isSideNavCollapsed, isSideNavRail } from "../../src/UIShell/nav-store";
import { user } from "../setup-tests";
import SideNavMenuRail from "./SideNavMenu.rail.test.svelte";

// Regression tests for https://github.com/carbon-design-system/carbon-components-svelte/issues/746
describe("SideNavMenu", () => {
  const getMenuButton = () =>
    screen.getByRole("button", { name: /Menu/, hidden: true });

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

  it("allows expanded menus when rail is open", () => {
    render(SideNavMenuRail, { props: { rail: true, isOpen: true } });

    expect(getMenuButton()).toHaveAttribute("aria-expanded", "true");
  });

  it("allows expanded menus when rail is not used", () => {
    render(SideNavMenuRail, { props: { rail: false, isOpen: true } });

    expect(getMenuButton()).toHaveAttribute("aria-expanded", "true");
  });

  it("can expand a menu by clicking when rail is open", async () => {
    render(SideNavMenuRail, { props: { rail: true, isOpen: true } });

    const menuButton = getMenuButton();

    // Menu starts expanded (from the `expanded` prop).
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    // Collapse it.
    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "false");

    // Expand it again.
    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");
  });
});
