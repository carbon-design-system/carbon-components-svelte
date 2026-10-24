import { fireEvent, render, screen } from "@testing-library/svelte";
import type ButtonComponent from "carbon-components-svelte/Button/Button.svelte";
import { type ComponentProps, tick } from "svelte";
import { TOOLTIP_ICON_LEAVE_DELAY_MS } from "../../src/constants/timing.js";
import { user } from "../utils/user";
import Button from "./Button.test.svelte";
import ButtonInActionSetContext from "./ButtonInActionSetContext.test.svelte";
import ButtonInModal from "./ButtonInModal.test.svelte";
import ButtonLoading from "./ButtonLoading.test.svelte";
import ButtonPortalAdjacent from "./ButtonPortalAdjacent.test.svelte";
import ButtonSelected from "./ButtonSelected.test.svelte";
import { expectInlineTooltip } from "./helpers";

describe("Button", () => {
  it.each([
    "primary",
    "secondary",
    "tertiary",
    "ghost",
    "danger",
    "danger-tertiary",
    "danger-ghost",
  ])("should render the %s kind", (kind) => {
    render(Button);

    const button = screen.getByText(kind);
    expect(button.closest("button")).toHaveClass(`bx--btn--${kind}`);
  });

  it.each([
    ["field", "bx--btn--field"],
    ["small", "bx--btn--sm"],
  ])("should render the %s size", (size, className) => {
    render(Button);

    const buttons = screen.getAllByText(new RegExp(`${size}`, "i"));
    for (const button of buttons) {
      expect(button.closest("button")).toHaveClass(className);
    }
  });

  it("should render icon-only button with tooltip", () => {
    render(Button);

    const iconButton = screen.getByText("Tooltip text").parentElement;
    assert(iconButton);
    expect(iconButton).toHaveClass("bx--btn--icon-only");
    expectInlineTooltip(iconButton, true);
  });

  it("should render as link when href is provided", () => {
    render(Button);

    const linkButton = screen.getByText("Link button");
    expect(linkButton.tagName).toBe("A");
    expect(linkButton).toHaveAttribute("href", "#");
    expect(linkButton).not.toHaveAttribute("type");
  });

  it("should forward tabindex", () => {
    render(Button);

    expect(screen.getByTestId("btn-tabindex")).toHaveAttribute(
      "tabindex",
      "-1",
    );
  });

  it.each([
    ["ghost", true, "true", true],
    ["ghost", false, "false", false],
    ["primary", true, null, false],
  ] as const)(
    "reflects isSelected on a %s icon-only button (%s)",
    (kind, isSelected, pressed, selectedClass) => {
      render(ButtonSelected, { props: { kind, isSelected } });

      const button = screen.getByTestId("button");
      if (pressed === null) expect(button).not.toHaveAttribute("aria-pressed");
      else expect(button).toHaveAttribute("aria-pressed", pressed);
      if (selectedClass) expect(button).toHaveClass("bx--btn--selected");
      else expect(button).not.toHaveClass("bx--btn--selected");
    },
  );

  it('should set rel="noopener noreferrer" on link when target="_blank"', () => {
    render(Button);

    const externalLink = screen.getByText("External link");
    expect(externalLink.tagName).toBe("A");
    expect(externalLink).toHaveAttribute("target", "_blank");
    expect(externalLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("should render custom element when as prop is used", () => {
    render(Button);

    const customButton = screen.getByText("Custom element");
    expect(customButton.tagName).toBe("P");
    expect(customButton).toHaveClass("bx--btn");
  });

  it("should render disabled state", () => {
    render(Button);

    const disabledButton = screen.getByText("Disabled button");
    expect(disabledButton).toBeDisabled();
    expect(disabledButton).toHaveClass("bx--btn--disabled");
  });

  it("should strip href when disabled is also set", () => {
    render(Button);

    const button = screen.getByTestId("btn-disabled-href");
    expect(button.tagName).toBe("BUTTON");
    expect(button).toBeDisabled();
    expect(button).not.toHaveAttribute("href");
  });

  it("should render skeleton state", () => {
    render(Button);

    const skeletons = document.querySelectorAll(".bx--skeleton");
    expect(skeletons).toHaveLength(3);

    for (const skeleton of skeletons) {
      expect(skeleton).toHaveClass("bx--btn");
    }
    expect(skeletons[1]).toHaveClass("bx--btn--field");
    expect(skeletons[2]).toHaveClass("bx--btn--sm");
  });

  it("should keep a consumer style on a skeleton", () => {
    render(Button);

    expect(screen.getByTestId("btn-skeleton")).toHaveStyle({ width: "200px" });
  });

  it("should handle click events", async () => {
    const onClick = vi.fn();
    render(Button, { props: { onClick } });

    const button = screen.getByTestId("btn");
    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("should render with icon", () => {
    render(Button);

    const buttonWithIcon = screen.getByRole("button", { name: "With icon" });
    const icon = buttonWithIcon.querySelector(".bx--btn__icon");
    expect(icon).toBeInTheDocument();
  });

  it("should label an icon-only button through its assistive text, not the icon", () => {
    render(Button);

    const btnA = screen.getByTestId("btn-icon-a");
    const icon = btnA.querySelector(".bx--btn__icon");
    assert(icon);
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).not.toHaveAttribute("aria-label");

    const assistiveText = btnA.querySelector(".bx--assistive-text");
    expect(assistiveText).toHaveTextContent("Add");
  });

  // The pointer can rest on the inline tooltip, which may cover a
  // neighboring button. A click there must not press this one (#937).
  it("should not activate an icon-only button from a click on its tooltip", () => {
    render(Button);

    const btnA = screen.getByTestId("btn-icon-a");
    const onClick = vi.fn();
    btnA.addEventListener("click", onClick);
    const assistiveText = btnA.querySelector(".bx--assistive-text");
    assert(assistiveText);

    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    assistiveText.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(onClick).not.toHaveBeenCalled();

    btnA.click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("should hide other icon-only button tooltips on mouseenter", async () => {
    vi.useFakeTimers();
    render(Button);

    const btnA = screen.getByTestId("btn-icon-a");
    const btnB = screen.getByTestId("btn-icon-b");
    const btnC = screen.getByTestId("btn-icon-c");

    expect(btnA).not.toHaveClass("bx--tooltip--hidden");
    expect(btnB).not.toHaveClass("bx--tooltip--hidden");
    expect(btnC).not.toHaveClass("bx--tooltip--hidden");

    // The hovered tooltip waits out the enter delay.
    await fireEvent.mouseEnter(btnA);
    expect(btnA).toHaveClass("bx--tooltip--hidden");
    await vi.advanceTimersByTimeAsync(100);
    expect(btnA).not.toHaveClass("bx--tooltip--hidden");
    expect(btnB).toHaveClass("bx--tooltip--hidden");
    expect(btnC).toHaveClass("bx--tooltip--hidden");

    // Moving to a neighbor hands the tooltip over at once.
    await fireEvent.mouseEnter(btnB);
    await vi.advanceTimersByTimeAsync(0);
    expect(btnA).toHaveClass("bx--tooltip--hidden");
    expect(btnB).not.toHaveClass("bx--tooltip--hidden");
    expect(btnC).toHaveClass("bx--tooltip--hidden");
    vi.useRealTimers();
  });

  it("should show the icon-only tooltip at once on keyboard focus and release it on blur", async () => {
    render(Button);

    const btnA = screen.getByTestId("btn-icon-a");
    const btnB = screen.getByTestId("btn-icon-b");

    btnA.focus();
    await tick();
    expect(btnA).toHaveClass("bx--tooltip--instant");
    expect(btnB).toHaveClass("bx--tooltip--hidden");

    btnA.blur();
    await tick();
    expect(btnA).not.toHaveClass("bx--tooltip--instant");
    expect(btnB).not.toHaveClass("bx--tooltip--hidden");
  });

  it("should clear tooltip hidden state on mouseleave", async () => {
    vi.useFakeTimers();
    render(Button);

    const btnA = screen.getByTestId("btn-icon-a");
    const btnB = screen.getByTestId("btn-icon-b");

    await fireEvent.mouseEnter(btnA);
    await vi.advanceTimersByTimeAsync(100);
    expect(btnB).toHaveClass("bx--tooltip--hidden");

    // The tooltip waits the leave delay, so the pointer can move onto it.
    await fireEvent.mouseLeave(btnA);
    expect(btnA).toHaveClass("bx--tooltip--visible");
    expect(btnB).toHaveClass("bx--tooltip--hidden");

    await vi.advanceTimersByTimeAsync(TOOLTIP_ICON_LEAVE_DELAY_MS);
    expect(btnA).not.toHaveClass("bx--tooltip--visible");
    expect(btnA).not.toHaveClass("bx--tooltip--hidden");
    expect(btnB).not.toHaveClass("bx--tooltip--hidden");
    vi.useRealTimers();
  });

  it("should hide tooltip but keep accessibility when hideTooltip is true", () => {
    render(Button);

    const iconButton = screen.getByTestId("btn-icon-only-hide-tooltip");
    expect(iconButton).toHaveClass("bx--btn--icon-only");

    expectInlineTooltip(iconButton, false);

    const assistiveText = iconButton.querySelector(".bx--assistive-text");
    assert(assistiveText);
    expect(assistiveText).toHaveTextContent("Add item");
  });

  it("should render an icon-only button with no tooltip when iconDescription is omitted", () => {
    render(Button);

    const button = screen.getByTestId("btn-icon-no-description");
    expect(button).toHaveClass("bx--btn--icon-only");

    expectInlineTooltip(button, false);
    expect(button.querySelector(".bx--assistive-text")).not.toBeInTheDocument();

    expect(button).toHaveAttribute("aria-label", "Custom accessible name");
    expect(screen.getByRole("button", { name: "Custom accessible name" })).toBe(
      button,
    );
  });

  describe("portalTooltip", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should render portal tooltip on mouseenter and remove on mouseleave", async () => {
      render(Button);

      const button = screen.getByTestId("btn-icon-portal");

      expect(
        document.body.querySelector(".bx--tooltip-portal"),
      ).not.toBeInTheDocument();

      await fireEvent.mouseEnter(button);
      await vi.advanceTimersByTimeAsync(100);

      const portal = document.body.querySelector(".bx--tooltip-portal");
      expect(portal).toBeInTheDocument();
      expect(portal).toHaveAttribute("data-tooltip-type", "icon");
      expect(portal).toHaveTextContent("Portal tooltip text");

      await fireEvent.mouseLeave(button);
      await vi.advanceTimersByTimeAsync(300);

      expect(
        document.body.querySelector(".bx--tooltip-portal"),
      ).not.toBeInTheDocument();
    });

    it("should only show one portal tooltip at a time for adjacent buttons", async () => {
      render(ButtonPortalAdjacent);

      const btnA = screen.getByTestId("btn-portal-a");
      const btnB = screen.getByTestId("btn-portal-b");

      await fireEvent.mouseEnter(btnA);
      await vi.advanceTimersByTimeAsync(100);

      let portals = document.body.querySelectorAll(".bx--tooltip-portal");
      expect(portals).toHaveLength(1);
      expect(portals[0]).toHaveTextContent("Tooltip A");

      // Move to the adjacent button: A's tooltip must close as B's opens, so
      // the two never overlap. Warm handoff skips the enter delay.
      await fireEvent.mouseEnter(btnB);
      await vi.advanceTimersByTimeAsync(100);

      portals = document.body.querySelectorAll(".bx--tooltip-portal");
      expect(portals).toHaveLength(1);
      expect(portals[0]).toHaveTextContent("Tooltip B");
    });
  });

  describe("portalTooltip (modal auto-portal)", () => {
    it("should dismiss the portal tooltip when its Modal closes", async () => {
      vi.useFakeTimers();
      try {
        const { rerender } = render(ButtonInModal, {
          props: { modalOpen: true },
        });

        await fireEvent.mouseEnter(screen.getByTestId("btn-icon-modal"));
        await vi.advanceTimersByTimeAsync(100);
        expect(
          document.body.querySelector(".bx--tooltip-portal"),
        ).toBeInTheDocument();

        await rerender({ modalOpen: false });
        await vi.advanceTimersByTimeAsync(300);

        expect(
          document.body.querySelector(".bx--tooltip-portal"),
        ).not.toBeInTheDocument();
      } finally {
        vi.useRealTimers();
      }
    });

    it("should portal the tooltip by default when inside a Modal", () => {
      render(ButtonInModal, { props: { modalOpen: true } });

      const button = screen.getByTestId("btn-icon-modal");
      expect(button).toHaveClass("bx--btn--icon-only");
      expect(button).not.toHaveClass("bx--tooltip__trigger");
      expect(button).not.toHaveClass("bx--tooltip--a11y");
    });

    it("should not portal inside a Modal when portalTooltip is false", () => {
      render(ButtonInModal, {
        props: { modalOpen: true, portalTooltip: false },
      });

      const button = screen.getByTestId("btn-icon-modal");
      expect(button).toHaveClass("bx--tooltip__trigger");
      expect(button).toHaveClass("bx--tooltip--a11y");
    });
  });

  it("does not render a badge when count is omitted", () => {
    render(Button);
    const container = screen.getByTestId("badge-none");

    expect(
      container.querySelector(".bx--btn__badge-wrapper"),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector(".bx--badge-indicator"),
    ).not.toBeInTheDocument();
  });

  it("renders a dot badge when count is 0", () => {
    render(Button);
    const container = screen.getByTestId("badge-dot");
    const button = container.querySelector("button");

    expect(
      container.querySelector(".bx--btn__badge-wrapper"),
    ).toBeInTheDocument();
    expect(button).toHaveClass("bx--btn--lg");
  });

  it("uses lg size when the badge slot is used", () => {
    render(Button);
    const container = screen.getByTestId("badge-size-override");
    const button = container.querySelector("button");

    expect(button).toHaveClass("bx--btn--lg");
    expect(button).not.toHaveClass("bx--btn--sm");
  });

  it("falls back to the size from an ancestor `carbon:ActionSet` context", () => {
    render(ButtonInActionSetContext);

    expect(screen.getByRole("button")).toHaveClass("bx--btn--sm");
  });

  it("does not override a Button's own size with the ActionSet context", () => {
    render(ButtonInActionSetContext, { size: "lg" });

    const button = screen.getByRole("button");
    expect(button).toHaveClass("bx--btn--lg");
    expect(button).not.toHaveClass("bx--btn--sm");
  });

  describe("loading", () => {
    it("replaces the icon with a spinner, sets aria-busy and suppresses the assistive text on an icon-only button", () => {
      const { container } = render(ButtonLoading, { loading: true });

      const button = screen.getByTestId("btn-icon-only-loading");
      expect(button).toHaveAttribute("aria-busy", "true");
      expect(button.querySelector(".bx--btn__icon")).toBeNull();
      expect(button.querySelector(".bx--btn__loading")).not.toBeNull();
      expect(container.querySelector("title")).toHaveTextContent("Adding item");
      expect(button.querySelector(".bx--assistive-text")).toBeNull();
    });

    it("renders the spinner trailing the label on a labeled button", () => {
      render(ButtonLoading, { loading: true });

      const button = screen.getByTestId("btn-labeled-loading");
      expect(button).toHaveTextContent("Submit");
      expect(button.querySelector(".bx--btn__loading")).not.toBeNull();
    });

    it("marks the button aria-disabled but keeps it focusable while loading", () => {
      render(ButtonLoading, { loading: true });

      const button = screen.getByTestId("btn-labeled-loading");
      expect(button).not.toBeDisabled();
      expect(button).toHaveAttribute("aria-disabled", "true");
      expect(button).toHaveClass("bx--btn--disabled");

      button.focus();
      expect(button).toHaveFocus();
    });

    it("keeps href and cancels the default action while loading", () => {
      render(ButtonLoading, { loading: true });

      const button = screen.getByTestId("btn-href-loading");
      expect(button.tagName).toBe("A");
      expect(button).toHaveAttribute("href", "#");

      const clickEvent = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
      });
      button.dispatchEvent(clickEvent);
      expect(clickEvent.defaultPrevented).toBe(true);
    });

    it.each([
      [true, 0],
      [false, 1],
    ])("calls the click handler per loading=%s", async (loading, calls) => {
      const onClick = vi.fn();
      render(ButtonLoading, { loading, onClick });

      await user.click(screen.getByTestId("btn-click-guard"));
      expect(onClick).toHaveBeenCalledTimes(calls);
    });

    it("does not render a spinner when skeleton and loading are both set", () => {
      render(ButtonLoading, { loading: true });

      const button = screen.getByTestId("btn-skeleton-loading");
      expect(button).toHaveClass("bx--skeleton");
      expect(button.querySelector(".bx--btn__loading")).toBeNull();
    });

    it("toggles the spinner on and off when loading changes", async () => {
      const { rerender } = render(ButtonLoading, { loading: false });

      const button = screen.getByTestId("btn-labeled-loading");
      expect(button.querySelector(".bx--btn__loading")).toBeNull();

      await rerender({ loading: true });
      expect(button.querySelector(".bx--btn__loading")).not.toBeNull();

      await rerender({ loading: false });
      expect(button.querySelector(".bx--btn__loading")).toBeNull();
    });
  });

  describe("Generics", () => {
    it("should support custom Icon types with generics", () => {
      type CustomIcon = new (...args: unknown[]) => unknown;

      type ComponentType = ButtonComponent<CustomIcon>;
      type Props = ComponentProps<ComponentType>;

      expectTypeOf<Props["icon"]>().toEqualTypeOf<CustomIcon | undefined>();
    });

    it("should default to any type when generic is not specified", () => {
      type ComponentType = ButtonComponent;
      type Props = ComponentProps<ComponentType>;

      // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
      expectTypeOf<Props["icon"]>().toEqualTypeOf<any>();
    });
  });
});
