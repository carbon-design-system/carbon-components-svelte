import { render, screen } from "@testing-library/svelte";
import HeaderSideNavItemsTest from "./HeaderSideNavItems.test.svelte";

describe("HeaderSideNavItems", () => {
  it("renders a list with the header navigation class", () => {
    render(HeaderSideNavItemsTest);

    const list = screen.getByTestId("header-side-nav-items");
    expect(list.tagName).toBe("UL");
    expect(list).toHaveClass("bx--side-nav__header-navigation");
    expect(list).not.toHaveClass("bx--side-nav__header-divider");
  });

  it("adds the divider class when hasDivider is true", () => {
    render(HeaderSideNavItemsTest, { props: { hasDivider: true } });

    const list = screen.getByTestId("header-side-nav-items");
    expect(list).toHaveClass(
      "bx--side-nav__header-navigation",
      "bx--side-nav__header-divider",
    );
  });
});

describe("HeaderSideNavItems roles", () => {
  it("gives its menu items a menubar parent, like HeaderNav", () => {
    render(HeaderSideNavItemsTest);

    const list = screen.getByTestId("header-side-nav-items");
    expect(list).toHaveAttribute("role", "menubar");
    expect(list).toHaveAttribute("aria-orientation", "vertical");
    const items = list.querySelectorAll('[role="menuitem"]');
    expect(items).toHaveLength(2);
    for (const item of items) {
      expect(item.parentElement).toHaveAttribute("role", "none");
      expect(item.parentElement?.parentElement).toBe(list);
    }
  });
});

describe("HeaderSideNavItems list semantics", () => {
  it("sits in a list item of SideNavItems", () => {
    render(HeaderSideNavItemsTest);

    const wrapper = screen.getByTestId("header-side-nav-items").parentElement;
    expect(wrapper?.tagName).toBe("LI");
    expect(wrapper?.parentElement).toHaveClass("bx--side-nav__items");
  });
});
