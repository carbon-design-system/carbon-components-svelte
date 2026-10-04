import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import HeaderNavMenuCurrent from "./HeaderNavMenuCurrent.test.svelte";

const submenu = () =>
  screen.getByRole("menuitem", { name: "Products" }).closest("li");

describe("HeaderNavMenu current marker", () => {
  it("drops the current marker when the selected item unmounts", async () => {
    const { component } = render(HeaderNavMenuCurrent);
    expect(submenu()).toHaveClass("bx--header__submenu--current");

    component.showBeta = false;
    await tick();
    expect(submenu()).not.toHaveClass("bx--header__submenu--current");
  });
});
