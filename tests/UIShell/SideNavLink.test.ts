import { render, screen } from "@testing-library/svelte";
import SideNavLinkBadge from "./SideNavLinkBadge.test.svelte";

describe("SideNavLink badge slot", () => {
  it.each([
    ["badge", true],
    ["no-badge", false],
  ])("%s container has the badge wrapper: %s", (testId, hasBadge) => {
    render(SideNavLinkBadge);
    const container = screen.getByTestId(testId);
    const wrapper = container.querySelector(".bx--side-nav__link-badge");

    expect(wrapper !== null).toBe(hasBadge);
    expect(wrapper?.tagName).toBe(hasBadge ? "DIV" : undefined);
    expect(container.querySelector(".bx--badge-indicator") !== null).toBe(
      hasBadge,
    );
  });
});
