import { render, screen } from "@testing-library/svelte";
import HeaderSideNavItemsTest from "./HeaderNavBreakpoint.test.svelte";

describe("HeaderSideNavItems", () => {
  it.each([false, true])(
    "adds the divider class only when hasDivider is %s",
    (hasDivider) => {
      render(HeaderSideNavItemsTest, { props: { hasDivider } });

      const list = screen.getByTestId("header-side-nav-items");
      expect(list.tagName).toBe("UL");
      expect(list).toHaveClass("bx--side-nav__header-navigation");
      expect(list.classList.contains("bx--side-nav__header-divider")).toBe(
        hasDivider,
      );
    },
  );
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
