import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import TooltipDefinition from "./TooltipDefinition.test.svelte";

describe("TooltipDefinition", () => {
  let consoleLog: Console["log"];

  beforeEach(() => {
    consoleLog = vi.spyOn(console, "log");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Regression test for initial event dispatch in Svelte 5
  // https://github.com/carbon-design-system/carbon-components-svelte/issues/2525
  it("does not fire open/close event on initial render", () => {
    render(TooltipDefinition);

    expect(consoleLog).not.toHaveBeenCalledWith("open");
    expect(consoleLog).not.toHaveBeenCalledWith("close");
  });

  // Regression test for initial event dispatch in Svelte 5
  // https://github.com/carbon-design-system/carbon-components-svelte/issues/2525
  it("does not fire open/close event on initial render when open is true", () => {
    render(TooltipDefinition, { props: { open: true } });

    expect(consoleLog).not.toHaveBeenCalledWith("open");
    expect(consoleLog).not.toHaveBeenCalledWith("close");
  });

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
    expect(consoleLog).toHaveBeenCalledWith("open");
  });

  it("should hide tooltip on mouse leave", async () => {
    render(TooltipDefinition);

    const trigger = screen.getByText("Tooltip trigger");
    await user.hover(trigger);
    await user.unhover(trigger);

    expect(trigger).toHaveClass("bx--tooltip--hidden");
    expect(consoleLog).toHaveBeenCalledWith("close");
  });

  it("should show tooltip on focus", async () => {
    render(TooltipDefinition);

    const trigger = screen.getByText("Tooltip trigger");
    await user.tab();

    expect(trigger).toHaveClass("bx--tooltip--visible");
    expect(consoleLog).toHaveBeenCalledWith("open");
  });

  it("should hide tooltip on blur", async () => {
    render(TooltipDefinition);

    const trigger = screen.getByText("Tooltip trigger");
    await user.tab();
    await user.tab();

    expect(trigger).toHaveClass("bx--tooltip--hidden");
    expect(consoleLog).toHaveBeenCalledWith("close");
  });

  it("should hide tooltip on Escape key", async () => {
    render(TooltipDefinition);

    const trigger = screen.getByText("Tooltip trigger");
    await user.hover(trigger);
    await user.keyboard("{Escape}");

    expect(trigger).toHaveClass("bx--tooltip--hidden");
    expect(consoleLog).toHaveBeenCalledWith("close");
  });

  it("should support top direction", () => {
    render(TooltipDefinition, {
      props: { direction: "top" },
    });

    const trigger = screen.getByText("Tooltip trigger");
    expect(trigger).toHaveClass("bx--tooltip--top");
  });

  it("should support bottom direction", () => {
    render(TooltipDefinition, {
      props: { direction: "bottom" },
    });

    const trigger = screen.getByText("Tooltip trigger");
    expect(trigger).toHaveClass("bx--tooltip--bottom");
  });

  it("should support start alignment", () => {
    render(TooltipDefinition, {
      props: { align: "start" },
    });

    const trigger = screen.getByText("Tooltip trigger");
    expect(trigger).toHaveClass("bx--tooltip--align-start");
  });

  it("should support center alignment", () => {
    render(TooltipDefinition, {
      props: { align: "center" },
    });

    const trigger = screen.getByText("Tooltip trigger");
    expect(trigger).toHaveClass("bx--tooltip--align-center");
  });

  it("should support end alignment", () => {
    render(TooltipDefinition, {
      props: { align: "end" },
    });

    const trigger = screen.getByText("Tooltip trigger");
    expect(trigger).toHaveClass("bx--tooltip--align-end");
  });

  it("should support custom trigger content", () => {
    render(TooltipDefinition, {
      props: {
        triggerContent: "Custom trigger",
      },
    });

    expect(screen.getByText("Custom trigger")).toBeInTheDocument();
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

  it("should have correct ARIA attributes", () => {
    render(TooltipDefinition);

    const trigger = screen.getByText("Tooltip trigger");
    const tooltip = screen.getByRole("tooltip");

    expect(trigger).toHaveAttribute("aria-describedby", tooltip.id);
    expect(tooltip).toHaveClass("bx--assistive-text");
  });
});
