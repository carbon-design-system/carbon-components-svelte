import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import RangeSlider from "./RangeSlider.test.svelte";

describe("RangeSlider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
});
