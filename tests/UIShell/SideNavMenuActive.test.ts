import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import SideNavMenuActive from "./SideNavMenuActive.test.svelte";

const MENUS = ["Level 1", "Level 2", "Level 3", "Sibling"];

function activeMenus() {
  return MENUS.filter((name) =>
    screen
      .getByRole("button", { name })
      .parentElement?.classList.contains("bx--side-nav__item--active"),
  );
}

describe("SideNavMenu active state", () => {
  it("marks every collapsed ancestor of the current item", async () => {
    render(SideNavMenuActive);
    expect(activeMenus()).toEqual([]);

    await user.click(screen.getByRole("button", { name: "Select current" }));
    expect(activeMenus()).toEqual(["Level 1", "Level 2", "Level 3"]);
  });

  it("leaves expanded menus unmarked", async () => {
    render(SideNavMenuActive, { selected: "current" });
    expect(activeMenus()).toEqual([]);

    await user.click(screen.getByRole("button", { name: "Level 3" }));
    await user.click(screen.getByRole("button", { name: "Level 1" }));
    expect(activeMenus()).toEqual(["Level 1", "Level 3"]);
  });

  it.each([
    ["Select other", ["Level 1", "Sibling"]],
    ["Toggle current", []],
  ])("updates after %s", async (button, expected) => {
    render(SideNavMenuActive);
    await user.click(screen.getByRole("button", { name: "Select current" }));
    expect(activeMenus()).toEqual(["Level 1", "Level 2", "Level 3"]);

    await user.click(screen.getByRole("button", { name: button }));
    expect(activeMenus()).toEqual(expected);
  });

  it("marks a menu set to isActive", () => {
    render(SideNavMenuActive);

    expect(
      screen.getByRole("button", { name: "Detail" }).parentElement,
    ).toHaveClass("bx--side-nav__item--active");
  });
});
