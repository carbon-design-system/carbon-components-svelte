import { render, screen, waitFor } from "@testing-library/svelte";
import type OverflowMenuComponent from "carbon-components-svelte/OverflowMenu/OverflowMenu.svelte";
import type { ComponentProps } from "svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import OverflowMenuAllDisabled from "./OverflowMenu.allDisabled.test.svelte";
import OverflowMenuDisabled from "./OverflowMenu.disabled.test.svelte";
import OverflowMenuDisabledLink from "./OverflowMenu.disabledLink.test.svelte";
import OverflowMenuDynamicItems from "./OverflowMenu.dynamicItems.test.svelte";
import OverflowMenuPreventDefault from "./OverflowMenu.preventDefault.test.svelte";
import OverflowMenuRel from "./OverflowMenu.rel.test.svelte";
import OverflowMenu from "./OverflowMenu.test.svelte";
import OverflowMenuTriggerClose from "./OverflowMenu.triggerClose.test.svelte";
import OverflowMenuInBreadcrumb from "./OverflowMenuInBreadcrumb.test.svelte";
import OverflowMenuInModal from "./OverflowMenuInModal.test.svelte";
import OverflowMenuItemIcons from "./OverflowMenuItem.icons.test.svelte";

describe("OverflowMenu", () => {
  // Regression: ?? for aria-label so empty string is used (not fallback)
  it("uses empty aria-label when passed (nullish coalescing)", () => {
    render(OverflowMenu, { props: { ariaLabel: "" } });
    const menuButton = screen.getByRole("button");
    expect(menuButton).toHaveAttribute("aria-label", "");
  });

  it("keeps aria-controls stable regardless of open state", async () => {
    render(OverflowMenu, { props: { id: "test-id" } });

    const menuButton = screen.getByRole("button");
    expect(menuButton).toHaveAttribute("aria-controls", "menu-test-id");

    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    expect(menuButton).toHaveAttribute("aria-controls", "menu-test-id");

    await user.keyboard("{Escape}");
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(menuButton).toHaveAttribute("aria-controls", "menu-test-id");
  });

  it("renders and functions correctly", async () => {
    render(OverflowMenu);

    const menuButton = screen.getByRole("button");
    expect(menuButton).toHaveAttribute("aria-haspopup", "menu");
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
      trigger: "item-select",
      index: 0,
      text: "Manage credentials",
    });
  });

  it("renders the menu as a sibling of the button, not nested inside it", async () => {
    render(OverflowMenu);

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    const menu = screen.getByRole("menu");
    expect(menu).toBeInTheDocument();
    expect(menuButton.contains(menu)).toBe(false);
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
    expect(spy).toHaveBeenCalledWith("close", { trigger: "escape-key" });
  });

  it("does not infinite-loop when all items are disabled", async () => {
    render(OverflowMenuAllDisabled);

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{ArrowDown}");
    await user.keyboard("{ArrowUp}");
    await user.keyboard("{ArrowDown}");

    expect(menuButton).toHaveAttribute("aria-expanded", "true");
  });

  it("supports Home and End to jump to first/last item", async () => {
    render(OverflowMenu);

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    const menuItems = screen.getAllByRole("menuitem");
    expect(menuItems[0]).toHaveFocus();

    await user.keyboard("{End}");
    expect(menuItems[2]).toHaveFocus();

    await user.keyboard("{Home}");
    expect(menuItems[0]).toHaveFocus();
  });

  it("Home and End skip disabled items", async () => {
    render(OverflowMenuDisabled);

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    const menuItems = screen.getAllByRole("menuitem");
    expect(menuItems).toHaveLength(4);
    expect(menuItems[0]).toHaveFocus();

    // Last non-disabled item is index 2 ("Third").
    await user.keyboard("{End}");
    expect(menuItems[2]).toHaveFocus();

    // First non-disabled item is index 0 ("First").
    await user.keyboard("{Home}");
    expect(menuItems[0]).toHaveFocus();
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
    ["xs", "bx--overflow-menu--xs"],
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

  test.each([
    ["sm", "bx--overflow-menu-options--sm"],
    ["xl", "bx--overflow-menu-options--xl"],
  ] as const)("keeps the %s size modifier on the menu options inside a breadcrumb", async (size, expectedClass) => {
    render(OverflowMenuInBreadcrumb, { props: { size } });

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    const menu = screen.getByRole("menu");
    // Keep the size class for compact menu items. The triangle caret is fixed
    // in `_breadcrumb.scss`, not by dropping the modifier.
    expect(menu).toHaveClass("bx--breadcrumb-menu-options");
    expect(menu).toHaveClass(expectedClass);
  });

  it("applies light variant styling", () => {
    render(OverflowMenu, { props: { light: true } });

    const menuButton = screen.getByRole("button");
    expect(menuButton).toHaveClass("bx--overflow-menu--light");
  });

  it("disables the trigger button when disabled is true", async () => {
    render(OverflowMenu, { props: { disabled: true } });

    const menuButton = screen.getByRole("button");
    expect(menuButton).toBeDisabled();

    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
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

    const dangerItem = screen.getByRole("menuitem", { name: "Delete service" });
    expect(dangerItem.parentElement).toHaveClass(
      "bx--overflow-menu-options__option--danger",
    );
  });

  it("renders button menu items with type='button' to prevent form submission", async () => {
    render(OverflowMenu);

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    const buttonItem = screen.getByRole("menuitem", {
      name: "Manage credentials",
    });
    expect(buttonItem.tagName).toBe("BUTTON");
    expect(buttonItem).toHaveAttribute("type", "button");
  });

  it("handles link menu items correctly", async () => {
    render(OverflowMenu);

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    const linkItem = screen.getByRole("menuitem", {
      name: "API documentation",
    });
    expect(linkItem).toHaveAttribute(
      "href",
      "https://cloud.ibm.com/docs/api-gateway/",
    );
    expect(linkItem).not.toHaveAttribute("type");
  });

  it("forwards target attribute and adds rel for _blank", async () => {
    render(OverflowMenu);

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    const linkItem = screen.getByRole("menuitem", {
      name: "API documentation",
    });
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
      trigger: "item-select",
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

    expect(spy).toHaveBeenCalledWith("close", { trigger: "escape-key" });
  });

  it("handles close event with outside click", async () => {
    render(OverflowMenu);

    const spy = vi.spyOn(console, "log");
    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    await user.click(document.body);

    expect(spy).toHaveBeenCalledWith("close", { trigger: "outside-click" });
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
      trigger: "item-select",
      index: 0,
      text: "Manage credentials",
    });

    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.queryByRole("menu")).toBeInTheDocument();
  });

  it("does not navigate, dispatch click, or close menu for disabled link item", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(OverflowMenuDisabledLink);

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    const disabledLink = screen.getByRole("menuitem", {
      name: "API documentation",
    });
    expect(disabledLink.tagName).toBe("A");
    expect(disabledLink).toHaveAttribute("aria-disabled", "true");
    expect(disabledLink).toHaveAttribute("tabindex", "-1");
    expect(disabledLink.parentElement).toHaveClass(
      "bx--overflow-menu-options__option--disabled",
    );

    const clickEvent = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
    });
    disabledLink.dispatchEvent(clickEvent);

    expect(clickEvent.defaultPrevented).toBe(true);
    expect(consoleLog).not.toHaveBeenCalledWith("click", "API documentation");
    expect(consoleLog).not.toHaveBeenCalledWith("close", {
      trigger: "item-select",
      index: 0,
      text: "API documentation",
    });
    expect(menuButton).toHaveAttribute("aria-expanded", "true");
  });

  it("dispatches close before flipping `open` when trigger click closes the menu", async () => {
    const spy = vi.spyOn(console, "log");
    render(OverflowMenuTriggerClose);

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    spy.mockClear();
    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "false");

    // The `close` event must be dispatched while `open` is still `true`
    // so listeners can preventDefault before any subscriber observes the
    // transition.
    expect(spy).toHaveBeenCalledWith("close:open-at-dispatch", true);
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

  it("removes destroyed items from the registry so arrow nav skips them", async () => {
    const { rerender } = render(OverflowMenuDynamicItems, {
      props: { showMiddle: true },
    });

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    let menuItems = screen.getAllByRole("menuitem");
    expect(menuItems).toHaveLength(3);
    expect(menuItems[0]).toHaveTextContent("First");
    expect(menuItems[0]).toHaveFocus();

    await rerender({ showMiddle: false });
    await tick();

    menuItems = screen.getAllByRole("menuitem");
    expect(menuItems).toHaveLength(2);
    expect(menuItems[0]).toHaveTextContent("First");
    expect(menuItems[1]).toHaveTextContent("Last");

    // ArrowDown from First should jump straight to Last — the removed
    // "Middle" must no longer be in the internal registry.
    await user.keyboard("{ArrowDown}");
    expect(menuItems[1]).toHaveFocus();
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

    it("should render menu in FloatingPortal when inside Modal (portalMenu not passed)", async () => {
      render(OverflowMenuInModal, { props: { modalOpen: true } });

      const menuButton = screen.getByRole("button", { name: "menu" });
      await user.click(menuButton);

      const menu = screen.getByRole("menu");
      expect(menu).toBeInTheDocument();
      const floatingPortal = menu.closest("[data-floating-portal]");
      expect(floatingPortal).toBeInTheDocument();
      expect(floatingPortal?.parentElement).toBe(document.body);
    });

    it("should not render menu in FloatingPortal when inside Modal with portalMenu=false", async () => {
      render(OverflowMenuInModal, {
        props: { modalOpen: true, portalMenu: false },
      });

      const menuButton = screen.getByRole("button", { name: "menu" });
      await user.click(menuButton);

      const menu = screen.getByRole("menu");
      expect(menu).toBeInTheDocument();
      const floatingPortal = menu.closest("[data-floating-portal]");
      expect(floatingPortal).not.toBeInTheDocument();
    });

    it("should focus first menu item when opened", async () => {
      render(OverflowMenu, { props: { portalMenu: true } });

      const menuButton = screen.getByRole("button");
      await user.click(menuButton);

      const menuItems = screen.getAllByRole("menuitem");
      expect(menuItems[0]).toHaveFocus();
    });

    it("should handle keyboard navigation", async () => {
      render(OverflowMenu, { props: { portalMenu: true } });

      const menuButton = screen.getByRole("button");
      await user.click(menuButton);

      const menuItems = screen.getAllByRole("menuitem");
      expect(menuItems[0]).toHaveFocus();

      await user.keyboard("{ArrowDown}");
      expect(menuItems[1]).toHaveFocus();

      await user.keyboard("{ArrowDown}");
      expect(menuItems[2]).toHaveFocus();

      await user.keyboard("{ArrowUp}");
      expect(menuItems[1]).toHaveFocus();
    });

    it("should handle keyboard navigation with wrap-around", async () => {
      render(OverflowMenu, { props: { portalMenu: true } });

      const menuButton = screen.getByRole("button");
      await user.click(menuButton);

      const menuItems = screen.getAllByRole("menuitem");
      expect(menuItems[0]).toHaveFocus();

      await user.keyboard("{ArrowUp}");
      expect(menuItems[2]).toHaveFocus();

      await user.keyboard("{ArrowDown}");
      expect(menuItems[0]).toHaveFocus();

      await user.keyboard("{Escape}");
      expect(menuButton).toHaveFocus();
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

  describe("item icons", () => {
    it("renders left and right icon wrappers from the icon/iconRight props", () => {
      render(OverflowMenuItemIcons);

      const bothIcons = screen.getByRole("menuitem", { name: "Both icons" });
      expect(
        bothIcons.querySelector(
          ".bx--overflow-menu-options__option-icon--left",
        ),
      ).toBeInTheDocument();
      expect(
        bothIcons.querySelector(
          ".bx--overflow-menu-options__option-icon--right",
        ),
      ).toBeInTheDocument();
    });

    it("renders the iconRight slot content", () => {
      render(OverflowMenuItemIcons);

      const slotIcon = screen.getByTestId("slot-icon-right");
      expect(
        slotIcon.closest(".bx--overflow-menu-options__option-icon--right"),
      ).toBeInTheDocument();
    });

    it("omits icon wrappers when neither prop nor slot is provided", () => {
      render(OverflowMenuItemIcons);

      const noIcons = screen.getByRole("menuitem", { name: "No icons" });
      expect(
        noIcons.querySelector(".bx--overflow-menu-options__option-icon"),
      ).toBeNull();
    });
  });

  describe("Generics", () => {
    it("should support custom Icon types with generics", () => {
      type CustomIcon = new (...args: unknown[]) => unknown;

      type ComponentType = OverflowMenuComponent<CustomIcon>;
      type Props = ComponentProps<ComponentType>;

      expectTypeOf<Props["icon"]>().toEqualTypeOf<CustomIcon | undefined>();
    });

    it("should default to any type when generic is not specified", () => {
      type ComponentType = OverflowMenuComponent;
      type Props = ComponentProps<ComponentType>;

      // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
      expectTypeOf<Props["icon"]>().toEqualTypeOf<any>();
    });
  });
});
