import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import HeaderNavItemBadge from "./HeaderNavItem.badge.test.svelte";

const badgeIn = (link: HTMLElement) =>
  link.querySelector(".bx--header__menu-item-badge > .bx--badge-indicator");

describe("HeaderNavItem badge", () => {
  it("does not render a badge when the slot is omitted", () => {
    render(HeaderNavItemBadge);
    const link = screen.getByTestId("no-badge");

    expect(
      link.querySelector(".bx--header__menu-item-badge"),
    ).not.toBeInTheDocument();
  });

  it("renders the badge inside the link, after the label", () => {
    render(HeaderNavItemBadge);
    const link = screen.getByTestId("count");
    const badge = badgeIn(link);

    expect(badge).toHaveClass("bx--badge-indicator--count");
    expect(badge).toHaveTextContent("3");
    expect(link.lastElementChild).toHaveClass("bx--header__menu-item-badge");
  });

  it("includes the count in the link's accessible name", () => {
    render(HeaderNavItemBadge);

    expect(screen.getByRole("menuitem", { name: "Alerts 3" })).toBe(
      screen.getByTestId("count"),
    );
  });

  it("renders a dot badge when count is 0", () => {
    render(HeaderNavItemBadge);
    const badge = badgeIn(screen.getByTestId("dot"));

    expect(badge).not.toHaveClass("bx--badge-indicator--count");
    expect(badge?.textContent?.trim()).toBe("");
  });

  it("keeps the roving tab stop on the link", async () => {
    render(HeaderNavItemBadge);
    await tick();

    expect(screen.getByTestId("no-badge")).toHaveAttribute("tabindex", "0");
    expect(screen.getByTestId("count")).toHaveAttribute("tabindex", "-1");

    screen.getByTestId("no-badge").focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByTestId("dot")).toHaveFocus();
  });

  it("renders the icon before the badge", () => {
    render(HeaderNavItemBadge);
    const link = screen.getByTestId("icon");
    const svg = link.querySelector("svg");
    const badge = link.querySelector(".bx--header__menu-item-badge");

    expect(link).toHaveClass("bx--header__menu-item--icon");
    expect(svg?.compareDocumentPosition(badge as Node)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(badgeIn(link)).toHaveTextContent("1");
  });

  it("renders the badge inside a menu item that wraps its label", () => {
    render(HeaderNavItemBadge);
    const inMenu = screen.getByTestId("in-menu");

    expect(inMenu.querySelector("span")).not.toHaveClass(
      "bx--text-truncate--end",
    );
    expect(badgeIn(inMenu)).toHaveTextContent("5");
  });
});
