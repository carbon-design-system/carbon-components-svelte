import { fireEvent, render, screen } from "@testing-library/svelte";
import RangeSliderComponent from "carbon-components-svelte/Slider/RangeSlider.svelte";
import { tick } from "svelte";
import { flushDismiss } from "../utils/flush-dismiss";
import { user } from "../utils/user";
import RangeSlider from "./RangeSlider.test.svelte";

describe("RangeSlider", () => {
  it("should render two thumbs and two text inputs", () => {
    render(RangeSlider, { props: { value: 10, valueUpper: 90 } });

    const thumbs = screen.getAllByRole("slider");
    expect(thumbs).toHaveLength(2);
    expect(thumbs[0]).toHaveAttribute("aria-valuenow", "10");
    expect(thumbs[1]).toHaveAttribute("aria-valuenow", "90");

    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs).toHaveLength(2);
    expect(inputs[0]).toHaveValue(10);
    expect(inputs[1]).toHaveValue(90);
  });

  it("dispatches focus and blur events from both text inputs with a handle", async () => {
    const onfocus = vi.fn();
    const onblur = vi.fn();
    render(RangeSlider, {
      props: { onfocus, onblur, value: 10, valueUpper: 90 },
    });

    const [lower, upper] = screen.getAllByRole("spinbutton");

    await fireEvent.focus(lower);
    expect(onfocus).toHaveBeenCalledTimes(1);
    expect(onfocus.mock.calls[0][0].detail).toEqual({
      value: 10,
      valueUpper: 90,
      handle: "lower",
    });
    await fireEvent.blur(lower);
    expect(onblur).toHaveBeenCalledTimes(1);
    expect(onblur.mock.calls[0][0].detail).toEqual({
      value: 10,
      valueUpper: 90,
      handle: "lower",
    });

    await fireEvent.focus(upper);
    expect(onfocus).toHaveBeenCalledTimes(2);
    expect(onfocus.mock.calls[1][0].detail).toEqual({
      value: 10,
      valueUpper: 90,
      handle: "upper",
    });
    await fireEvent.blur(upper);
    expect(onblur).toHaveBeenCalledTimes(2);
    expect(onblur.mock.calls[1][0].detail).toEqual({
      value: 10,
      valueUpper: 90,
      handle: "upper",
    });
  });

  it("selects each text input's full value on focus when selectTextOnFocus is true", async () => {
    render(RangeSlider, {
      props: { selectTextOnFocus: true, value: 10, valueUpper: 90 },
    });

    const [lower, upper] = screen.getAllByRole("spinbutton");
    assert(lower instanceof HTMLInputElement);
    assert(upper instanceof HTMLInputElement);

    const selectLower = vi.spyOn(lower, "select");
    await user.click(lower);
    await tick();
    expect(selectLower).toHaveBeenCalled();

    const selectUpper = vi.spyOn(upper, "select");
    await user.click(upper);
    await tick();
    expect(selectUpper).toHaveBeenCalled();
  });

  it("does not select all text on focus when selectTextOnFocus is false (default)", async () => {
    render(RangeSlider, { props: { value: 10, valueUpper: 90 } });

    const [lower] = screen.getAllByRole("spinbutton");
    assert(lower instanceof HTMLInputElement);
    const select = vi.spyOn(lower, "select");
    await user.click(lower);
    await tick();

    expect(select).not.toHaveBeenCalled();
  });

  it("does not select text on focus when disabled", async () => {
    render(RangeSlider, {
      props: {
        selectTextOnFocus: true,
        disabled: true,
        value: 10,
        valueUpper: 90,
      },
    });

    const [lower, upper] = screen.getAllByRole("spinbutton");
    assert(lower instanceof HTMLInputElement);
    assert(upper instanceof HTMLInputElement);
    const selectLower = vi.spyOn(lower, "select");
    const selectUpper = vi.spyOn(upper, "select");
    await fireEvent.focus(lower);
    await fireEvent.focus(upper);

    expect(selectLower).not.toHaveBeenCalled();
    expect(selectUpper).not.toHaveBeenCalled();
  });

  it("should apply two-handles container class", () => {
    const { container } = render(RangeSlider);
    expect(
      container.querySelector(".bx--slider-container--two-handles"),
    ).toBeInTheDocument();
  });

  it("should hide both text inputs when hideTextInput is true", () => {
    render(RangeSlider, { props: { hideTextInput: true } });

    const inputs = screen
      .getAllByLabelText(/bound/i)
      .filter((el) => el.tagName === "INPUT");
    expect(inputs).toHaveLength(2);
    for (const input of inputs) {
      expect(input).toHaveAttribute("type", "hidden");
    }
  });

  it("should clamp lower value to not exceed upper value", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(RangeSlider, { props: { value: 10, valueUpper: 50 } });

    const lowerInput = screen.getAllByRole("spinbutton")[0];
    await user.clear(lowerInput);
    await user.type(lowerInput, "80");
    await user.keyboard("{Tab}");

    expect(consoleLog).toHaveBeenCalledWith("change", {
      value: 50,
      valueUpper: 50,
    });
  });

  it("should clamp upper value to not go below lower value", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(RangeSlider, { props: { value: 40, valueUpper: 80 } });

    const upperInput = screen.getAllByRole("spinbutton")[1];
    await user.clear(upperInput);
    await user.type(upperInput, "20");
    await user.keyboard("{Tab}");

    expect(consoleLog).toHaveBeenCalledWith("change", {
      value: 40,
      valueUpper: 40,
    });
  });

  it("should not push lower handle past upper bound via arrow keys", async () => {
    render(RangeSlider, { props: { value: 49, valueUpper: 50 } });

    const [lowerThumb] = screen.getAllByRole("slider");
    lowerThumb.focus();
    await user.keyboard("{ArrowRight}");
    await user.keyboard("{ArrowRight}");

    expect(lowerThumb).toHaveAttribute("aria-valuenow", "50");
  });

  it("should not push upper handle below lower bound via arrow keys", async () => {
    render(RangeSlider, { props: { value: 50, valueUpper: 51 } });

    const [, upperThumb] = screen.getAllByRole("slider");
    upperThumb.focus();
    await user.keyboard("{ArrowLeft}");
    await user.keyboard("{ArrowLeft}");

    expect(upperThumb).toHaveAttribute("aria-valuenow", "50");
  });

  it("prevents arrow/Home/End default actions (page scroll) while dragging a thumb", () => {
    render(RangeSlider);

    const [lowerThumb] = screen.getAllByRole("slider");

    for (const key of ["ArrowRight", "Home", "End"]) {
      const event = new KeyboardEvent("keydown", {
        key,
        bubbles: true,
        cancelable: true,
      });
      lowerThumb.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    }
  });

  it("should jump the lower thumb to min/End clamped to upper via Home and End", async () => {
    render(RangeSlider, {
      props: { value: 40, valueUpper: 60, min: 0, max: 100 },
    });

    const [lowerThumb] = screen.getAllByRole("slider");
    lowerThumb.focus();

    await user.keyboard("{End}");
    expect(lowerThumb).toHaveAttribute("aria-valuenow", "60");

    await user.keyboard("{Home}");
    expect(lowerThumb).toHaveAttribute("aria-valuenow", "0");
  });

  it("should jump the upper thumb to max/Home clamped to lower via Home and End", async () => {
    render(RangeSlider, {
      props: { value: 40, valueUpper: 60, min: 0, max: 100 },
    });

    const [, upperThumb] = screen.getAllByRole("slider");
    upperThumb.focus();

    await user.keyboard("{Home}");
    expect(upperThumb).toHaveAttribute("aria-valuenow", "40");

    await user.keyboard("{End}");
    expect(upperThumb).toHaveAttribute("aria-valuenow", "100");
  });

  it("should dispatch change event with { value, valueUpper } detail", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(RangeSlider, { props: { value: 0, valueUpper: 100 } });

    const [lowerThumb] = screen.getAllByRole("slider");
    lowerThumb.focus();
    await user.keyboard("{ArrowRight}");

    expect(consoleLog).toHaveBeenCalledWith("change", {
      value: 1,
      valueUpper: 100,
    });
    expect(consoleLog).toHaveBeenCalledWith("input", {
      value: 1,
      valueUpper: 100,
    });
  });

  it("should clamp keyboard arrow values to min and max", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(RangeSlider, { props: { value: 0, valueUpper: 100 } });

    const [lowerThumb, upperThumb] = screen.getAllByRole("slider");

    upperThumb.focus();
    await user.keyboard("{ArrowRight}");
    expect(consoleLog).toHaveBeenCalledWith("input", {
      value: 0,
      valueUpper: 100,
    });
    expect(consoleLog).toHaveBeenCalledWith("change", {
      value: 0,
      valueUpper: 100,
    });

    vi.clearAllMocks();
    lowerThumb.focus();
    await user.keyboard("{Shift>}{ArrowLeft}{/Shift}");
    expect(consoleLog).toHaveBeenCalledWith("input", {
      value: 0,
      valueUpper: 100,
    });
    expect(consoleLog).toHaveBeenCalledWith("change", {
      value: 0,
      valueUpper: 100,
    });
  });

  it("should move the focused thumb by the large step on PageUp and PageDown", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(RangeSlider, { props: { value: 0, valueUpper: 100 } });

    const [lowerThumb, upperThumb] = screen.getAllByRole("slider");

    lowerThumb.focus();
    await user.keyboard("{PageUp}");
    expect(consoleLog).toHaveBeenCalledWith("change", {
      value: 25,
      valueUpper: 100,
    });

    vi.clearAllMocks();
    upperThumb.focus();
    await user.keyboard("{PageDown}");
    expect(consoleLog).toHaveBeenCalledWith("change", {
      value: 25,
      valueUpper: 75,
    });
  });

  it("should not push the lower handle past the upper bound via PageUp", async () => {
    render(RangeSlider, { props: { value: 49, valueUpper: 50 } });

    const [lowerThumb] = screen.getAllByRole("slider");
    lowerThumb.focus();
    await user.keyboard("{PageUp}");

    expect(lowerThumb).toHaveAttribute("aria-valuenow", "50");
  });

  it("should not push the upper handle below the lower bound via PageDown", async () => {
    render(RangeSlider, { props: { value: 50, valueUpper: 51 } });

    const [, upperThumb] = screen.getAllByRole("slider");
    upperThumb.focus();
    await user.keyboard("{PageDown}");

    expect(upperThumb).toHaveAttribute("aria-valuenow", "50");
  });

  it("prevents PageUp/PageDown default actions (page scroll)", () => {
    render(RangeSlider);

    const [lowerThumb] = screen.getAllByRole("slider");

    for (const key of ["PageUp", "PageDown"]) {
      const event = new KeyboardEvent("keydown", {
        key,
        bubbles: true,
        cancelable: true,
      });
      lowerThumb.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    }
  });

  it("should allow the upper handle to reach max via keyboard when step doesn't evenly divide the range", async () => {
    render(RangeSlider, {
      props: { value: 0, valueUpper: 400, min: 0, max: 435, step: 50 },
    });

    const [, upperThumb] = screen.getAllByRole("slider");
    upperThumb.focus();
    await user.keyboard("{ArrowRight}");

    expect(upperThumb).toHaveAttribute("aria-valuenow", "435");
  });

  it("should not dispatch change on programmatic value updates", async () => {
    const consoleLog = vi.spyOn(console, "log");
    const { rerender } = render(RangeSlider, {
      props: { value: 10, valueUpper: 90 },
    });

    await rerender({ value: 20, valueUpper: 80 });

    expect(consoleLog).not.toHaveBeenCalledWith("change", expect.anything());
  });

  it("should apply name attributes to lower and upper inputs", () => {
    render(RangeSlider, {
      props: { name: "lower", nameUpper: "upper" },
    });

    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs[0]).toHaveAttribute("name", "lower");
    expect(inputs[1]).toHaveAttribute("name", "upper");
  });

  it("should format aria-valuetext on both thumbs without changing numeric values", () => {
    render(RangeSlider, {
      props: {
        value: 20,
        valueUpper: 80,
        formatValue: (v) => `$${v}`,
      },
    });

    const [lowerThumb, upperThumb] = screen.getAllByRole("slider");
    expect(lowerThumb).toHaveAttribute("aria-valuetext", "$20");
    expect(upperThumb).toHaveAttribute("aria-valuetext", "$80");
    expect(lowerThumb).toHaveAttribute("aria-valuenow", "20");
    expect(upperThumb).toHaveAttribute("aria-valuenow", "80");
    expect(screen.getByText("$0")).toBeInTheDocument();
    expect(screen.getByText("$100")).toBeInTheDocument();

    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs[0]).toHaveValue(20);
    expect(inputs[1]).toHaveValue(80);
  });

  it("should keep value props numeric when formatValue is set", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(RangeSlider, {
      props: {
        value: 10,
        valueUpper: 90,
        formatValue: (v) => `${v}%`,
      },
    });

    const [lowerThumb] = screen.getAllByRole("slider");
    expect(lowerThumb).toHaveAttribute("aria-valuetext", "10%");

    lowerThumb.focus();
    await user.keyboard("{ArrowRight}");

    expect(consoleLog).toHaveBeenCalledWith("change", {
      value: 11,
      valueUpper: 90,
    });
    expect(lowerThumb).toHaveAttribute("aria-valuenow", "11");
    expect(lowerThumb).toHaveAttribute("aria-valuetext", "11%");
    expect(screen.getAllByRole("spinbutton")[0]).toHaveValue(11);
  });

  it("should not respond to keyboard when disabled", () => {
    render(RangeSlider, {
      props: { value: 10, valueUpper: 90, disabled: true },
    });

    const [lowerThumb] = screen.getAllByRole("slider");
    expect(lowerThumb).not.toHaveAttribute("tabindex");
  });

  // Regression: keyboard handling must live on each role="slider" thumb, not a
  // role="presentation" parent (which strips ARIA semantics from the
  // keyboard-handling element). Mirrors the Slider a11y fix in #3092.
  it("attaches keyboard handling to each thumb with role=slider", () => {
    const consoleLog = vi.spyOn(console, "log");
    render(RangeSlider, { props: { value: 10, valueUpper: 90 } });

    const [lowerThumb, upperThumb] = screen.getAllByRole("slider");
    expect(lowerThumb).toHaveAttribute("role", "slider");
    expect(upperThumb).toHaveAttribute("role", "slider");

    // No presentation-role wrapper should swallow the thumbs' semantics.
    expect(screen.queryByRole("presentation")).not.toBeInTheDocument();

    lowerThumb.focus();
    expect(lowerThumb).toHaveFocus();
    lowerThumb.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
    expect(consoleLog).toHaveBeenCalledWith("input", {
      value: 11,
      valueUpper: 90,
    });

    upperThumb.focus();
    expect(upperThumb).toHaveFocus();
    upperThumb.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }),
    );
    expect(consoleLog).toHaveBeenCalledWith("input", {
      value: 11,
      valueUpper: 89,
    });
  });

  it("should render labeled marks at the given values", () => {
    const { container } = render(RangeSlider, {
      props: {
        min: 0,
        max: 3,
        step: 1,
        value: 0,
        valueUpper: 2,
        marks: [
          { value: 0, label: "Off" },
          { value: 1, label: "Low" },
          { value: 2, label: "Med" },
          { value: 3, label: "High" },
        ],
      },
    });

    const markEls = container.querySelectorAll(".bx--slider__mark");
    expect(markEls).toHaveLength(4);
    expect(screen.getByText("Off")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(markEls[0]).toHaveStyle({ left: "0%" });
    expect(markEls[3]).toHaveStyle({ left: "100%" });
  });

  it("should place a tick at every step when marks is true", () => {
    const { container } = render(RangeSlider, {
      props: { min: 0, max: 10, step: 5, marks: true },
    });

    const markEls = container.querySelectorAll(".bx--slider__mark");
    expect(markEls).toHaveLength(3);
    expect(markEls[1]).toHaveStyle({ left: "50%" });
  });

  it.each([
    ["disabled", { disabled: true }],
    ["readonly", { readonly: true }],
  ])("hides invalid and warn states when %s", (_, props) => {
    for (const status of [
      { invalid: true, invalidText: "Invalid range" },
      { warn: true, warnText: "Check range" },
    ]) {
      const { unmount } = render(RangeSliderComponent, {
        props: { labelText: "Range", ...status, ...props },
      });
      expect(screen.queryByText("Invalid range")).not.toBeInTheDocument();
      expect(screen.queryByText("Check range")).not.toBeInTheDocument();
      for (const input of screen.getAllByRole("spinbutton")) {
        expect(input).not.toHaveAttribute("aria-invalid");
        expect(input).not.toHaveAttribute("data-warn");
      }
      unmount();
    }
  });

  it("describes the field as read-only for screen readers that ignore aria-readonly", () => {
    const { container } = render(RangeSliderComponent, {
      props: { labelText: "Range", id: "test-range", readonly: true },
    });

    const [lower, upper] = screen.getAllByRole("slider");
    expect(lower).toHaveAttribute("aria-readonly", "true");
    expect(lower).toHaveAttribute("aria-describedby", "readonly-test-range");
    expect(upper).toHaveAttribute("aria-readonly", "true");
    expect(upper).toHaveAttribute("aria-describedby", "readonly-test-range");

    const description = container.querySelector("#readonly-test-range");
    expect(description).toHaveTextContent("Read-only");
    expect(description).toHaveClass("bx--visually-hidden");
  });

  it("does not set aria-readonly when not readonly", () => {
    render(RangeSliderComponent, {
      props: { labelText: "Range", id: "test-range" },
    });

    for (const thumb of screen.getAllByRole("slider")) {
      expect(thumb).not.toHaveAttribute("aria-readonly");
    }
  });

  it("shows helper text", () => {
    render(RangeSliderComponent, {
      props: {
        labelText: "Range",
        id: "test-range",
        helperText: "Drag both ends",
      },
    });

    expect(screen.getByText("Drag both ends")).toHaveClass(
      "bx--form__helper-text",
    );
    for (const thumb of screen.getAllByRole("slider")) {
      expect(thumb).toHaveAttribute("aria-describedby", "helper-test-range");
    }
  });

  describe("minGap", () => {
    it("should stop the lower handle minGap short of the upper handle", async () => {
      render(RangeSlider, {
        props: { value: 40, valueUpper: 50, minGap: 10 },
      });

      const [lowerThumb] = screen.getAllByRole("slider");
      lowerThumb.focus();
      await user.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");

      expect(lowerThumb).toHaveAttribute("aria-valuenow", "40");
      expect(lowerThumb).toHaveAttribute("aria-valuemax", "40");
    });

    it("should stop the upper handle minGap short of the lower handle", async () => {
      render(RangeSlider, {
        props: { value: 40, valueUpper: 60, minGap: 10 },
      });

      const [, upperThumb] = screen.getAllByRole("slider");
      upperThumb.focus();
      await user.keyboard("{ArrowLeft>15/}");

      expect(upperThumb).toHaveAttribute("aria-valuenow", "50");
      expect(upperThumb).toHaveAttribute("aria-valuemin", "50");
    });

    it("should let handles converge when minGap is the default 0", async () => {
      render(RangeSlider, { props: { value: 49, valueUpper: 50 } });

      const [lowerThumb] = screen.getAllByRole("slider");
      lowerThumb.focus();
      await user.keyboard("{ArrowRight}");
      await user.keyboard("{ArrowRight}");

      expect(lowerThumb).toHaveAttribute("aria-valuenow", "50");
    });

    it("should clamp a typed lower value to valueUpper - minGap", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(RangeSlider, {
        props: { value: 10, valueUpper: 50, minGap: 10 },
      });

      const [lowerInput] = screen.getAllByRole("spinbutton");
      expect(lowerInput).toHaveAttribute("max", "40");
      await user.clear(lowerInput);
      await user.type(lowerInput, "45");
      await user.keyboard("{Tab}");

      expect(consoleLog).toHaveBeenCalledWith("change", {
        value: 40,
        valueUpper: 50,
      });
    });

    it("should clamp a typed upper value to value + minGap", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(RangeSlider, {
        props: { value: 40, valueUpper: 80, minGap: 10 },
      });

      const [, upperInput] = screen.getAllByRole("spinbutton");
      expect(upperInput).toHaveAttribute("min", "50");
      await user.clear(upperInput);
      await user.type(upperInput, "45");
      await user.keyboard("{Tab}");

      expect(consoleLog).toHaveBeenCalledWith("change", {
        value: 40,
        valueUpper: 50,
      });
    });

    it("should keep both values in bounds when minGap exceeds the range", async () => {
      render(RangeSlider, {
        props: { min: 0, max: 100, value: 40, valueUpper: 60, minGap: 200 },
      });

      const [lowerThumb, upperThumb] = screen.getAllByRole("slider");
      const lower = Number(lowerThumb.getAttribute("aria-valuenow"));
      const upper = Number(upperThumb.getAttribute("aria-valuenow"));
      expect(lower).toBeGreaterThanOrEqual(0);
      expect(upper).toBeLessThanOrEqual(100);
      expect(lower).toBeLessThanOrEqual(upper);
      expect(upper - lower).toBeLessThanOrEqual(100);

      lowerThumb.focus();
      await user.keyboard("{End}");
      expect(
        Number(lowerThumb.getAttribute("aria-valuenow")),
      ).toBeGreaterThanOrEqual(0);
      expect(
        Number(lowerThumb.getAttribute("aria-valuemax")),
      ).toBeGreaterThanOrEqual(0);
    });

    it("should respect minGap on Home and End", async () => {
      render(RangeSlider, {
        props: { min: 0, max: 100, value: 40, valueUpper: 60, minGap: 10 },
      });

      const [lowerThumb, upperThumb] = screen.getAllByRole("slider");
      lowerThumb.focus();
      await user.keyboard("{End}");
      expect(lowerThumb).toHaveAttribute("aria-valuenow", "50");

      upperThumb.focus();
      await user.keyboard("{Home}");
      expect(upperThumb).toHaveAttribute("aria-valuenow", "60");
    });

    it("should stop a dragged lower handle minGap short of the upper handle", async () => {
      const { container } = render(RangeSlider, {
        props: { value: 10, valueUpper: 50, minGap: 10 },
      });

      const slider = container.querySelector(".bx--slider");
      const track = container.querySelector(".bx--slider__track");
      assert(slider instanceof HTMLElement);
      assert(track instanceof HTMLElement);
      vi.spyOn(track, "getBoundingClientRect").mockReturnValue({
        left: 0,
        right: 200,
        width: 200,
        top: 0,
        bottom: 0,
        height: 2,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      // jsdom thumb rects are all zero, so pickHandle ties to the lower handle.
      const [lowerThumb] = screen.getAllByRole("slider");
      await fireEvent.mouseDown(lowerThumb, { clientX: 20 });
      await flushDismiss();
      await fireEvent.mouseMove(window, { clientX: 98 });
      await tick();
      await fireEvent.mouseUp(window);

      expect(lowerThumb).toHaveAttribute("aria-valuenow", "40");
    });

    it("should correct a programmatic update that violates minGap", async () => {
      const { rerender } = render(RangeSlider, {
        props: { value: 20, valueUpper: 80, minGap: 10 },
      });

      await rerender({ value: 75 });

      const [lowerThumb, upperThumb] = screen.getAllByRole("slider");
      expect(lowerThumb).toHaveAttribute("aria-valuenow", "75");
      expect(upperThumb).toHaveAttribute("aria-valuenow", "85");
    });
  });

  describe("orientation", () => {
    const rect = (overrides: Partial<DOMRect>): DOMRect => ({
      top: 0,
      bottom: 0,
      height: 0,
      left: 0,
      right: 0,
      width: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
      ...overrides,
    });

    it("should set aria-orientation on both thumbs", () => {
      const { unmount } = render(RangeSlider);
      for (const thumb of screen.getAllByRole("slider")) {
        expect(thumb).toHaveAttribute("aria-orientation", "horizontal");
      }
      unmount();

      render(RangeSlider, { props: { orientation: "vertical" } });
      for (const thumb of screen.getAllByRole("slider")) {
        expect(thumb).toHaveAttribute("aria-orientation", "vertical");
      }
    });

    it("should add the vertical modifier class only when vertical", () => {
      const { container, unmount } = render(RangeSlider);
      expect(container.querySelector(".bx--slider")).not.toHaveClass(
        "bx--slider--vertical",
      );
      unmount();

      const vertical = render(RangeSlider, {
        props: { orientation: "vertical" },
      });
      expect(vertical.container.querySelector(".bx--slider")).toHaveClass(
        "bx--slider--vertical",
      );
    });

    it("should position handles, fill, and marks along the vertical axis", () => {
      const { container } = render(RangeSlider, {
        props: {
          orientation: "vertical",
          value: 20,
          valueUpper: 70,
          marks: [{ value: 0 }, { value: 100 }],
        },
      });

      const lower = container.querySelector<HTMLElement>(
        ".bx--slider__thumb-wrapper--lower",
      );
      const upper = container.querySelector<HTMLElement>(
        ".bx--slider__thumb-wrapper--upper",
      );
      assert(lower && upper);
      expect(lower).toHaveStyle({ top: "80%" });
      expect(upper).toHaveStyle({ top: "30%" });
      expect(lower.style.insetInlineStart).toBe("");
      expect(
        container.querySelector<HTMLElement>(".bx--slider__filled-track")?.style
          .transform,
      ).toBe("translate(-50%, -20%) scaleY(0.5)");
      const marks =
        container.querySelectorAll<HTMLElement>(".bx--slider__mark");
      expect(marks[0]).toHaveStyle({ top: "100%" });
      expect(marks[1]).toHaveStyle({ top: "0%" });
    });

    it("should pick the handle nearest the pointer by clientY and read the value from it", async () => {
      const { container } = render(RangeSlider, {
        props: { orientation: "vertical", value: 20, valueUpper: 70 },
      });

      const slider = container.querySelector(".bx--slider");
      const track = container.querySelector(".bx--slider__track");
      assert(slider instanceof HTMLElement);
      assert(track instanceof HTMLElement);
      const [lowerThumb, upperThumb] = screen.getAllByRole("slider");
      vi.spyOn(track, "getBoundingClientRect").mockReturnValue(
        rect({ bottom: 200, height: 200, right: 2, width: 2 }),
      );
      // Same x for both handles, so only the y distance can tell them apart.
      vi.spyOn(lowerThumb, "getBoundingClientRect").mockReturnValue(
        rect({ top: 160, bottom: 176, height: 16, width: 24 }),
      );
      vi.spyOn(upperThumb, "getBoundingClientRect").mockReturnValue(
        rect({ top: 44, bottom: 60, height: 16, width: 24 }),
      );

      await fireEvent.mouseDown(slider, { clientX: 1, clientY: 20 });
      await tick();
      await fireEvent.mouseUp(window);

      expect(lowerThumb).toHaveAttribute("aria-valuenow", "20");
      expect(upperThumb).toHaveAttribute("aria-valuenow", "90");
    });

    it("should increase with ArrowUp and decrease with ArrowDown when vertical", async () => {
      render(RangeSlider, {
        props: { orientation: "vertical", value: 20, valueUpper: 70 },
      });

      const [lowerThumb] = screen.getAllByRole("slider");
      lowerThumb.focus();
      await user.keyboard("{ArrowUp}");
      expect(lowerThumb).toHaveAttribute("aria-valuenow", "21");
      await user.keyboard("{ArrowDown}{ArrowDown}");
      expect(lowerThumb).toHaveAttribute("aria-valuenow", "19");
    });
  });

  describe("grabbing a handle", () => {
    const rect = (overrides: Partial<DOMRect>): DOMRect => ({
      top: 0,
      bottom: 0,
      height: 0,
      left: 0,
      right: 0,
      width: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
      ...overrides,
    });

    it.each([
      {
        orientation: "horizontal" as const,
        track: rect({ right: 200, width: 200, height: 2 }),
        // Value point of 20 is x=40; the lower handle hangs left of it.
        press: { clientX: 32 },
        move: { clientX: 52 },
      },
      {
        orientation: "vertical" as const,
        track: rect({ bottom: 200, height: 200, width: 2 }),
        // Value point of 20 is y=160; the lower handle hangs below it.
        press: { clientY: 168 },
        move: { clientY: 148 },
      },
    ])(
      "should not jump the handle when pressed off its value point ($orientation)",
      async ({ orientation, track, press, move }) => {
        const { container } = render(RangeSlider, {
          props: { orientation, value: 20, valueUpper: 70 },
        });

        const trackEl = container.querySelector(".bx--slider__track");
        assert(trackEl instanceof HTMLElement);
        vi.spyOn(trackEl, "getBoundingClientRect").mockReturnValue(track);
        const [lowerThumb] = screen.getAllByRole("slider");

        await fireEvent.mouseDown(lowerThumb, press);
        await tick();
        expect(lowerThumb).toHaveAttribute("aria-valuenow", "20");

        // Moving 20px keeps the grab offset: 10 units, not 10 plus the offset.
        await flushDismiss();
        await fireEvent.mouseMove(window, move);
        await tick();
        await fireEvent.mouseUp(window);
        expect(lowerThumb).toHaveAttribute("aria-valuenow", "30");
      },
    );
  });
});
