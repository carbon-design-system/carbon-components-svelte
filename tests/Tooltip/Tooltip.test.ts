import { fireEvent, render, screen } from "@testing-library/svelte";
import type TooltipComponent from "carbon-components-svelte/Tooltip/Tooltip.svelte";
import Tooltip from "carbon-components-svelte/Tooltip/Tooltip.svelte";
import type { ComponentProps } from "svelte";
import { tick } from "svelte";
import { rect } from "../utils/rect";
import TooltipCustomIcon from "./TooltipCustomIcon.test.svelte";
import TooltipDefault from "./TooltipDefault.test.svelte";
import TooltipEscape from "./TooltipEscape.test.svelte";
import TooltipFooterFocus from "./TooltipFooterFocus.test.svelte";
import TooltipFooterStandalone from "./TooltipFooterStandalone.test.svelte";
import TooltipGroup from "./TooltipGroup.test.svelte";
import TooltipHideIcon from "./TooltipHideIcon.test.svelte";
import TooltipHideIconFooter from "./TooltipHideIconFooter.test.svelte";
import TooltipNoLabel from "./TooltipNoLabel.test.svelte";
import TooltipOpen from "./TooltipOpen.test.svelte";
import TooltipPortalDirections from "./TooltipPortalDirections.test.svelte";
import TooltipTriggerSlot from "./TooltipTriggerSlot.test.svelte";
import TooltipTwoInstancesFocus from "./TooltipTwoInstancesFocus.test.svelte";

describe("Tooltip", () => {
  describe("in a TooltipGroup", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("opens instantly after a group Button and closes when the Button's tooltip opens", async () => {
      vi.useFakeTimers();
      render(TooltipGroup);

      const edit = screen.getByRole("button", { name: "Edit" });
      const trigger = screen.getByRole("button", { name: "Information" });

      await fireEvent.mouseEnter(edit);
      await vi.advanceTimersByTimeAsync(100);
      await fireEvent.mouseLeave(edit);
      await fireEvent.mouseEnter(trigger);
      expect(screen.getByRole("dialog")).toHaveTextContent("Details");

      await fireEvent.mouseEnter(edit);
      await vi.advanceTimersByTimeAsync(0);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("stays open when opened by keyboard and another tooltip opens", async () => {
      vi.useFakeTimers();
      render(TooltipGroup);

      const edit = screen.getByRole("button", { name: "Edit" });
      const trigger = screen.getByRole("button", { name: "Information" });

      await fireEvent.focus(trigger);
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      await fireEvent.mouseEnter(edit);
      await vi.advanceTimersByTimeAsync(100);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("should render with default props", () => {
    render(TooltipDefault);
    const trigger = screen.getByRole("button", { name: "Information" });
    expect(trigger).toBeInTheDocument();
    expect(trigger.closest(".bx--tooltip__label")).toBeInTheDocument();
    expect(trigger).toHaveClass("bx--tooltip__trigger");
  });

  it("should hide icon when hideIcon is true", async () => {
    render(TooltipHideIcon);

    const trigger = screen.getByRole("button");
    expect(trigger).not.toHaveClass("bx--tooltip__trigger");
    expect(screen.getByText("Tooltip trigger")).toBeInTheDocument();

    await fireEvent.mouseEnter(trigger);
    await vi.advanceTimersByTimeAsync(100);

    expect(
      screen.getByText("This tooltip has its icon hidden"),
    ).toBeInTheDocument();
  });

  it("should show tooltip when open is true", () => {
    render(TooltipOpen);

    const tooltip = screen.getByRole("dialog");
    expect(tooltip.closest(".bx--tooltip")).toBeInTheDocument();
    expect(tooltip.closest(".bx--tooltip")).toHaveClass("bx--tooltip--shown");
    expect(
      screen.getByText("This tooltip is initially open"),
    ).toBeInTheDocument();
  });

  it.each([
    ["with an icon", TooltipDefault, "Information"],
    ["without an icon", TooltipHideIcon, "Tooltip trigger"],
  ])(
    "should reference the tooltip with aria-describedby only while open %s",
    async (_, Component, name) => {
      render(Component);

      const trigger = screen.getByRole("button", { name });
      expect(trigger).not.toHaveAttribute("aria-describedby");

      await fireEvent.mouseEnter(trigger);
      await vi.advanceTimersByTimeAsync(100);

      const describedBy = trigger.getAttribute("aria-describedby");
      expect(describedBy).toBeTruthy();
      expect(document.getElementById(describedBy as string)).toBe(
        screen.getByRole("dialog").closest(".bx--tooltip"),
      );

      await fireEvent.keyDown(trigger, { key: "Escape" });

      expect(trigger).not.toHaveAttribute("aria-describedby");
    },
  );

  it("should open tooltip on focus", async () => {
    render(TooltipDefault);

    const trigger = screen.getByRole("button", { name: "Information" });

    await fireEvent.focus(trigger);
    const tooltip = screen.getByRole("dialog");
    expect(tooltip.closest(".bx--tooltip")).toBeInTheDocument();
    expect(tooltip.closest(".bx--tooltip")).toHaveClass("bx--tooltip--shown");
  });

  it("should close tooltip on Escape key", async () => {
    render(TooltipOpen);

    const tooltip = screen.getByRole("dialog");
    expect(tooltip.closest(".bx--tooltip")).toBeInTheDocument();

    await fireEvent.keyDown(tooltip, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("stops Escape only when it closes the tooltip", async () => {
    const onParentKeydown = vi.fn();
    render(TooltipEscape, { props: { onParentKeydown } });

    const trigger = screen.getByRole("button", { name: "Information" });
    await fireEvent.focus(trigger);
    await fireEvent.keyDown(trigger, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onParentKeydown).not.toHaveBeenCalled();

    // With nothing left to dismiss, Escape reaches ancestors (a Modal).
    await fireEvent.keyDown(trigger, { key: "Escape" });
    expect(onParentKeydown).toHaveBeenCalledTimes(1);
  });

  it("closes a hovered tooltip on Escape before ancestors see it when focus is elsewhere", async () => {
    const onParentKeydown = vi.fn();
    render(TooltipEscape, { props: { onParentKeydown } });

    await fireEvent.mouseEnter(
      screen.getByRole("button", { name: "Information" }),
    );
    await vi.advanceTimersByTimeAsync(100);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const other = screen.getByLabelText("Other control");
    other.focus();
    await fireEvent.keyDown(other, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onParentKeydown).not.toHaveBeenCalled();
  });

  it("should open tooltip on mouseenter", async () => {
    render(TooltipDefault);

    const trigger = screen.getByRole("button", { name: "Information" });

    await fireEvent.mouseEnter(trigger);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(100);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("should close tooltip on mouseleave", async () => {
    const { container } = render(TooltipOpen);

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const wrapper = container.firstElementChild;
    if (!(wrapper instanceof Element)) expect.fail("Expected element");
    await fireEvent.mouseLeave(wrapper);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await vi.advanceTimersByTimeAsync(300);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should cancel close when re-entering tooltip", async () => {
    render(TooltipDefault);

    const trigger = screen.getByRole("button", { name: "Information" });

    await fireEvent.mouseEnter(trigger);
    await vi.advanceTimersByTimeAsync(100);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const tooltipEl = screen.getByRole("dialog").closest(".bx--tooltip");
    if (!(tooltipEl instanceof Element)) expect.fail("Expected element");
    const wrapper = tooltipEl.parentElement;
    if (!(wrapper instanceof Element)) expect.fail("Expected element");
    await fireEvent.mouseLeave(wrapper);
    await vi.advanceTimersByTimeAsync(100);

    // Re-enter the tooltip content before leaveDelayMs expires.
    await fireEvent.mouseEnter(tooltipEl);

    // Wait past the original leave delay.
    await vi.advanceTimersByTimeAsync(300);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("should render custom icon via slot", async () => {
    render(TooltipCustomIcon);

    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
    expect(screen.getByText("🔍")).toBeInTheDocument();

    // mouseenter doesn't bubble, so fire on the trigger (parent of custom-icon).
    const trigger = screen.getByRole("button");
    await fireEvent.mouseEnter(trigger);
    await vi.advanceTimersByTimeAsync(100);
    expect(screen.getByText("Custom icon tooltip")).toBeInTheDocument();
  });

  it.each([
    ["direction", "top", "bx--tooltip--top"],
    ["direction", "right", "bx--tooltip--right"],
    ["direction", "bottom", "bx--tooltip--bottom"],
    ["direction", "left", "bx--tooltip--left"],
    ["align", "start", "bx--tooltip--align-start"],
    ["align", "center", "bx--tooltip--align-center"],
    ["align", "end", "bx--tooltip--align-end"],
  ] as const)(
    "applies %s=%s as %s on the tooltip",
    (prop, value, className) => {
      render(Tooltip, {
        props: { open: true, iconDescription: "Information", [prop]: value },
      });

      expect(screen.getByRole("dialog").closest(".bx--tooltip")).toHaveClass(
        className,
      );
    },
  );

  it("should apply correct direction classes when using portal tooltip", async () => {
    // jsdom lays everything out at 0,0, where no side has room and the portal
    // flips left to right. Center every box so each direction fits unflipped.
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue(
      rect({ left: 400, top: 300, width: 20, height: 20 }),
    );
    render(TooltipPortalDirections);
    await vi.advanceTimersByTimeAsync(0);

    const topTooltip = screen
      .getByText("Portal tooltip top")
      .closest(".bx--tooltip");
    const rightTooltip = screen
      .getByText("Portal tooltip right")
      .closest(".bx--tooltip");
    const bottomTooltip = screen
      .getByText("Portal tooltip bottom")
      .closest(".bx--tooltip");
    const leftTooltip = screen
      .getByText("Portal tooltip left")
      .closest(".bx--tooltip");

    expect(topTooltip).toHaveClass("bx--tooltip--top");
    expect(bottomTooltip).toHaveClass("bx--tooltip--bottom");
    expect(rightTooltip).toHaveClass("bx--tooltip--right");
    expect(leftTooltip).toHaveClass("bx--tooltip--left");
  });

  it("should not open tooltip on focus caused by mouse", async () => {
    render(TooltipDefault);

    const trigger = screen.getByRole("button", { name: "Information" });

    // Mouse down sets focusByMouse flag.
    await fireEvent.mouseDown(trigger);
    await fireEvent.focus(trigger);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("TooltipFooter should not throw when rendered outside a Tooltip", () => {
    expect(() => render(TooltipFooterStandalone)).not.toThrow();
  });

  it("should move focus into the footer when opened via keyboard", async () => {
    render(TooltipFooterFocus);

    const trigger = screen.getByRole("button", { name: "Resource list" });
    await fireEvent.focus(trigger);

    expect(screen.getByRole("link", { name: "Learn more" })).toHaveFocus();
  });

  it("returns focus to the trigger on Escape from the content with hideIcon", async () => {
    render(TooltipHideIconFooter);

    const trigger = screen.getByRole("button", { name: "Resource list" });
    await fireEvent.focus(trigger);
    const link = screen.getByRole("link", { name: "Learn more" });
    expect(link).toHaveFocus();

    await fireEvent.keyDown(link, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("should not move focus into the footer when opened via mouse hover", async () => {
    render(TooltipFooterFocus);

    const trigger = screen.getByRole("button", { name: "Resource list" });
    await fireEvent.mouseEnter(trigger);
    await vi.advanceTimersByTimeAsync(100);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Learn more" })).not.toHaveFocus();
  });

  it("should close when focus tabs out of its content into another tooltip's trigger", async () => {
    render(TooltipTwoInstancesFocus);

    const trigger1 = screen.getByRole("button", { name: "First" });
    await fireEvent.focus(trigger1);
    expect(
      screen.getByRole("link", { name: "Learn more" }),
    ).toBeInTheDocument();

    // Focus moves from the trigger into the link inside its own tooltip content.
    const link = screen.getByRole("link", { name: "Learn more" });
    await fireEvent.focusOut(trigger1, { relatedTarget: link });
    await fireEvent.focus(link);
    expect(
      screen.getByRole("link", { name: "Learn more" }),
    ).toBeInTheDocument();

    // Focus then leaves the content for the second tooltip's trigger.
    const trigger2 = screen.getByRole("button", { name: "Second" });
    await fireEvent.focusOut(link, { relatedTarget: trigger2 });

    expect(
      screen.queryByRole("link", { name: "Learn more" }),
    ).not.toBeInTheDocument();
  });

  it("should have a non-empty accessible name with no props set", () => {
    render(TooltipNoLabel);

    const trigger = screen.getByRole("button");
    expect(trigger.getAttribute("aria-label")).toBeTruthy();
  });

  it.each([
    ["inline", false],
    ["in a portal", true],
  ])(
    "should label the interactive dialog with its trigger %s",
    async (_, portalTooltip) => {
      render(TooltipOpen, { props: { portalTooltip } });
      await vi.advanceTimersByTimeAsync(0);

      const labelledby = screen
        .getByRole("dialog")
        .getAttribute("aria-labelledby");
      expect(labelledby).toBeTruthy();
      expect(document.getElementById(labelledby ?? "")).toBeInTheDocument();
    },
  );

  describe("trigger content slots", () => {
    it.each([
      ["triggerChildren", "New trigger"],
      ["triggerText", "Old trigger"],
    ] as const)("renders the %s slot beside the icon", (slots, text) => {
      render(TooltipTriggerSlot, { props: { slots } });

      expect(screen.getByText(text).parentElement).toHaveClass(
        "bx--tooltip__label",
      );
    });

    it.each([false, true])(
      "prefers the triggerChildren slot with hideIcon %s",
      (hideIcon) => {
        render(TooltipTriggerSlot, { props: { slots: "both", hideIcon } });

        expect(screen.getByText("New trigger")).toBeInTheDocument();
        expect(screen.queryByText("Old trigger")).toBeNull();
      },
    );
  });

  describe("portal content", () => {
    it("closes on Escape from the portalled content", async () => {
      render(TooltipOpen, { props: { portalTooltip: true } });
      await vi.advanceTimersByTimeAsync(0);

      await fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("closes when focus leaves the portalled content", async () => {
      render(TooltipOpen, { props: { portalTooltip: true } });
      await vi.advanceTimersByTimeAsync(0);

      await fireEvent.focusOut(screen.getByRole("dialog"), {
        relatedTarget: document.body,
      });

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("position offsets", () => {
    afterEach(() => {
      document.documentElement.removeAttribute("style");
    });

    // Distinct box sizes so each term of the offset math shows in the result.
    // The icon ends the label in LTR (left 28) and starts it in RTL (left 0).
    function mockSizes(iconLeft = 28) {
      const sizes = {
        "bx--tooltip__label": rect({ width: 40, height: 20 }),
        "bx--tooltip__trigger": rect({ left: iconLeft, width: 12, height: 10 }),
        "bx--tooltip": rect({ width: 100, height: 50 }),
      } as const;
      vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
        function (this: Element) {
          for (const [className, box] of Object.entries(sizes)) {
            if (this.classList.contains(className)) return box;
          }
          return rect();
        },
      );
    }

    it.each([
      ["bottom", false, "-16px", "5px"],
      ["right", false, "46px", "-28px"],
      ["left", false, "-80px", "-47px"],
      ["top", false, "-17px", "-75px"],
      // Without an icon, the icon box falls back to 16 x 16.
      ["bottom", true, "-30px", "8px"],
      ["left", true, "-107px", "-47px"],
      ["top", true, "-30px", "-77px"],
    ] as const)(
      "offsets a %s tooltip (hideIcon: %s) to left %s and margin-top %s",
      async (direction, hideIcon, left, marginTop) => {
        mockSizes();
        render(Tooltip, {
          props: { open: true, direction, hideIcon, iconDescription: "Info" },
        });
        await tick();
        await tick();

        const tooltip = screen
          .getByRole("dialog")
          .closest<HTMLElement>(".bx--tooltip");
        expect(tooltip?.style.left).toBe(left);
        expect(tooltip?.style.marginTop).toBe(marginTop);
      },
    );

    // Each LTR box mirrored around the label: the icon starts it in RTL.
    it.each([
      ["bottom", "-44px"],
      ["top", "-43px"],
      // `left` and `right` name physical sides, beside the icon.
      ["right", "18px"],
      ["left", "-108px"],
    ] as const)(
      "offsets a %s tooltip in RTL to left %s",
      async (direction, left) => {
        document.documentElement.style.direction = "rtl";
        mockSizes(0);
        render(Tooltip, {
          props: { open: true, direction, iconDescription: "Info" },
        });
        await tick();
        await tick();

        const tooltip = screen
          .getByRole("dialog")
          .closest<HTMLElement>(".bx--tooltip");
        expect(tooltip?.style.left).toBe(left);
      },
    );

    it.each([
      ["start", "bottom", "bx--tooltip--align-end"],
      ["end", "top", "bx--tooltip--align-start"],
      ["center", "bottom", "bx--tooltip--align-center"],
      // Beside the icon, `start` and `end` are on the block axis.
      ["start", "left", "bx--tooltip--align-start"],
    ] as const)(
      "aligns %s on a %s tooltip to the physical side in RTL",
      async (align, direction, className) => {
        document.documentElement.style.direction = "rtl";
        render(Tooltip, {
          props: { open: true, align, direction, iconDescription: "Info" },
        });
        await tick();

        const tooltip = screen
          .getByRole("dialog")
          .closest<HTMLElement>(".bx--tooltip");
        expect(tooltip).toHaveClass(className);
      },
    );
  });

  describe("reposition performance", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should not remeasure geometry on unrelated re-renders while open", async () => {
      const { rerender } = render(Tooltip, {
        open: true,
        iconDescription: "Information",
      });

      // Let the initial tick()-deferred position() run before observing.
      // `tick()` resolves via microtasks, which fake timers don't control.
      await tick();
      await tick();

      const spy = vi.spyOn(Element.prototype, "getBoundingClientRect");

      // Re-render with a prop that doesn't affect tooltip geometry.
      await rerender({ open: true, iconDescription: "Updated description" });
      await tick();
      await tick();

      expect(spy).not.toHaveBeenCalled();

      // A direction change still triggers a reposition.
      await rerender({
        open: true,
        direction: "top",
        iconDescription: "Updated description",
      });
      await tick();
      await tick();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe("Generics", () => {
    it("should support custom Icon types with generics", () => {
      type CustomIcon = new (...args: unknown[]) => unknown;

      type ComponentType = TooltipComponent<CustomIcon>;
      type Props = ComponentProps<ComponentType>;

      expectTypeOf<Props["icon"]>().toEqualTypeOf<CustomIcon | undefined>();
    });

    it("should default to any type when generic is not specified", () => {
      type ComponentType = TooltipComponent;
      type Props = ComponentProps<ComponentType>;

      // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
      expectTypeOf<Props["icon"]>().toEqualTypeOf<any>();
    });
  });
});
