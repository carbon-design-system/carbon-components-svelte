import { render, screen } from "@testing-library/svelte";
import SideNavMenuBadge from "./SideNavMenuBadge.test.svelte";

describe("SideNavMenu badge slot", () => {
  it("renders the badge slot when provided", () => {
    render(SideNavMenuBadge);
    const container = screen.getByTestId("badge");
    const wrapper = container.querySelector(".bx--side-nav__submenu-badge");

    expect(wrapper).toBeInTheDocument();
    expect(wrapper?.tagName).toBe("DIV");
    expect(container.querySelector(".bx--badge-indicator")).toBeInTheDocument();
  });

  it("omits the badge wrapper when the slot is not provided", () => {
    render(SideNavMenuBadge);
    const container = screen.getByTestId("no-badge");

    expect(
      container.querySelector(".bx--side-nav__submenu-badge"),
    ).not.toBeInTheDocument();
  });
});
