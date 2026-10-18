import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import HeaderNavTest from "./HeaderNavMenubar.test.svelte";

const items = [
  { text: "Link 1" },
  { text: "Link 2" },
  {
    text: "Menu",
    items: [
      { text: "Menu Item 1" },
      { text: "Menu Item 2" },
      { text: "Menu Item 3" },
    ],
  },
];

describe("HeaderNav keyboard navigation", () => {
  describe("HeaderNavMenu", () => {
    it.each([
      { key: "{ArrowDown}", focused: "Menu Item 1" },
      { key: "{ArrowUp}", focused: "Menu Item 3" },
    ])(
      "should open menu and focus $focused when $key is pressed",
      async ({ key, focused }) => {
        render(HeaderNavTest, { props: { items } });

        const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
        menuTrigger.focus();

        await user.keyboard(key);
        expect(menuTrigger).toHaveAttribute("aria-expanded", "true");
        expect(screen.getByRole("menuitem", { name: focused })).toHaveFocus();
      },
    );

    it("should toggle menu when Space is pressed on trigger", async () => {
      render(HeaderNavTest, { props: { items } });

      const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
      menuTrigger.focus();

      await user.keyboard(" ");
      expect(menuTrigger).toHaveAttribute("aria-expanded", "true");

      menuTrigger.focus();
      await user.keyboard(" ");
      expect(menuTrigger).toHaveAttribute("aria-expanded", "false");
    });
  });

  describe("HeaderNavItem within menu", () => {
    it("should wrap to last item when Up Arrow is pressed on first item", async () => {
      render(HeaderNavTest, { props: { items } });

      const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
      menuTrigger.focus();

      await user.keyboard("{ArrowDown}");

      const firstItem = screen.getByRole("menuitem", { name: "Menu Item 1" });
      expect(firstItem).toHaveFocus();

      await user.keyboard("{ArrowUp}");
      const lastItem = screen.getByRole("menuitem", { name: "Menu Item 3" });
      expect(lastItem).toHaveFocus();
    });
  });
});
