import {
  fireEvent,
  render,
  screen,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/svelte";
import type HeaderActionComponent from "carbon-components-svelte/UIShell/HeaderAction.svelte";
import HeaderGlobalAction from "carbon-components-svelte/UIShell/HeaderGlobalAction.svelte";
import Add from "carbon-icons-svelte/lib/Add.svelte";
import Help from "carbon-icons-svelte/lib/Help.svelte";
import type { ComponentProps } from "svelte";
import { flushDismiss } from "../utils/flush-dismiss";
import { user } from "../utils/user";
import HeaderActionSlot from "./HeaderAction.slot.test.svelte";
import HeaderActionClose from "./HeaderActionClose.test.svelte";
import HeaderActionTooltipGroup from "./HeaderActionTooltipGroup.test.svelte";
import HeaderGlobalActionBadge from "./HeaderGlobalAction.badge.test.svelte";

describe("HeaderAction", () => {
  it("supports custom textChildren and icon slots", () => {
    render(HeaderActionSlot);

    expect(screen.getByText("Custom text content")).toBeInTheDocument();
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });

  it("renders the closeIcon while open", async () => {
    const { container: reference } = render(Help, { props: { size: 20 } });
    render(HeaderActionClose, { props: { customCloseIcon: true } });
    const button = screen.getByRole("button", { name: "Switcher" });

    await user.click(button);

    expect(button.querySelector("svg")?.innerHTML).toBe(
      reference.querySelector("svg")?.innerHTML,
    );
  });

  describe("accessibility", () => {
    const getActionButton = () =>
      screen.getByRole("button", { name: "Switcher" });

    it("closes the panel and refocuses the trigger on Escape", async () => {
      render(HeaderActionClose);

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

    it.each([
      { key: "Escape", isComposing: true },
      { key: "Escape", keyCode: 229 },
    ])(
      "keeps the panel open when Escape cancels an IME composition (%o)",
      async (init) => {
        const onClose = vi.fn();
        render(HeaderActionClose, { props: { withInput: true, onClose } });

        await user.click(getActionButton());
        await flushDismiss();

        const input = screen.getByRole("textbox", { name: "Filter" });
        input.focus();
        await fireEvent.keyDown(input, init);

        expect(screen.getByTestId("panel-content")).toBeInTheDocument();
        expect(onClose).not.toHaveBeenCalled();
      },
    );
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

      // The focused tooltip comes back once the hovered one's leave
      // delay ends.
      await fireEvent.mouseLeave(settings);
      await fireEvent.mouseLeave(help);
      await vi.waitFor(() => {
        expect(notifications).not.toHaveClass("bx--tooltip--hidden");
      });
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Testing default any type
      expectTypeOf<Props["icon"]>().toEqualTypeOf<any>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Testing default any type
      expectTypeOf<Props["closeIcon"]>().toEqualTypeOf<any>();
    });
  });
});

describe("HeaderAction close event", () => {
  const getActionButton = () =>
    screen.getByRole("button", { name: "Switcher" });

  it('dispatches close with trigger "toggle" when the button closes the panel', async () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();
    render(HeaderActionClose, { props: { onOpen, onClose } });

    await user.click(getActionButton());
    expect(getActionButton()).toHaveClass("bx--header__action--active");
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen.mock.calls[0][0].detail).toEqual({ trigger: "toggle" });

    await user.click(getActionButton());
    expect(getActionButton()).not.toHaveClass("bx--header__action--active");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({ trigger: "toggle" });
  });

  it('dispatches close with trigger "outside-click" when clicking outside', async () => {
    const onClose = vi.fn();
    render(HeaderActionClose, { props: { onClose } });

    await user.click(getActionButton());
    expect(getActionButton()).toHaveClass("bx--header__action--active");

    await user.click(screen.getByTestId("outside"));
    expect(getActionButton()).not.toHaveClass("bx--header__action--active");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({
      trigger: "outside-click",
    });
  });

  it("does not dispatch close on outside click when preventCloseOnClickOutside is set", async () => {
    const onClose = vi.fn();
    render(HeaderActionClose, {
      props: { onClose, preventCloseOnClickOutside: true },
    });

    await user.click(getActionButton());
    expect(getActionButton()).toHaveClass("bx--header__action--active");

    await user.click(screen.getByTestId("outside"));
    expect(getActionButton()).toHaveClass("bx--header__action--active");
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("HeaderGlobalAction", () => {
  it("forwards click from the button with and without a badge", async () => {
    const onClick = vi.fn();
    render(HeaderGlobalActionBadge, { props: { onClick } });

    await user.click(
      within(screen.getByTestId("no-badge")).getByRole("button"),
    );
    expect(onClick).toHaveBeenCalledTimes(1);

    await user.click(within(screen.getByTestId("dot")).getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("renders a dot badge when count is 0, and no badge when omitted", () => {
    render(HeaderGlobalActionBadge);
    const none = screen.getByTestId("no-badge");
    expect(
      none.querySelector(".bx--btn__badge-wrapper"),
    ).not.toBeInTheDocument();
    expect(none.querySelector(".bx--badge-indicator")).not.toBeInTheDocument();

    const container = screen.getByTestId("dot");
    const badge = container.querySelector(".bx--badge-indicator");
    const button = container.querySelector("button");

    expect(
      container.querySelector(".bx--btn__badge-wrapper"),
    ).toBeInTheDocument();
    expect(button).toHaveClass("bx--btn--lg");
    expect(badge).not.toHaveClass("bx--badge-indicator--count");
    expect(badge?.textContent?.trim()).toBe("");
  });

  it("should forward portalTooltip to the underlying Button", () => {
    render(HeaderGlobalAction, {
      props: {
        "data-testid": "header-global-action",
        icon: Add,
        iconDescription: "Tooltip text",
        portalTooltip: true,
      },
    });

    const button = screen.getByTestId("header-global-action");
    expect(button).toHaveClass("bx--header__action");
    expect(button).toHaveClass("bx--btn--icon-only");
    expect(button).not.toHaveClass("bx--tooltip__trigger");
    expect(button).not.toHaveClass("bx--tooltip--a11y");
  });
});
