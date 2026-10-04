import {
  fireEvent,
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/svelte";
import type HeaderActionComponent from "carbon-components-svelte/UIShell/HeaderAction.svelte";
import type { ComponentProps } from "svelte";
import { flushDismiss } from "../utils/flush-dismiss";
import { user } from "../utils/user";
import HeaderActionOutsideClick from "./HeaderAction.outsideClick.test.svelte";
import HeaderActionSlot from "./HeaderAction.slot.test.svelte";
import HeaderActionTooltipGroup from "./HeaderActionTooltipGroup.test.svelte";

describe("HeaderAction", () => {
  it("supports custom textChildren slot", () => {
    render(HeaderActionSlot);

    const customText = screen.getByText("Custom text content");
    expect(customText).toBeInTheDocument();
  });

  it("supports custom icon slot", () => {
    render(HeaderActionSlot);

    const customIcon = screen.getByTestId("custom-icon");
    expect(customIcon).toBeInTheDocument();
  });

  describe("outside click", () => {
    const getActionButton = () =>
      screen.getByRole("button", { name: "Switcher" });

    it("closes when clicking outside", async () => {
      render(HeaderActionOutsideClick);

      await user.click(getActionButton());
      expect(getActionButton()).toHaveClass("bx--header__action--active");

      await user.click(document.body);
      expect(getActionButton()).not.toHaveClass("bx--header__action--active");
    });

    it("stays open when clicking panel content", async () => {
      render(HeaderActionOutsideClick);

      await user.click(getActionButton());
      await user.click(screen.getByTestId("panel-content"));
      expect(screen.getByTestId("panel-content")).toBeInTheDocument();
    });

    it("respects preventCloseOnClickOutside", async () => {
      render(HeaderActionOutsideClick, {
        props: { preventCloseOnClickOutside: true },
      });

      await user.click(getActionButton());
      await user.click(document.body);
      expect(screen.getByTestId("panel-content")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    const getActionButton = () =>
      screen.getByRole("button", { name: "Switcher" });

    it("is a disclosure that controls its panel, not a menu button", async () => {
      render(HeaderActionOutsideClick);

      const button = getActionButton();
      expect(button).not.toHaveAttribute("aria-haspopup");
      expect(button).toHaveAttribute("aria-expanded", "false");
      expect(button).not.toHaveAttribute("aria-controls");

      await user.click(button);
      expect(button).toHaveAttribute("aria-expanded", "true");
      const panel = screen.getByRole("region", { name: "Switcher" });
      expect(button).toHaveAttribute("aria-controls", panel.id);
    });

    it("closes the panel and refocuses the trigger on Escape", async () => {
      render(HeaderActionOutsideClick);

      const button = getActionButton();
      await user.click(button);
      expect(screen.getByTestId("panel-content")).toBeInTheDocument();

      await flushDismiss();

      await user.keyboard("{Escape}");

      const panel = screen.queryByTestId("panel-content");
      if (panel) {
        // The panel's outro is a real (if duration: 0) transition driven by
        // Svelte's rAF-based transition loop. Under CI's parallel worker
        // load, jsdom's setTimeout-based rAF polyfill can lag well past the
        // default 1s timeout even though nothing is actually stuck.
        await waitForElementToBeRemoved(panel, { timeout: 5000 });
      }
      expect(button).toHaveFocus();
    });
  });

  describe("tooltip group", () => {
    it("hides a focused action's tooltip while another action is hovered", async () => {
      render(HeaderActionTooltipGroup);

      const notifications = screen.getByRole("button", {
        name: "Notifications",
      });
      const help = screen.getByRole("button", { name: "Help" });
      const settings = screen.getByRole("button", { name: "Settings" });

      await fireEvent.focus(notifications);
      expect(notifications).not.toHaveClass("bx--tooltip--hidden");
      expect(help).toHaveClass("bx--tooltip--hidden");
      expect(settings).toHaveClass("bx--tooltip--hidden");

      await fireEvent.mouseEnter(help);
      expect(notifications).toHaveClass("bx--tooltip--hidden");
      expect(help).not.toHaveClass("bx--tooltip--hidden");

      await fireEvent.mouseEnter(settings);
      expect(help).toHaveClass("bx--tooltip--hidden");
      expect(settings).not.toHaveClass("bx--tooltip--hidden");

      await fireEvent.mouseLeave(settings);
      await fireEvent.mouseLeave(help);
      expect(notifications).not.toHaveClass("bx--tooltip--hidden");
    });
  });

  describe("Generics", () => {
    it("should support custom Icon types with generics", () => {
      type CustomIcon = new (...args: unknown[]) => unknown;

      type ComponentType = HeaderActionComponent<CustomIcon>;
      type Props = ComponentProps<ComponentType>;

      expectTypeOf<Props["icon"]>().toEqualTypeOf<CustomIcon | undefined>();
      expectTypeOf<Props["closeIcon"]>().toEqualTypeOf<
        CustomIcon | undefined
      >();
    });

    it("should default to any type when generic is not specified", () => {
      type ComponentType = HeaderActionComponent;
      type Props = ComponentProps<ComponentType>;

      // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
      expectTypeOf<Props["icon"]>().toEqualTypeOf<any>();
      // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
      expectTypeOf<Props["closeIcon"]>().toEqualTypeOf<any>();
    });
  });
});
