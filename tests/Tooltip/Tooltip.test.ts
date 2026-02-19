import { fireEvent, render, screen } from "@testing-library/svelte";
import TooltipAlignments from "./TooltipAlignments.test.svelte";
import TooltipCustomContent from "./TooltipCustomContent.test.svelte";
import TooltipCustomIcon from "./TooltipCustomIcon.test.svelte";
import TooltipDefault from "./TooltipDefault.test.svelte";
import TooltipDirections from "./TooltipDirections.test.svelte";
import TooltipEvents from "./TooltipEvents.test.svelte";
import TooltipHideIcon from "./TooltipHideIcon.test.svelte";
import TooltipOpen from "./TooltipOpen.test.svelte";

describe("Tooltip", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("should render with default props", () => {
    render(TooltipDefault);
    const trigger = screen.getByRole("button", { name: "Information" });
    expect(trigger).toBeInTheDocument();
    expect(trigger.closest(".bx--tooltip__label")).toBeInTheDocument();
    expect(trigger).toHaveClass("bx--tooltip__trigger");
  });

  test("should hide icon when hideIcon is true", async () => {
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

  test("should show tooltip when open is true", () => {
    render(TooltipOpen);

    const tooltip = screen.getByRole("dialog");
    expect(tooltip.closest(".bx--tooltip")).toBeInTheDocument();
    expect(tooltip.closest(".bx--tooltip")).toHaveClass("bx--tooltip--shown");
    expect(
      screen.getByText("This tooltip is initially open"),
    ).toBeInTheDocument();
  });

  test("should open tooltip on focus", async () => {
    render(TooltipDefault);

    const trigger = screen.getByRole("button", { name: "Information" });

    await fireEvent.focus(trigger);
    const tooltip = screen.getByRole("dialog");
    expect(tooltip.closest(".bx--tooltip")).toBeInTheDocument();
    expect(tooltip.closest(".bx--tooltip")).toHaveClass("bx--tooltip--shown");
  });

  test("should close tooltip on Escape key", async () => {
    render(TooltipOpen);

    const tooltip = screen.getByRole("dialog");
    expect(tooltip.closest(".bx--tooltip")).toBeInTheDocument();

    await fireEvent.keyDown(tooltip, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("should open tooltip on mouseenter", async () => {
    render(TooltipDefault);

    const trigger = screen.getByRole("button", { name: "Information" });

    await fireEvent.mouseEnter(trigger);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(100);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  test("should close tooltip on mouseleave", async () => {
    const { container } = render(TooltipOpen);

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const wrapper = container.firstElementChild;
    if (!(wrapper instanceof Element)) expect.fail("Expected element");
    await fireEvent.mouseLeave(wrapper);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await vi.advanceTimersByTimeAsync(300);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("should cancel close when re-entering tooltip", async () => {
    render(TooltipDefault);

    const trigger = screen.getByRole("button", { name: "Information" });

    // Open via hover.
    await fireEvent.mouseEnter(trigger);
    await vi.advanceTimersByTimeAsync(100);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Start leaving.
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

  test("should render custom slot content", () => {
    render(TooltipCustomContent);

    expect(screen.getByTestId("tooltip-content")).toBeInTheDocument();
    expect(screen.getByText("Custom tooltip content")).toBeInTheDocument();
  });

  test("should render custom icon via slot", async () => {
    render(TooltipCustomIcon);

    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
    expect(screen.getByText("🔍")).toBeInTheDocument();

    // mouseenter doesn't bubble, so fire on the trigger (parent of custom-icon).
    const trigger = screen.getByRole("button");
    await fireEvent.mouseEnter(trigger);
    await vi.advanceTimersByTimeAsync(100);
    expect(screen.getByText("Custom icon tooltip")).toBeInTheDocument();
  });

  test("should apply correct direction classes", () => {
    render(TooltipDirections);

    const tooltips = screen.getAllByRole("dialog");
    expect(tooltips.length).toBe(4);

    const topTooltip = screen
      .getByText("Tooltip with top direction")
      .closest(".bx--tooltip");
    const rightTooltip = screen
      .getByText("Tooltip with right direction")
      .closest(".bx--tooltip");
    const bottomTooltip = screen
      .getByText("Tooltip with bottom direction")
      .closest(".bx--tooltip");
    const leftTooltip = screen
      .getByText("Tooltip with left direction")
      .closest(".bx--tooltip");

    expect(topTooltip).toHaveClass("bx--tooltip--top");
    expect(rightTooltip).toHaveClass("bx--tooltip--right");
    expect(bottomTooltip).toHaveClass("bx--tooltip--bottom");
    expect(leftTooltip).toHaveClass("bx--tooltip--left");
  });

  test("should apply correct alignment classes", () => {
    render(TooltipAlignments);

    const tooltips = screen.getAllByRole("dialog");
    expect(tooltips.length).toBe(3);

    const startTooltip = screen
      .getByText("Tooltip with start alignment")
      .closest(".bx--tooltip");
    const centerTooltip = screen
      .getByText("Tooltip with center alignment")
      .closest(".bx--tooltip");
    const endTooltip = screen
      .getByText("Tooltip with end alignment")
      .closest(".bx--tooltip");

    expect(startTooltip).toHaveClass("bx--tooltip--align-start");
    expect(centerTooltip).toHaveClass("bx--tooltip--align-center");
    expect(endTooltip).toHaveClass("bx--tooltip--align-end");
  });

  test("should dispatch events when tooltip opens and closes", async () => {
    render(TooltipEvents);

    expect(screen.getByText("Open events: 0")).toBeInTheDocument();
    expect(screen.getByText("Close events: 0")).toBeInTheDocument();

    const trigger = screen.getByRole("button");
    await fireEvent.mouseEnter(trigger);
    await vi.advanceTimersByTimeAsync(100);
    expect(screen.getByText("Open events: 1")).toBeInTheDocument();

    const tooltip = screen.getByRole("dialog");
    await fireEvent.keyDown(tooltip, { key: "Escape" });
    expect(screen.getByText("Close events: 1")).toBeInTheDocument();
  });

  test("should not open tooltip on focus caused by mouse", async () => {
    render(TooltipDefault);

    const trigger = screen.getByRole("button", { name: "Information" });

    // Mouse down sets focusByMouse flag.
    await fireEvent.mouseDown(trigger);
    await fireEvent.focus(trigger);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
