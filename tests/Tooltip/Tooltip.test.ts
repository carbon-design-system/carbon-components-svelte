import { fireEvent, render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
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
    const { container } = render(TooltipDefault);
    expect(container.querySelector(".bx--tooltip__label")).toBeInTheDocument();
    expect(
      container.querySelector(".bx--tooltip__trigger"),
    ).toBeInTheDocument();
  });

  test("should hide icon when hideIcon is true", async () => {
    const { container } = render(TooltipHideIcon);

    expect(
      container.querySelector(".bx--tooltip__trigger"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Tooltip trigger")).toBeInTheDocument();
    await user.click(screen.getByText("Tooltip trigger"));
    expect(
      screen.getByText("This tooltip has its icon hidden"),
    ).toBeInTheDocument();
  });

  test("should show tooltip when open is true", () => {
    const { container } = render(TooltipOpen);

    expect(container.querySelector(".bx--tooltip")).toBeInTheDocument();
    expect(container.querySelector(".bx--tooltip--shown")).toBeInTheDocument();
    expect(
      screen.getByText("This tooltip is initially open"),
    ).toBeInTheDocument();
  });

  test("should open tooltip on focus", async () => {
    const { container } = render(TooltipDefault);

    const trigger = container.querySelector(".bx--tooltip__trigger");
    assert(trigger);

    await fireEvent.focus(trigger);
    expect(container.querySelector(".bx--tooltip")).toBeInTheDocument();
    expect(container.querySelector(".bx--tooltip--shown")).toBeInTheDocument();
  });

  test("should close tooltip on Escape key", async () => {
    const { container } = render(TooltipOpen);

    expect(container.querySelector(".bx--tooltip")).toBeInTheDocument();

    const tooltip = container.querySelector(".bx--tooltip");
    assert(tooltip);

    await fireEvent.keyDown(tooltip, { key: "Escape" });
    expect(container.querySelector(".bx--tooltip")).not.toBeInTheDocument();
  });

  test("should toggle tooltip on mousedown", async () => {
    const { container } = render(TooltipDefault);

    const trigger = container.querySelector(".bx--tooltip__trigger");
    assert(trigger);

    await user.click(trigger);
    expect(container.querySelector(".bx--tooltip")).toBeInTheDocument();

    await user.click(trigger);
    expect(container.querySelector(".bx--tooltip")).not.toBeInTheDocument();
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
    const { container } = render(TooltipDirections);

    const tooltips = container.querySelectorAll(".bx--tooltip");

    expect(tooltips.length).toBe(4);

    expect(container.querySelector(".bx--tooltip--top")).toBeInTheDocument();
    expect(container.querySelector(".bx--tooltip--right")).toBeInTheDocument();
    expect(container.querySelector(".bx--tooltip--bottom")).toBeInTheDocument();
    expect(container.querySelector(".bx--tooltip--left")).toBeInTheDocument();

    expect(screen.getByText("Tooltip with top direction")).toBeInTheDocument();
    expect(
      screen.getByText("Tooltip with right direction"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Tooltip with bottom direction"),
    ).toBeInTheDocument();
    expect(screen.getByText("Tooltip with left direction")).toBeInTheDocument();
  });

  test("should apply correct alignment classes", () => {
    const { container } = render(TooltipAlignments);

    const tooltips = container.querySelectorAll(".bx--tooltip");
    expect(tooltips.length).toBe(3);

    expect(
      container.querySelector(".bx--tooltip--align-start"),
    ).toBeInTheDocument();
    expect(
      container.querySelector(".bx--tooltip--align-center"),
    ).toBeInTheDocument();
    expect(
      container.querySelector(".bx--tooltip--align-end"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Tooltip with start alignment"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Tooltip with center alignment"),
    ).toBeInTheDocument();
    expect(screen.getByText("Tooltip with end alignment")).toBeInTheDocument();
  });

  test("should dispatch events when tooltip opens and closes", async () => {
    const { container } = render(TooltipEvents);

    expect(screen.getByText("Open events: 0")).toBeInTheDocument();
    expect(screen.getByText("Close events: 0")).toBeInTheDocument();

    const trigger = container.querySelector(".bx--tooltip__trigger");
    assert(trigger);

    await user.click(trigger);
    expect(screen.getByText("Open events: 1")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.getByText("Close events: 1")).toBeInTheDocument();
  });

  test("should close tooltip when clicking outside", async () => {
    const { container } = render(TooltipOpen);

    expect(container.querySelector(".bx--tooltip")).toBeInTheDocument();

    await user.click(document.body);
    expect(container.querySelector(".bx--tooltip")).not.toBeInTheDocument();
  });

  test("should maintain pointer capture during interaction to prevent premature closing", async () => {
    const { container } = render(TooltipPointerCapture);

    const trigger = container.querySelector(".bx--tooltip__trigger");
    assert(trigger);

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

    expect(container.querySelector(".bx--tooltip")).toBeInTheDocument();
    expect(setPointerCaptureSpy).toHaveBeenCalled();

    await fireEvent.pointerUp(trigger, { pointerId: 1 });
    expect(releasePointerCaptureSpy).toHaveBeenCalled();
  });
});
