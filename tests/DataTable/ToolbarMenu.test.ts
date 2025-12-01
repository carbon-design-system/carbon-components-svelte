import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import ToolbarMenuTest from "./ToolbarMenu.test.svelte";

describe("DataTable Toolbar Menu", () => {
  describe("ToolbarMenu", () => {
    it("should render with default props", () => {
      const { container } = render(ToolbarMenuTest, {
        props: { testComponent: "ToolbarMenu", slotContent: "Menu content" },
      });

      const menu = container.querySelector(".bx--toolbar-action");
      expect(menu).toBeInTheDocument();
      expect(menu).toHaveClass("bx--overflow-menu");
    });

    it("should render with Settings icon", () => {
      const { container } = render(ToolbarMenuTest, {
        props: { testComponent: "ToolbarMenu" },
      });

      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("should be flipped when open", () => {
      const { container } = render(ToolbarMenuTest, {
        props: { testComponent: "ToolbarMenu", menuProps: { open: true } },
      });

      const menuOptions = container.querySelector(".bx--overflow-menu-options");
      expect(menuOptions).toHaveClass("bx--overflow-menu--flip");
    });

    it("should apply custom class", () => {
      const { container } = render(ToolbarMenuTest, {
        props: {
          testComponent: "ToolbarMenu",
          class: "custom-menu-class",
        },
      });

      const menu = container.querySelector(".bx--overflow-menu");
      expect(menu).toHaveClass("custom-menu-class");
    });

    it("should render slot content when open", () => {
      render(ToolbarMenuTest, {
        props: {
          testComponent: "ToolbarMenu",
          menuProps: { open: true },
          slotContent: "Menu items here",
        },
      });

      expect(screen.getByText("Menu items here")).toBeInTheDocument();
    });
  });

  describe("ToolbarMenuItem", () => {
    it("should render with default props when menu is open", async () => {
      const { container } = render(ToolbarMenuTest, {
        props: {
          testComponent: "ToolbarMenuItem",
          slotContent: "Menu item text",
        },
      });

      const button = container.querySelector(".bx--overflow-menu");
      assert(button);
      await user.click(button);

      const menuItem = container.querySelector(
        ".bx--overflow-menu-options__option",
      );
      expect(menuItem).toBeInTheDocument();
      expect(screen.getByText("Menu item text")).toBeInTheDocument();
    });

    it("should render slot content", async () => {
      const { container } = render(ToolbarMenuTest, {
        props: {
          testComponent: "ToolbarMenuItem",
          slotContent: "Custom menu item",
        },
      });

      const button = container.querySelector(".bx--overflow-menu");
      assert(button);
      await user.click(button);

      expect(screen.getByText("Custom menu item")).toBeInTheDocument();
    });

    it("should handle click events", async () => {
      const consoleLog = vi.spyOn(console, "log");
      const { container } = render(ToolbarMenuTest, {
        props: {
          testComponent: "ToolbarMenuItem",
          slotContent: "Clickable item",
        },
      });

      // Click to open the menu
      const button = container.querySelector(".bx--overflow-menu");
      assert(button);
      await user.click(button);

      const menuButton = container.querySelector(
        ".bx--overflow-menu-options__btn",
      );
      assert(menuButton);
      await user.click(menuButton);

      expect(consoleLog).toHaveBeenCalledWith("click");
    });

    it("should handle keydown events", async () => {
      const consoleLog = vi.spyOn(console, "log");
      const { container } = render(ToolbarMenuTest, {
        props: {
          testComponent: "ToolbarMenuItem",
          slotContent: "Keyboard item",
        },
      });

      const button = container.querySelector(".bx--overflow-menu");
      assert(button);
      await user.click(button);

      const menuItem = container.querySelector(
        ".bx--overflow-menu-options__option",
      );
      assert(menuItem instanceof HTMLElement);

      menuItem.focus();
      await user.keyboard("{Enter}");

      expect(consoleLog).toHaveBeenCalledWith("keydown");
    });

    it("should apply custom attributes", async () => {
      const { container } = render(ToolbarMenuTest, {
        props: {
          testComponent: "ToolbarMenuItem",
          "data-testid": "custom-menu-item",
          slotContent: "Item",
        },
      });

      // Click to open the menu
      const button = container.querySelector(".bx--overflow-menu");
      assert(button);
      await user.click(button);

      const menuItem = container.querySelector(
        "[data-testid='custom-menu-item']",
      );
      expect(menuItem).toBeInTheDocument();
    });
  });
});
