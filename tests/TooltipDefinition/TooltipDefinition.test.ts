import { fireEvent, render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import TooltipDefinition from "./TooltipDefinition.test.svelte";
import TooltipDefinitionBlur from "./TooltipDefinitionBlur.test.svelte";
import TooltipDefinitionGroup from "./TooltipDefinitionGroup.test.svelte";
import TooltipDefinitionPortal from "./TooltipDefinitionPortal.test.svelte";

describe("TooltipDefinition", () => {
  describe("in a TooltipGroup", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("shows at once without the fade-in on focus", async () => {
      render(TooltipDefinitionGroup);
      const trigger = screen.getByRole("button", { name: "APR" });

      await fireEvent.focus(trigger);
      expect(trigger).toHaveClass("bx--tooltip--visible");
      expect(trigger).toHaveClass("bx--tooltip--instant");
    });

    it("opens instantly after a group Button and hides while the Button's tooltip shows", async () => {
      vi.useFakeTimers();
      render(TooltipDefinitionGroup);

      const edit = screen.getByRole("button", { name: "Edit" });
      const trigger = screen.getByRole("button", { name: "APR" });
      const wrapper = trigger.parentElement;
      assert(wrapper);

      await fireEvent.mouseEnter(edit);
      await vi.advanceTimersByTimeAsync(100);
      await fireEvent.mouseLeave(edit);
      await fireEvent.mouseEnter(wrapper);
      expect(trigger).toHaveClass("bx--tooltip--visible");

      await fireEvent.mouseEnter(edit);
      expect(trigger).toHaveClass("bx--tooltip--hidden");
      expect(trigger).not.toHaveClass("bx--tooltip--visible");
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // Regression test for initial event dispatch in Svelte 5
  // https://github.com/carbon-design-system/carbon-components-svelte/issues/2531
  it.each([{ open: false }, { open: true }])(
    "does not fire open/close event on initial render with open: $open",
    ({ open }) => {
      const onOpen = vi.fn();
      const onClose = vi.fn();
      render(TooltipDefinition, { props: { open, onOpen, onClose } });

      expect(onOpen).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    },
  );

  it("should render with default props", () => {
    render(TooltipDefinition);

    expect(screen.getByText("Tooltip trigger")).toBeInTheDocument();
    expect(screen.getByText("Test tooltip text")).toBeInTheDocument();
  });

  it("should show tooltip on hover", async () => {
    render(TooltipDefinition);

    const trigger = screen.getByText("Tooltip trigger");
    await user.hover(trigger);

    expect(trigger).toHaveClass("bx--tooltip--visible");
  });

  it("should hide tooltip on mouse leave", async () => {
    render(TooltipDefinition);

    const trigger = screen.getByText("Tooltip trigger");
    await user.hover(trigger);
    await user.unhover(trigger);

    expect(trigger).toHaveClass("bx--tooltip--hidden");
  });

  it("should show tooltip on focus", async () => {
    const onOpen = vi.fn();
    render(TooltipDefinition, { props: { onOpen } });

    const trigger = screen.getByText("Tooltip trigger");
    await user.tab();

    expect(trigger).toHaveClass("bx--tooltip--visible");
    expect(onOpen).toHaveBeenCalled();
  });

  it("should hide tooltip on blur", async () => {
    const onClose = vi.fn();
    render(TooltipDefinition, { props: { onClose } });

    const trigger = screen.getByText("Tooltip trigger");
    await user.tab();
    await user.tab();

    expect(trigger).toHaveClass("bx--tooltip--hidden");
    expect(onClose).toHaveBeenCalled();
  });

  it("should hide tooltip on Escape key", async () => {
    const onClose = vi.fn();
    render(TooltipDefinition, { props: { onClose } });

    const trigger = screen.getByText("Tooltip trigger");
    await user.hover(trigger);
    await user.keyboard("{Escape}");

    expect(trigger).toHaveClass("bx--tooltip--hidden");
    expect(onClose).toHaveBeenCalled();
  });

  it.each([
    ["direction", "top", "bx--tooltip--top"],
    ["direction", "bottom", "bx--tooltip--bottom"],
    ["align", "start", "bx--tooltip--align-start"],
    ["align", "center", "bx--tooltip--align-center"],
    ["align", "end", "bx--tooltip--align-end"],
  ] as const)("should support %s %s", (prop, value, className) => {
    render(TooltipDefinition, { props: { [prop]: value } });

    expect(screen.getByText("Tooltip trigger")).toHaveClass(className);
  });

  it("should support controlled open state", () => {
    render(TooltipDefinition, {
      props: { open: true },
    });

    const trigger = screen.getByText("Tooltip trigger");
    expect(trigger).toHaveClass("bx--tooltip--visible");
  });

  it("should use provided id for tooltip", () => {
    render(TooltipDefinition, {
      props: { id: "custom-id" },
    });

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveAttribute("id", "custom-id");
  });

  it("should not open on hover when clickToOpen is true", async () => {
    const onOpen = vi.fn();
    render(TooltipDefinition, { props: { clickToOpen: true, onOpen } });

    const trigger = screen.getByText("Tooltip trigger");
    await user.hover(trigger);

    expect(trigger).toHaveClass("bx--tooltip--hidden");
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("should open on click when clickToOpen is true", async () => {
    const onOpen = vi.fn();
    render(TooltipDefinition, { props: { clickToOpen: true, onOpen } });

    const trigger = screen.getByText("Tooltip trigger");
    await user.click(trigger);

    expect(trigger).toHaveClass("bx--tooltip--visible");
    expect(onOpen).toHaveBeenCalled();
  });

  it("should close on second click when clickToOpen is true", async () => {
    const onClose = vi.fn();
    render(TooltipDefinition, { props: { clickToOpen: true, onClose } });

    const trigger = screen.getByText("Tooltip trigger");
    await user.click(trigger);
    await user.click(trigger);

    expect(trigger).toHaveClass("bx--tooltip--hidden");
    expect(onClose).toHaveBeenCalled();
  });

  it("should close on Escape when clickToOpen is true", async () => {
    const onClose = vi.fn();
    render(TooltipDefinition, { props: { clickToOpen: true, onClose } });

    const trigger = screen.getByText("Tooltip trigger");
    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(trigger).toHaveClass("bx--tooltip--hidden");
    expect(onClose).toHaveBeenCalled();
  });

  describe("enterDelayMs / leaveDelayMs", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should delay showing tooltip on mouseenter by enterDelayMs", async () => {
      render(TooltipDefinition, {
        props: { enterDelayMs: 200, leaveDelayMs: 0 },
      });

      const trigger = screen.getByText("Tooltip trigger");
      const definition = trigger.closest(".bx--tooltip--definition");
      assert(definition instanceof HTMLElement);
      await fireEvent.mouseEnter(definition);

      expect(trigger).toHaveClass("bx--tooltip--hidden");

      await vi.advanceTimersByTimeAsync(200);

      expect(trigger).toHaveClass("bx--tooltip--visible");
    });

    it("should delay hiding tooltip on mouseleave by leaveDelayMs", async () => {
      render(TooltipDefinition, {
        props: { enterDelayMs: 0, leaveDelayMs: 200 },
      });

      const trigger = screen.getByText("Tooltip trigger");
      const span = trigger.closest(".bx--tooltip--definition");
      assert(span instanceof HTMLElement);

      await fireEvent.mouseEnter(span);

      expect(trigger).toHaveClass("bx--tooltip--visible");

      await fireEvent.mouseLeave(span);

      expect(trigger).toHaveClass("bx--tooltip--visible");

      await vi.advanceTimersByTimeAsync(200);

      expect(trigger).toHaveClass("bx--tooltip--hidden");
    });
  });

  it("should have correct ARIA attributes", () => {
    render(TooltipDefinition);

    const trigger = screen.getByText("Tooltip trigger");
    const tooltip = screen.getByRole("tooltip");

    expect(trigger).toHaveAttribute("aria-describedby", tooltip.id);
    expect(tooltip).toHaveClass("bx--assistive-text");
  });

  it("controls the tooltip and reflects it in aria-expanded", async () => {
    render(TooltipDefinition);

    const trigger = screen.getByRole("button", { name: "Tooltip trigger" });
    expect(trigger).toHaveAttribute("aria-controls", "test-tooltip");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.tab();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it.each([
    ["Enter", "{Enter}"],
    ["Space", " "],
  ])("toggles the tooltip with %s", async (_, key) => {
    const onClick = vi.fn();
    render(TooltipDefinition);

    const trigger = screen.getByRole("button", { name: "Tooltip trigger" });
    trigger.addEventListener("click", onClick);
    await user.tab();

    await user.keyboard(key);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveClass("bx--tooltip--hidden");

    await user.keyboard(key);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveClass("bx--tooltip--visible");
    // The key still clicks the button, for `on:click` listeners.
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("toggles once per Enter when clickToOpen is true", async () => {
    render(TooltipDefinition, { props: { clickToOpen: true } });

    const trigger = screen.getByRole("button", { name: "Tooltip trigger" });
    await user.tab();
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.keyboard("{Enter}");
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Enter}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps a hover-opened tooltip open on a pointer click", async () => {
    render(TooltipDefinition);

    const trigger = screen.getByRole("button", { name: "Tooltip trigger" });
    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  describe("portal tooltip", () => {
    it("references the portal tooltip with aria-controls only while shown", async () => {
      render(TooltipDefinition, { props: { portalTooltip: true } });

      const trigger = screen.getByRole("button", { name: "Tooltip trigger" });
      expect(trigger).not.toHaveAttribute("aria-controls");
      expect(trigger).toHaveAttribute("aria-expanded", "false");

      await user.tab();
      expect(trigger).toHaveAttribute("aria-controls", "test-tooltip");
      expect(trigger).toHaveAttribute("aria-expanded", "true");
    });

    it("should render tooltip content in a portal when open", () => {
      render(TooltipDefinitionPortal);

      expect(screen.getByText("Portal tooltip bottom")).toBeInTheDocument();
    });

    it("should not render assistive text div when using portal", () => {
      render(TooltipDefinition, {
        props: { portalTooltip: true },
      });

      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("should not apply CSS tooltip classes when using portal", () => {
      render(TooltipDefinition, {
        props: { portalTooltip: true, direction: "top" },
      });

      const trigger = screen.getByText("Tooltip trigger");
      expect(trigger).not.toHaveClass("bx--tooltip--a11y");
      expect(trigger).not.toHaveClass("bx--tooltip--top");
    });

    it("should add portal-active class on trigger when using portal", () => {
      render(TooltipDefinition, {
        props: { portalTooltip: true },
      });

      expect(screen.getByText("Tooltip trigger")).toHaveClass(
        "bx--tooltip--portal-active",
      );
    });

    it("references the portal tooltip with aria-describedby only while shown", async () => {
      render(TooltipDefinition, { props: { portalTooltip: true } });

      const trigger = screen.getByRole("button", { name: "Tooltip trigger" });
      expect(trigger).not.toHaveAttribute("aria-describedby");

      await user.tab();
      expect(trigger).toHaveAttribute(
        "aria-describedby",
        screen.getByRole("tooltip").id,
      );
    });

    it("hides a focused portal tooltip on Escape without bubbling", async () => {
      const onParentKeydown = vi.fn();
      render(TooltipDefinition, {
        props: { portalTooltip: true, onParentKeydown },
      });

      await user.tab();
      expect(screen.getByRole("tooltip")).toBeInTheDocument();

      await user.keyboard("{Escape}");
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
      expect(onParentKeydown).not.toHaveBeenCalled();

      // With nothing left to dismiss, Escape reaches ancestors (a Modal).
      await user.keyboard("{Escape}");
      expect(onParentKeydown).toHaveBeenCalledTimes(1);
    });

    // Regression test: the portalled tooltip sits right against (and
    // slightly overlaps) the trigger, so the pointer can leave the trigger
    // and land on the portal before the close timer fires. Without a
    // mouseenter handler on the portal to cancel that timer, the tooltip
    // would close and immediately reopen in a loop.
    it("should stay open when the pointer moves from the trigger onto the portal", async () => {
      vi.useFakeTimers();

      render(TooltipDefinition, {
        props: { portalTooltip: true, enterDelayMs: 0, leaveDelayMs: 200 },
      });

      const trigger = screen.getByText("Tooltip trigger");
      const definition = trigger.closest(".bx--tooltip--definition");
      assert(definition instanceof HTMLElement);

      await fireEvent.mouseEnter(definition);
      expect(screen.getByText("Test tooltip text")).toBeInTheDocument();

      await fireEvent.mouseLeave(definition);

      const portalContent = document.querySelector(".bx--tooltip-portal");
      assert(portalContent instanceof HTMLElement);
      await fireEvent.mouseEnter(portalContent);

      await vi.advanceTimersByTimeAsync(200);

      expect(screen.getByText("Test tooltip text")).toBeInTheDocument();
    });

    it("should close after leaveDelayMs when the pointer leaves the portal", async () => {
      vi.useFakeTimers();

      render(TooltipDefinition, {
        props: { portalTooltip: true, enterDelayMs: 0, leaveDelayMs: 200 },
      });

      const trigger = screen.getByText("Tooltip trigger");
      const definition = trigger.closest(".bx--tooltip--definition");
      assert(definition instanceof HTMLElement);

      await fireEvent.mouseEnter(definition);

      const portalContent = document.querySelector(".bx--tooltip-portal");
      assert(portalContent instanceof HTMLElement);
      await fireEvent.mouseEnter(portalContent);
      await fireEvent.mouseLeave(portalContent);

      await vi.advanceTimersByTimeAsync(200);

      expect(screen.queryByText("Test tooltip text")).not.toBeInTheDocument();
    });
  });

  it("keeps a clickToOpen portal tooltip open when the pointer leaves it", async () => {
    vi.useFakeTimers();
    render(TooltipDefinition, {
      props: { portalTooltip: true, clickToOpen: true },
    });

    await fireEvent.click(screen.getByRole("button"));
    await vi.advanceTimersByTimeAsync(0);
    const portal = document.querySelector(".bx--tooltip-portal");
    assert(portal instanceof HTMLElement);

    await fireEvent.mouseLeave(portal);
    await vi.advanceTimersByTimeAsync(300);

    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("forwards blur from the trigger", async () => {
    render(TooltipDefinitionBlur);

    await user.tab();
    expect(screen.getByRole("button", { name: "APR" })).toHaveFocus();
    await user.tab();

    expect(screen.getByTestId("blur-count")).toHaveTextContent("1");
  });
});
