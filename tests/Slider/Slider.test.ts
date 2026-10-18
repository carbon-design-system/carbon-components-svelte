import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { clickToFocus } from "../utils/click-to-focus";
import { flushDismiss } from "../utils/flush-dismiss";
import { rect } from "../utils/rect";
import { user } from "../utils/user";
import Slider from "./Slider.test.svelte";

const HORIZONTAL_TRACK = {
  left: 0,
  right: 200,
  width: 200,
  top: 0,
  bottom: 2,
  height: 2,
};

/** Returns the text input labelled by `label`, skipping the thumb that shares the label. */
const getInputByLabel = (label: string) => {
  const input = screen
    .getAllByLabelText(label)
    .find((el) => el.tagName === "INPUT");
  assert(input);
  return input;
};

/** Stubs the slider track's `getBoundingClientRect` with the given edges. */
const mockTrackRect = (
  container: HTMLElement,
  edges: Parameters<typeof rect>[0],
) => {
  const track = container.querySelector(".bx--slider__track");
  assert(track instanceof HTMLElement);
  vi.spyOn(track, "getBoundingClientRect").mockReturnValue(rect(edges));
};

/** Presses the slider at the given pointer coordinates, then releases the window. */
const pressTrack = async (
  container: HTMLElement,
  coords: { clientX?: number; clientY?: number },
) => {
  const slider = container.querySelector(".bx--slider");
  assert(slider instanceof HTMLElement);
  await fireEvent.mouseDown(slider, coords);
  await tick();
  await fireEvent.mouseUp(window);
};

describe("Slider", () => {
  it("should render with default props", () => {
    render(Slider);

    expect(screen.getByText("Test Slider")).toBeInTheDocument();
    expect(screen.getByRole("slider")).toBeInTheDocument();
    expect(screen.getByRole("spinbutton")).toHaveValue(0);
  });

  it("should focus input when label is clicked", async () => {
    render(Slider);

    const label = screen.getByText("Test Slider").closest("label");
    const input = getInputByLabel("Test Slider");

    assert(label);
    await user.click(label);

    expect(input).toHaveFocus();
  });

  it("should handle value changes through input", async () => {
    const onchange = vi.fn();
    render(Slider, { props: { onchange } });

    const input = screen.getByRole("spinbutton");
    await user.clear(input);
    await user.type(input, "50");
    await user.keyboard("{Tab}");

    expect(onchange).toHaveBeenCalledWith(50);
  });

  it.each(["ArrowRight", "Home", "End", "PageUp", "PageDown"])(
    "prevents the %s default action (page scroll)",
    (key) => {
      render(Slider);

      const event = new KeyboardEvent("keydown", {
        key,
        bubbles: true,
        cancelable: true,
      });
      screen.getByRole("slider").dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    },
  );

  it("should jump to min and max with Home and End", async () => {
    render(Slider, { props: { value: 50, min: 0, max: 100 } });

    const slider = screen.getByRole("slider");
    slider.focus();

    await user.keyboard("{End}");
    expect(slider).toHaveAttribute("aria-valuenow", "100");

    await user.keyboard("{Home}");
    expect(slider).toHaveAttribute("aria-valuenow", "0");
  });

  it("should show the numeric min/max as range labels by default", () => {
    render(Slider);

    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("should pin the thumb at a defined position when min equals max", () => {
    render(Slider, {
      props: {
        min: 10,
        max: 10,
        value: 10,
      },
    });

    const slider = screen.getByRole("slider");
    expect(slider.style.left).toBe("0%");
  });

  it.each([
    ["hideTextInput", { hideTextInput: true }],
    ["readonly", { readonly: true }],
  ])("does not point the label at a hidden input (%s)", (_, props) => {
    render(Slider, { props });

    const label = screen.getByText("Test Slider").closest("label");
    assert(label);
    expect(label).not.toHaveAttribute("for");
    expect(label.control).toBeNull();
    expect(screen.queryByRole("spinbutton")).toBeNull();
  });

  it("hides the range labels with hideRangeLabels", () => {
    const { container } = render(Slider, { props: { hideRangeLabels: true } });

    expect(container.querySelector(".bx--slider__range-label")).toBeNull();
  });

  it("forwards focus and blur events from the number input", async () => {
    const onfocus = vi.fn();
    const onblur = vi.fn();
    render(Slider, { props: { onfocus, onblur } });

    const input = screen.getByRole("spinbutton");
    await fireEvent.focus(input);
    expect(onfocus).toHaveBeenCalled();

    await fireEvent.blur(input);
    expect(onblur).toHaveBeenCalled();
  });

  it("selects the full value on focus when selectTextOnFocus is true", async () => {
    render(Slider, { props: { selectTextOnFocus: true, value: 42 } });

    const input = screen.getByRole("spinbutton");
    assert(input instanceof HTMLInputElement);
    const select = vi.spyOn(input, "select");
    await user.click(input);
    await tick();

    expect(select).toHaveBeenCalled();
  });

  it("keeps the selected value through the click's mouseup", async () => {
    render(Slider, { props: { selectTextOnFocus: true, value: 42 } });

    const mouseup = await clickToFocus(screen.getByRole("spinbutton"));
    expect(mouseup.defaultPrevented).toBe(true);
  });

  it("does not select all text on focus when selectTextOnFocus is false (default)", async () => {
    render(Slider, { props: { value: 42 } });

    const input = screen.getByRole("spinbutton");
    assert(input instanceof HTMLInputElement);
    const select = vi.spyOn(input, "select");
    await user.click(input);
    await tick();

    expect(select).not.toHaveBeenCalled();
  });

  it("does not select text on focus when disabled", async () => {
    render(Slider, {
      props: { selectTextOnFocus: true, disabled: true, value: 42 },
    });

    const input = screen.getByRole("spinbutton");
    assert(input instanceof HTMLInputElement);
    const select = vi.spyOn(input, "select");
    await fireEvent.focus(input);

    expect(select).not.toHaveBeenCalled();
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
    // Out of the tab order, and announced as unavailable rather than as
    // an operable slider.
    expect(slider).not.toHaveAttribute("tabindex");
    expect(slider).toHaveAttribute("aria-disabled", "true");
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
    const input = getInputByLabel("Test Slider");

    assert(sliderElement);
    assert(container);
    expect(sliderElement).toHaveClass("bx--slider--readonly");
    expect(container).toHaveClass("bx--slider-container--readonly");
    expect(input).toHaveAttribute("type", "hidden");
    expect(slider).toHaveAttribute("tabindex", "0");
  });

  it("keeps a read-only thumb reachable by keyboard with hideTextInput", async () => {
    render(Slider, {
      props: { readonly: true, hideTextInput: true, value: 50 },
    });

    await user.tab();
    expect(screen.getByRole("slider")).toHaveFocus();
  });

  it("leaves the thumb as the only control when read-only", async () => {
    render(Slider, { props: { readonly: true, value: 50 } });

    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

    await user.tab();
    expect(screen.getByRole("slider")).toHaveFocus();
    await user.tab();
    expect(document.body).toHaveFocus();
  });

  it("shows the read-only value as text hidden from screen readers", async () => {
    const { rerender } = render(Slider, {
      props: { readonly: true, value: 50 },
    });

    expect(screen.getByText("50")).toHaveAttribute("aria-hidden", "true");

    await rerender({ readonly: true, value: 60 });
    expect(screen.getByText("60")).toHaveAttribute("aria-hidden", "true");
  });

  it("shows no read-only value text with hideTextInput", () => {
    render(Slider, {
      props: { readonly: true, hideTextInput: true, value: 50 },
    });

    expect(screen.queryByText("50")).not.toBeInTheDocument();
  });

  it("describes the field as read-only for screen readers that ignore aria-readonly", () => {
    const { container } = render(Slider, {
      props: { id: "test-slider", readonly: true },
    });

    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("aria-readonly", "true");
    expect(slider).toHaveAttribute("aria-describedby", "readonly-test-slider");

    const description = container.querySelector("#readonly-test-slider");
    expect(description).toHaveTextContent("Read-only");
    expect(description).toHaveClass("bx--visually-hidden");
  });

  it("should not allow keyboard interaction when readonly", async () => {
    render(Slider, {
      props: { readonly: true, value: 50 },
    });

    const slider = screen.getByRole("slider");
    slider.focus();
    await user.keyboard("{ArrowRight}{ArrowUp}{End}{PageUp}");
    expect(slider).toHaveAttribute("aria-valuenow", "50");
  });

  it("should not allow mouse dragging when readonly", async () => {
    render(Slider, {
      props: { readonly: true, value: 50 },
    });

    const slider = screen.getByRole("slider");
    const initialValue = slider.getAttribute("aria-valuenow");

    const container = slider.parentElement;
    assert(container);
    await user.click(container);

    expect(slider.getAttribute("aria-valuenow")).toBe(initialValue);
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
    expect(screen.getByRole("alert")).toBe(invalidText);
  });

  it("should not announce the warning as an alert", () => {
    render(Slider, { props: { warn: true, warnText: "Check value" } });

    expect(screen.getByText("Check value")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
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

  it("shows helper text", () => {
    render(Slider, {
      props: { id: "test-slider", helperText: "Drag to adjust" },
    });

    const helper = screen.getByText("Drag to adjust");
    expect(helper).toHaveClass("bx--form__helper-text");
    expect(screen.getByRole("slider")).toHaveAttribute(
      "aria-describedby",
      "helper-test-slider",
    );
  });

  it("hides helper text when invalid text is shown", () => {
    render(Slider, {
      props: {
        id: "test-slider",
        helperText: "Drag to adjust",
        invalid: true,
        invalidText: "Required",
      },
    });

    expect(screen.queryByText("Drag to adjust")).not.toBeInTheDocument();
  });

  it.each([
    ["invalid", "invalidText", "Error message", "true"],
    ["warn", "warnText", "Warning message", null],
  ] as const)(
    "should associate %s text with slider via aria-describedby",
    (flag, textProp, message, ariaInvalid) => {
      render(Slider, { props: { [flag]: true, [textProp]: message } });

      const slider = screen.getByRole("slider");
      const input = screen.getByRole("spinbutton");

      const messageId = screen.getByText(message).getAttribute("id");
      expect(messageId).toBeTruthy();

      expect(slider).toHaveAttribute("aria-describedby", messageId);
      expect(input).toHaveAttribute("aria-describedby", messageId);
      expect(slider.getAttribute("aria-invalid")).toBe(ariaInvalid);
      expect(input.getAttribute("aria-invalid")).toBe(ariaInvalid);
    },
  );

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

  it("should suppress invalid state when disabled", () => {
    const { container } = render(Slider, {
      props: {
        disabled: true,
        invalid: true,
        invalidText: "Error message",
        warn: true,
        warnText: "Warning message",
      },
    });

    expect(container.querySelector(".bx--slider__invalid-icon")).toBeNull();
    expect(screen.queryByText("Error message")).not.toBeInTheDocument();
    expect(screen.queryByText("Warning message")).not.toBeInTheDocument();

    const slider = container.querySelector('[role="slider"]');
    const input = container.querySelector("input.bx--slider-text-input");
    expect(slider).not.toHaveAttribute("aria-invalid");
    expect(slider).not.toHaveAttribute("aria-describedby");
    expect(input).not.toHaveClass("bx--text-input--invalid");
    expect(input).not.toHaveAttribute("data-invalid");
  });

  it("should suppress invalid/warn state when readonly", () => {
    const { container } = render(Slider, {
      props: {
        id: "test-slider",
        readonly: true,
        invalid: true,
        invalidText: "Error message",
        warn: true,
        warnText: "Warning message",
      },
    });

    expect(container.querySelector(".bx--slider__invalid-icon")).toBeNull();
    expect(screen.queryByText("Error message")).not.toBeInTheDocument();
    expect(screen.queryByText("Warning message")).not.toBeInTheDocument();

    const slider = container.querySelector('[role="slider"]');
    expect(slider).not.toHaveAttribute("aria-invalid");
    expect(slider).toHaveAttribute("aria-describedby", "readonly-test-slider");
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

  it("should format aria-valuetext and range labels without changing the numeric value", () => {
    render(Slider, {
      props: {
        value: 50,
        formatValue: (v) => `$${v}`,
      },
    });

    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("aria-valuetext", "$50");
    expect(slider).toHaveAttribute("aria-valuenow", "50");
    expect(screen.getByText("$0")).toBeInTheDocument();
    expect(screen.getByText("$100")).toBeInTheDocument();
    expect(screen.getByRole("spinbutton")).toHaveValue(50);
  });

  it("should keep value numeric when formatValue is set", async () => {
    const onchange = vi.fn();
    render(Slider, {
      props: {
        value: 10,
        onchange,
        formatValue: (v) => `${v}%`,
      },
    });

    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("aria-valuetext", "10%");

    await user.tab();
    expect(slider).toHaveFocus();
    await user.keyboard("{ArrowRight}");

    expect(onchange).toHaveBeenCalledWith(11);
    expect(slider).toHaveAttribute("aria-valuenow", "11");
    expect(slider).toHaveAttribute("aria-valuetext", "11%");
    expect(screen.getByRole("spinbutton")).toHaveValue(11);
  });

  it("should clamp values to min and max", async () => {
    const onchange = vi.fn();
    render(Slider, {
      props: { min: 10, max: 990, onchange },
    });

    const input = screen.getByRole("spinbutton");
    await user.clear(input);
    await user.type(input, "5");
    await user.keyboard("{Tab}");
    expect(onchange).toHaveBeenCalledWith(10);

    await user.clear(input);
    await user.type(input, "1000{Tab}");
    await user.keyboard("{Tab}");
    expect(onchange).toHaveBeenCalledWith(990);
  });

  it.each([
    { typed: "", expected: "100" },
    { typed: "abc", expected: "100" },
    { typed: "٥٠", expected: "50" },
    { typed: "150", expected: "100" },
  ])("shows $expected after typing '$typed'", async ({ typed, expected }) => {
    render(Slider, { props: { value: 100, inputType: "text" } });
    const input = screen.getByRole("textbox");

    await fireEvent.change(input, { target: { value: typed } });

    expect(screen.getByRole("slider")).toHaveAttribute(
      "aria-valuenow",
      expected,
    );
    expect(input).toHaveValue(expected);
  });

  it.each([
    [150, "100"],
    [-20, "0"],
  ])("clamps an initial value of %i into range", (value, expected) => {
    render(Slider, { props: { value } });

    expect(screen.getByRole("slider")).toHaveAttribute(
      "aria-valuenow",
      expected,
    );
    expect(screen.getByRole("spinbutton")).toHaveValue(Number(expected));
  });

  it("clamps the value when max drops below it", async () => {
    const { rerender } = render(Slider, { props: { value: 80 } });

    await rerender({ max: 50 });

    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "50");
  });

  it("moves the value with the pointer and dispatches change once on release", async () => {
    const onchange = vi.fn();
    const { container } = render(Slider, { props: { onchange } });
    const slider = container.querySelector(".bx--slider");
    assert(slider instanceof HTMLElement);
    mockTrackRect(container, HORIZONTAL_TRACK);
    const thumb = screen.getByRole("slider");

    await fireEvent.mouseDown(slider, { clientX: 50 });
    await flushDismiss();
    expect(thumb).toHaveAttribute("aria-valuenow", "25");
    expect(onchange).not.toHaveBeenCalled();

    await fireEvent.mouseMove(window, { clientX: 150 });
    await tick();
    expect(thumb).toHaveAttribute("aria-valuenow", "75");
    expect(onchange).not.toHaveBeenCalled();

    await fireEvent.mouseUp(window);
    expect(onchange).toHaveBeenCalledTimes(1);
    expect(onchange).toHaveBeenLastCalledWith(75);

    await fireEvent.mouseMove(window, { clientX: 20 });
    await tick();
    expect(thumb).toHaveAttribute("aria-valuenow", "75");
  });

  it("should not respond to dragging when disabled", async () => {
    const onchange = vi.fn();
    const oninput = vi.fn();
    render(Slider, {
      props: { disabled: true, onchange, oninput },
    });

    const slider = screen.getByRole("slider");
    const container = slider.parentElement;
    assert(container);

    await user.pointer({ target: slider, keys: "[MouseLeft]" });

    const { left, width } = container.getBoundingClientRect();
    await user.pointer({ target: container, coords: { x: left + width / 2 } });

    await user.pointer({ target: container, keys: "[/MouseLeft]" });

    expect(onchange).not.toHaveBeenCalled();
    expect(oninput).not.toHaveBeenCalled();
  });

  it("should render label slot", () => {
    render(Slider, {
      props: { useSlot: true },
    });

    expect(screen.getByText("Slot Label")).toBeInTheDocument();
    getInputByLabel("Slot Label");
  });

  it("should maintain label association with custom id", () => {
    render(Slider, {
      props: { id: "custom-slider-id" },
    });

    const label = screen.getByText("Test Slider").closest("label");
    const input = getInputByLabel("Test Slider");

    assert(label);
    expect(label).toHaveAttribute("for", "input-custom-slider-id");
    expect(input).toHaveAttribute("id", "input-custom-slider-id");
  });

  // Regression: a stationary click on the track should move the thumb,
  // not only a click followed by a mousemove.
  it("should update value on a click without dragging", async () => {
    const oninput = vi.fn();
    const { container } = render(Slider, {
      props: { value: 0, min: 0, max: 100, oninput },
    });
    mockTrackRect(container, HORIZONTAL_TRACK);

    await pressTrack(container, { clientX: 100 });

    expect(oninput).toHaveBeenCalledWith(50);
    expect(screen.getByRole("spinbutton")).toHaveValue(50);
  });

  it("ends the drag on a release right after the press", async () => {
    const onchange = vi.fn();
    const { container } = render(Slider, { props: { onchange } });
    const slider = container.querySelector(".bx--slider");
    const track = container.querySelector(".bx--slider__track");
    assert(slider instanceof HTMLElement && track instanceof HTMLElement);
    vi.spyOn(track, "getBoundingClientRect").mockReturnValue(
      rect({ right: 200, height: 2 }),
    );

    await fireEvent.mouseDown(slider, { clientX: 100 });
    await fireEvent.mouseUp(window);
    expect(onchange).toHaveBeenCalledExactlyOnceWith(50);

    // With no button held, a later move must not drag the thumb.
    await flushDismiss();
    await fireEvent.mouseMove(window, { clientX: 180 });
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "50");
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/1980
  it.each([
    ["ArrowUp", {}, "{ArrowUp}", [1]],
    ["ArrowRight then ArrowLeft", {}, "{ArrowRight}{ArrowLeft}", [1, 0]],
    ["ArrowDown", { value: 50 }, "{ArrowDown}", [49]],
    ["Shift+ArrowRight", {}, "{Shift>}{ArrowRight}{/Shift}", [25]],
    ["PageUp then PageDown", {}, "{PageUp}{PageDown}", [25, 0]],
    ["PageUp clamped to max", { value: 90 }, "{PageUp}", [100]],
    ["ArrowRight clamped to max", { value: 100 }, "{ArrowRight}", [100]],
    [
      "Shift+ArrowRight clamped to max",
      { value: 100 },
      "{Shift>}{ArrowRight}{/Shift}",
      [100],
    ],
  ] as const)(
    "fires input and change for %s",
    async (_, props, keys, expected) => {
      const onchange = vi.fn();
      const oninput = vi.fn();
      render(Slider, { props: { ...props, onchange, oninput } });

      await user.tab();
      expect(screen.getByRole("slider")).toHaveFocus();

      await user.keyboard(keys);
      expect(oninput.mock.calls.map(([value]) => value)).toEqual(expected);
      expect(onchange.mock.calls.map(([value]) => value)).toEqual(expected);
    },
  );

  it("should not dispatch change on programmatic value updates", async () => {
    const onchange = vi.fn();
    const { rerender } = render(Slider, { props: { value: 10, onchange } });

    await rerender({ value: 20, onchange });

    expect(onchange).not.toHaveBeenCalled();
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

  // Regression: keyboard handling must live on the role="slider" thumb, not a
  // role="presentation" parent (which strips ARIA semantics from the
  // keyboard-handling element).
  it("attaches keyboard handling to the thumb with role=slider", () => {
    const oninput = vi.fn();
    render(Slider, { props: { oninput } });

    const slider = screen.getByRole("slider");

    // No presentation-role wrapper should swallow the thumb's semantics.
    expect(screen.queryByRole("presentation")).not.toBeInTheDocument();

    slider.focus();
    expect(slider).toHaveFocus();

    // Dispatch keydown directly on the thumb (not the parent track) and
    // confirm the value changes — proves the handler is on the thumb.
    slider.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
    expect(oninput).toHaveBeenCalledWith(1);
  });

  it.each([
    {
      name: "0.1 steps by key",
      props: { max: 1, step: 0.1 },
      keys: "{ArrowRight}{ArrowRight}{ArrowRight}",
      expected: "0.3",
    },
    {
      name: "0.1 steps by click",
      props: { max: 1, step: 0.1 },
      clientX: 60,
      expected: "0.3",
    },
    {
      name: "a grid counted from min by key",
      props: { min: 3, max: 103, step: 5, value: 3 },
      keys: "{ArrowRight}",
      expected: "8",
    },
  ])(
    "lands on the step grid: $name",
    async ({ props, keys, clientX, expected }) => {
      const { container } = render(Slider, { props });
      const thumb = screen.getByRole("slider");
      if (keys) {
        thumb.focus();
        await user.keyboard(keys);
      } else {
        const slider = container.querySelector(".bx--slider");
        const track = container.querySelector(".bx--slider__track");
        assert(slider instanceof HTMLElement && track instanceof HTMLElement);
        vi.spyOn(track, "getBoundingClientRect").mockReturnValue(
          rect({ right: 200, height: 2 }),
        );
        await fireEvent.mouseDown(slider, { clientX });
        await fireEvent.mouseUp(window);
      }
      expect(thumb).toHaveAttribute("aria-valuenow", expected);
    },
  );

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/1219
  it("should round shift+arrow values to valid steps", async () => {
    const onchange = vi.fn();
    render(Slider, {
      props: {
        min: 0,
        max: 10,
        step: 1,
        onchange,
      },
    });

    const slider = screen.getByRole("slider");
    await user.tab();
    expect(slider).toHaveFocus();

    await user.keyboard("{Shift>}{ArrowRight}{/Shift}");
    expect(onchange).toHaveBeenCalledTimes(1);
    expect(Number.isInteger(onchange.mock.calls[0][0])).toBe(true);

    onchange.mockClear();

    await user.keyboard("{Shift>}{ArrowRight}{/Shift}");
    expect(onchange).toHaveBeenCalledTimes(1);
    expect(Number.isInteger(onchange.mock.calls[0][0])).toBe(true);
  });

  it("should render labeled marks at the given values", () => {
    const { container } = render(Slider, {
      props: {
        min: 0,
        max: 3,
        step: 1,
        value: 1,
        marks: [
          { value: 0, label: "Off" },
          { value: 1, label: "Low" },
          { value: 2, label: "Med" },
          { value: 3, label: "High" },
        ],
      },
    });

    const marksEl = container.querySelector(".bx--slider__marks");
    const markEls = container.querySelectorAll(".bx--slider__mark");
    expect(marksEl).toBeInTheDocument();
    expect(markEls).toHaveLength(4);
    expect(screen.getByText("Off")).toBeInTheDocument();
    expect(screen.getByText("Low")).toBeInTheDocument();
    expect(screen.getByText("Med")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(markEls[0]).toHaveStyle({ left: "0%" });
    expect(markEls[1]).toHaveStyle({ left: `${(1 / 3) * 100}%` });
    expect(markEls[3]).toHaveStyle({ left: "100%" });
    expect(container.querySelector(".bx--slider")).toHaveClass(
      "bx--slider--with-marks",
      "bx--slider--with-mark-labels",
    );
  });

  it("should place a tick at every step when marks is true", () => {
    const { container } = render(Slider, {
      props: { min: 0, max: 10, step: 5, marks: true },
    });

    const markEls = container.querySelectorAll(".bx--slider__mark");
    expect(markEls).toHaveLength(3);
    expect(markEls[0]).toHaveStyle({ left: "0%" });
    expect(markEls[1]).toHaveStyle({ left: "50%" });
    expect(markEls[2]).toHaveStyle({ left: "100%" });
    expect(container.querySelector(".bx--slider__mark-label")).toBeNull();
  });

  describe("snapToMarks", () => {
    it("should snap a click to the nearest mark", async () => {
      const oninput = vi.fn();
      const { container } = render(Slider, {
        props: {
          value: 0,
          min: 0,
          max: 100,
          step: 1,
          marks: [{ value: 0 }, { value: 25 }, { value: 100 }],
          snapToMarks: true,
          oninput,
        },
      });
      mockTrackRect(container, HORIZONTAL_TRACK);

      await pressTrack(container, { clientX: 55 });

      expect(oninput).toHaveBeenCalledWith(25);
      expect(screen.getByRole("spinbutton")).toHaveValue(25);
    });

    it("should keep step-based snapping when snapToMarks is off", async () => {
      const { container } = render(Slider, {
        props: {
          value: 0,
          min: 0,
          max: 100,
          step: 1,
          marks: [{ value: 0 }, { value: 25 }, { value: 100 }],
        },
      });
      mockTrackRect(container, HORIZONTAL_TRACK);

      await pressTrack(container, { clientX: 55 });

      expect(screen.getByRole("spinbutton")).toHaveValue(28);
    });

    it("should ignore snapToMarks when marks is not set", async () => {
      const { container } = render(Slider, {
        props: { value: 0, min: 0, max: 100, step: 1, snapToMarks: true },
      });
      mockTrackRect(container, HORIZONTAL_TRACK);

      await pressTrack(container, { clientX: 55 });

      expect(screen.getByRole("spinbutton")).toHaveValue(28);
    });

    it("should move to the adjacent mark with arrow keys", async () => {
      const onchange = vi.fn();
      render(Slider, {
        props: {
          value: 0,
          min: 0,
          max: 100,
          step: 1,
          marks: [{ value: 0 }, { value: 10 }, { value: 50 }],
          snapToMarks: true,
          onchange,
        },
      });

      await user.tab();
      expect(screen.getByRole("slider")).toHaveFocus();

      await user.keyboard("{ArrowRight}");
      expect(onchange).toHaveBeenCalledWith(10);
      expect(onchange).not.toHaveBeenCalledWith(1);

      await user.keyboard("{ArrowRight}");
      expect(onchange).toHaveBeenLastCalledWith(50);

      await user.keyboard("{ArrowRight}");
      expect(onchange).toHaveBeenLastCalledWith(50);

      await user.keyboard("{ArrowLeft}");
      expect(onchange).toHaveBeenLastCalledWith(10);
    });

    it("should walk unsorted marks in value order", async () => {
      const onchange = vi.fn();
      render(Slider, {
        props: {
          value: 0,
          marks: [{ value: 50 }, { value: 0 }, { value: 10 }],
          snapToMarks: true,
          onchange,
        },
      });

      await user.tab();
      await user.keyboard("{ArrowRight}");
      expect(onchange).toHaveBeenLastCalledWith(10);
    });

    it("should jump by stepMultiplier marks with Shift+Arrow", async () => {
      const onchange = vi.fn();
      render(Slider, {
        props: {
          value: 0,
          marks: [
            { value: 0 },
            { value: 5 },
            { value: 10 },
            { value: 15 },
            { value: 20 },
          ],
          stepMultiplier: 2,
          snapToMarks: true,
          onchange,
        },
      });

      await user.tab();
      await user.keyboard("{Shift>}{ArrowRight}{/Shift}");
      expect(onchange).toHaveBeenLastCalledWith(10);
    });

    it("should not snap a programmatic value that sits between marks", () => {
      render(Slider, {
        props: {
          value: 7,
          marks: [{ value: 0 }, { value: 10 }],
          snapToMarks: true,
        },
      });

      expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "7");
    });

    it("should keep Home and End jumping to min and max", async () => {
      const onchange = vi.fn();
      render(Slider, {
        props: {
          value: 10,
          min: 0,
          max: 100,
          marks: [{ value: 10 }, { value: 50 }],
          snapToMarks: true,
          onchange,
        },
      });

      await user.tab();
      await user.keyboard("{End}");
      expect(onchange).toHaveBeenLastCalledWith(100);
      await user.keyboard("{Home}");
      expect(onchange).toHaveBeenLastCalledWith(0);
    });
  });

  describe("orientation", () => {
    it("should set aria-orientation and the vertical classes only when vertical", () => {
      const { container, unmount } = render(Slider);
      expect(screen.getByRole("slider")).toHaveAttribute(
        "aria-orientation",
        "horizontal",
      );
      expect(container.querySelector(".bx--slider")).not.toHaveClass(
        "bx--slider--vertical",
      );
      expect(container.querySelector(".bx--form-item")).not.toHaveClass(
        "bx--slider-form-item--vertical",
      );
      expect(container.querySelector(".bx--slider-container")).not.toHaveClass(
        "bx--slider-container--vertical",
      );
      unmount();

      const vertical = render(Slider, { props: { orientation: "vertical" } });
      expect(screen.getByRole("slider")).toHaveAttribute(
        "aria-orientation",
        "vertical",
      );
      expect(vertical.container.querySelector(".bx--slider")).toHaveClass(
        "bx--slider--vertical",
      );
      expect(vertical.container.querySelector(".bx--form-item")).toHaveClass(
        "bx--slider-form-item--vertical",
      );
      expect(
        vertical.container.querySelector(".bx--slider-container"),
      ).toHaveClass("bx--slider-container--vertical");
    });

    it("should read clientY on a vertical track, increasing toward the top", async () => {
      const oninput = vi.fn();
      const { container } = render(Slider, {
        props: { orientation: "vertical", value: 0, min: 0, max: 100, oninput },
      });
      mockTrackRect(container, {
        top: 0,
        bottom: 200,
        height: 200,
        right: 2,
        width: 2,
      });

      await pressTrack(container, { clientX: 1, clientY: 50 });

      expect(oninput).toHaveBeenCalledWith(75);
      expect(screen.getByRole("spinbutton")).toHaveValue(75);
    });

    it("should keep reading clientX on a horizontal track", async () => {
      const { container } = render(Slider, {
        props: { value: 0, min: 0, max: 100 },
      });
      mockTrackRect(container, HORIZONTAL_TRACK);

      await pressTrack(container, { clientX: 50, clientY: 1 });

      expect(screen.getByRole("spinbutton")).toHaveValue(25);
    });

    it("should position the thumb, fill, and marks along the vertical axis", () => {
      const { container } = render(Slider, {
        props: {
          orientation: "vertical",
          value: 25,
          marks: [{ value: 0 }, { value: 100 }],
        },
      });

      const thumb = screen.getByRole("slider");
      expect(thumb).toHaveStyle({ top: "75%" });
      expect(thumb.style.left).toBe("");
      expect(
        container.querySelector<HTMLElement>(".bx--slider__filled-track")?.style
          .transform,
      ).toBe("translate(-50%, 0) scaleY(0.25)");
      const marks =
        container.querySelectorAll<HTMLElement>(".bx--slider__mark");
      expect(marks[0]).toHaveStyle({ top: "100%" });
      expect(marks[1]).toHaveStyle({ top: "0%" });
    });

    it("should increase with ArrowUp and decrease with ArrowDown when vertical", async () => {
      const onchange = vi.fn();
      render(Slider, {
        props: { orientation: "vertical", value: 10, onchange },
      });

      await user.tab();
      await user.keyboard("{ArrowUp}");
      expect(onchange).toHaveBeenLastCalledWith(11);

      await user.keyboard("{ArrowDown}{ArrowDown}");
      expect(onchange).toHaveBeenLastCalledWith(9);
    });

    it("should snap to marks on a vertical track", async () => {
      const { container } = render(Slider, {
        props: {
          orientation: "vertical",
          value: 0,
          marks: [{ value: 0 }, { value: 25 }, { value: 100 }],
          snapToMarks: true,
        },
      });
      mockTrackRect(container, { bottom: 200, height: 200, width: 2 });

      await pressTrack(container, { clientY: 145 });

      expect(screen.getByRole("spinbutton")).toHaveValue(25);
    });
  });
});
