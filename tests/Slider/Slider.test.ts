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

  it("should associate label with input via for attribute", () => {
    render(Slider);

    const label = screen.getByText("Test Slider").closest("label");
    const input = screen.getByRole("spinbutton");

    assert(label);
    const inputId = input.getAttribute("id");
    expect(label).toHaveAttribute("for", inputId);
    expect(inputId).toMatch(/^input-/);
  });

  it("should find input by label text using getByLabelText", () => {
    render(Slider);

    const inputs = screen.getAllByLabelText("Test Slider");
    const input = inputs.find((el) => el.tagName === "INPUT");
    expect(input).toBeDefined();
    assert(input);
    expect(input).toHaveAttribute("type", "number");
  });

  it("should focus input when label is clicked", async () => {
    render(Slider);

    const label = screen.getByText("Test Slider").closest("label");
    const inputs = screen.getAllByLabelText("Test Slider");
    const input = inputs.find((el) => el.tagName === "INPUT");

    assert(label);
    assert(input);
    await user.click(label);

    expect(input).toHaveFocus();
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

    const inputs = screen.getAllByLabelText("Test Slider");
    const spinbutton = inputs.find((el) => el.tagName === "INPUT");
    assert(spinbutton);
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

  it("should handle readonly state", () => {
    render(Slider, {
      props: { readonly: true },
    });

    const slider = screen.getByRole("slider");
    const sliderElement = slider.parentElement;
    const container = sliderElement?.parentElement;
    const inputs = screen.getAllByLabelText("Test Slider");
    const input = inputs.find((el) => el.tagName === "INPUT");

    assert(sliderElement);
    assert(container);
    assert(input);
    expect(sliderElement).toHaveClass("bx--slider--readonly");
    expect(container).toHaveClass("bx--slider-container--readonly");
    expect(input).toHaveAttribute("readonly");
    expect(slider).not.toHaveAttribute("tabindex");
  });

  it("should not allow keyboard interaction when readonly", async () => {
    render(Slider, {
      props: { readonly: true, value: 50 },
    });

    const slider = screen.getByRole("slider");
    await user.tab();
    expect(slider).not.toHaveFocus();
  });

  it("should not allow mouse dragging when readonly", async () => {
    render(Slider, {
      props: { readonly: true, value: 50 },
    });

    const slider = screen.getByRole("slider");
    const initialValue = slider.getAttribute("aria-valuenow");

    const container = screen.getByRole("presentation");
    await user.click(container);

    // Value should not change
    expect(slider.getAttribute("aria-valuenow")).toBe(initialValue);
  });

  it("should not allow input value changes when readonly", () => {
    render(Slider, {
      props: { readonly: true },
    });

    const inputs = screen.getAllByLabelText("Test Slider");
    const input = inputs.find((el) => el.tagName === "INPUT");
    assert(input);

    expect(input).toHaveAttribute("readonly");
    // Input should be readonly and not allow changes
    expect(input).toHaveProperty("readOnly", true);
  });

  it("should hide thumb visually when readonly", () => {
    render(Slider, {
      props: { readonly: true },
    });

    const slider = screen.getByRole("slider");
    const sliderElement = slider.parentElement;
    assert(sliderElement);
    expect(sliderElement).toHaveClass("bx--slider--readonly");
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

  it("should display invalid text when invalid is true", () => {
    render(Slider, {
      props: { invalid: true, invalidText: "Please select a valid value" },
    });

    const invalidText = screen.getByText("Please select a valid value");
    expect(invalidText).toBeInTheDocument();
    expect(invalidText).toHaveClass("bx--slider__validation-msg");
    expect(invalidText).toHaveClass("bx--slider__validation-msg--invalid");
    expect(invalidText).toHaveClass("bx--form-requirement");
  });

  it("should not display invalid text when invalid is false", () => {
    render(Slider, {
      props: { invalid: false, invalidText: "Please select a valid value" },
    });

    const invalidText = screen.queryByText("Please select a valid value");
    expect(invalidText).not.toBeInTheDocument();
  });

  it("should associate invalid text with slider via aria-describedby", () => {
    render(Slider, {
      props: { invalid: true, invalidText: "Error message" },
    });

    const slider = screen.getByRole("slider");
    const input = screen.getByRole("spinbutton");
    const invalidText = screen.getByText("Error message");

    const errorId = invalidText.getAttribute("id");
    expect(errorId).toBeTruthy();

    expect(slider).toHaveAttribute("aria-describedby", errorId);
    expect(input).toHaveAttribute("aria-describedby", errorId);
    expect(slider).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("should not set aria-describedby when invalid is false", () => {
    render(Slider, {
      props: { invalid: false, invalidText: "Error message" },
    });

    const slider = screen.getByRole("slider");
    const input = screen.getByRole("spinbutton");

    expect(slider).not.toHaveAttribute("aria-describedby");
    expect(input).not.toHaveAttribute("aria-describedby");
  });

  it("should handle warn state", () => {
    render(Slider, {
      props: { warn: true },
    });

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveClass("bx--slider-text-input--warn");
    expect(input).toHaveAttribute("data-warn", "true");
  });

  it("should display warn text when warn is true", () => {
    render(Slider, {
      props: { warn: true, warnText: "Warning message goes here" },
    });

    const warnText = screen.getByText("Warning message goes here");
    expect(warnText).toBeInTheDocument();
    expect(warnText).toHaveClass("bx--slider__validation-msg");
    expect(warnText).toHaveClass("bx--form-requirement");
  });

  it("should not display warn text when warn is false", () => {
    render(Slider, {
      props: { warn: false, warnText: "Warning message goes here" },
    });

    const warnText = screen.queryByText("Warning message goes here");
    expect(warnText).not.toBeInTheDocument();
  });

  it("should associate warn text with slider via aria-describedby", () => {
    render(Slider, {
      props: { warn: true, warnText: "Warning message" },
    });

    const slider = screen.getByRole("slider");
    const input = screen.getByRole("spinbutton");
    const warnText = screen.getByText("Warning message");

    const warnId = warnText.getAttribute("id");
    expect(warnId).toBeTruthy();

    expect(slider).toHaveAttribute("aria-describedby", warnId);
    expect(input).toHaveAttribute("aria-describedby", warnId);
  });

  it("should not set aria-describedby when warn is false", () => {
    render(Slider, {
      props: { warn: false, warnText: "Warning message" },
    });

    const slider = screen.getByRole("slider");
    const input = screen.getByRole("spinbutton");

    expect(slider).not.toHaveAttribute("aria-describedby");
    expect(input).not.toHaveAttribute("aria-describedby");
  });

  it("should prioritize invalid over warn state", () => {
    render(Slider, {
      props: {
        invalid: true,
        warn: true,
        invalidText: "Error message",
        warnText: "Warning message",
      },
    });

    const input = screen.getByRole("spinbutton");
    const errorText = screen.getByText("Error message");
    const warnText = screen.queryByText("Warning message");

    expect(input).toHaveClass("bx--text-input--invalid");
    expect(input).toHaveAttribute("data-invalid", "true");
    expect(input).not.toHaveAttribute("data-warn");
    expect(errorText).toBeInTheDocument();
    expect(warnText).not.toBeInTheDocument();
  });

  it("should show warn icon when warn is true and invalid is false", () => {
    const { container } = render(Slider, {
      props: { warn: true, invalid: false },
    });

    const icon = container.querySelector(
      ".bx--slider__invalid-icon.bx--slider__invalid-icon--warning",
    );
    expect(icon).toBeInTheDocument();
  });

  it("should not show warn icon when invalid is true", () => {
    const { container } = render(Slider, {
      props: { warn: true, invalid: true },
    });

    const warnIcon = container.querySelector(
      ".bx--slider__invalid-icon--warning",
    );
    expect(warnIcon).not.toBeInTheDocument();
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

  it("should handle mouse dragging without errors", async () => {
    render(Slider);

    const container = screen.getByRole("presentation");
    const { left, width } = container.getBoundingClientRect();

    await user.pointer({ target: container, keys: "[MouseLeft]" });
    await user.pointer({
      target: container,
      coords: { x: left + width / 2 },
    });

    await user.pointer({ target: container, keys: "[/MouseLeft]" });
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(container).toBeInTheDocument();
  });

  it("should not respond to dragging when disabled", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Slider, {
      props: { disabled: true },
    });

    const slider = screen.getByRole("slider");
    const container = screen.getByRole("presentation");

    await user.pointer({ target: slider, keys: "[MouseLeft]" });

    const { left, width } = container.getBoundingClientRect();
    await user.pointer({ target: container, coords: { x: left + width / 2 } });

    await user.pointer({ target: container, keys: "[/MouseLeft]" });

    expect(consoleLog).not.toHaveBeenCalled();
  });

  it("should handle light variant", () => {
    render(Slider, {
      props: { light: true },
    });

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveClass("bx--text-input--light");
  });

  it("should hide label visually", () => {
    render(Slider, {
      props: { hideLabel: true },
    });

    const label = screen.getByText("Test Slider");
    expect(label).toHaveClass("bx--visually-hidden");
  });

  it("should apply name attribute", () => {
    render(Slider, {
      props: { name: "slider-name" },
    });

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("name", "slider-name");
  });

  it("should handle custom input type", () => {
    render(Slider, {
      props: { inputType: "text" },
    });

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("type", "text");
  });

  it("should render label slot", () => {
    render(Slider, {
      props: { useSlot: true },
    });

    expect(screen.getByText("Slot Label")).toBeInTheDocument();
    const inputs = screen.getAllByLabelText("Slot Label");
    const input = inputs.find((el) => el.tagName === "INPUT");
    expect(input).toBeDefined();
  });

  it("should maintain label association with custom id", () => {
    render(Slider, {
      props: { id: "custom-slider-id" },
    });

    const label = screen.getByText("Test Slider").closest("label");
    const inputs = screen.getAllByLabelText("Test Slider");
    const input = inputs.find((el) => el.tagName === "INPUT");

    assert(label);
    assert(input);
    expect(label).toHaveAttribute("for", "input-custom-slider-id");
    expect(input).toHaveAttribute("id", "input-custom-slider-id");
  });

  it("should handle arrow up key", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Slider);

    const slider = screen.getByRole("slider");
    await user.tab();
    expect(slider).toHaveFocus();

    await user.keyboard("{ArrowUp}");
    expect(consoleLog).toHaveBeenCalledWith("change", 1);
  });

  it("should handle arrow down key", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Slider, {
      props: { min: 0, max: 100 },
    });

    const slider = screen.getByRole("slider");
    const input = screen.getByRole("spinbutton");
    await user.clear(input);
    await user.type(input, "50");
    await user.keyboard("{Tab}");

    vi.clearAllMocks();

    await user.tab();
    expect(slider).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(consoleLog).toHaveBeenCalledWith("change", 49);
  });

  it("should apply custom class", () => {
    const { container } = render(Slider, {
      props: { customClass: "custom-slider" },
    });

    const formItem = container.querySelector(".bx--form-item");
    expect(formItem).toHaveClass("custom-slider");
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/1980
  it("should fire input event when using arrow keys", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Slider);

    const slider = screen.getByRole("slider");
    await user.tab();
    expect(slider).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(consoleLog).toHaveBeenCalledWith("input", 1);
    expect(consoleLog).toHaveBeenCalledWith("change", 1);

    await user.keyboard("{ArrowLeft}");
    expect(consoleLog).toHaveBeenCalledWith("input", 0);
    expect(consoleLog).toHaveBeenCalledWith("change", 0);
  });

  // Regression: ?? for aria-label so empty string is used (not fallback)
  it("uses empty aria-label when passed (nullish coalescing)", () => {
    render(Slider, {
      props: {
        labelText: "Range",
        hideLabel: true,
        ariaLabel: "",
      },
    });
    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("aria-label", "");
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/1219
  it("should round shift+arrow values to valid steps", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Slider, {
      props: {
        min: 0,
        max: 10,
        step: 1,
      },
    });

    const slider = screen.getByRole("slider");
    await user.tab();
    expect(slider).toHaveFocus();

    // With step=1, all values should be integers
    // Using Shift+ArrowRight should increment by whole numbers only
    await user.keyboard("{Shift>}{ArrowRight}{/Shift}");
    const firstCall = consoleLog.mock.calls.find(
      (call) => call[0] === "change",
    );
    expect(firstCall).toBeDefined();
    assert(firstCall);
    const firstValue = firstCall[1];

    // Value should be a whole number when step=1
    expect(Number.isInteger(firstValue)).toBe(true);
    expect(firstValue % 1).toBe(0);

    vi.clearAllMocks();

    await user.keyboard("{Shift>}{ArrowRight}{/Shift}");
    const secondCall = consoleLog.mock.calls.find(
      (call) => call[0] === "change",
    );
    expect(secondCall).toBeDefined();
    assert(secondCall);
    const secondValue = secondCall[1];

    // Value should still be a whole number
    expect(Number.isInteger(secondValue)).toBe(true);
    expect(secondValue % 1).toBe(0);
  });
});
