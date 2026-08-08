import { render, screen } from "@testing-library/svelte";
import SideNavLinkBadge from "./SideNavLink.badge.test.svelte";

describe("SideNavLink badge", () => {
  it("does not render a badge when the slot is omitted", () => {
    render(SideNavLinkBadge);
    const link = screen.getByTestId("no-badge");
    const item = link.closest(".bx--side-nav__item");

    expect(
      item?.querySelector(".bx--btn__badge-wrapper"),
    ).not.toBeInTheDocument();
    expect(item?.querySelector(".bx--badge-indicator")).not.toBeInTheDocument();
  });

  it("renders a dot badge when count is 0", () => {
    render(SideNavLinkBadge);
    const link = screen.getByTestId("dot");
    const wrapper = link.closest(".bx--btn__badge-wrapper");
    const badge = wrapper?.querySelector(".bx--badge-indicator");

    expect(wrapper).toBeInTheDocument();
    expect(badge).not.toHaveClass("bx--badge-indicator--count");
    expect(badge?.textContent?.trim()).toBe("");
  });

  it("renders a numbered badge when count is positive", () => {
    render(SideNavLinkBadge);
    const link = screen.getByTestId("count");
    const wrapper = link.closest(".bx--btn__badge-wrapper");
    const badge = wrapper?.querySelector(".bx--badge-indicator");

    expect(wrapper).toBeInTheDocument();
    expect(badge).toHaveClass("bx--badge-indicator--count");
    expect(badge).toHaveTextContent("4");
  });
});

describe("SideNavMenuItem badge", () => {
  it("does not render a badge when the slot is omitted", () => {
    render(SideNavLinkBadge);
    const link = screen.getByTestId("menu-item-no-badge");
    const item = link.closest(".bx--side-nav__menu-item");

    expect(
      item?.querySelector(".bx--btn__badge-wrapper"),
    ).not.toBeInTheDocument();
    expect(item?.querySelector(".bx--badge-indicator")).not.toBeInTheDocument();
  });

  it("renders a numbered badge when count is positive", () => {
    render(SideNavLinkBadge);
    const link = screen.getByTestId("menu-item-count");
    const wrapper = link.closest(".bx--btn__badge-wrapper");
    const badge = wrapper?.querySelector(".bx--badge-indicator");

    expect(wrapper).toBeInTheDocument();
    expect(badge).toHaveClass("bx--badge-indicator--count");
    expect(badge).toHaveTextContent("2");
  });
});
