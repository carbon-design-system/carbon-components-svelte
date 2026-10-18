import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import HeaderNavTest from "./HeaderNavKeyboard.test.svelte";

describe("HeaderNav keyboard navigation", () => {
  describe("HeaderNavMenu", () => {
    it("should open menu and focus first item when Down Arrow is pressed", async () => {
      render(HeaderNavTest);

      const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
      menuTrigger.focus();

      await user.keyboard("{ArrowDown}");
      expect(menuTrigger).toHaveAttribute("aria-expanded", "true");
      const firstItem = screen.getByRole("menuitem", { name: "Menu Item 1" });
      expect(firstItem).toHaveFocus();
    });

    it("should open menu and focus last item when Up Arrow is pressed", async () => {
      render(HeaderNavTest);

      const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
      menuTrigger.focus();

      await user.keyboard("{ArrowUp}");
      expect(menuTrigger).toHaveAttribute("aria-expanded", "true");

      const lastItem = screen.getByRole("menuitem", { name: "Menu Item 3" });
      expect(lastItem).toHaveFocus();
    });

    it("should toggle menu when Space is pressed on trigger", async () => {
      render(HeaderNavTest);

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
      render(HeaderNavTest);

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
