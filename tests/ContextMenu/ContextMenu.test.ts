import { fireEvent, render, screen } from "@testing-library/svelte";
import type ContextMenuOptionComponent from "carbon-components-svelte/ContextMenu/ContextMenuOption.svelte";
import type { ComponentProps } from "svelte";
import { user } from "../utils/user";
import ContextMenuPreventDefault from "./ContextMenu.preventDefault.test.svelte";
import ContextMenuTarget from "./ContextMenu.target.test.svelte";
import ContextMenu from "./ContextMenu.test.svelte";
import ContextMenuOptionIcon from "./ContextMenuOption.icon.test.svelte";
import ContextMenuOptionRole from "./ContextMenuOption.role.test.svelte";
import ContextMenuOptionSlot from "./ContextMenuOption.slot.test.svelte";

/** ContextMenuOption's hover-open/close delay for a submenu ("moderate-01"). */
const HOVER_DELAY_MS = 150;

/**
 * Stub an element's `getBoundingClientRect()` (jsdom never computes real
 * layout) and force FloatingPortal to recompute against it, matching the
 * pattern FloatingPortal's own tests use for reposition assertions. Accepts
 * either a CSS selector or an already-resolved element.
 */
async function stubRectAndReposition(
  target: string | Element,
  rect: { top: number; left: number; right: number; bottom: number; width: number; height: number },
) {
  const element =
    typeof target === "string" ? document.querySelector(target) : target;
  assert(element);
  (element as HTMLElement).getBoundingClientRect = () => rect as DOMRect;
  window.dispatchEvent(new Event("resize"));
  await new Promise((resolve) => requestAnimationFrame(resolve));
}

describe("ContextMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render with default props", () => {
    render(ContextMenu, { props: { open: true } });

    const target = screen.getByTestId("target");
    expect(target).toBeInTheDocument();
    expect(target).toHaveTextContent("Right click me");

    const menu = screen.getAllByRole("menu");
    expect(menu[0]).toBeInTheDocument();
    expect(menu[0]).toHaveClass("bx--menu");
  });

  it("should set aria-label on root menu from labelText", () => {
    render(ContextMenu, {
      props: { open: true, labelText: "Page actions" },
    });

    const menu = screen.getAllByRole("menu")[0];
    expect(menu).toHaveAttribute("aria-label", "Page actions");
  });

  it("should set aria-label from aria-label prop", () => {
    render(ContextMenu, {
      props: { open: true, ariaLabel: "Custom menu name" },
    });

    const menu = screen.getAllByRole("menu")[0];
    expect(menu).toHaveAttribute("aria-label", "Custom menu name");
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

  it("should render menu options", () => {
    render(ContextMenu, { props: { open: true } });

    const options = screen.getAllByRole("menuitem");
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent("Option 1");
    expect(options[1]).toHaveTextContent("Option 2");
    expect(options[2]).toHaveTextContent("Option 3");
  });

  it("should open on right click", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ContextMenu);

    const target = screen.getByTestId("target");
    await user.pointer({ target, keys: "[MouseRight]" });
    expect(consoleLog).toHaveBeenCalledWith("open", expect.any(HTMLElement));
  });

  it("should dispatch open only when open transitions to true", () => {
    const consoleLog = vi.spyOn(console, "log");
    const { rerender } = render(ContextMenu, {
      props: { open: true, x: 100, y: 100 },
    });

    const openCallsAfterMount = consoleLog.mock.calls.filter(
      (call) => call[0] === "open",
    ).length;

    rerender({ open: true, x: 150, y: 150 });
    rerender({ open: true, x: 200, y: 200 });

    const openCallsAfterRerender = consoleLog.mock.calls.filter(
      (call) => call[0] === "open",
    ).length;

    expect(openCallsAfterRerender).toBe(openCallsAfterMount);
  });

  it("should dispatch close only when open transitions to false", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ContextMenu, { props: { open: false } });

    await user.keyboard("{Escape}");
    await user.click(document.body);

    const closeCalls = consoleLog.mock.calls.filter(
      (call) => call[0] === "close",
    ).length;

    expect(closeCalls).toBe(0);
  });

  it("should close on escape key", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ContextMenu, { props: { open: true } });

    await user.keyboard("{Escape}");
    expect(consoleLog).toHaveBeenCalledWith("close");
  });

  it("should close on click outside", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ContextMenu, { props: { open: true } });

    await user.click(document.body);
    expect(consoleLog).toHaveBeenCalledWith("close");
  });

  it("should handle keyboard navigation", async () => {
    render(ContextMenu, { props: { open: true } });

    const menu = screen.getAllByRole("menu")[0];
    menu.focus();

    const options = screen.getAllByRole("menuitem");

    // ArrowDown from the focused menu moves to the first option.
    await user.keyboard("{ArrowDown}");
    expect(options[0]).toHaveFocus();

    // ArrowUp clamps at the first option (no wrap).
    await user.keyboard("{ArrowUp}");
    expect(options[0]).toHaveFocus();

    // End jumps to the last option.
    await user.keyboard("{End}");
    expect(options[options.length - 1]).toHaveFocus();

    // Home jumps back to the first option.
    await user.keyboard("{Home}");
    expect(options[0]).toHaveFocus();
  });

  it("should handle custom target", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ContextMenu);

    const target = screen.getByTestId("target");
    await user.pointer({ target, keys: "[MouseRight]" });
    expect(consoleLog).toHaveBeenCalledWith("open", target);
  });

  // Regression test: when `target` is updated to a new set of nodes,
  // the previously-bound nodes should have their `contextmenu`
  // listener removed. Otherwise, right-clicking a node that is no
  // longer in `target` still triggers `openMenu`.
  it("should remove contextmenu listener from nodes no longer in target", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ContextMenuTarget);

    // Initial target is [A]. Swap to [B].
    await user.click(screen.getByTestId("swap"));

    // Right-clicking A should no longer open the menu.
    const targetA = screen.getByTestId("target-a");
    await user.pointer({ target: targetA, keys: "[MouseRight]" });

    const openCalls = consoleLog.mock.calls.filter(
      ([label]) => label === "open",
    );
    expect(openCalls).toHaveLength(0);
  });

  it("should handle custom position", async () => {
    render(ContextMenu, {
      props: {
        open: true,
        x: 100,
        y: 200,
      },
    });

    // jsdom never computes real layout, so the internal point-anchor's
    // getBoundingClientRect() is zero regardless of its inline x/y style -
    // stub it to reflect (100, 200), then force a reposition.
    await stubRectAndReposition("[data-context-menu-point-anchor]", {
      top: 200,
      left: 100,
      right: 100,
      bottom: 200,
      width: 0,
      height: 0,
    });

    const portal = document.querySelector("[data-floating-portal]");
    assert(portal);
    expect(portal).toHaveStyle({
      left: "100px",
      top: "200px",
    });
  });

  it("should handle nested menus", () => {
    render(ContextMenu, { props: { open: true } });

    const menus = screen.getAllByRole("menu");
    expect(menus[0]).toHaveAttribute("data-level", "1");

    // Simulate nested menu
    const nestedMenu = document.createElement("ul");
    nestedMenu.setAttribute("data-level", "2");
    menus[0].appendChild(nestedMenu);
  });

  it("should set level to 1 when ctx is null (root menu)", () => {
    render(ContextMenu, { props: { open: true } });

    const menus = screen.getAllByRole("menu");
    expect(menus[0]).toHaveAttribute("data-level", "1");
  });

  it("should set level to 2 when ctx exists (nested menu)", async () => {
    vi.useFakeTimers();
    render(ContextMenu, {
      props: {
        open: true,
        withSubmenu: true,
        x: 100,
        y: 100,
      },
    });

    const submenuTrigger = screen.getByText("Option with submenu");
    await fireEvent.mouseEnter(submenuTrigger.closest("li"));
    await vi.advanceTimersByTimeAsync(HOVER_DELAY_MS);
    vi.useRealTimers();

    const submenu = screen
      .getAllByRole("menu")
      .find((menu) => menu.getAttribute("data-level") === "2");
    assert(submenu);
    expect(submenu).toHaveAttribute("data-level", "2");
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/1848
  it("should not close parent menu when clicking submenu trigger", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ContextMenu, {
      props: {
        open: true,
        withSubmenu: true,
        x: 100,
        y: 100,
      },
    });

    const submenuTrigger = screen.getByText("Option with submenu");
    expect(submenuTrigger).toBeInTheDocument();

    await user.click(submenuTrigger);

    expect(consoleLog).not.toHaveBeenCalledWith("close");

    const submenuOptions = screen.getByText("Submenu option 1");
    expect(submenuOptions).toBeInTheDocument();
  });

  it("should close menu when clicking regular option", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ContextMenu, {
      props: {
        open: true,
        x: 100,
        y: 100,
      },
    });

    // Click a regular option
    const option = screen.getByText("Option 1");
    await user.click(option);

    // Menu should close
    expect(consoleLog).toHaveBeenCalledWith("close");
  });

  it("should not close menu when activating disabled regular option", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ContextMenu, {
      props: {
        open: true,
        optionDisabled: true,
        x: 100,
        y: 100,
      },
    });

    const disabledOption = screen.getByText("Option 2");
    await user.click(disabledOption);
    expect(consoleLog).not.toHaveBeenCalledWith("close");

    const trigger = disabledOption.closest("li");
    assert(trigger);
    trigger.focus();

    await user.keyboard("{Enter}");
    expect(consoleLog).not.toHaveBeenCalledWith("close");

    await user.keyboard(" ");
    expect(consoleLog).not.toHaveBeenCalledWith("close");
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/1847
  it("should position submenu to the left when it would overflow right viewport edge", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 400,
    });

    render(ContextMenu, {
      props: {
        open: true,
        withSubmenu: true,
        x: 300,
        y: 100,
      },
    });

    const submenuTrigger = screen.getByText("Option with submenu").closest("li");
    assert(submenuTrigger);
    // Trigger sits flush against the right edge of a 400px-wide viewport.
    submenuTrigger.getBoundingClientRect = () =>
      ({ top: 100, left: 300, right: 400, bottom: 120, width: 100, height: 20 }) as DOMRect;

    vi.useFakeTimers();
    try {
      await fireEvent.mouseEnter(submenuTrigger);
      await vi.advanceTimersByTimeAsync(HOVER_DELAY_MS);
    } finally {
      vi.useRealTimers();
    }

    const submenu = screen
      .getAllByRole("menu")
      .find((menu) => menu.getAttribute("data-level") === "2");
    assert(submenu);
    const portal = submenu.closest("[data-floating-portal]");
    assert(portal);
    // FloatingPortal measures its own wrapper (not the <ul>) for the
    // flip/clamp decision.
    await stubRectAndReposition(portal, {
      top: 100,
      left: 0,
      right: 200,
      bottom: 300,
      width: 200,
      height: 200,
    });

    expect(portal).toHaveAttribute("data-floating-direction", "left");

    const submenuX = Number.parseInt((portal as HTMLElement).style.left, 10);
    // Submenu should not overflow the right edge of viewport.
    expect(submenuX + 200).toBeLessThanOrEqual(400);
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/1847
  it("should position submenu to the right when there is sufficient space", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });

    render(ContextMenu, {
      props: {
        open: true,
        withSubmenu: true,
        x: 100,
        y: 100,
      },
    });

    const submenuTrigger = screen.getByText("Option with submenu").closest("li");
    assert(submenuTrigger);
    // Trigger has plenty of room to either side.
    submenuTrigger.getBoundingClientRect = () =>
      ({ top: 100, left: 100, right: 300, bottom: 120, width: 200, height: 20 }) as DOMRect;

    vi.useFakeTimers();
    try {
      await fireEvent.mouseEnter(submenuTrigger);
      await vi.advanceTimersByTimeAsync(HOVER_DELAY_MS);
    } finally {
      vi.useRealTimers();
    }

    const submenu = screen
      .getAllByRole("menu")
      .find((menu) => menu.getAttribute("data-level") === "2");
    assert(submenu);
    const portal = submenu.closest("[data-floating-portal]");
    assert(portal);
    await stubRectAndReposition(portal, {
      top: 100,
      left: 0,
      right: 200,
      bottom: 300,
      width: 200,
      height: 200,
    });

    // Submenu should be positioned to the right of the parent (trigger) option.
    expect(portal).toHaveAttribute("data-floating-direction", "right");
    expect(Number.parseInt((portal as HTMLElement).style.left, 10)).toBe(300);
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/1847
  it("should constrain submenu to viewport when it would overflow both sides", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 200,
    });

    render(ContextMenu, {
      props: {
        open: true,
        withSubmenu: true,
        x: 100,
        y: 100,
      },
    });

    const submenuTrigger = screen.getByText("Option with submenu").closest("li");
    assert(submenuTrigger);
    // Neither side of a 200px-wide viewport has room for a 250px-wide submenu.
    submenuTrigger.getBoundingClientRect = () =>
      ({ top: 100, left: 50, right: 150, bottom: 120, width: 100, height: 20 }) as DOMRect;

    vi.useFakeTimers();
    try {
      await fireEvent.mouseEnter(submenuTrigger);
      await vi.advanceTimersByTimeAsync(HOVER_DELAY_MS);
    } finally {
      vi.useRealTimers();
    }

    const submenu = screen
      .getAllByRole("menu")
      .find((menu) => menu.getAttribute("data-level") === "2");
    assert(submenu);
    const portal = submenu.closest("[data-floating-portal]");
    assert(portal);
    await stubRectAndReposition(portal, {
      top: 100,
      left: 0,
      right: 250,
      bottom: 300,
      width: 250,
      height: 200,
    });

    // Content wider than the viewport itself: clamped to the left edge
    // rather than overflowing whichever side it lands on.
    expect(Number.parseInt((portal as HTMLElement).style.left, 10)).toBe(0);
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

    it("should not open submenu via Enter/Space when disabled", async () => {
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
      trigger.focus();

      await user.keyboard("{Enter}");
      expect(trigger).toHaveAttribute("aria-expanded", "false");

      await user.keyboard(" ");
      expect(trigger).toHaveAttribute("aria-expanded", "false");

      const submenu = screen
        .getAllByRole("menu")
        .find((menu) => menu.getAttribute("data-level") === "2");
      expect(submenu).toBeUndefined();
    });

    it("should not open submenu on hover when disabled", async () => {
      render(ContextMenu, {
        props: {
          open: true,
          withSubmenu: true,
          submenuDisabled: true,
          x: 100,
          y: 100,
        },
      });

      const submenuTrigger = screen.getByText("Option with submenu");
      await user.hover(submenuTrigger);
      await new Promise((resolve) => setTimeout(resolve, 200));

      const trigger = submenuTrigger.closest("li");
      assert(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "false");

      const submenu = screen
        .getAllByRole("menu")
        .find((menu) => menu.getAttribute("data-level") === "2");
      expect(submenu).toBeUndefined();
    });

    it("should not open submenu on click when disabled", async () => {
      render(ContextMenu, {
        props: {
          open: true,
          withSubmenu: true,
          submenuDisabled: true,
          x: 100,
          y: 100,
        },
      });

      const submenuTrigger = screen.getByText("Option with submenu");
      await user.click(submenuTrigger);

      const trigger = submenuTrigger.closest("li");
      assert(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "false");

      const submenu = screen
        .getAllByRole("menu")
        .find((menu) => menu.getAttribute("data-level") === "2");
      expect(submenu).toBeUndefined();
    });
  });

  it("supports custom label slot for ContextMenuOption", () => {
    render(ContextMenuOptionSlot);

    const customLabel = screen.getByText("Custom label content");
    expect(customLabel).toBeInTheDocument();
  });

  it("supports preventDefault on click to prevent menu from closing", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ContextMenuPreventDefault, {
      props: { open: true, x: 100, y: 100 },
    });

    const options = screen.getAllByRole("menuitem");
    await user.click(options[0]);

    expect(consoleLog).toHaveBeenCalledWith("click", "Stay open");
    expect(consoleLog).not.toHaveBeenCalledWith("close");

    const menu = screen.queryByRole("menu");
    expect(menu).toBeInTheDocument();
  });

  it("closes menu normally when preventDefault is not called on click", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ContextMenuPreventDefault, {
      props: { open: true, x: 100, y: 100 },
    });

    const options = screen.getAllByRole("menuitem");
    await user.click(options[1]);

    expect(consoleLog).toHaveBeenCalledWith("click", "Close menu");
    expect(consoleLog).toHaveBeenCalledWith("close");
  });

  describe("ContextMenuOption icon auto-indentation", () => {
    it("should auto-set indented when icon is provided", () => {
      render(ContextMenuOptionIcon, {
        props: { open: true, x: 100, y: 100 },
      });

      const options = screen.getAllByRole("menuitem");
      const copyOption = options.find((o) => o.textContent?.includes("Copy"));
      assert(copyOption);

      const iconEl = copyOption.querySelector(".bx--menu-option__icon");
      expect(iconEl).toBeInTheDocument();
    });

    it("should not render icon container when no icon is provided", () => {
      render(ContextMenuOptionIcon, {
        props: { open: true, x: 100, y: 100 },
      });

      const options = screen.getAllByRole("menuitem");
      const plainOption = options.find((o) => o.textContent?.includes("Plain"));
      assert(plainOption);

      const iconEl = plainOption.querySelector(".bx--menu-option__icon");
      expect(iconEl).not.toBeInTheDocument();
    });
  });

  describe("ContextMenuOption danger variant", () => {
    it("should apply danger class when kind is danger", () => {
      render(ContextMenuOptionIcon, {
        props: { open: true, x: 100, y: 100 },
      });

      const options = screen.getAllByRole("menuitem");
      const deleteOption = options.find((o) =>
        o.textContent?.includes("Delete"),
      );
      assert(deleteOption);

      expect(deleteOption).toHaveClass("bx--menu-option--danger");
    });

    it("should render icon in danger option", () => {
      render(ContextMenuOptionIcon, {
        props: { open: true, x: 100, y: 100 },
      });

      const options = screen.getAllByRole("menuitem");
      const deleteOption = options.find((o) =>
        o.textContent?.includes("Delete"),
      );
      assert(deleteOption);

      const iconEl = deleteOption.querySelector(".bx--menu-option__icon");
      expect(iconEl).toBeInTheDocument();
    });

    it("should not apply danger class to non-danger options", () => {
      render(ContextMenuOptionIcon, {
        props: { open: true, x: 100, y: 100 },
      });

      const options = screen.getAllByRole("menuitem");
      const copyOption = options.find((o) => o.textContent?.includes("Copy"));
      assert(copyOption);

      expect(copyOption).not.toHaveClass("bx--menu-option--danger");
    });
  });

  describe("ContextMenuOption disabled", () => {
    it("should apply disabled class only when disabled is true", () => {
      render(ContextMenu, {
        props: { open: true, x: 100, y: 100, withDisabled: true },
      });

      const options = screen.getAllByRole("menuitem");
      const enabledOption = options.find((o) =>
        o.textContent?.includes("Option 1"),
      );
      const disabledOption = options.find((o) =>
        o.textContent?.includes("Disabled option"),
      );
      assert(enabledOption);
      assert(disabledOption);

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

  describe("ContextMenuOption submenu safe triangle", () => {
    it("does not close the submenu when the pointer moves into it before the close delay elapses", async () => {
      vi.useFakeTimers();
      try {
        render(ContextMenu, {
          props: { open: true, withSubmenu: true, x: 100, y: 100 },
        });

        const parent = screen.getByText("Option with submenu").closest("li");
        assert(parent);
        await fireEvent.mouseEnter(parent);
        await vi.advanceTimersByTimeAsync(HOVER_DELAY_MS);
        expect(
          screen.getByText("Submenu option 1"),
        ).toBeInTheDocument();

        await fireEvent.mouseLeave(parent);
        const submenu = screen
          .getAllByRole("menu")
          .find((menu) => menu.getAttribute("data-level") === "2");
        assert(submenu);
        await fireEvent.mouseEnter(submenu);
        await vi.advanceTimersByTimeAsync(HOVER_DELAY_MS);

        expect(
          screen.getByText("Submenu option 1"),
        ).toBeInTheDocument();
      } finally {
        vi.useRealTimers();
      }
    });

    it("does not close the submenu when the pointer crosses through the safe triangle", async () => {
      vi.useFakeTimers();
      try {
        render(ContextMenu, {
          props: { open: true, withSubmenu: true, x: 100, y: 100 },
        });

        const parent = screen.getByText("Option with submenu").closest("li");
        assert(parent);
        await fireEvent.mouseEnter(parent);
        await vi.advanceTimersByTimeAsync(HOVER_DELAY_MS);

        const submenu = screen
          .getAllByRole("menu")
          .find((menu) => menu.getAttribute("data-level") === "2");
        assert(submenu);
        parent.getBoundingClientRect = () =>
          ({ top: 100, left: 0, right: 100, bottom: 120, height: 20 }) as DOMRect;
        submenu.getBoundingClientRect = () =>
          ({ top: 100, left: 100, right: 300, bottom: 300, height: 200 }) as DOMRect;

        await fireEvent.mouseLeave(parent);
        // Inside the wedge between the trigger and the submenu's vertical center.
        await fireEvent.mouseMove(parent, { clientX: 110, clientY: 200 });
        await vi.advanceTimersByTimeAsync(HOVER_DELAY_MS);

        expect(
          screen.getByText("Submenu option 1"),
        ).toBeInTheDocument();
        expect(submenu).toHaveClass("bx--menu--open");
      } finally {
        vi.useRealTimers();
      }
    });

    it("closes the submenu when the pointer moves away from the safe triangle", async () => {
      vi.useFakeTimers();
      try {
        render(ContextMenu, {
          props: { open: true, withSubmenu: true, x: 100, y: 100 },
        });

        const parent = screen.getByText("Option with submenu").closest("li");
        assert(parent);
        await fireEvent.mouseEnter(parent);
        await vi.advanceTimersByTimeAsync(HOVER_DELAY_MS);

        const submenu = screen
          .getAllByRole("menu")
          .find((menu) => menu.getAttribute("data-level") === "2");
        assert(submenu);
        parent.getBoundingClientRect = () =>
          ({ top: 100, left: 0, right: 100, bottom: 120, height: 20 }) as DOMRect;
        submenu.getBoundingClientRect = () =>
          ({ top: 100, left: 100, right: 300, bottom: 300, height: 200 }) as DOMRect;

        await fireEvent.mouseLeave(parent);
        // Far outside the wedge.
        await fireEvent.mouseMove(parent, { clientX: 105, clientY: 400 });
        await vi.advanceTimersByTimeAsync(HOVER_DELAY_MS);

        // The submenu unmounts (rather than just losing a CSS class) once
        // ContextMenuOption's own `submenuOpen` flips to false.
        expect(submenu).not.toBeInTheDocument();
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
