import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import TooltipDefinition from "./TooltipDefinition.test.svelte";
import TooltipDefinitionPortal from "./TooltipDefinitionPortal.test.svelte";

describe("TooltipDefinition", () => {
  let consoleLog: Console["log"];

  beforeEach(() => {
    consoleLog = vi.spyOn(console, "log");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Regression test for initial event dispatch in Svelte 5
  // https://github.com/carbon-design-system/carbon-components-svelte/issues/2531
  it("does not fire open/close event on initial render", () => {
    render(TooltipDefinition);

    expect(consoleLog).not.toHaveBeenCalledWith("open");
    expect(consoleLog).not.toHaveBeenCalledWith("close");
  });

  // Regression test for initial event dispatch in Svelte 5
  // https://github.com/carbon-design-system/carbon-components-svelte/issues/2531
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

  it("should not open on hover when clickToOpen is true", async () => {
    render(TooltipDefinition, { props: { clickToOpen: true } });

    const trigger = screen.getByText("Tooltip trigger");
    await user.hover(trigger);

    expect(trigger).toHaveClass("bx--tooltip--hidden");
    expect(consoleLog).not.toHaveBeenCalledWith("open");
  });

  it("should open on click when clickToOpen is true", async () => {
    render(TooltipDefinition, { props: { clickToOpen: true } });

    const trigger = screen.getByText("Tooltip trigger");
    await user.click(trigger);

    expect(trigger).toHaveClass("bx--tooltip--visible");
    expect(consoleLog).toHaveBeenCalledWith("open");
  });

  it("should close on second click when clickToOpen is true", async () => {
    render(TooltipDefinition, { props: { clickToOpen: true } });

    const trigger = screen.getByText("Tooltip trigger");
    await user.click(trigger);
    await user.click(trigger);

    expect(trigger).toHaveClass("bx--tooltip--hidden");
    expect(consoleLog).toHaveBeenCalledWith("close");
  });

  it("should close on Escape when clickToOpen is true", async () => {
    render(TooltipDefinition, { props: { clickToOpen: true } });

    const trigger = screen.getByText("Tooltip trigger");
    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(trigger).toHaveClass("bx--tooltip--hidden");
    expect(consoleLog).toHaveBeenCalledWith("close");
  });

  it("should have correct ARIA attributes", () => {
    render(TooltipDefinition);

    const trigger = screen.getByText("Tooltip trigger");
    const tooltip = screen.getByRole("tooltip");

    expect(trigger).toHaveAttribute("aria-describedby", tooltip.id);
    expect(tooltip).toHaveClass("bx--assistive-text");
  });

  describe("portal tooltip", () => {
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
  });
});
