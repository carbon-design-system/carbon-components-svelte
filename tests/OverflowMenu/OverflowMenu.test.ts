import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import type OverflowMenuComponent from "carbon-components-svelte/OverflowMenu/OverflowMenu.svelte";
import type { ComponentProps } from "svelte";
import { tick } from "svelte";
import { netListenerCalls } from "../utils/net-listener-calls";
import { rect } from "../utils/rect";
import { user } from "../utils/user";
import OverflowMenuCustomTrigger from "./OverflowMenu.customTrigger.test.svelte";
import OverflowMenuDisabled from "./OverflowMenu.disabled.test.svelte";
import OverflowMenuDynamicItems from "./OverflowMenu.dynamicItems.test.svelte";
import OverflowMenuRel from "./OverflowMenu.rel.test.svelte";
import OverflowMenu from "./OverflowMenu.test.svelte";
import OverflowMenuInBreadcrumb from "./OverflowMenuInBreadcrumb.test.svelte";
import OverflowMenuInModal from "./OverflowMenuInModal.test.svelte";
import OverflowMenuItemAria from "./OverflowMenuItem.aria.test.svelte";
import OverflowMenuItemIcons from "./OverflowMenuItem.icons.test.svelte";
import OverflowMenuPrimaryFocus from "./OverflowMenuPrimaryFocus.test.svelte";
import { closeDetails, openMenu } from "./helpers";

describe("OverflowMenu", () => {
  afterEach(() => {
    for (const portal of document.querySelectorAll("[data-floating-portal]")) {
      portal.remove();
    }
  });

  // Regression: ?? for aria-label so empty string is used (not fallback)
  it("uses empty aria-label when passed (nullish coalescing)", () => {
    render(OverflowMenu, { props: { ariaLabel: "" } });
    const menuButton = screen.getByRole("button");
    expect(menuButton).toHaveAttribute("aria-label", "");
  });

  it("references the menu with aria-controls only while it is rendered", async () => {
    render(OverflowMenu, { props: { id: "test-id" } });

    const menuButton = screen.getByRole("button");
    expect(menuButton).not.toHaveAttribute("aria-controls");

    await openMenu(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    expect(menuButton).toHaveAttribute("aria-controls", "menu-test-id");
    expect(screen.getByRole("menu")).toHaveAttribute("id", "menu-test-id");

    await user.keyboard("{Escape}");
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(menuButton).not.toHaveAttribute("aria-controls");
  });

  it("returns focus to the trigger after selecting an item with the keyboard", async () => {
    render(OverflowMenu);

    const { menuButton, items } = await openMenu();
    expect(items[0]).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(menuButton).toHaveFocus();
  });

  it("returns focus to the trigger after selecting a portalled item in a Modal", async () => {
    render(OverflowMenuInModal, { props: { modalOpen: true } });

    const { menuButton } = await openMenu(
      screen.getByRole("button", { name: "Options" }),
    );
    await user.click(screen.getByRole("menuitem", { name: "Option 2" }));

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(menuButton).toHaveFocus();
  });

  it("renders and functions correctly", async () => {
    const onClose = vi.fn();
    const onItemClick = vi.fn();
    render(OverflowMenu, { props: { onClose, onItemClick } });

    const menuButton = screen.getByRole("button");
    expect(menuButton).toHaveAttribute("aria-haspopup", "menu");
    expect(menuButton).toHaveAttribute("aria-expanded", "false");

    const { items: menuItems } = await openMenu(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

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

    await user.click(menuItems[0]);
    expect(onItemClick).toHaveBeenCalledWith("Manage credentials");

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(closeDetails(onClose)).toContainEqual({
      trigger: "item-select",
      index: 0,
      text: "Manage credentials",
    });
  });

  it("moves focus to the item matching a typed character", async () => {
    render(OverflowMenu);

    const { items: menuItems } = await openMenu();
    // "Manage credentials" is already focused on open.
    expect(menuItems[0]).toHaveFocus();

    // Types "d" to jump straight to "Delete service".
    await user.keyboard("d");
    expect(menuItems[2]).toHaveFocus();
  });

  it("renders the menu as a sibling of the button, not nested inside it", async () => {
    render(OverflowMenu);

    const { menuButton } = await openMenu();

    const menu = screen.getByRole("menu");
    expect(menu).toBeInTheDocument();
    expect(menuButton.contains(menu)).toBe(false);
  });

  it("handles keyboard navigation", async () => {
    const onClose = vi.fn();
    const onItemClick = vi.fn();
    render(OverflowMenu, { props: { onClose, onItemClick } });

    const { menuButton, items: firstItems } = await openMenu();
    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    expect(firstItems[0]).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(firstItems[1]).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(onItemClick).toHaveBeenCalledWith("API documentation");

    const { items: menuItems } = await openMenu(menuButton);
    expect(menuItems[0]).toHaveFocus();

    await user.keyboard("{ArrowUp}");
    expect(menuItems[2]).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(closeDetails(onClose)).toContainEqual({ trigger: "escape-key" });
  });

  it("measures the trigger when opening, not on every keypress", async () => {
    const descriptor = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "offsetWidth",
    );
    assert(descriptor?.get);
    let reads = 0;
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      configurable: true,
      get() {
        reads += 1;
        return descriptor.get?.call(this);
      },
    });

    try {
      render(OverflowMenu);
      await openMenu();
      await tick();
      const afterOpen = reads;
      expect(afterOpen).toBeGreaterThan(0);

      await user.keyboard("{ArrowDown}");
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{ArrowUp}");
      await tick();

      expect(screen.getAllByRole("menuitem")[1]).toHaveFocus();
      expect(reads).toBe(afterOpen);
    } finally {
      Object.defineProperty(HTMLElement.prototype, "offsetWidth", descriptor);
    }
  });

  it("supports Home and End to jump to first/last item", async () => {
    render(OverflowMenu);

    const { items: menuItems } = await openMenu();
    expect(menuItems[0]).toHaveFocus();

    await user.keyboard("{End}");
    expect(menuItems[2]).toHaveFocus();

    await user.keyboard("{Home}");
    expect(menuItems[0]).toHaveFocus();
  });

  it("Home and End on the trigger move focus into the menu", async () => {
    render(OverflowMenu);

    const { menuButton, items: menuItems } = await openMenu();
    menuButton.focus();

    await user.keyboard("{End}");
    expect(menuItems[2]).toHaveFocus();

    menuButton.focus();
    await user.keyboard("{Home}");
    expect(menuItems[0]).toHaveFocus();
  });

  it("prevents the default arrow key action on the open trigger", async () => {
    render(OverflowMenu);

    const { menuButton } = await openMenu();
    menuButton.focus();

    expect(await fireEvent.keyDown(menuButton, { key: "ArrowDown" })).toBe(
      false,
    );
  });

  it.each([
    { key: "ArrowLeft", mod: { altKey: true }, on: "item" },
    { key: "ArrowDown", mod: { metaKey: true }, on: "item" },
    { key: "End", mod: { ctrlKey: true }, on: "trigger" },
  ])(
    "leaves $key with $mod on the $on to the browser",
    async ({ key, mod, on }) => {
      render(OverflowMenu);

      const menuButton = screen.getByRole("button");
      await user.click(menuButton);
      const first = screen.getAllByRole("menuitem")[0];
      expect(first).toHaveFocus();

      const target = on === "item" ? first : menuButton;
      const notPrevented = await fireEvent.keyDown(target, { key, ...mod });

      expect(notPrevented).toBe(true);
      expect(first).toHaveFocus();
    },
  );

  it("Home and End skip disabled items", async () => {
    render(OverflowMenuDisabled);

    const { items: menuItems } = await openMenu();
    expect(menuItems).toHaveLength(4);
    expect(menuItems[0]).toHaveFocus();

    // Last non-disabled item is index 2 ("Third").
    await user.keyboard("{End}");
    expect(menuItems[2]).toHaveFocus();

    // First non-disabled item is index 0 ("First").
    await user.keyboard("{Home}");
    expect(menuItems[0]).toHaveFocus();
  });

  it("opens with focus on the first enabled item", async () => {
    render(OverflowMenuDisabled, { firstDisabled: true });

    await user.click(screen.getByRole("button"));

    // jsdom would focus the disabled First; a browser leaves focus on the
    // trigger, where the arrow keys do nothing.
    expect(screen.getByRole("menuitem", { name: "Third" })).toHaveFocus();
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

    // Old approach would create 3+ style tags.
    expect(styleTagsAfter).toBe(styleTagsBefore);

    const allMenus = screen.getAllByRole("menu");

    expect(allMenus.length).toBeGreaterThan(0);
    for (const menu of allMenus) {
      expect(menu).toHaveStyle("--overflow-menu-options-after-width: 2.5rem");
    }
  });

  it.each([
    ["sm", "bx--overflow-menu-options--sm"],
    ["xl", "bx--overflow-menu-options--xl"],
  ] as const)(
    "keeps the %s size modifier on the menu options inside a breadcrumb",
    async (size, expectedClass) => {
      render(OverflowMenuInBreadcrumb, { props: { size } });

      await openMenu();

      const menu = screen.getByRole("menu");
      // Keep the size class for compact menu items. The triangle caret is fixed
      // in `_breadcrumb.scss`, not by dropping the modifier.
      expect(menu).toHaveClass("bx--breadcrumb-menu-options");
      expect(menu).toHaveClass(expectedClass);
    },
  );

  it("disables the trigger button when disabled is true", async () => {
    render(OverflowMenu, { props: { disabled: true } });

    const menuButton = screen.getByRole("button");
    expect(menuButton).toBeDisabled();

    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("applies direction attribute", async () => {
    render(OverflowMenu, { props: { direction: "top" } });

    await openMenu();

    const menu = screen.getByRole("menu");
    expect(menu).toHaveAttribute("data-floating-menu-direction", "top");
  });

  it("gives button items type='button' and link items no type", async () => {
    render(OverflowMenu);

    await openMenu();

    const buttonItem = screen.getByRole("menuitem", {
      name: "Manage credentials",
    });
    expect(buttonItem.tagName).toBe("BUTTON");
    expect(buttonItem).toHaveAttribute("type", "button");

    const linkItem = screen.getByRole("menuitem", {
      name: "API documentation",
    });
    expect(linkItem).not.toHaveAttribute("type");
  });

  it.each([
    ["default", "noopener noreferrer"],
    ["override", "noopener"],
  ] as const)(
    "resolves rel for a _blank link item (%s)",
    async (testCase, expectedRel) => {
      render(OverflowMenuRel, { props: { testCase } });

      const {
        items: [linkItem],
      } = await openMenu();
      expect(linkItem).toHaveAttribute("target", "_blank");
      expect(linkItem).toHaveAttribute("rel", expectedRel);
    },
  );

  it("returns focus to button after menu closes", async () => {
    render(OverflowMenu);

    const { menuButton, items: menuItems } = await openMenu();
    expect(menuItems[0]).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(menuButton).toHaveFocus();
  });

  it("supports preventDefault on item to prevent menu from closing", async () => {
    const onClose = vi.fn();
    const onItemClick = vi.fn();
    render(OverflowMenu, {
      props: { onClose, onItemClick, preventItemClick: true },
    });

    const {
      menuButton,
      items: [firstItem],
    } = await openMenu();
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    await user.click(firstItem);

    expect(onItemClick).toHaveBeenCalledWith("Manage credentials");
    expect(onClose).not.toHaveBeenCalled();

    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.queryByRole("menu")).toBeInTheDocument();
  });

  it("does not navigate, dispatch click, or close menu for disabled link item", async () => {
    const onClose = vi.fn();
    const onItemClick = vi.fn();
    render(OverflowMenu, {
      props: { onClose, onItemClick, disabledLink: true },
    });

    const { menuButton } = await openMenu();
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
    expect(onItemClick).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(menuButton).toHaveAttribute("aria-expanded", "true");
  });

  it("dispatches close before flipping `open` when trigger click closes the menu", async () => {
    const onClose = vi.fn();
    render(OverflowMenu, { props: { onClose } });

    const { menuButton } = await openMenu();
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "false");

    // The `close` event must be dispatched while `open` is still `true`
    // so listeners can preventDefault before any subscriber observes the
    // transition.
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][1]).toBe(true);
  });

  it("closes menu normally when preventDefault is not called", async () => {
    render(OverflowMenu);

    const {
      menuButton,
      items: [firstItem],
    } = await openMenu();
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    await user.click(firstItem);

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("removes destroyed items from the registry so arrow nav skips them", async () => {
    const { rerender } = render(OverflowMenuDynamicItems, {
      props: { showMiddle: true },
    });

    const { items: initialItems } = await openMenu();
    expect(initialItems).toHaveLength(3);
    expect(initialItems[0]).toHaveTextContent("First");
    expect(initialItems[0]).toHaveFocus();

    await rerender({ showMiddle: false });
    await tick();

    const menuItems = screen.getAllByRole("menuitem");
    expect(menuItems).toHaveLength(2);
    expect(menuItems[0]).toHaveTextContent("First");
    expect(menuItems[1]).toHaveTextContent("Last");

    // ArrowDown from First should jump straight to Last — the removed
    // "Middle" must no longer be in the internal registry.
    await user.keyboard("{ArrowDown}");
    expect(menuItems[1]).toHaveFocus();
  });

  it("keeps an item added while open in DOM order", async () => {
    const onClose = vi.fn();
    const { rerender } = render(OverflowMenuDynamicItems, {
      props: { showMiddle: false, onClose },
    });

    await user.click(screen.getByRole("button"));
    await rerender({ showMiddle: true });

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Middle" })).toHaveFocus();

    await user.click(screen.getByRole("menuitem", { name: "Last" }));
    expect(onClose).toHaveBeenCalledWith({
      trigger: "item-select",
      index: 2,
      text: "Last",
    });
  });

  it("tracks an item's text and disabled changes while open", async () => {
    const onClose = vi.fn();
    const { rerender } = render(OverflowMenuDynamicItems, {
      props: { middleDisabled: true, onClose },
    });

    await user.click(screen.getByRole("button"));
    await rerender({ middleDisabled: false, middleText: "Zebra" });

    await user.keyboard("{ArrowDown}");
    const middle = screen.getByRole("menuitem", { name: "Zebra" });
    expect(middle).toHaveFocus();

    await user.click(middle);
    expect(onClose).toHaveBeenCalledWith({
      trigger: "item-select",
      index: 1,
      text: "Zebra",
    });
  });

  describe("portalMenu", () => {
    it("should render menu in FloatingPortal when portalMenu is true", async () => {
      render(OverflowMenu, { props: { portalMenu: true } });

      await openMenu();

      const menu = screen.getByRole("menu");
      expect(menu).toBeInTheDocument();
      const floatingPortal = menu.closest("[data-floating-portal]");
      expect(floatingPortal).toBeInTheDocument();
      expect(floatingPortal?.parentElement).toBe(document.body);
    });

    it("should set position: relative on portal menu ul", async () => {
      render(OverflowMenu, { props: { portalMenu: true } });

      await openMenu();

      const menu = screen.getByRole("menu");
      expect(menu.style.position).toBe("relative");
    });

    it("should render menu in FloatingPortal when inside Modal (portalMenu not passed)", async () => {
      render(OverflowMenuInModal, { props: { modalOpen: true } });

      await openMenu(screen.getByRole("button", { name: "Options" }));

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

      await openMenu(screen.getByRole("button", { name: "Options" }));

      const menu = screen.getByRole("menu");
      expect(menu).toBeInTheDocument();
      const floatingPortal = menu.closest("[data-floating-portal]");
      expect(floatingPortal).not.toBeInTheDocument();
    });

    it("focuses items and trigger with preventScroll so the page does not jump", async () => {
      // Regression: a portalled menu briefly sits at (0,0) before
      // FloatingPortal positions it. Focusing without `preventScroll`
      // scrolls that initial position into view, jumping the page to top.
      const focusSpy = vi.spyOn(HTMLElement.prototype, "focus");
      render(OverflowMenu, { props: { portalMenu: true } });

      const { menuButton, items: menuItems } = await openMenu();

      // First item is focused programmatically on open.
      expect(menuItems[0]).toHaveFocus();
      expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });

      // Escape returns focus to the trigger, also without scrolling.
      focusSpy.mockClear();
      await user.keyboard("{Escape}");
      expect(menuButton).toHaveFocus();
      expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });

      focusSpy.mockRestore();
    });

    it("should reflect auto-flipped direction in data-floating-menu-direction", async () => {
      // Mock getBoundingClientRect to simulate anchor near top of viewport
      // so that direction="top" will auto-flip to "bottom".
      const original = Element.prototype.getBoundingClientRect;
      Element.prototype.getBoundingClientRect = function () {
        if (this.hasAttribute?.("data-floating-portal")) {
          return rect({ width: 160, height: 200 });
        }
        if (this.classList?.contains("bx--overflow-menu")) {
          return rect({ top: 30, width: 40, height: 32 });
        }
        return original.call(this);
      };

      try {
        render(OverflowMenu, {
          props: { portalMenu: true, direction: "top" },
        });

        await openMenu();
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

  describe.each([
    ["non-portalled", false],
    ["portalled", true],
  ] as const)("%s menu", (_, portalMenu) => {
    it("moves focus with the arrow keys", async () => {
      render(OverflowMenu, { props: { portalMenu } });

      const { items: menuItems } = await openMenu();
      expect(menuItems[0]).toHaveFocus();

      await user.keyboard("{ArrowDown}");
      expect(menuItems[1]).toHaveFocus();

      await user.keyboard("{ArrowDown}");
      expect(menuItems[2]).toHaveFocus();

      await user.keyboard("{ArrowUp}");
      expect(menuItems[1]).toHaveFocus();
    });

    it("wraps arrow navigation around both ends, then Escape returns focus to the trigger", async () => {
      render(OverflowMenu, { props: { portalMenu } });

      const { menuButton, items: menuItems } = await openMenu();
      expect(menuItems[0]).toHaveFocus();

      await user.keyboard("{ArrowUp}");
      expect(menuItems[2]).toHaveFocus();

      await user.keyboard("{ArrowDown}");
      expect(menuItems[0]).toHaveFocus();

      await user.keyboard("{Escape}");
      expect(menuButton).toHaveFocus();
    });

    it("closes when clicking outside", async () => {
      render(OverflowMenu, { props: { portalMenu } });

      const { menuButton } = await openMenu();
      expect(menuButton).toHaveAttribute("aria-expanded", "true");

      await user.click(document.body);
      expect(menuButton).toHaveAttribute("aria-expanded", "false");
    });

    it("caps the menu height in pixels when maxHeight is a number", async () => {
      render(OverflowMenu, { props: { portalMenu, maxHeight: 240 } });

      await openMenu();

      const menu = screen.getByRole("menu");
      expect(menu.closest("[data-floating-portal]") !== null).toBe(portalMenu);
      expect(menu).toHaveClass("bx--overflow-menu-options--scrollable");
      expect(menu).toHaveStyle("max-height: 240px");
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

    it("renders the iconEnd prop and slot at the end", () => {
      render(OverflowMenuItemIcons);

      const endProp = screen.getByRole("menuitem", { name: "End prop" });
      expect(
        endProp.querySelector(
          ".bx--overflow-menu-options__option-icon--right svg",
        ),
      ).toBeInTheDocument();
      expect(
        screen
          .getByTestId("slot-icon-end")
          .closest(".bx--overflow-menu-options__option-icon--right"),
      ).toBeInTheDocument();
    });

    it("prefers iconEnd over iconRight", () => {
      render(OverflowMenuItemIcons);

      const endIcon = (name: string) =>
        screen
          .getByRole("menuitem", { name })
          .querySelector(".bx--overflow-menu-options__option-icon--right");
      // Both items render Launch from `iconEnd`; the second also sets
      // `iconRight` to Edit.
      expect(endIcon("Both end props")?.innerHTML).toBe(
        endIcon("End prop")?.innerHTML,
      );

      expect(screen.getByTestId("both-icon-end")).toBeInTheDocument();
      expect(screen.queryByTestId("both-icon-right")).toBeNull();
      expect(endIcon("Both end slots")?.querySelectorAll("svg")).toHaveLength(
        1,
      );
    });
  });

  it("puts aria attributes on the menu item, and the rest on the wrapper", () => {
    render(OverflowMenuItemAria);

    const button = screen.getByRole("menuitem", { name: "Save" });
    expect(button).toHaveAttribute("aria-keyshortcuts", "Control+S");
    expect(button).toHaveAttribute("aria-describedby", "save-hint");
    expect(button).toHaveAccessibleDescription("Saves the draft");

    const link = screen.getByRole("menuitem", { name: "Docs" });
    expect(link).toHaveAttribute("aria-keyshortcuts", "Control+D");
    expect(link).toHaveAttribute("aria-current", "page");

    const wrapper = screen.getByTestId("save");
    expect(wrapper).toHaveAttribute("role", "none");
    for (const name of wrapper.getAttributeNames()) {
      expect(name.startsWith("aria-")).toBe(false);
    }
  });

  it("focuses the primaryFocus item, not the first item, when opened", async () => {
    render(OverflowMenuPrimaryFocus);

    const { items: menuItems } = await openMenu();
    expect(menuItems[1]).toHaveTextContent("API documentation");
    expect(menuItems[1]).toHaveFocus();
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

// A menu rendered open hasn't been opened by the user, so it leaves focus
// (and the page's scroll position) where they are.
describe("OverflowMenu rendered open", () => {
  it("does not take focus", async () => {
    render(OverflowMenuPrimaryFocus, { open: true });
    await tick();
    await tick();

    expect(screen.getAllByRole("menuitem")).toHaveLength(3);
    expect(document.body).toHaveFocus();
  });

  it("focuses the primary item when opened after rendering", async () => {
    const { rerender } = render(OverflowMenuPrimaryFocus);
    await tick();

    await rerender({ open: true });
    await tick();

    expect(
      screen.getByRole("menuitem", { name: "API documentation" }),
    ).toHaveFocus();
  });

  it("moves focus with the arrow keys once focus is in the menu", async () => {
    render(OverflowMenuPrimaryFocus, { open: true });
    await tick();

    screen.getByRole("menuitem", { name: "API documentation" }).focus();
    await user.keyboard("{ArrowDown}");

    expect(
      screen.getByRole("menuitem", { name: "Delete service" }),
    ).toHaveFocus();
  });
});

describe("OverflowMenu custom trigger", () => {
  it("marks the trigger only when the `menu` slot is filled", () => {
    render(OverflowMenuCustomTrigger);

    expect(screen.getByTestId("custom")).toHaveClass(
      "bx--overflow-menu--custom-trigger",
    );
    expect(screen.getByTestId("default")).not.toHaveClass(
      "bx--overflow-menu--custom-trigger",
    );
  });
});

describe("OverflowMenu window listeners", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opening adds one window click listener, closing removes it", async () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    for (let i = 0; i < 5; i++) {
      render(OverflowMenu, { props: { id: `menu-${i}` } });
    }
    expect(netListenerCalls(addSpy, removeSpy, "click")).toBe(0);

    const buttons = screen.getAllByRole("button");
    await user.click(buttons[0]);
    expect(netListenerCalls(addSpy, removeSpy, "click")).toBe(1);

    await user.keyboard("{Escape}");
    expect(netListenerCalls(addSpy, removeSpy, "click")).toBe(0);
  });
});

describe("OverflowMenu in RTL", () => {
  afterEach(() => {
    document.documentElement.style.removeProperty("direction");
  });

  /**
   * Whether the open menu lines up with the button's right edge, read from
   * the flip class and, when portalled, the portal's physical alignment.
   */
  async function alignsRight(props: { flipped: boolean; portalMenu: boolean }) {
    const { unmount } = render(OverflowMenu, { props });
    await user.click(screen.getByRole("button"));
    const menu = screen.getByRole("menu");
    const flip = menu.classList.contains("bx--overflow-menu--flip");
    const align = menu
      .closest("[data-floating-portal]")
      ?.getAttribute("data-floating-intrinsic-align");
    if (props.portalMenu) expect(align).toBe(flip ? "end" : "start");
    unmount();
    return flip;
  }

  it.each([false, true])(
    "aligns the menu with the inline start, or the end when flipped (portalMenu: %s)",
    async (portalMenu) => {
      expect(await alignsRight({ flipped: false, portalMenu })).toBe(false);
      expect(await alignsRight({ flipped: true, portalMenu })).toBe(true);

      document.documentElement.style.direction = "rtl";
      expect(await alignsRight({ flipped: false, portalMenu })).toBe(true);
      expect(await alignsRight({ flipped: true, portalMenu })).toBe(false);
    },
  );
});
