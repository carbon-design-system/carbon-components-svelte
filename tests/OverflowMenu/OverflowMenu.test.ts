import { render, screen, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../setup-tests";
import OverflowMenuPreventDefault from "./OverflowMenu.preventDefault.test.svelte";
import OverflowMenuRel from "./OverflowMenu.rel.test.svelte";
import OverflowMenu from "./OverflowMenu.test.svelte";

describe("OverflowMenu", () => {
  // Regression: ?? for aria-label so empty string is used (not fallback)
  it("uses empty aria-label when passed (nullish coalescing)", () => {
    render(OverflowMenu, { props: { ariaLabel: "" } });
    const menuButton = screen.getByRole("button");
    expect(menuButton).toHaveAttribute("aria-label", "");
  });

  it("renders and functions correctly", async () => {
    render(OverflowMenu);

    const menuButton = screen.getByRole("button");
    expect(menuButton).toHaveAttribute("aria-haspopup", "true");
    expect(menuButton).toHaveAttribute("aria-expanded", "false");

    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    const menuItems = screen.getAllByRole("menuitem");
    expect(menuItems).toHaveLength(3);
    expect(menuItems[0]).toHaveFocus();

    expect(menuItems[0]).toHaveTextContent("Manage credentials");
    expect(menuItems[1]).toHaveTextContent("API documentation");
    expect(menuItems[2]).toHaveTextContent("Delete service");

    expect(menuItems[1]).toHaveAttribute(
      "href",
      "https://cloud.ibm.com/docs/api-gateway/",
    );

    expect(menuItems[2].parentElement).toHaveClass(
      "bx--overflow-menu-options__option--danger",
    );

    const spy = vi.spyOn(console, "log");
    await user.click(menuItems[0]);
    expect(spy).toHaveBeenCalledWith("click", "Manage credentials");

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(spy).toHaveBeenCalledWith("close", {
      index: 0,
      text: "Manage credentials",
    });
  });

  it("handles keyboard navigation", async () => {
    render(OverflowMenu);

    const spy = vi.spyOn(console, "log");

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    let menuItems = screen.getAllByRole("menuitem");
    expect(menuItems[0]).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(menuItems[1]).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(spy).toHaveBeenCalledWith("click", "API documentation");

    await user.click(menuButton);
    menuItems = screen.getAllByRole("menuitem");
    expect(menuItems[0]).toHaveFocus();

    await user.keyboard("{ArrowUp}");
    expect(menuItems[2]).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(spy).toHaveBeenCalledWith("close", null);
  });

  it("closes when clicking outside", async () => {
    render(OverflowMenu);

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    await user.click(document.body);
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
  });

  it("uses CSS custom properties for performance optimization", async () => {
    render(OverflowMenu);

    const styleTags = document.querySelectorAll("style");
    const initialStyleCount = styleTags.length;
    expect(styleTags.length).toBe(initialStyleCount);

    await user.click(screen.getByRole("button"));
    const menu = screen.getByRole("menu");
    expect(menu).toHaveStyle("--overflow-menu-options-after-width: 2rem");
    expect(styleTags.length).toBe(initialStyleCount);
  });

  it("stress test: multiple instances don't create individual style tags", async () => {
    render(OverflowMenu);
    render(OverflowMenu);
    render(OverflowMenu);

    const styleTagsBefore = document.querySelectorAll("style").length;
    const menuButtons = screen.getAllByRole("button");

    await user.click(menuButtons[0]);
    await user.click(menuButtons[1]);
    await user.click(menuButtons[2]);

    const styleTagsAfter = document.querySelectorAll("style").length;

    // Verify no additional style tags created (old approach would create 3+)
    expect(styleTagsAfter).toBe(styleTagsBefore);

    // Verify all menus have CSS custom property set.
    const allMenus = screen.getAllByRole("menu");

    expect(allMenus.length).toBeGreaterThan(0);
    for (const menu of allMenus) {
      expect(menu).toHaveStyle("--overflow-menu-options-after-width: 2rem");
    }
  });

  test.each([
    ["sm", "bx--overflow-menu--sm"],
    ["xl", "bx--overflow-menu--xl"],
  ] as const)("should support %s size", (size, expectedClass) => {
    render(OverflowMenu, { props: { size } });

    const menuButton = screen.getByRole("button");
    expect(menuButton).toHaveClass(expectedClass);
  });

  it("should not apply size classes when size is undefined", () => {
    render(OverflowMenu, { props: { size: undefined } });

    const menuButton = screen.getByRole("button");
    expect(menuButton).not.toHaveClass("bx--overflow-menu--sm");
    expect(menuButton).not.toHaveClass("bx--overflow-menu--xl");
  });

  it("applies light variant styling", () => {
    render(OverflowMenu, { props: { light: true } });

    const menuButton = screen.getByRole("button");
    expect(menuButton).toHaveClass("bx--overflow-menu--light");
  });

  it("applies flipped styling", async () => {
    render(OverflowMenu, { props: { flipped: true } });

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    const menu = screen.getByRole("menu");
    expect(menu).toHaveClass("bx--overflow-menu--flip");
  });

  it("applies direction attribute", async () => {
    render(OverflowMenu, { props: { direction: "top" } });

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    const menu = screen.getByRole("menu");
    expect(menu).toHaveAttribute("data-floating-menu-direction", "top");
  });

  it("applies custom menu options class", async () => {
    render(OverflowMenu, { props: { menuOptionsClass: "custom-class" } });

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    const menu = screen.getByRole("menu");
    expect(menu).toHaveClass("custom-class");
  });

  it("applies custom icon class", () => {
    render(OverflowMenu, { props: { iconClass: "custom-icon-class" } });

    const button = screen.getByRole("button");
    const icon = button.querySelector("svg");
    expect(icon).toHaveClass("custom-icon-class");
  });

  it("uses custom icon description", () => {
    render(OverflowMenu, { props: { iconDescription: "Custom description" } });

    const button = screen.getByRole("button");
    const icon = button.querySelector("svg");
    expect(icon).toHaveAttribute("aria-label", "Custom description");
  });

  it("uses custom id", () => {
    render(OverflowMenu, { props: { id: "custom-id" } });

    const menuButton = screen.getByRole("button");
    expect(menuButton).toHaveAttribute("id", "custom-id");
  });

  it("applies danger styling to menu items", async () => {
    render(OverflowMenu);

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    const menuItems = screen.getAllByRole("menuitem");
    const dangerItem = menuItems.find(
      (item) => item.textContent === "Delete service",
    );
    expect(dangerItem?.parentElement).toHaveClass(
      "bx--overflow-menu-options__option--danger",
    );
  });

  it("renders button menu items with type='button' to prevent form submission", async () => {
    render(OverflowMenu);

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    const menuItems = screen.getAllByRole("menuitem");
    const buttonItem = menuItems.find(
      (item) => item.textContent === "Manage credentials",
    );
    expect(buttonItem?.tagName).toBe("BUTTON");
    expect(buttonItem).toHaveAttribute("type", "button");
  });

  it("handles link menu items correctly", async () => {
    render(OverflowMenu);

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    const menuItems = screen.getAllByRole("menuitem");
    const linkItem = menuItems.find(
      (item) => item.textContent === "API documentation",
    );
    expect(linkItem).toHaveAttribute(
      "href",
      "https://cloud.ibm.com/docs/api-gateway/",
    );
  });

  it("forwards target attribute and adds rel for _blank", async () => {
    render(OverflowMenu);

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    const menuItems = screen.getAllByRole("menuitem");
    const linkItem = menuItems.find(
      (item) => item.textContent === "API documentation",
    );
    expect(linkItem).toHaveAttribute("target", "_blank");
    expect(linkItem).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("sets noopener noreferrer by default when target is _blank", async () => {
    render(OverflowMenuRel, { props: { testCase: "default" } });

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    const linkItem = screen.getByRole("menuitem");
    expect(linkItem).toHaveAttribute("target", "_blank");
    expect(linkItem).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("allows rel prop to override default noopener noreferrer", async () => {
    render(OverflowMenuRel, { props: { testCase: "override" } });

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    const linkItem = screen.getByRole("menuitem");
    expect(linkItem).toHaveAttribute("target", "_blank");
    expect(linkItem).toHaveAttribute("rel", "noopener");
    expect(linkItem).not.toHaveAttribute("rel", "noopener noreferrer");
  });

  it("allows rel prop to be set to empty string", async () => {
    render(OverflowMenuRel, { props: { testCase: "empty" } });

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    const linkItem = screen.getByRole("menuitem");
    expect(linkItem).toHaveAttribute("target", "_blank");
    expect(linkItem).toHaveAttribute("rel", "");
  });

  it("does not set rel by default when target is not _blank", async () => {
    render(OverflowMenuRel, { props: { testCase: "no-target" } });

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    const linkItem = screen.getByRole("menuitem");
    expect(linkItem).toHaveAttribute("target", "_self");
    expect(linkItem).not.toHaveAttribute("rel");
  });

  it("allows rel prop to be set even when target is not _blank", async () => {
    render(OverflowMenuRel, { props: { testCase: "custom-rel" } });

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    const linkItem = screen.getByRole("menuitem");
    expect(linkItem).toHaveAttribute("target", "_self");
    expect(linkItem).toHaveAttribute("rel", "nofollow");
  });

  it("returns focus to button after menu closes", async () => {
    render(OverflowMenu);

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    const menuItems = screen.getAllByRole("menuitem");
    expect(menuItems[0]).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(menuButton).toHaveFocus();
  });

  it("handles close event with item click", async () => {
    render(OverflowMenu);

    const spy = vi.spyOn(console, "log");
    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    const menuItems = screen.getAllByRole("menuitem");
    await user.click(menuItems[0]);

    expect(spy).toHaveBeenCalledWith("close", {
      index: 0,
      text: "Manage credentials",
    });
  });

  it("handles close event with escape key", async () => {
    render(OverflowMenu);

    const spy = vi.spyOn(console, "log");
    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    await user.keyboard("{Escape}");

    expect(spy).toHaveBeenCalledWith("close", null);
  });

  it("handles close event with outside click", async () => {
    render(OverflowMenu);

    const spy = vi.spyOn(console, "log");
    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    await user.click(document.body);

    expect(spy).toHaveBeenCalledWith("close", null);
  });

  it("supports preventDefault on item to prevent menu from closing", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(OverflowMenuPreventDefault);

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    const menuItems = screen.getAllByRole("menuitem");
    await user.click(menuItems[0]);

    expect(consoleLog).toHaveBeenCalledWith("click", "Manage credentials");
    expect(consoleLog).not.toHaveBeenCalledWith("close", {
      index: 0,
      text: "Manage credentials",
    });

    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.queryByRole("menu")).toBeInTheDocument();
  });

  it("closes menu normally when preventDefault is not called", async () => {
    render(OverflowMenu);

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    const menuItems = screen.getAllByRole("menuitem");
    await user.click(menuItems[0]);

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  describe("portalMenu", () => {
    afterEach(() => {
      const existingPortals = document.querySelectorAll(
        "[data-floating-portal]",
      );
      for (const portal of existingPortals) {
        portal.remove();
      }
    });

    it("should render menu in FloatingPortal when portalMenu is true", async () => {
      render(OverflowMenu, { props: { portalMenu: true } });

      const menuButton = screen.getByRole("button");
      await user.click(menuButton);

      const menu = screen.getByRole("menu");
      expect(menu).toBeInTheDocument();
      const floatingPortal = menu.closest("[data-floating-portal]");
      expect(floatingPortal).toBeInTheDocument();
      expect(floatingPortal?.parentElement).toBe(document.body);
    });

    it("should not render menu inside button when portalMenu is true", async () => {
      render(OverflowMenu, { props: { portalMenu: true } });

      const menuButton = screen.getByRole("button");
      await user.click(menuButton);

      const menu = screen.getByRole("menu");
      expect(menuButton.contains(menu)).toBe(false);
    });

    it("should close portal menu when clicking outside", async () => {
      render(OverflowMenu, { props: { portalMenu: true } });

      const menuButton = screen.getByRole("button");
      await user.click(menuButton);
      expect(menuButton).toHaveAttribute("aria-expanded", "true");

      await user.click(document.body);
      expect(menuButton).toHaveAttribute("aria-expanded", "false");
    });

    it("should close portal menu on Escape", async () => {
      render(OverflowMenu, { props: { portalMenu: true } });

      const menuButton = screen.getByRole("button");
      await user.click(menuButton);
      expect(menuButton).toHaveAttribute("aria-expanded", "true");

      const menu = screen.getByRole("menu");
      await user.type(menu, "{Escape}");
      expect(menuButton).toHaveAttribute("aria-expanded", "false");
      expect(menuButton).toHaveFocus();
    });

    it("should apply direction attribute on portal menu", async () => {
      render(OverflowMenu, { props: { portalMenu: true, direction: "top" } });

      const menuButton = screen.getByRole("button");
      await user.click(menuButton);

      const menu = screen.getByRole("menu");
      expect(menu).toHaveAttribute("data-floating-menu-direction", "top");
    });

    it("should set position: relative on portal menu ul", async () => {
      render(OverflowMenu, { props: { portalMenu: true } });

      const menuButton = screen.getByRole("button");
      await user.click(menuButton);

      const menu = screen.getByRole("menu");
      expect(menu.style.position).toBe("relative");
    });

    it("should reflect auto-flipped direction in data-floating-menu-direction", async () => {
      // Mock getBoundingClientRect to simulate anchor near top of viewport
      // so that direction="top" will auto-flip to "bottom".
      const original = Element.prototype.getBoundingClientRect;
      Element.prototype.getBoundingClientRect = function () {
        if (this.hasAttribute?.("data-floating-portal")) {
          return {
            x: 0,
            y: 0,
            width: 160,
            height: 200,
            top: 0,
            right: 160,
            bottom: 200,
            left: 0,
            // biome-ignore lint/style/useNamingConvention: toJSON is standard DOMRect API
            toJSON() {
              return this;
            },
          } as DOMRect;
        }
        if (this.classList?.contains("bx--overflow-menu")) {
          return {
            x: 0,
            y: 30,
            width: 40,
            height: 32,
            top: 30,
            right: 40,
            bottom: 62,
            left: 0,
            // biome-ignore lint/style/useNamingConvention: toJSON is standard DOMRect API
            toJSON() {
              return this;
            },
          } as DOMRect;
        }
        return original.call(this);
      };

      try {
        render(OverflowMenu, {
          props: { portalMenu: true, direction: "top" },
        });

        const menuButton = screen.getByRole("button");
        await user.click(menuButton);
        await tick();

        const menu = screen.getByRole("menu");

        // FloatingPortal auto-flipped from "top" to "bottom" because
        // there's not enough space above (30px) for the menu (200px height).
        await waitFor(() => {
          expect(menu).toHaveAttribute(
            "data-floating-menu-direction",
            "bottom",
          );
        });

        const portal = menu.closest("[data-floating-portal]");
        expect(portal).toHaveAttribute("data-floating-direction", "bottom");
      } finally {
        Element.prototype.getBoundingClientRect = original;
      }
    });
  });
});
