import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import Slider from "./Slider.test.svelte";

describe("Slider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render with default props", () => {
    render(Slider);

    expect(screen.getByText("Test Slider")).toBeInTheDocument();
    expect(screen.getByRole("slider")).toBeInTheDocument();
    expect(screen.getByRole("spinbutton")).toHaveValue(0);
  });

  it("should handle value changes through input", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Slider);

    const input = screen.getByRole("spinbutton");
    await user.clear(input);
    await user.type(input, "50");
    await user.keyboard("{Tab}");

    expect(consoleLog).toHaveBeenCalledWith("change", 50);
  });

  it("should handle keyboard navigation", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Slider);

    const slider = screen.getByRole("slider");
    await user.tab();
    expect(slider).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(consoleLog).toHaveBeenCalledWith("change", 1);

    await user.keyboard("{ArrowLeft}");
    expect(consoleLog).toHaveBeenCalledWith("change", 0);
  });

  it("should handle custom range and step", () => {
    render(Slider, {
      props: {
        min: 10,
        max: 990,
        minLabel: "10 MB",
        maxLabel: "990 MB",
        step: 10,
      },
    });

    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("aria-valuemin", "10");
    expect(slider).toHaveAttribute("aria-valuemax", "990");
    expect(screen.getByText("990 MB")).toBeInTheDocument();
  });

  it("should handle hidden text input", () => {
    render(Slider, {
      props: { hideTextInput: true },
    });

    const spinbutton = screen.getByLabelText("Slider number input");
    expect(spinbutton).toHaveAttribute("type", "hidden");
  });

  it("should handle full width", () => {
    render(Slider, {
      props: { fullWidth: true },
    });

    const slider = screen.getByRole("slider").parentElement;
    expect(slider).toHaveStyle("max-width: none");
  });

  it("should handle disabled state", () => {
    render(Slider, {
      props: { disabled: true },
    });

    const slider = screen.getByRole("slider");
    const input = screen.getByRole("spinbutton");
    const label = screen.getByText("Test Slider");

    expect(slider.parentElement).toHaveClass("bx--slider--disabled");
    expect(input).toBeDisabled();
    expect(label).toHaveClass("bx--label--disabled");
  });

  it("should handle invalid state", () => {
    render(Slider, {
      props: { invalid: true },
    });

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveClass("bx--text-input--invalid");
    expect(input).toHaveAttribute("data-invalid", "true");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("should handle custom labels", () => {
    render(Slider, {
      props: {
        minLabel: "0 MB",
        maxLabel: "100 MB",
      },
    });

    expect(screen.getByText("0 MB")).toBeInTheDocument();
    expect(screen.getByText("100 MB")).toBeInTheDocument();
  });

  it("should handle required state", () => {
    render(Slider, {
      props: { required: true },
    });

    const input = screen.getByRole("spinbutton");
    expect(input).toBeRequired();
  });

  it("should handle step multiplier with shift key", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Slider);

    const slider = screen.getByRole("slider");
    await user.tab();
    expect(slider).toHaveFocus();

    await user.keyboard("{Shift>}{ArrowRight}{/Shift}");
    expect(consoleLog).toHaveBeenCalledWith("change", 25);
  });

  it("should clamp values to min and max", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Slider, {
      props: { min: 10, max: 990 },
    });

    const input = screen.getByRole("spinbutton");
    await user.clear(input);
    await user.type(input, "5");
    await user.keyboard("{Tab}");
    expect(consoleLog).toHaveBeenCalledWith("change", 10);

    await user.clear(input);
    await user.type(input, "1000{Tab}");
    await user.keyboard("{Tab}");
    expect(consoleLog).toHaveBeenCalledWith("change", 990);
  });

  it("should not respond to dragging when disabled", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Slider, {
      props: { disabled: true },
    });

    const slider = screen.getByRole("slider");
    const container = screen.getByRole("presentation");

    // Simulate mouse down on the slider
    await user.pointer({ target: slider, keys: "[MouseLeft]" });

    // Simulate mouse move
    const { left, width } = container.getBoundingClientRect();
    await user.pointer({ target: container, coords: { x: left + width / 2 } });

    // Simulate mouse up
    await user.pointer({ target: container, keys: "[/MouseLeft]" });

    expect(consoleLog).not.toHaveBeenCalled();
  });
});
