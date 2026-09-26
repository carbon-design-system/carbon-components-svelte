import { render, screen } from "@testing-library/svelte";
import SideNavMenuIcon from "./SideNavMenuIcon.test.svelte";

describe("SideNavMenu icon", () => {
  it.each([
    ["Prop icon", true],
    ["Slot icon", true],
    ["No icon", false],
  ])("%s sets the icon item class: %s", (text, iconClass) => {
    render(SideNavMenuIcon);

    const item = screen.getByRole("button", { name: text }).parentElement;
    assert(item);
    expect(item.classList.contains("bx--side-nav__item--icon")).toBe(iconClass);
  });
});
