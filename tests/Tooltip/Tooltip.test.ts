import { fireEvent, render, screen } from "@testing-library/svelte";
import { isSvelte5, user } from "../setup-tests";
import TooltipAlignments from "./TooltipAlignments.test.svelte";
import TooltipCustomContent from "./TooltipCustomContent.test.svelte";
import TooltipCustomIcon from "./TooltipCustomIcon.test.svelte";
import TooltipDefault from "./TooltipDefault.test.svelte";
import TooltipDirections from "./TooltipDirections.test.svelte";
import TooltipEvents from "./TooltipEvents.test.svelte";
import TooltipHideIcon from "./TooltipHideIcon.test.svelte";
import TooltipOpen from "./TooltipOpen.test.svelte";
import TooltipPointerCapture from "./TooltipPointerCapture.test.svelte";

describe("Tooltip", () => {
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
    await user.click(screen.getByText("Tooltip trigger"));
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

  test("should toggle tooltip on mousedown", async () => {
    render(TooltipDefault);

    const trigger = screen.getByRole("button", { name: "Information" });

    await user.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(trigger);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
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

    await user.click(screen.getByTestId("custom-icon"));
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

    if (isSvelte5) {
      // In Svelte 5, a close event may be emitted on initial render
      const openEventsText = screen.getByText(/Open events: \d+/);
      const closeEventsText = screen.getByText(/Close events: \d+/);
      expect(openEventsText).toBeInTheDocument();
      expect(closeEventsText).toBeInTheDocument();
    } else {
      expect(screen.getByText("Open events: 0")).toBeInTheDocument();
      expect(screen.getByText("Close events: 0")).toBeInTheDocument();
    }

    // Get initial counts (may be 0 or 1 for close in Svelte 5)
    const openEventsText = screen.getByText(/Open events: \d+/);
    const closeEventsText = screen.getByText(/Close events: \d+/);
    const initialOpenCount = Number.parseInt(
      openEventsText.textContent?.match(/\d+/)?.[0] || "0",
      10,
    );
    const initialCloseCount = Number.parseInt(
      closeEventsText.textContent?.match(/\d+/)?.[0] || "0",
      10,
    );

    const trigger = screen.getByRole("button");
    await user.click(trigger);
    if (isSvelte5) {
      // Open count should increase by 1
      expect(
        screen.getByText(new RegExp(`Open events: ${initialOpenCount + 1}`)),
      ).toBeInTheDocument();
    } else {
      expect(screen.getByText("Open events: 1")).toBeInTheDocument();
    }

    await user.keyboard("{Escape}");
    if (isSvelte5) {
      // Close count should increase by 1 from initial
      expect(
        screen.getByText(new RegExp(`Close events: ${initialCloseCount + 1}`)),
      ).toBeInTheDocument();
    } else {
      expect(screen.getByText("Close events: 1")).toBeInTheDocument();
    }
  });

  test("should close tooltip when clicking outside", async () => {
    render(TooltipOpen);

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(document.body);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("should maintain pointer capture during interaction to prevent premature closing", async () => {
    render(TooltipPointerCapture);

    const trigger = screen.getByRole("button");

    if (!trigger.setPointerCapture) {
      trigger.setPointerCapture = vi.fn();
    }
    if (!trigger.releasePointerCapture) {
      trigger.releasePointerCapture = vi.fn();
    }

    const setPointerCaptureSpy = vi.spyOn(trigger, "setPointerCapture");
    const releasePointerCaptureSpy = vi.spyOn(trigger, "releasePointerCapture");
    await fireEvent.pointerDown(trigger, { pointerId: 1 });

    // Simulate the delay of the focus event.
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(setPointerCaptureSpy).toHaveBeenCalled();

    await fireEvent.pointerUp(trigger, { pointerId: 1 });
    expect(releasePointerCaptureSpy).toHaveBeenCalled();
  });
});
