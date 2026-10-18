import { render, screen } from "@testing-library/svelte";
import HeaderNavItem from "carbon-components-svelte/UIShell/HeaderNavItem.svelte";

describe("HeaderNavItem", () => {
  it.each([true, false])(
    "applies the current-page styling only when isSelected is %s",
    (isSelected) => {
      render(HeaderNavItem, {
        props: { href: "/", text: "Overview", isSelected },
      });

      const item = screen.getByRole("menuitem", { name: "Overview" });
      expect(item.classList.contains("bx--header__menu-item--current")).toBe(
        isSelected,
      );
      expect(item.getAttribute("aria-current")).toBe(
        isSelected ? "page" : null,
      );
    },
  );
});
