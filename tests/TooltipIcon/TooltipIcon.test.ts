import { fireEvent, render, screen } from "@testing-library/svelte";
import type TooltipIconComponent from "carbon-components-svelte/TooltipIcon/TooltipIcon.svelte";
import type { ComponentProps } from "svelte";
import { openTooltips } from "../utils/open-tooltips";
import { user } from "../utils/user";
import TooltipIconSize from "./TooltipIcon.size.test.svelte";
import TooltipIcon from "./TooltipIcon.test.svelte";
import TooltipIconGroup from "./TooltipIconGroup.test.svelte";
import TooltipIconMultiple from "./TooltipIconMultiple.test.svelte";
import TooltipIconPortal from "./TooltipIconPortal.test.svelte";
import TooltipIconPortalEscape from "./TooltipIconPortalEscape.test.svelte";
import TooltipIconReactive from "./TooltipIconReactive.test.svelte";
import TooltipIconTooltipSlot from "./TooltipIconTooltipSlot.test.svelte";

type Props = ComponentProps<TooltipIconComponent>;

describe("TooltipIcon", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it.each([{ open: false }, { open: true }])(
    "does not fire open/close event on initial render with open: $open",
    ({ open }) => {
      const onOpen = vi.fn();
      const onClose = vi.fn();
      render(TooltipIcon, { props: { open, onOpen, onClose } });

      expect(onOpen).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    },
  );

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

  it("should dispatch close event on Escape", async () => {
    const onClose = vi.fn();
    render(TooltipIcon, { props: { onClose } });

    const trigger = screen.getByRole("button");
    await user.hover(trigger);
    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalled();
  });

  it.each([
    { key: "Escape", isComposing: true },
    { key: "Escape", keyCode: 229 },
  ])(
    "stays open when Escape cancels an IME composition in another field (%o)",
    async (init) => {
      const onClose = vi.fn();
      render(TooltipIcon, { props: { onClose, withInput: true } });

      const trigger = screen.getByRole("button");
      await user.hover(trigger);
      expect(trigger).not.toHaveClass("bx--tooltip--hidden");

      const input = screen.getByRole("textbox", { name: "Unrelated" });
      input.focus();
      await fireEvent.keyDown(input, init);

      expect(trigger).not.toHaveClass("bx--tooltip--hidden");
      expect(onClose).not.toHaveBeenCalled();
    },
  );

  it("should dispatch open event on focus", async () => {
    const onOpen = vi.fn();
    render(TooltipIcon, { props: { onOpen } });

    await user.tab();

    expect(onOpen).toHaveBeenCalled();
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
    it.each([
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

    it.each([
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
    // `--hidden` is also forced by `disabled`, so the class alone cannot
    // tell whether hover tried to open the tooltip. The open event can.
    const onOpen = vi.fn();
    render(TooltipIcon, {
      props: { disabled: true, onOpen },
    });

    const trigger = screen.getByRole("button");
    await user.hover(trigger);

    expect(trigger).toHaveClass("bx--tooltip--hidden");
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("should have correct ARIA attributes", () => {
    render(TooltipIcon);

    const trigger = screen.getByRole("button");
    const tooltip = screen.getByText("Test tooltip text");

    expect(trigger).toHaveAttribute("aria-describedby", "test-tooltip");
    expect(tooltip).toHaveClass("bx--assistive-text");
    // The id must point at the rendered tooltip text.
    expect(
      document.getElementById(trigger.getAttribute("aria-describedby") ?? ""),
    ).toBe(tooltip);
  });

  describe("size", () => {
    it.each([
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
    });
  });

  describe("in a TooltipGroup", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("uses the group's enter delay and opens instantly after a group Button", async () => {
      vi.useFakeTimers();
      render(TooltipIconGroup);

      const edit = screen.getByRole("button", { name: "Edit" });
      const icon = screen.getByTestId("tooltip-icon");

      await fireEvent.mouseEnter(icon);
      await vi.advanceTimersByTimeAsync(199);
      expect(icon).toHaveClass("bx--tooltip--hidden");
      await vi.advanceTimersByTimeAsync(1);
      expect(icon).not.toHaveClass("bx--tooltip--hidden");

      await fireEvent.mouseLeave(icon);
      await vi.advanceTimersByTimeAsync(300);
      expect(icon).toHaveClass("bx--tooltip--hidden");

      await fireEvent.mouseEnter(edit);
      await vi.advanceTimersByTimeAsync(200);
      await fireEvent.mouseLeave(edit);
      await fireEvent.mouseEnter(icon);
      expect(icon).not.toHaveClass("bx--tooltip--hidden");
    });

    it("hides a portalled tooltip icon when a Button tooltip opens", async () => {
      vi.useFakeTimers();
      render(TooltipIconGroup, { props: { portalTooltip: true } });

      const edit = screen.getByRole("button", { name: "Edit" });
      const icon = screen.getByTestId("tooltip-icon");

      await fireEvent.focus(icon);
      expect(screen.getByText("Synced")).toBeInTheDocument();

      await fireEvent.mouseEnter(edit);
      await vi.advanceTimersByTimeAsync(0);
      expect(screen.queryByText("Synced")).not.toBeInTheDocument();
      expect(
        screen.getByText("Edit", { selector: ".bx--tooltip-portal__content" }),
      ).toBeInTheDocument();
    });
  });

  describe("portal tooltip", () => {
    it("should render tooltip content in a portal when hovered", async () => {
      render(TooltipIconPortal);

      const buttons = screen.getAllByRole("button");
      expect(openTooltips()).toHaveLength(0);

      // TooltipIconPortal order: top, right, bottom, left
      await user.hover(buttons[2]);

      const open = openTooltips();
      expect(open).toHaveLength(1);
      expect(open[0]).toHaveTextContent("Portal tooltip bottom");
      // Portalled out of the trigger, not rendered inline beside it.
      expect(buttons[2]).not.toContainElement(open[0] as HTMLElement);
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

    it("names the trigger with tooltipText when using portal", () => {
      render(TooltipIconPortalEscape);

      expect(
        screen.getByRole("button", { name: "Portal tooltip" }),
      ).toBeInTheDocument();
    });

    it("hides a focused portal tooltip on Escape without bubbling", async () => {
      const onParentKeydown = vi.fn();
      render(TooltipIconPortalEscape, { props: { onParentKeydown } });

      await user.tab();
      expect(screen.getByRole("tooltip")).toBeInTheDocument();

      await user.keyboard("{Escape}");
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
      expect(screen.getByRole("button")).toHaveFocus();
      expect(onParentKeydown).not.toHaveBeenCalled();

      // With nothing left to dismiss, Escape reaches ancestors (a Modal).
      await user.keyboard("{Escape}");
      expect(onParentKeydown).toHaveBeenCalledTimes(1);
    });

    it("reopens a portal tooltip on keyboard activation after Escape", async () => {
      render(TooltipIconPortalEscape);

      await user.tab();
      expect(screen.getByRole("tooltip")).toBeInTheDocument();

      await user.keyboard("{Escape}");
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

      await user.keyboard("{Enter}");
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
    });

    it("hides a hovered portal tooltip on Escape without reaching ancestors when focus is elsewhere", async () => {
      const onParentKeydown = vi.fn();
      render(TooltipIconPortalEscape, { props: { onParentKeydown } });

      await user.hover(screen.getByRole("button"));
      expect(screen.getByRole("tooltip")).toBeInTheDocument();

      screen.getByLabelText("Other control").focus();
      await user.keyboard("{Escape}");

      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
      expect(onParentKeydown).not.toHaveBeenCalled();
    });

    it.each([
      [
        "hover",
        () => user.hover(screen.getByRole("button")),
        () => user.unhover(screen.getByRole("button")),
      ],
      ["focus", () => user.tab(), () => user.tab()],
    ])(
      "dispatches open and close on %s when using portal",
      async (_, show, hide) => {
        const onOpen = vi.fn();
        const onClose = vi.fn();
        render(TooltipIconPortalEscape, { props: { onOpen, onClose } });

        await show();
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
        expect(onOpen).toHaveBeenCalledTimes(1);

        await hide();
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
        expect(onClose).toHaveBeenCalledTimes(1);
      },
    );

    it("keeps aria-describedby on the tooltip when a consumer supplies aria-label", async () => {
      render(TooltipIconPortalEscape, { props: { ariaLabel: "Custom name" } });

      const trigger = screen.getByRole("button", { name: "Custom name" });
      expect(trigger).not.toHaveAttribute("aria-describedby");

      await user.tab();
      const tooltip = screen.getByRole("tooltip");
      expect(trigger).toHaveAttribute("aria-describedby", tooltip.id);
    });

    it("delays a portal tooltip by enterDelayMs and leaveDelayMs", async () => {
      vi.useFakeTimers();
      render(TooltipIcon, {
        props: { portalTooltip: true, enterDelayMs: 200, leaveDelayMs: 200 },
      });
      const trigger = screen.getByRole("button");

      await fireEvent.mouseEnter(trigger);
      await vi.advanceTimersByTimeAsync(199);
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
      await vi.advanceTimersByTimeAsync(1);
      expect(screen.getByRole("tooltip")).toBeInTheDocument();

      await fireEvent.mouseLeave(trigger);
      await vi.advanceTimersByTimeAsync(199);
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
      await vi.advanceTimersByTimeAsync(1);
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
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

  describe("tooltip content slots", () => {
    it.each([
      ["tooltipChildren", "New content"],
      ["tooltipText", "Old content"],
    ] as const)("renders the %s slot in the tooltip", (slots, text) => {
      render(TooltipIconTooltipSlot, { props: { slots } });

      expect(screen.getByText(text).parentElement).toHaveClass(
        "bx--assistive-text",
      );
    });

    it.each([false, true])(
      "prefers the tooltipChildren slot with portalTooltip %s",
      (portalTooltip) => {
        render(TooltipIconTooltipSlot, {
          props: { slots: "both", portalTooltip },
        });

        expect(screen.getByText("New content")).toBeInTheDocument();
        expect(screen.queryByText("Old content")).toBeNull();
      },
    );
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
