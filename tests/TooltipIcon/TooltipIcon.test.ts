import { fireEvent, render, screen } from "@testing-library/svelte";
import type { TooltipIcon as TooltipIconSource } from "carbon-components-svelte";
import type TooltipIconComponent from "carbon-components-svelte/TooltipIcon/TooltipIcon.svelte";
import type { ComponentProps } from "svelte";
import { user } from "../setup-tests";
import TooltipIconSize from "./TooltipIcon.size.test.svelte";
import TooltipIcon from "./TooltipIcon.test.svelte";
import TooltipIconMultiple from "./TooltipIconMultiple.test.svelte";
import TooltipIconPortal from "./TooltipIconPortal.test.svelte";
import TooltipIconReactive from "./TooltipIconReactive.test.svelte";

type Props = ComponentProps<TooltipIconSource>;

describe("TooltipIcon", () => {
  let consoleLog: Console["log"];

  beforeEach(() => {
    consoleLog = vi.spyOn(console, "log");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not fire open/close event on initial render", () => {
    render(TooltipIcon);

    expect(consoleLog).not.toHaveBeenCalledWith("open");
    expect(consoleLog).not.toHaveBeenCalledWith("close");
  });

  it("does not fire open/close event on initial render when open is true", () => {
    render(TooltipIcon, { props: { open: true } });

    expect(consoleLog).not.toHaveBeenCalledWith("open");
    expect(consoleLog).not.toHaveBeenCalledWith("close");
  });

  it("should render with default props", () => {
    render(TooltipIcon);

    expect(screen.getByText("Test tooltip text")).toBeInTheDocument();
  });

  it("should show and hide the tooltip", async () => {
    render(TooltipIcon);

    const trigger = screen.getByRole("button");
    await user.hover(trigger);

    expect(trigger).not.toHaveClass("bx--tooltip--hidden");

    await user.keyboard("{Escape}");
    expect(screen.getByRole("button")).toHaveClass("bx--tooltip--hidden");
  });

  it("should show tooltip on focus", async () => {
    render(TooltipIcon);

    const trigger = screen.getByRole("button");
    await user.tab();

    expect(trigger).not.toHaveClass("bx--tooltip--hidden");
  });

  it("should hide tooltip on blur", async () => {
    render(TooltipIcon);

    await user.tab();
    const trigger = screen.getByRole("button");
    expect(trigger).not.toHaveClass("bx--tooltip--hidden");

    await user.tab();
    expect(trigger).toHaveClass("bx--tooltip--hidden");
  });

  it("should stay open on mouseleave after click", async () => {
    render(TooltipIcon);

    const trigger = screen.getByRole("button");
    await user.click(trigger);

    expect(trigger).not.toHaveClass("bx--tooltip--hidden");

    await user.unhover(trigger);
    expect(trigger).not.toHaveClass("bx--tooltip--hidden");
  });

  it("should close on second click", async () => {
    render(TooltipIcon);

    const trigger = screen.getByRole("button");
    await user.click(trigger);
    await user.click(trigger);

    expect(trigger).toHaveClass("bx--tooltip--hidden");
  });

  it("should close on Escape after click", async () => {
    render(TooltipIcon);

    const trigger = screen.getByRole("button");
    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(trigger).toHaveClass("bx--tooltip--hidden");
  });

  it("should hide tooltip on Escape key", async () => {
    render(TooltipIcon);

    const trigger = screen.getByRole("button");
    await user.hover(trigger);
    await user.keyboard("{Escape}");

    expect(trigger).toHaveClass("bx--tooltip--hidden");
  });

  it("should support controlled open state", () => {
    render(TooltipIcon, {
      props: { open: true },
    });

    const trigger = screen.getByRole("button");
    expect(trigger).not.toHaveClass("bx--tooltip--hidden");
  });

  it("should dispatch open event on hover", async () => {
    render(TooltipIcon);

    const trigger = screen.getByRole("button");
    await user.hover(trigger);

    expect(consoleLog).toHaveBeenCalledWith("open");
  });

  it("should dispatch close event on Escape", async () => {
    render(TooltipIcon);

    const trigger = screen.getByRole("button");
    await user.hover(trigger);
    await user.keyboard("{Escape}");

    expect(consoleLog).toHaveBeenCalledWith("close");
  });

  it("should dispatch close event on mouse leave", async () => {
    render(TooltipIcon);

    const trigger = screen.getByRole("button");
    await user.hover(trigger);
    await user.unhover(trigger);

    expect(consoleLog).toHaveBeenCalledWith("close");
  });

  it("should dispatch open event on focus", async () => {
    render(TooltipIcon);

    await user.tab();

    expect(consoleLog).toHaveBeenCalledWith("open");
  });

  describe("reactive (bind:open)", () => {
    it("should be visible when initially open", () => {
      render(TooltipIconReactive);

      const trigger = screen.getByRole("button", { name: /test tooltip/i });
      expect(trigger).toHaveClass("bx--tooltip--visible");
      expect(trigger).not.toHaveClass("bx--tooltip--hidden");
    });

    it("should hide when toggled off via external button", async () => {
      render(TooltipIconReactive);

      const trigger = screen.getByRole("button", { name: /test tooltip/i });
      expect(trigger).toHaveClass("bx--tooltip--visible");

      const toggle = screen.getByTestId("toggle");
      await user.click(toggle);

      expect(trigger).not.toHaveClass("bx--tooltip--visible");
      expect(trigger).toHaveClass("bx--tooltip--hidden");
    });

    it("should show again when toggled back on", async () => {
      render(TooltipIconReactive);

      const trigger = screen.getByRole("button", { name: /test tooltip/i });
      const toggle = screen.getByTestId("toggle");

      await user.click(toggle); // close
      await user.click(toggle); // re-open

      expect(trigger).toHaveClass("bx--tooltip--visible");
      expect(trigger).not.toHaveClass("bx--tooltip--hidden");
    });
  });

  describe("tooltip positioning", () => {
    test.each([
      ["top", "bx--tooltip--top"],
      ["right", "bx--tooltip--right"],
      ["bottom", "bx--tooltip--bottom"],
      ["left", "bx--tooltip--left"],
    ] as const)("should support %s direction", (direction, expectedClass) => {
      render(TooltipIcon, {
        props: { direction },
      });

      const trigger = screen.getByRole("button");
      expect(trigger).toHaveClass(expectedClass);
    });

    test.each([
      ["start", "bx--tooltip--align-start"],
      ["center", "bx--tooltip--align-center"],
      ["end", "bx--tooltip--align-end"],
    ] as const)("should support %s alignment", (align, expectedClass) => {
      render(TooltipIcon, {
        props: { align },
      });

      const trigger = screen.getByRole("button");
      expect(trigger).toHaveClass(expectedClass);
    });
  });

  it("should support disabled state", () => {
    render(TooltipIcon, {
      props: { disabled: true },
    });

    const trigger = screen.getByRole("button");
    expect(trigger).toBeDisabled();
    expect(trigger).toHaveStyle({ cursor: "not-allowed" });
    expect(trigger).toHaveClass("bx--tooltip--hidden");
  });

  it("should not show tooltip when disabled", async () => {
    render(TooltipIcon, {
      props: { disabled: true },
    });

    const trigger = screen.getByRole("button");
    await user.hover(trigger);

    expect(trigger).toHaveClass("bx--tooltip--hidden");
  });

  it("should support custom tooltip text", () => {
    render(TooltipIcon, {
      props: { tooltipText: "Custom tooltip" },
    });

    expect(screen.getByText("Custom tooltip")).toBeInTheDocument();
  });

  it("should use provided id for tooltip", () => {
    render(TooltipIcon, {
      props: { id: "custom-id" },
    });

    const tooltip = screen.getByRole("button");
    expect(tooltip).toHaveAttribute("aria-describedby", "custom-id");
  });

  it("should have correct ARIA attributes", () => {
    render(TooltipIcon);

    const trigger = screen.getByRole("button");
    const tooltip = screen.getByText("Test tooltip text");

    expect(trigger).toHaveAttribute("aria-describedby", "test-tooltip");
    expect(tooltip).toHaveClass("bx--assistive-text");
  });

  describe("size", () => {
    it("should render with default size (16)", () => {
      render(TooltipIconSize);

      const icon = screen.getByTestId("mock-icon");
      expect(icon).toHaveAttribute("width", "16");
      expect(icon).toHaveAttribute("height", "16");
    });

    test.each([
      [16, "16"],
      [20, "20"],
      [24, "24"],
      [32, "32"],
    ] as const)("should pass size %i to icon", (size, expected) => {
      render(TooltipIconSize, {
        props: { size },
      });

      const icon = screen.getByTestId("mock-icon");
      expect(icon).toHaveAttribute("width", expected);
      expect(icon).toHaveAttribute("height", expected);
    });

    it("should type size prop: 16/20/24/32 and any number are valid", () => {
      expectTypeOf<16>().toExtend<Props["size"]>();
      expectTypeOf<20>().toExtend<Props["size"]>();
      expectTypeOf<24>().toExtend<Props["size"]>();
      expectTypeOf<32>().toExtend<Props["size"]>();
      expectTypeOf<number>().toExtend<NonNullable<Props["size"]>>();
    });
  });

  describe("adjacent tooltip icons", () => {
    it("should only show one tooltip at a time when hovering between icons", async () => {
      render(TooltipIconMultiple);

      const btnA = screen.getByTestId("tooltip-a");
      const btnB = screen.getByTestId("tooltip-b");
      const btnC = screen.getByTestId("tooltip-c");

      // Initially all tooltips are hidden (open defaults to false).
      expect(btnA).toHaveClass("bx--tooltip--hidden");
      expect(btnB).toHaveClass("bx--tooltip--hidden");
      expect(btnC).toHaveClass("bx--tooltip--hidden");

      // Hover tooltip A: only A should be visible.
      await fireEvent.mouseEnter(btnA);
      expect(btnA).not.toHaveClass("bx--tooltip--hidden");
      expect(btnB).toHaveClass("bx--tooltip--hidden");
      expect(btnC).toHaveClass("bx--tooltip--hidden");

      // Hover tooltip B: only B should be visible.
      await fireEvent.mouseEnter(btnB);
      expect(btnA).toHaveClass("bx--tooltip--hidden");
      expect(btnB).not.toHaveClass("bx--tooltip--hidden");
      expect(btnC).toHaveClass("bx--tooltip--hidden");
    });

    it("should clear tooltip hidden state on mouseleave", async () => {
      render(TooltipIconMultiple);

      const btnA = screen.getByTestId("tooltip-a");
      const btnB = screen.getByTestId("tooltip-b");

      await fireEvent.mouseEnter(btnA);
      expect(btnA).not.toHaveClass("bx--tooltip--hidden");
      expect(btnB).toHaveClass("bx--tooltip--hidden");

      await fireEvent.mouseLeave(btnA);
      // After mouseleave, both are hidden (no tooltip is open).
      expect(btnA).toHaveClass("bx--tooltip--hidden");
      expect(btnB).toHaveClass("bx--tooltip--hidden");
    });

    it("should skip enterDelayMs when moving from one tooltip to another (warm handoff)", async () => {
      vi.useFakeTimers();

      render(TooltipIconMultiple, {
        props: { enterDelayMs: 200, leaveDelayMs: 0 },
      });

      const btnA = screen.getByTestId("tooltip-a");
      const btnB = screen.getByTestId("tooltip-b");

      // First tooltip requires the full delay.
      await fireEvent.mouseEnter(btnA);
      expect(btnA).toHaveClass("bx--tooltip--hidden");

      await vi.advanceTimersByTimeAsync(200);
      expect(btnA).not.toHaveClass("bx--tooltip--hidden");

      // Moving to B should show instantly (warm handoff, no delay).
      await fireEvent.mouseEnter(btnB);
      expect(btnB).not.toHaveClass("bx--tooltip--hidden");

      vi.useRealTimers();
    });
  });

  describe("portal tooltip", () => {
    it("should render tooltip content in a portal when hovered", async () => {
      render(TooltipIconPortal);

      const buttons = screen.getAllByRole("button");
      // TooltipIconPortal order: top, right, bottom, left
      await user.hover(buttons[2]);

      expect(screen.getByText("Portal tooltip bottom")).toBeInTheDocument();
    });

    it("should not render assistive text span when using portal", () => {
      render(TooltipIcon, {
        props: { portalTooltip: true },
      });

      const button = screen.getByRole("button");
      const assistiveText = button.querySelector(".bx--assistive-text");
      expect(assistiveText).not.toBeInTheDocument();
    });

    it("should not apply CSS tooltip classes when using portal", () => {
      render(TooltipIcon, {
        props: { portalTooltip: true, direction: "top" },
      });

      const button = screen.getByRole("button");
      expect(button).not.toHaveClass("bx--tooltip--a11y");
      expect(button).not.toHaveClass("bx--tooltip--top");
    });

    it("should add portal-active class on trigger when using portal", () => {
      render(TooltipIcon, {
        props: { portalTooltip: true },
      });

      expect(screen.getByRole("button")).toHaveClass(
        "bx--tooltip--portal-active",
      );
    });
  });

  describe("enterDelayMs / leaveDelayMs", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should delay showing tooltip on mouseenter by enterDelayMs", async () => {
      render(TooltipIcon, {
        props: { enterDelayMs: 200, leaveDelayMs: 0 },
      });

      const trigger = screen.getByRole("button");
      await fireEvent.mouseEnter(trigger);

      expect(trigger).toHaveClass("bx--tooltip--hidden");

      await vi.advanceTimersByTimeAsync(200);

      expect(trigger).not.toHaveClass("bx--tooltip--hidden");
    });

    it("should delay hiding tooltip on mouseleave by leaveDelayMs", async () => {
      render(TooltipIcon, {
        props: { enterDelayMs: 0, leaveDelayMs: 200 },
      });

      const trigger = screen.getByRole("button");
      await fireEvent.mouseEnter(trigger);

      expect(trigger).not.toHaveClass("bx--tooltip--hidden");

      await fireEvent.mouseLeave(trigger);

      expect(trigger).not.toHaveClass("bx--tooltip--hidden");

      await vi.advanceTimersByTimeAsync(200);

      expect(trigger).toHaveClass("bx--tooltip--hidden");
    });
  });

  describe("Generics", () => {
    it("should support custom Icon types with generics", () => {
      type CustomIcon = new (...args: unknown[]) => unknown;

      type ComponentType = TooltipIconComponent<CustomIcon>;
      type GenericProps = ComponentProps<ComponentType>;

      expectTypeOf<GenericProps["icon"]>().toEqualTypeOf<
        CustomIcon | undefined
      >();
    });

    it("should default to any type when generic is not specified", () => {
      type ComponentType = TooltipIconComponent;
      type GenericProps = ComponentProps<ComponentType>;

      // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
      expectTypeOf<GenericProps["icon"]>().toEqualTypeOf<any>();
    });
  });
});
