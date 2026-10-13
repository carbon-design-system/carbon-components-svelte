import { render, screen } from "@testing-library/svelte";
import SideNavMenuItemBadge from "./SideNavMenuItemBadge.test.svelte";

describe("SideNavMenuItem badge slot", () => {
  it("renders the badge slot inside the link when provided", () => {
    render(SideNavMenuItemBadge);
    const link = screen.getByTestId("count");
    const wrapper = link.querySelector(".bx--side-nav__link-badge");

    expect(wrapper).toBeInTheDocument();
    expect(wrapper?.querySelector(".bx--badge-indicator")).toHaveTextContent(
      "2",
    );
    // The label stays a sibling of the badge so it can truncate.
    expect(link.querySelector(".bx--side-nav__link-text")).toHaveTextContent(
      "Archive",
    );
  });

  it("omits the badge wrapper when the slot is not provided", () => {
    render(SideNavMenuItemBadge);
    const link = screen.getByTestId("no-badge");

    expect(
      link.querySelector(".bx--side-nav__link-badge"),
    ).not.toBeInTheDocument();
  });
});
