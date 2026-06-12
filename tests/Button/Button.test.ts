import { fireEvent, render, screen } from "@testing-library/svelte";
import type ButtonComponent from "carbon-components-svelte/Button/Button.svelte";
import type { ComponentProps } from "svelte";
import { user } from "../utils/user";
import Button from "./Button.test.svelte";
import ButtonInModal from "./ButtonInModal.test.svelte";
import ButtonPortalAdjacent from "./ButtonPortalAdjacent.test.svelte";
import HeaderGlobalActionPortal from "./HeaderGlobalActionPortal.test.svelte";

describe("Button", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render with various kinds", () => {
    render(Button);

    const kinds = [
      "primary",
      "secondary",
      "tertiary",
      "ghost",
      "danger",
      "danger-tertiary",
      "danger-ghost",
    ];

    for (const kind of kinds) {
      const button = screen.getByText(kind);
      expect(button.closest("button")).toHaveClass(`bx--btn--${kind}`);
    }
  });

  it("should render with different sizes", () => {
    render(Button);

    const sizes = {
      field: "bx--btn--field",
      small: "bx--btn--sm",
    };

    for (const [size, className] of Object.entries(sizes)) {
      const buttons = screen.getAllByText(new RegExp(`${size}`, "i"));
      for (const button of buttons) {
        expect(button.closest("button")).toHaveClass(className);
      }
    }
  });

  it("should render icon-only button with tooltip", () => {
    render(Button);

    const iconButton = screen.getByText("Tooltip text").parentElement;
    assert(iconButton);
    expect(iconButton).toHaveClass("bx--btn--icon-only");
    expect(iconButton).toHaveClass("bx--tooltip__trigger");
    expect(iconButton).toHaveClass("bx--tooltip--a11y");
    expect(iconButton).toHaveClass("bx--btn--icon-only--bottom");
    expect(iconButton).toHaveClass("bx--tooltip--align-center");
  });

  it("should render as link when href is provided", () => {
    render(Button);

    const linkButton = screen.getByText("Link button");
    expect(linkButton.tagName).toBe("A");
    expect(linkButton).toHaveAttribute("href", "#");
  });

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
  });

  it("should handle click events", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Button);

    const button = screen.getByTestId("btn");
    await user.click(button);
    expect(consoleLog).toHaveBeenCalledWith("click");
    expect(consoleLog).toHaveBeenCalledTimes(1);
  });

  it("should render with icon", () => {
    render(Button);

    const buttonWithIcon = screen.getByRole("button", { name: "With icon" });
    const icon = buttonWithIcon.querySelector(".bx--btn__icon");
    expect(icon).toBeInTheDocument();
  });

  it("should not set aria-label on the icon (relies on assistive text)", () => {
    render(Button);

    const btnA = screen.getByTestId("btn-icon-a");
    const icon = btnA.querySelector(".bx--btn__icon");
    assert(icon);
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).not.toHaveAttribute("aria-label");
  });

  it("should set pointer-events to none on assistive text for icon-only buttons", () => {
    render(Button);

    const btnA = screen.getByTestId("btn-icon-a");
    const assistiveText = btnA.querySelector(".bx--assistive-text");
    assert(assistiveText instanceof HTMLElement);
    expect(assistiveText.style.pointerEvents).toBe("none");
  });

  it("should hide other icon-only button tooltips on mouseenter", async () => {
    render(Button);

    const btnA = screen.getByTestId("btn-icon-a");
    const btnB = screen.getByTestId("btn-icon-b");
    const btnC = screen.getByTestId("btn-icon-c");

    // Initially no button should have bx--tooltip--hidden.
    expect(btnA).not.toHaveClass("bx--tooltip--hidden");
    expect(btnB).not.toHaveClass("bx--tooltip--hidden");
    expect(btnC).not.toHaveClass("bx--tooltip--hidden");

    // Hover button A: others should get bx--tooltip--hidden.
    await fireEvent.mouseEnter(btnA);
    expect(btnA).not.toHaveClass("bx--tooltip--hidden");
    expect(btnB).toHaveClass("bx--tooltip--hidden");
    expect(btnC).toHaveClass("bx--tooltip--hidden");

    // Hover button B: A and C should get bx--tooltip--hidden.
    await fireEvent.mouseEnter(btnB);
    expect(btnA).toHaveClass("bx--tooltip--hidden");
    expect(btnB).not.toHaveClass("bx--tooltip--hidden");
    expect(btnC).toHaveClass("bx--tooltip--hidden");
  });

  it("should clear tooltip hidden state on mouseleave", async () => {
    render(Button);

    const btnA = screen.getByTestId("btn-icon-a");
    const btnB = screen.getByTestId("btn-icon-b");

    await fireEvent.mouseEnter(btnA);
    expect(btnB).toHaveClass("bx--tooltip--hidden");

    await fireEvent.mouseLeave(btnA);
    expect(btnA).not.toHaveClass("bx--tooltip--hidden");
    expect(btnB).not.toHaveClass("bx--tooltip--hidden");
  });

  it("should hide tooltip but keep accessibility when hideTooltip is true", () => {
    render(Button);

    const iconButton = screen.getByTestId("btn-icon-only-hide-tooltip");
    expect(iconButton).toHaveClass("bx--btn--icon-only");

    // Should NOT have tooltip classes.
    expect(iconButton).not.toHaveClass("bx--tooltip__trigger");
    expect(iconButton).not.toHaveClass("bx--tooltip--a11y");
    expect(iconButton).not.toHaveClass("bx--btn--icon-only--bottom");
    expect(iconButton).not.toHaveClass("bx--tooltip--align-center");

    // Should still have accessible text for screen readers.
    const assistiveText = iconButton.querySelector(".bx--assistive-text");
    assert(assistiveText);
    expect(assistiveText).toHaveTextContent("Add item");
  });

  describe("portalTooltip", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should not apply legacy CSS tooltip classes when portalTooltip is true", () => {
      render(Button);

      const button = screen.getByTestId("btn-icon-portal");
      expect(button).toHaveClass("bx--btn--icon-only");
      expect(button).not.toHaveClass("bx--tooltip__trigger");
      expect(button).not.toHaveClass("bx--tooltip--a11y");
      expect(button).not.toHaveClass("bx--btn--icon-only--top");
      expect(button).not.toHaveClass("bx--tooltip--align-center");
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
    it("should portal the tooltip by default when inside a Modal", () => {
      render(ButtonInModal, { props: { modalOpen: true } });

      const button = screen.getByTestId("btn-icon-modal");
      expect(button).toHaveClass("bx--btn--icon-only");
      // Portal mode suppresses the inline CSS tooltip classes.
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

    it("should not portal outside a Modal by default", () => {
      render(Button);

      // Default icon-only button (no portalTooltip, no Modal) stays inline.
      const button = screen.getByText("Tooltip text").parentElement;
      assert(button);
      expect(button).toHaveClass("bx--tooltip__trigger");
      expect(button).toHaveClass("bx--tooltip--a11y");
    });
  });

  describe("HeaderGlobalAction", () => {
    it("should forward portalTooltip to the underlying Button", () => {
      render(HeaderGlobalActionPortal);

      const button = screen.getByTestId("header-global-action");
      expect(button).toHaveClass("bx--header__action");
      expect(button).toHaveClass("bx--btn--icon-only");
      // portalTooltip reached the Button: inline CSS tooltip classes suppressed.
      expect(button).not.toHaveClass("bx--tooltip__trigger");
      expect(button).not.toHaveClass("bx--tooltip--a11y");
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
    const badge = container.querySelector(".bx--badge-indicator");
    const button = container.querySelector("button");

    expect(
      container.querySelector(".bx--btn__badge-wrapper"),
    ).toBeInTheDocument();
    expect(button).toHaveClass("bx--btn--lg");
    expect(badge).not.toHaveClass("bx--badge-indicator--count");
    expect(badge?.textContent?.trim()).toBe("");
  });

  it("renders a numbered badge when count is positive", () => {
    render(Button);
    const container = screen.getByTestId("badge-count");
    const badge = container.querySelector(".bx--badge-indicator");

    expect(
      container.querySelector(".bx--btn__badge-wrapper"),
    ).toBeInTheDocument();
    expect(badge).toHaveClass("bx--badge-indicator--count");
    expect(badge).toHaveTextContent("4");
  });

  it("renders a string count as a custom label", () => {
    render(Button);
    const container = screen.getByTestId("badge-label");
    const badge = container.querySelector(".bx--badge-indicator");

    expect(badge).toHaveClass("bx--badge-indicator--count");
    expect(badge).toHaveTextContent("1.2K");
  });

  it("uses lg size when the badge slot is used", () => {
    render(Button);
    const container = screen.getByTestId("badge-size-override");
    const button = container.querySelector("button");

    expect(button).toHaveClass("bx--btn--lg");
    expect(button).not.toHaveClass("bx--btn--sm");
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
