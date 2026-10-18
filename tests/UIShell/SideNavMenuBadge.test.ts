import { render, screen } from "@testing-library/svelte";
import SideNavMenuBadge from "./SideNavMenuBadge.test.svelte";

describe("SideNavMenu badge slot", () => {
  it.each([
    ["badge", true],
    ["no-badge", false],
  ])("%s container has the badge wrapper: %s", (testId, hasBadge) => {
    render(SideNavMenuBadge);
    const container = screen.getByTestId(testId);
    const wrapper = container.querySelector(".bx--side-nav__submenu-badge");

    expect(wrapper !== null).toBe(hasBadge);
    expect(wrapper?.tagName).toBe(hasBadge ? "DIV" : undefined);
    expect(container.querySelector(".bx--badge-indicator") !== null).toBe(
      hasBadge,
    );
  });
});
