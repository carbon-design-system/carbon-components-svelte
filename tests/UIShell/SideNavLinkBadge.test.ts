import { render, screen } from "@testing-library/svelte";
import SideNavLinkBadge from "./SideNavLinkBadge.test.svelte";

describe("SideNavLink badge slot", () => {
  it("renders the badge slot when provided", () => {
    render(SideNavLinkBadge);
    const container = screen.getByTestId("badge");
    const wrapper = container.querySelector(".bx--side-nav__link-badge");

    expect(wrapper).toBeInTheDocument();
    expect(wrapper?.tagName).toBe("DIV");
    expect(container.querySelector(".bx--badge-indicator")).toBeInTheDocument();
  });

  it("omits the badge wrapper when the slot is not provided", () => {
    render(SideNavLinkBadge);
    const container = screen.getByTestId("no-badge");

    expect(
      container.querySelector(".bx--side-nav__link-badge"),
    ).not.toBeInTheDocument();
  });
});
