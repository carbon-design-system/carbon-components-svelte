import { fireEvent, render, screen } from "@testing-library/svelte";
import RangeSliderComponent from "carbon-components-svelte/Slider/RangeSlider.svelte";
import { tick } from "svelte";
import { clickToFocus } from "../utils/click-to-focus";
import { flushDismiss } from "../utils/flush-dismiss";
import { netListenerCalls } from "../utils/net-listener-calls";
import { rect } from "../utils/rect";
import { user } from "../utils/user";
import RangeSlider from "./RangeSlider.test.svelte";

/** Matches a `change`/`input` event whose detail is the given bounds. */
const bounds = (value: number, valueUpper: number) =>
  expect.objectContaining({ detail: { value, valueUpper } });

describe("RangeSlider", () => {
  it("names each thumb and text input by the label and its bound", () => {
    render(RangeSlider, { props: { labelText: "Price" } });

    const [lowerThumb, upperThumb] = screen.getAllByRole("slider");
    expect(lowerThumb).toHaveAccessibleName("Price Lower bound");
    expect(upperThumb).toHaveAccessibleName("Price Upper bound");

    const [lowerInput, upperInput] = screen.getAllByRole("spinbutton");
    expect(lowerInput).toHaveAccessibleName("Price Lower bound");
    expect(upperInput).toHaveAccessibleName("Price Upper bound");
  });

  it("keeps read-only thumbs reachable by keyboard", async () => {
    render(RangeSlider, { props: { readonly: true, value: 10 } });

    const [lowerThumb] = screen.getAllByRole("slider");
    lowerThumb.focus();
    await user.keyboard("{ArrowRight}");
    expect(lowerThumb).toHaveAttribute("aria-valuenow", "10");
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

  it("keeps each selected value through the click's mouseup", async () => {
    render(RangeSlider, {
      props: { selectTextOnFocus: true, value: 10, valueUpper: 90 },
    });

    const [lower, upper] = screen.getAllByRole("spinbutton");
    expect((await clickToFocus(lower)).defaultPrevented).toBe(true);
    expect((await clickToFocus(upper)).defaultPrevented).toBe(true);
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

  it("leaves the thumbs as the only controls when read-only", async () => {
    render(RangeSlider, { props: { readonly: true, value: 10 } });

    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

    const [lowerThumb, upperThumb] = screen.getAllByRole("slider");
    await user.tab();
    expect(lowerThumb).toHaveFocus();
    await user.tab();
    expect(upperThumb).toHaveFocus();
    await user.tab();
    expect(document.body).toHaveFocus();
  });

  it("hides the range labels with hideRangeLabels", () => {
    const { container } = render(RangeSlider, {
      props: { hideRangeLabels: true },
    });

    expect(container.querySelector(".bx--slider__range-label")).toBeNull();
  });

  it.each([
    {
      handle: "lower",
      minGap: 0,
      value: 10,
      valueUpper: 50,
      typed: "80",
      limit: ["max", "50"],
      expected: [50, 50],
    },
    {
      handle: "upper",
      minGap: 0,
      value: 40,
      valueUpper: 80,
      typed: "20",
      limit: ["min", "40"],
      expected: [40, 40],
    },
    {
      handle: "lower",
      minGap: 10,
      value: 10,
      valueUpper: 50,
      typed: "45",
      limit: ["max", "40"],
      expected: [40, 50],
    },
    {
      handle: "upper",
      minGap: 10,
      value: 40,
      valueUpper: 80,
      typed: "45",
      limit: ["min", "50"],
      expected: [40, 50],
    },
  ])(
    "should clamp a typed $handle value to the other handle (minGap $minGap)",
    async ({ handle, minGap, value, valueUpper, typed, limit, expected }) => {
      const onchange = vi.fn();
      render(RangeSlider, { props: { value, valueUpper, minGap, onchange } });

      const input =
        screen.getAllByRole("spinbutton")[handle === "lower" ? 0 : 1];
      expect(input).toHaveAttribute(limit[0], limit[1]);
      await user.clear(input);
      await user.type(input, typed);
      await user.keyboard("{Tab}");

      expect(onchange).toHaveBeenCalledWith(bounds(expected[0], expected[1]));
    },
  );

  it.each([
    { typed: "", expected: "50" },
    { typed: "abc", expected: "50" },
    { typed: "٣٠", expected: "30" },
    { typed: "80", expected: "50" },
  ])(
    "shows $expected after typing '$typed' into the lower input",
    async ({ typed, expected }) => {
      render(RangeSlider, {
        props: { value: 50, valueUpper: 50, inputType: "text" },
      });
      const [lowerInput] = screen.getAllByRole("textbox");

      await fireEvent.change(lowerInput, { target: { value: typed } });

      const [lowerThumb] = screen.getAllByRole("slider");
      expect(lowerThumb).toHaveAttribute("aria-valuenow", expected);
      expect(lowerInput).toHaveValue(expected);
    },
  );

  it.each([
    {
      handle: "lower",
      value: 49,
      valueUpper: 50,
      key: "{ArrowRight}",
      expected: "50",
    },
    {
      handle: "upper",
      value: 50,
      valueUpper: 51,
      key: "{ArrowLeft}",
      expected: "50",
    },
  ])(
    "should not push the $handle handle past the other via arrow keys",
    async ({ handle, value, valueUpper, key, expected }) => {
      render(RangeSlider, { props: { value, valueUpper } });

      const thumb = screen.getAllByRole("slider")[handle === "lower" ? 0 : 1];
      thumb.focus();
      await user.keyboard(key);
      await user.keyboard(key);

      expect(thumb).toHaveAttribute("aria-valuenow", expected);
    },
  );

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

  it.each([
    {
      handle: "lower",
      first: ["{End}", "60"],
      second: ["{Home}", "0"],
    },
    {
      handle: "upper",
      first: ["{Home}", "40"],
      second: ["{End}", "100"],
    },
  ])(
    "should jump the $handle thumb via Home and End, clamped to the other handle",
    async ({ handle, first, second }) => {
      render(RangeSlider, {
        props: { value: 40, valueUpper: 60, min: 0, max: 100 },
      });

      const thumb = screen.getAllByRole("slider")[handle === "lower" ? 0 : 1];
      thumb.focus();
      await user.keyboard(first[0]);
      expect(thumb).toHaveAttribute("aria-valuenow", first[1]);
      await user.keyboard(second[0]);
      expect(thumb).toHaveAttribute("aria-valuenow", second[1]);
    },
  );

  it("should dispatch change event with { value, valueUpper } detail", async () => {
    const onchange = vi.fn();
    const oninput = vi.fn();
    render(RangeSlider, {
      props: { value: 0, valueUpper: 100, onchange, oninput },
    });

    const [lowerThumb] = screen.getAllByRole("slider");
    lowerThumb.focus();
    await user.keyboard("{ArrowRight}");

    expect(onchange).toHaveBeenLastCalledWith(bounds(1, 100));
    expect(oninput).toHaveBeenLastCalledWith(bounds(1, 100));
  });

  it("ends the drag on a release right after the press", async () => {
    const onchange = vi.fn();
    const { container } = render(RangeSlider, {
      props: { value: 20, valueUpper: 80, onchange },
    });
    const slider = container.querySelector(".bx--slider");
    const track = container.querySelector(".bx--slider__track");
    assert(slider instanceof HTMLElement && track instanceof HTMLElement);
    vi.spyOn(track, "getBoundingClientRect").mockReturnValue(
      rect({ right: 200, height: 2 }),
    );
    const [lowerThumb, upperThumb] = screen.getAllByRole("slider");
    vi.spyOn(lowerThumb, "getBoundingClientRect").mockReturnValue(
      rect({ left: 32, width: 16, height: 16 }),
    );
    vi.spyOn(upperThumb, "getBoundingClientRect").mockReturnValue(
      rect({ left: 152, width: 16, height: 16 }),
    );

    await fireEvent.mouseDown(slider, { clientX: 60 });
    await fireEvent.mouseUp(window);
    expect(onchange).toHaveBeenCalledExactlyOnceWith(bounds(30, 80));

    // With no button held, a later move must not drag the thumb.
    await flushDismiss();
    await fireEvent.mouseMove(window, { clientX: 100 });
    expect(lowerThumb).toHaveAttribute("aria-valuenow", "30");
  });

  it("should clamp keyboard arrow values to min and max", async () => {
    const onchange = vi.fn();
    const oninput = vi.fn();
    render(RangeSlider, {
      props: { value: 0, valueUpper: 100, onchange, oninput },
    });

    const [lowerThumb, upperThumb] = screen.getAllByRole("slider");

    upperThumb.focus();
    await user.keyboard("{ArrowRight}");
    expect(oninput).toHaveBeenLastCalledWith(bounds(0, 100));
    expect(onchange).toHaveBeenLastCalledWith(bounds(0, 100));

    onchange.mockClear();
    oninput.mockClear();
    lowerThumb.focus();
    await user.keyboard("{Shift>}{ArrowLeft}{/Shift}");
    expect(oninput).toHaveBeenLastCalledWith(bounds(0, 100));
    expect(onchange).toHaveBeenLastCalledWith(bounds(0, 100));
  });

  it("should move the focused thumb by the large step on PageUp and PageDown", async () => {
    const onchange = vi.fn();
    render(RangeSlider, { props: { value: 0, valueUpper: 100, onchange } });

    const [lowerThumb, upperThumb] = screen.getAllByRole("slider");

    lowerThumb.focus();
    await user.keyboard("{PageUp}");
    expect(onchange).toHaveBeenLastCalledWith(bounds(25, 100));

    upperThumb.focus();
    await user.keyboard("{PageDown}");
    expect(onchange).toHaveBeenLastCalledWith(bounds(25, 75));
  });

  it.each([
    ["Shift+ArrowRight", "{Shift>}{ArrowRight}{/Shift}"],
    ["PageUp", "{PageUp}"],
  ])("moves by range / stepMultiplier on %s", async (_name, keys) => {
    const onchange = vi.fn();
    render(RangeSlider, {
      props: { value: 0, valueUpper: 100, stepMultiplier: 10, onchange },
    });

    const [lowerThumb] = screen.getAllByRole("slider");
    lowerThumb.focus();
    await user.keyboard(keys);

    expect(onchange).toHaveBeenLastCalledWith(bounds(10, 100));
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

  it.each([
    {
      name: "0.1 steps",
      props: { max: 1, step: 0.1, value: 0, valueUpper: 0.5 },
      keys: "{ArrowRight}{ArrowRight}{ArrowRight}",
      expected: "0.3",
    },
    {
      name: "a grid counted from min",
      props: { min: 3, max: 103, step: 5, value: 3, valueUpper: 103 },
      keys: "{ArrowRight}",
      expected: "8",
    },
  ])("keys land on the step grid: $name", async ({ props, keys, expected }) => {
    render(RangeSlider, { props });
    const [lowerThumb] = screen.getAllByRole("slider");
    lowerThumb.focus();
    await user.keyboard(keys);
    expect(lowerThumb).toHaveAttribute("aria-valuenow", expected);
  });

  it("should not dispatch change on programmatic value updates", async () => {
    const onchange = vi.fn();
    const { rerender } = render(RangeSlider, {
      props: { value: 10, valueUpper: 90, onchange },
    });

    await rerender({ value: 20, valueUpper: 80 });

    expect(onchange).not.toHaveBeenCalled();
  });

  it("should format aria-valuetext on both thumbs without changing numeric values", async () => {
    const onchange = vi.fn();
    render(RangeSlider, {
      props: {
        value: 20,
        valueUpper: 80,
        onchange,
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

    lowerThumb.focus();
    await user.keyboard("{ArrowRight}");

    expect(onchange).toHaveBeenLastCalledWith(bounds(21, 80));
    expect(lowerThumb).toHaveAttribute("aria-valuenow", "21");
    expect(lowerThumb).toHaveAttribute("aria-valuetext", "$21");
  });

  it("announces both thumbs as disabled and leaves them out of the tab order", () => {
    render(RangeSlider, {
      props: { value: 10, valueUpper: 90, disabled: true },
    });

    for (const thumb of screen.getAllByRole("slider")) {
      expect(thumb).toHaveAttribute("aria-disabled", "true");
      expect(thumb).not.toHaveAttribute("tabindex");
    }
  });

  it.each(["Home", "End", "PageUp", "ArrowRight"])(
    "ignores %s on a disabled thumb",
    async (key) => {
      const oninput = vi.fn();
      const onchange = vi.fn();
      render(RangeSlider, {
        props: {
          value: 50,
          valueUpper: 80,
          disabled: true,
          oninput,
          onchange,
        },
      });

      // Disabled thumbs can't take focus, so dispatch the key directly.
      const [lowerThumb] = screen.getAllByRole("slider");
      await fireEvent.keyDown(lowerThumb, { key });

      expect(oninput).not.toHaveBeenCalled();
      expect(onchange).not.toHaveBeenCalled();
      expect(lowerThumb).toHaveAttribute("aria-valuenow", "50");
    },
  );

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

  it.each([
    ["disabled", { disabled: true }],
    ["readonly", { readonly: true }],
  ])("hides invalid and warn states when %s", (_, props) => {
    for (const status of [
      { invalid: true, invalidText: "Invalid range" },
      { warn: true, warnText: "Check range" },
    ]) {
      const { container, unmount } = render(RangeSliderComponent, {
        props: { labelText: "Range", ...status, ...props },
      });
      expect(screen.queryByText("Invalid range")).not.toBeInTheDocument();
      expect(screen.queryByText("Check range")).not.toBeInTheDocument();
      const inputs = container.querySelectorAll("input");
      expect(inputs).toHaveLength(2);
      for (const input of inputs) {
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

  it("shows helper text", () => {
    render(RangeSliderComponent, {
      props: {
        labelText: "Range",
        id: "test-range",
        helperText: "Drag both ends",
      },
    });

    expect(screen.getByText("Drag both ends")).toBeInTheDocument();
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

      const track = container.querySelector(".bx--slider__track");
      assert(track instanceof HTMLElement);
      vi.spyOn(track, "getBoundingClientRect").mockReturnValue(
        rect({ right: 200, height: 2 }),
      );

      // Pressing the thumb itself grabs it, so no nearest-handle pick is made.
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
        rect({ bottom: 200, right: 2 }),
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
      await flushDismiss();
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
    it.each([
      ["disabled", { disabled: true }],
      ["readonly", { readonly: true }],
    ])("does not start a drag when pressed while %s", async (_name, state) => {
      const add = vi.spyOn(window, "addEventListener");
      const remove = vi.spyOn(window, "removeEventListener");
      const { container } = render(RangeSlider, {
        props: { value: 20, valueUpper: 70, ...state },
      });

      const slider = container.querySelector(".bx--slider");
      assert(slider instanceof HTMLElement);
      await fireEvent.mouseDown(slider, { clientX: 100 });
      await flushDismiss();

      for (const type of ["mousemove", "mouseup"]) {
        expect(netListenerCalls(add, remove, type)).toBe(0);
      }

      add.mockRestore();
      remove.mockRestore();
    });

    it.each([
      {
        orientation: "horizontal" as const,
        track: rect({ right: 200, height: 2 }),
        // Value point of 20 is x=40; the lower handle hangs left of it.
        press: { clientX: 32 },
        move: { clientX: 52 },
      },
      {
        orientation: "vertical" as const,
        track: rect({ bottom: 200, width: 2 }),
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
