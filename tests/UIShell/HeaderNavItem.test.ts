import { render, screen } from "@testing-library/svelte";
import HeaderNavItem from "carbon-components-svelte/UIShell/HeaderNavItem.svelte";

describe("HeaderNavItem", () => {
  it("applies the current-page styling class when isSelected", () => {
    render(HeaderNavItem, {
      props: { href: "/", text: "Overview", isSelected: true },
    });

    const item = screen.getByRole("menuitem", { name: "Overview" });
    expect(item).toHaveClass("bx--header__menu-item--current");
    expect(item).toHaveAttribute("aria-current", "page");
  });

  it("omits the current-page styling class when not selected", () => {
    render(HeaderNavItem, {
      props: { href: "/", text: "Overview", isSelected: false },
    });

    const item = screen.getByRole("menuitem", { name: "Overview" });
    expect(item).not.toHaveClass("bx--header__menu-item--current");
    expect(item).not.toHaveAttribute("aria-current");
  });
});
