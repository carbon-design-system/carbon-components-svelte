import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import type ContextMenuOptionComponent from "carbon-components-svelte/ContextMenu/ContextMenuOption.svelte";
import type { ComponentProps } from "svelte";
import { netListenerCalls } from "../utils/net-listener-calls";
import { user } from "../utils/user";
import { setViewportWidth } from "../utils/viewport";
import ContextMenuTarget from "./ContextMenu.target.test.svelte";
import ContextMenu from "./ContextMenu.test.svelte";
import ContextMenuOptionIcon from "./ContextMenuOption.icon.test.svelte";
import ContextMenuOptionRole from "./ContextMenuOption.role.test.svelte";
import ContextMenuOptionSlot from "./ContextMenuOption.slot.test.svelte";

describe("ContextMenu", () => {
  it("listens for the page's context menu once, not once per submenu", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    render(ContextMenu, { props: { withSubmenu: true } });

    expect(netListenerCalls(add, remove, "contextmenu")).toBe(1);
    add.mockRestore();
    remove.mockRestore();
  });

  it("should set aria-label on root menu from labelText", () => {
    render(ContextMenu, {
      props: { open: true, labelText: "Page actions" },
    });

    const menu = screen.getAllByRole("menu")[0];
    expect(menu).toHaveAttribute("aria-label", "Page actions");
  });

  it("should prefer aria-label over labelText when both are set", () => {
    render(ContextMenu, {
      props: {
        open: true,
        labelText: "From labelText",
        ariaLabel: "From aria-label",
      },
    });

    const menu = screen.getAllByRole("menu")[0];
    expect(menu).toHaveAttribute("aria-label", "From aria-label");
  });

  it("should dispatch open only when open transitions to true", async () => {
    const onopen = vi.fn();
    const { rerender } = render(ContextMenu, {
      props: { open: true, x: 100, y: 100, onopen },
    });

    // Mounting already open fires `open` once.
    expect(onopen).toHaveBeenCalledTimes(1);

    await rerender({ open: true, x: 150, y: 150 });
    await rerender({ open: true, x: 200, y: 200 });

    expect(onopen).toHaveBeenCalledTimes(1);
  });

  it("should dispatch close only when open transitions to false", async () => {
    const onclose = vi.fn();
    render(ContextMenu, { props: { open: false, onclose } });

    await user.keyboard("{Escape}");
    await user.click(document.body);
    // The options are always in the DOM, and selecting one calls `close`
    // directly, which must still be a no-op while the menu is closed.
    await user.click(screen.getByText("Option 1"));

    expect(onclose).not.toHaveBeenCalled();
  });

  it("should handle keyboard navigation", async () => {
    render(ContextMenu, { props: { open: true } });

    const menu = screen.getAllByRole("menu")[0];
    menu.focus();

    const options = screen.getAllByRole("menuitem");

    await user.keyboard("{ArrowDown}");
    expect(options[0]).toHaveFocus();

    await user.keyboard("{ArrowUp}");
    expect(options[0]).toHaveFocus();

    await user.keyboard("{End}");
    expect(options[options.length - 1]).toHaveFocus();

    await user.keyboard("{Home}");
    expect(options[0]).toHaveFocus();
  });

  it("should move focus onto disabled options with the arrow keys", async () => {
    render(ContextMenu, { props: { open: true, optionDisabled: true } });

    const menu = screen.getAllByRole("menu")[0];
    menu.focus();

    const options = screen.getAllByRole("menuitem");

    await user.keyboard("{ArrowDown}");
    expect(options[0]).toHaveFocus();

    // Disabled options stay focusable, as in the WAI-ARIA APG menu pattern.
    await user.keyboard("{ArrowDown}");
    expect(options[1]).toHaveAttribute("aria-disabled", "true");
    expect(options[1]).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(options[2]).toHaveFocus();

    await user.keyboard("{ArrowUp}");
    expect(options[1]).toHaveFocus();
  });

  it("should move focus onto disabled submenu options with the arrow keys", async () => {
    render(ContextMenu, {
      props: {
        open: true,
        withSubmenu: true,
        submenuOptionDisabled: true,
        x: 100,
        y: 100,
      },
    });

    screen.getByRole("menuitem", { name: "Option with submenu" }).focus();
    await user.keyboard("{ArrowRight}");
    await user.keyboard("{ArrowDown}");
    expect(
      screen.getByRole("menuitem", { name: "Submenu option 2" }),
    ).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(
      screen.getByRole("menuitem", { name: "Submenu option 3" }),
    ).toHaveFocus();

    await user.keyboard("{ArrowUp}");
    expect(
      screen.getByRole("menuitem", { name: "Submenu option 2" }),
    ).toHaveFocus();
  });

  it("should move focus to the option matching a typed character", async () => {
    render(ContextMenu, { props: { open: true } });

    const menu = screen.getAllByRole("menu")[0];
    menu.focus();

    const options = screen.getAllByRole("menuitem");

    await user.keyboard("{ArrowDown}");
    expect(options[0]).toHaveFocus();

    // All three options start with "o", so typing "o" again cycles
    // forward from the currently-focused option to the next match.
    await user.keyboard("o");
    expect(options[1]).toHaveFocus();
  });

  it("should scope typeahead search to the open submenu's own options", async () => {
    render(ContextMenu, {
      props: {
        open: true,
        withSubmenu: true,
        withRootSettings: true,
        x: 100,
        y: 100,
      },
    });

    const submenuTrigger = screen.getByRole("menuitem", {
      name: "Option with submenu",
    });
    submenuTrigger.focus();
    await user.keyboard("{ArrowRight}");

    const submenuOption1 = screen.getByRole("menuitem", {
      name: "Submenu option 1",
    });
    expect(submenuOption1).toHaveFocus();

    // Both submenu options start with "s", so typing "s" again cycles
    // forward to "Submenu option 2". Only the open submenu's items are
    // searched, not the root level's "Settings" option.
    await user.keyboard("s");

    const submenuOption2 = screen.getByRole("menuitem", {
      name: "Submenu option 2",
    });
    expect(submenuOption2).toHaveFocus();

    // The root level must not have searched too: if it had, focus would
    // jump to "Settings" once the submenu closes.
    await user.keyboard("{ArrowLeft}");
    expect(submenuTrigger).toHaveFocus();
  });

  it("should handle custom target", async () => {
    const onopen = vi.fn();
    render(ContextMenu, { props: { onopen } });

    const target = screen.getByTestId("target");
    await user.pointer({ target, keys: "[MouseRight]" });
    expect(onopen).toHaveBeenCalledWith(target);
  });

  // Regression test: when `target` is updated to a new set of nodes,
  // the previously-bound nodes should have their `contextmenu`
  // listener removed. Otherwise, right-clicking a node that is no
  // longer in `target` still triggers `openMenu`.
  it("should remove contextmenu listener from nodes no longer in target", async () => {
    const onopen = vi.fn();
    render(ContextMenuTarget, { props: { onopen } });

    // Initial target is [A]. Swap to [B].
    await user.click(screen.getByTestId("swap"));

    const targetA = screen.getByTestId("target-a");
    await user.pointer({ target: targetA, keys: "[MouseRight]" });

    expect(onopen).not.toHaveBeenCalled();

    // The new target still opens the menu.
    const targetB = screen.getByTestId("target-b");
    await user.pointer({ target: targetB, keys: "[MouseRight]" });
    expect(onopen).toHaveBeenCalledWith(targetB);
  });

  it("should restore focus to the parent option when the submenu closes with ArrowLeft", async () => {
    render(ContextMenu, {
      props: {
        open: true,
        withSubmenu: true,
        x: 100,
        y: 100,
      },
    });

    const submenuTrigger = screen.getByRole("menuitem", {
      name: "Option with submenu",
    });
    submenuTrigger.focus();
    await user.keyboard("{ArrowRight}");

    const submenuOption = screen.getByRole("menuitem", {
      name: "Submenu option 1",
    });
    expect(submenuOption).toHaveFocus();

    await user.keyboard("{ArrowLeft}");

    expect(submenuTrigger).toHaveFocus();
  });

  it.each([
    { key: "ArrowLeft", mod: { altKey: true }, inSubmenu: true },
    { key: "ArrowRight", mod: { metaKey: true }, inSubmenu: false },
    { key: "ArrowUp", mod: { metaKey: true }, inSubmenu: false },
  ])(
    "leaves $key with $mod to the browser",
    async ({ key, mod, inSubmenu }) => {
      render(ContextMenu, {
        props: { open: true, withSubmenu: true, x: 100, y: 100 },
      });

      const parent = screen.getByRole("menuitem", {
        name: "Option with submenu",
      });
      parent.focus();
      if (inSubmenu) await user.keyboard("{ArrowRight}");
      const focused = document.activeElement as HTMLElement;

      const notPrevented = await fireEvent.keyDown(focused, { key, ...mod });

      expect(notPrevented).toBe(true);
      expect(focused).toHaveFocus();
      expect(parent).toHaveAttribute("aria-expanded", String(inSubmenu));
    },
  );

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/1848
  it("should not close parent menu when clicking submenu trigger", async () => {
    const onclose = vi.fn();
    render(ContextMenu, {
      props: {
        open: true,
        withSubmenu: true,
        x: 100,
        y: 100,
        onclose,
      },
    });

    const submenuTrigger = screen.getByRole("menuitem", {
      name: "Option with submenu",
    });
    expect(submenuTrigger).toHaveAttribute("aria-expanded", "false");

    await user.click(submenuTrigger);

    expect(onclose).not.toHaveBeenCalled();
    expect(submenuTrigger).toHaveAttribute("aria-expanded", "true");
  });

  it.each([
    ["click", (option: HTMLElement) => user.click(option)],
    ["Enter", () => user.keyboard("{Enter}")],
  ])(
    "should reopen a submenu after selecting a submenu option by %s",
    async (_, select) => {
      render(ContextMenu, {
        props: { open: true, withSubmenu: true, x: 100, y: 100 },
      });

      const submenuTrigger = screen.getByRole("menuitem", {
        name: "Option with submenu",
      });
      submenuTrigger.focus();
      await user.keyboard("{ArrowRight}");
      await select(screen.getByRole("menuitem", { name: "Submenu option 1" }));
      expect(submenuTrigger).toHaveAttribute("aria-expanded", "false");

      await user.click(submenuTrigger);
      expect(submenuTrigger).toHaveAttribute("aria-expanded", "true");
    },
  );

  it("should not close menu when activating disabled regular option", async () => {
    const onclose = vi.fn();
    render(ContextMenu, {
      props: {
        open: true,
        optionDisabled: true,
        x: 100,
        y: 100,
        onclose,
      },
    });

    const disabledOption = screen.getByText("Option 2");
    await user.click(disabledOption);
    expect(onclose).not.toHaveBeenCalled();

    const trigger = disabledOption.closest("li");
    assert(trigger);
    trigger.focus();

    await user.keyboard("{Enter}");
    expect(onclose).not.toHaveBeenCalled();

    await user.keyboard(" ");
    expect(onclose).not.toHaveBeenCalled();
  });

  it.each([
    ["Enter", "{Enter}"],
    ["Space", " "],
  ])("activates an enabled option with %s", async (_, key) => {
    const onclose = vi.fn();
    const onoptionclick = vi.fn();
    render(ContextMenu, {
      props: { open: true, x: 100, y: 100, onclose, onoptionclick },
    });

    screen.getByRole("menuitem", { name: "Option 1" }).focus();
    await user.keyboard(key);

    expect(onoptionclick).toHaveBeenCalledWith("Option 1");
    expect(onclose).toHaveBeenCalledWith("select");
  });

  it.each([
    ["ArrowDown", "{ArrowDown}", "Submenu option 2"],
    ["ArrowUp", "{ArrowDown}{ArrowUp}", "Submenu option 1"],
    ["End", "{End}", "Submenu option 3"],
    ["Home", "{End}{Home}", "Submenu option 1"],
  ])("moves focus in the submenu with %s", async (_, keys, expected) => {
    render(ContextMenu, {
      props: { open: true, withSubmenu: true, x: 100, y: 100 },
    });

    screen.getByRole("menuitem", { name: "Option with submenu" }).focus();
    await user.keyboard("{ArrowRight}");
    await user.keyboard(keys);

    expect(screen.getByRole("menuitem", { name: expected })).toHaveFocus();
  });

  it("opens a submenu with ArrowLeft and closes it with ArrowRight in RTL", async () => {
    document.documentElement.style.direction = "rtl";
    render(ContextMenu, {
      props: { open: true, withSubmenu: true, x: 100, y: 100 },
    });
    const trigger = screen.getByRole("menuitem", {
      name: "Option with submenu",
    });

    try {
      trigger.focus();
      await user.keyboard("{ArrowRight}");
      expect(trigger).toHaveAttribute("aria-expanded", "false");

      await user.keyboard("{ArrowLeft}");
      expect(trigger).toHaveAttribute("aria-expanded", "true");
      expect(
        screen.getByRole("menuitem", { name: "Submenu option 1" }),
      ).toHaveFocus();

      await user.keyboard("{ArrowRight}");
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(trigger).toHaveFocus();
    } finally {
      document.documentElement.style.removeProperty("direction");
    }
  });

  // Regression tests for https://github.com/carbon-design-system/carbon-components-svelte/issues/1847
  // jsdom reports zero-sized rects, so the trigger and the submenu get mocked
  // widths. The submenu opens after the 150ms hover-intent delay.
  describe("submenu viewport positioning", () => {
    const originalInnerWidth = window.innerWidth;

    afterEach(() => {
      setViewportWidth(originalInnerWidth);
    });

    const openSubmenu = async (innerWidth: number, rootX: number) => {
      setViewportWidth(innerWidth);

      render(ContextMenu, {
        props: { open: true, withSubmenu: true, x: rootX, y: 100 },
      });

      const triggerText = screen.getByText("Option with submenu");
      const trigger = triggerText.closest("li");
      assert(trigger);
      const submenu = screen
        .getAllByRole("menu")
        .find((menu) => menu.getAttribute("data-level") === "2");
      assert(submenu);

      const rect = (width: number) => ({
        left: 0,
        right: width,
        top: 100,
        bottom: 140,
        width,
        height: 40,
        x: 0,
        y: 100,
        toJSON() {},
      });
      vi.spyOn(trigger, "getBoundingClientRect").mockReturnValue(rect(150));
      vi.spyOn(submenu, "getBoundingClientRect").mockReturnValue(rect(150));

      await user.hover(triggerText);
      await waitFor(() =>
        expect(trigger).toHaveAttribute("aria-expanded", "true"),
      );
      return submenu;
    };

    it("should position submenu to the left when it would overflow right viewport edge", async () => {
      // Right of the trigger would be 300 + 150 = 450 .. 600, past 400.
      const submenu = await openSubmenu(400, 300);

      // Flipped to the left of the root menu: 300 - 150.
      expect(submenu.style.left).toBe("150px");
    });

    it("should position submenu to the right when there is sufficient space", async () => {
      const submenu = await openSubmenu(1024, 100);

      // Flush with the trigger's right edge: 100 + 150.
      expect(submenu.style.left).toBe("250px");
    });

    it("should constrain submenu to viewport when it would overflow both sides", async () => {
      // Right would end at 400 and left would start at 100 - 150 = -50, so
      // it is pinned to the viewport's right edge: 200 - 150.
      const submenu = await openSubmenu(200, 100);

      expect(submenu.style.left).toBe("50px");
    });

    describe("in RTL", () => {
      beforeEach(() => {
        document.documentElement.style.direction = "rtl";
      });

      afterEach(() => {
        document.documentElement.style.removeProperty("direction");
      });

      it.each([
        ["opens the submenu to the left", 300, "150px"],
        ["flips the submenu right near the left edge", 100, "250px"],
      ])("%s", async (_, rootX, left) => {
        const submenu = await openSubmenu(1024, rootX);
        expect(submenu.style.left).toBe(left);
      });

      it("pins the submenu to the left edge when neither side fits", async () => {
        const submenu = await openSubmenu(200, 100);
        expect(submenu.style.left).toBe("0px");
      });
    });
  });

  describe("positioning", () => {
    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;

    afterEach(() => {
      setViewportWidth(originalInnerWidth);
      window.innerHeight = originalInnerHeight;
    });

    // Mocks a 150x100 menu in a 400x300 viewport.
    const renderClosedMenu = () => {
      setViewportWidth(400);
      window.innerHeight = 300;

      render(ContextMenu);

      const menu = screen.getAllByRole("menu")[0];
      vi.spyOn(menu, "getBoundingClientRect").mockReturnValue({
        left: 0,
        right: 150,
        top: 0,
        bottom: 100,
        width: 150,
        height: 100,
        x: 0,
        y: 0,
        toJSON() {},
      });
      return menu;
    };

    const rightClickAt = (x: number, y: number) =>
      user.pointer({
        target: document.body,
        coords: { x, y },
        keys: "[MouseRight]",
      });

    it("flips to the left and above the pointer near the viewport edge", async () => {
      const menu = renderClosedMenu();

      await rightClickAt(350, 250);

      // 350 - 150 wide, 250 - 100 tall.
      expect(menu.style.left).toBe("200px");
      expect(menu.style.top).toBe("150px");
    });

    it("moves to the pointer on a right click while open", async () => {
      const menu = renderClosedMenu();

      await rightClickAt(100, 80);
      await rightClickAt(120, 90);

      expect(menu.style.left).toBe("120px");
      expect(menu.style.top).toBe("90px");
    });

    it.each([
      ["opens left of the pointer in RTL", 200, "50px"],
      ["flips right of the pointer near the left edge in RTL", 100, "100px"],
    ])("%s", async (_, x, left) => {
      document.documentElement.style.direction = "rtl";
      const menu = renderClosedMenu();

      try {
        await rightClickAt(x, 80);
        expect(menu.style.left).toBe(left);
        expect(menu.style.top).toBe("80px");
      } finally {
        document.documentElement.style.removeProperty("direction");
      }
    });

    it("reopens at the pointer after closing", async () => {
      const menu = renderClosedMenu();

      await rightClickAt(100, 80);
      await user.keyboard("{Escape}");
      await rightClickAt(120, 90);

      expect(menu.style.left).toBe("120px");
      expect(menu.style.top).toBe("90px");
    });
  });

  // Regression test: a disabled submenu trigger should expose
  // `aria-disabled` and ignore keyboard, hover, and click activation.
  describe("disabled submenu trigger", () => {
    it("should set aria-disabled on a disabled submenu trigger", () => {
      render(ContextMenu, {
        props: {
          open: true,
          withSubmenu: true,
          submenuDisabled: true,
          x: 100,
          y: 100,
        },
      });

      const trigger = screen.getByText("Option with submenu").closest("li");
      assert(trigger);
      expect(trigger).toHaveAttribute("aria-disabled", "true");
      expect(trigger).toHaveAttribute("aria-haspopup", "true");
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    it.each<[string, (trigger: HTMLElement) => Promise<void>]>([
      [
        "Enter/Space",
        async (trigger) => {
          trigger.focus();

          await user.keyboard("{Enter}");
          expect(trigger).toHaveAttribute("aria-expanded", "false");

          await user.keyboard(" ");
        },
      ],
      [
        "hover",
        async (trigger) => {
          await user.hover(trigger);
          // Outlast the 150ms hover-intent delay before asserting it never opened.
          await new Promise((resolve) => setTimeout(resolve, 200));
        },
      ],
      ["click", (trigger) => user.click(trigger)],
    ])("should not open submenu via %s when disabled", async (_, activate) => {
      render(ContextMenu, {
        props: {
          open: true,
          withSubmenu: true,
          submenuDisabled: true,
          x: 100,
          y: 100,
        },
      });

      const trigger = screen.getByRole("menuitem", {
        name: "Option with submenu",
      });
      await activate(trigger);

      expect(trigger).toHaveAttribute("aria-expanded", "false");
    });
  });

  it("supports custom label slot for ContextMenuOption", () => {
    render(ContextMenuOptionSlot);

    const customLabel = screen.getByText("Custom label content");
    expect(customLabel).toBeInTheDocument();
    // Keeps the base label class (layout, typeahead) and adds the modifier
    // that lifts the truncating overflow clip.
    expect(customLabel.parentElement).toHaveClass(
      "bx--menu-option__label",
      "bx--menu-option__label--slotted",
    );
  });

  it("supports preventDefault on click to prevent menu from closing", async () => {
    const onclose = vi.fn();
    const onoptionclick = vi.fn();
    render(ContextMenu, {
      props: {
        open: true,
        x: 100,
        y: 100,
        preventFirst: true,
        onclose,
        onoptionclick,
      },
    });

    const options = screen.getAllByRole("menuitem");
    await user.click(options[0]);

    expect(onoptionclick).toHaveBeenCalledWith("Option 1");
    expect(onclose).not.toHaveBeenCalled();

    expect(screen.getAllByRole("menu")[0]).toHaveClass("bx--menu--open");
  });

  describe("ContextMenuOption icon auto-indentation", () => {
    it("should auto-set indented when icon is provided", () => {
      render(ContextMenuOptionIcon, {
        props: { open: true, x: 100, y: 100 },
      });

      const copyOption = screen.getByRole("menuitem", { name: /Copy/ });

      const iconEl = copyOption.querySelector(".bx--menu-option__icon");
      expect(iconEl).toBeInTheDocument();
    });
  });

  describe("ContextMenuOption danger variant", () => {
    it("should apply danger class when kind is danger", () => {
      render(ContextMenuOptionIcon, {
        props: { open: true, x: 100, y: 100 },
      });

      const deleteOption = screen.getByRole("menuitem", { name: /Delete/ });

      expect(deleteOption).toHaveClass("bx--menu-option--danger");
    });
  });

  describe("ContextMenuOption disabled", () => {
    it("should apply disabled class only when disabled is true", () => {
      render(ContextMenu, {
        props: { open: true, x: 100, y: 100, withDisabled: true },
      });

      const enabledOption = screen.getByRole("menuitem", { name: /Option 1/ });
      const disabledOption = screen.getByRole("menuitem", {
        name: /Disabled option/,
      });

      expect(enabledOption).not.toHaveClass("bx--menu-option--disabled");
      expect(disabledOption).toHaveClass("bx--menu-option--disabled");
      expect(disabledOption).toHaveAttribute("aria-disabled", "true");
    });
  });

  describe("ContextMenuOption role", () => {
    it("should reset role to menuitem when selectable toggles from true to false", async () => {
      const { rerender } = render(ContextMenuOptionRole, {
        props: { selectable: true },
      });

      expect(screen.getByRole("menuitemcheckbox")).toBeInTheDocument();

      await rerender({ selectable: false });

      expect(screen.queryByRole("menuitemcheckbox")).not.toBeInTheDocument();
      expect(screen.getByRole("menuitem")).toBeInTheDocument();
    });
  });

  describe("ContextMenuOption Generics", () => {
    it("should support custom Icon types with generics", () => {
      type CustomIcon = new (...args: unknown[]) => unknown;

      type ComponentType = ContextMenuOptionComponent<CustomIcon>;
      type Props = ComponentProps<ComponentType>;

      expectTypeOf<Props["icon"]>().toEqualTypeOf<CustomIcon | undefined>();
    });

    it("should default to any type when generic is not specified", () => {
      type ComponentType = ContextMenuOptionComponent;
      type Props = ComponentProps<ComponentType>;

      // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
      expectTypeOf<Props["icon"]>().toEqualTypeOf<any>();
    });
  });
});
