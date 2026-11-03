import { fireEvent, render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import DurationInput from "./DurationInput.test.svelte";

const HOUR = 3_600_000;
const MINUTE = 60_000;

const mount = (props: Record<string, unknown> = {}) =>
  render(DurationInput, { props });
const segments = () => screen.getAllByRole<HTMLInputElement>("spinbutton");
const texts = () => segments().map((segment) => segment.value);
const bound = () => screen.getByTestId("bound").textContent;

describe("DurationInput segmented", () => {
  it("renders hours, minutes and seconds with unit labels", () => {
    mount({ value: 90 * MINUTE });

    expect(texts()).toEqual(["01", "30", "00"]);
    expect(segments().map((s) => s.getAttribute("aria-label"))).toEqual([
      "hours",
      "minutes",
      "seconds",
    ]);
    expect(screen.getByRole("group")).toHaveAccessibleName("Duration");
    expect(document.querySelectorAll(".bx--duration-input__unit")).toHaveLength(
      3,
    );
  });

  it("spells the duration for assistive technology on every segment", () => {
    mount({ value: 90 * MINUTE });

    for (const segment of segments()) {
      expect(segment).toHaveAttribute("aria-valuetext", "1 hour, 30 minutes");
    }
    expect(segments()[1]).toHaveAttribute("aria-valuenow", "30");
    expect(segments()[1]).toHaveAttribute("aria-valuemax", "59");
    expect(segments()[0]).not.toHaveAttribute("aria-valuemax");
  });

  it("carries minutes into hours on ArrowUp", async () => {
    mount({ value: HOUR + 59 * MINUTE });

    segments()[1].focus();
    await user.keyboard("{ArrowUp}");

    expect(texts()).toEqual(["02", "00", "00"]);
    expect(bound()).toBe(String(2 * HOUR));
  });

  it("borrows from hours on ArrowDown and stops at the minimum", async () => {
    mount({ value: HOUR });

    segments()[1].focus();
    await user.keyboard("{ArrowDown}");
    expect(texts()).toEqual(["00", "59", "00"]);

    await user.keyboard("{Home}{ArrowDown}{ArrowDown}");
    expect(bound()).toBe(String(0));
  });

  it("steps the smallest segment by `step`", async () => {
    mount({
      value: 7 * MINUTE,
      fieldProps: { smallestUnit: "minute", step: 5 },
    });

    segments()[1].focus();
    await user.keyboard("{ArrowUp}");
    expect(texts()).toEqual(["00", "10"]);
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(texts()).toEqual(["00", "00"]);
  });

  it("types digits, then moves on to the next segment", async () => {
    mount();

    segments()[0].focus();
    await user.keyboard("1");
    expect(bound()).toBe(String(HOUR));
    await user.keyboard("{ArrowRight}9");
    expect(bound()).toBe(String(HOUR + 9 * MINUTE));
    // 9 cannot take a second digit under 60
    expect(segments()[2]).toHaveFocus();
  });

  it("starts over when a second digit would pass the segment limit", async () => {
    mount();

    segments()[1].focus();
    await user.keyboard("5");
    expect(segments()[1]).toHaveFocus();
    await user.keyboard("9");
    expect(texts()).toEqual(["", "59", ""]);
    expect(segments()[2]).toHaveFocus();
  });

  it("clears a segment with Backspace, and the value when all are clear", async () => {
    mount({ value: HOUR + 30 * MINUTE });

    segments()[1].focus();
    await user.keyboard("{Backspace}");
    expect(texts()).toEqual(["01", "", "00"]);
    expect(bound()).toBe(String(HOUR));

    segments()[0].focus();
    await user.keyboard("{Backspace}");
    segments()[2].focus();
    await user.keyboard("{Backspace}");
    expect(bound()).toBe("null");
  });

  it("fills cleared segments with zeros when focus leaves", async () => {
    mount();

    segments()[0].focus();
    await user.keyboard("2");
    expect(texts()).toEqual(["2", "", ""]);
    await user.tab({ shift: true });
    expect(texts()).toEqual(["02", "00", "00"]);
  });

  it("keeps a typed duration under `max` and raises it to `min` on blur", async () => {
    mount({ fieldProps: { min: 5 * MINUTE, max: 2 * HOUR } });

    segments()[0].focus();
    await user.keyboard("9");
    expect(bound()).toBe(String(2 * HOUR));

    segments()[0].focus();
    await user.keyboard("{Backspace}");
    segments()[2].focus();
    await user.keyboard("3");
    expect(bound()).toBe(String(3000));
    await user.tab();
    expect(bound()).toBe(String(5 * MINUTE));
  });

  it("fills every segment from a pasted duration", async () => {
    mount();

    segments()[0].focus();
    await fireEvent.paste(segments()[0], {
      clipboardData: { getData: () => "PT1H30M" },
    });

    expect(texts()).toEqual(["01", "30", "00"]);
  });

  it("adds days and milliseconds with the unit range", () => {
    mount({
      value: 26 * HOUR + 1500,
      fieldProps: { largestUnit: "day", smallestUnit: "millisecond" },
    });

    expect(texts()).toEqual(["01", "02", "00", "01", "500"]);
  });

  it("reports a change once per edit", async () => {
    const onChange = vi.fn();
    mount({ value: HOUR, onChange });

    segments()[1].focus();
    await user.keyboard("{ArrowUp}");

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ value: HOUR + MINUTE });
  });

  it("follows value changes from outside and keeps its own blanks", async () => {
    const { rerender } = mount({ value: HOUR });

    segments()[1].focus();
    await user.keyboard("{Backspace}");
    expect(texts()).toEqual(["01", "", "00"]);

    await rerender({ value: 2 * HOUR });
    expect(texts()).toEqual(["02", "00", "00"]);
  });

  it("leaves the keys alone when read-only or disabled", async () => {
    const { rerender } = mount({
      value: HOUR,
      fieldProps: { readonly: true },
    });

    segments()[1].focus();
    await user.keyboard("{ArrowUp}5");
    expect(bound()).toBe(String(HOUR));
    expect(segments()[1]).toHaveAttribute("aria-readonly", "true");

    await rerender({ fieldProps: { disabled: true } });
    for (const segment of segments()) expect(segment).toBeDisabled();
  });

  it("submits the duration in milliseconds under `name`", () => {
    mount({ value: 90 * MINUTE, fieldProps: { name: "length" } });

    const form = screen.getByTestId<HTMLFormElement>("form");
    expect(new FormData(form).get("length")).toBe(String(90 * MINUTE));
  });
});

describe("DurationInput text", () => {
  const field = () => screen.getByRole<HTMLInputElement>("textbox");

  it("reads the typed duration on blur", async () => {
    mount({ fieldProps: { variant: "text" } });

    await user.type(field(), "1.5h");
    await user.tab();

    expect(bound()).toBe(String(90 * MINUTE));
    expect(field()).toHaveValue("1h 30m");
  });

  it("reads ISO 8601 and commits on Enter", async () => {
    mount({ fieldProps: { variant: "text" } });

    await user.type(field(), "PT2H15M{Enter}");

    expect(bound()).toBe(String(2 * HOUR + 15 * MINUTE));
    expect(field()).toHaveValue("2h 15m");
  });

  it("counts a bare number in the smallest unit", async () => {
    mount({
      fieldProps: { variant: "text", smallestUnit: "minute" },
    });

    await user.type(field(), "90{Enter}");

    expect(bound()).toBe(String(90 * MINUTE));
  });

  it("flags text that is not a duration and keeps the value", async () => {
    mount({ value: HOUR, fieldProps: { variant: "text" } });

    await user.clear(field());
    await user.type(field(), "soon{Enter}");

    expect(bound()).toBe(String(HOUR));
    expect(field()).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter a duration, such as 1h 30m",
    );

    await user.type(field(), "x");
    expect(field()).not.toHaveAttribute("aria-invalid");
  });

  it("rounds to `step` and keeps the value inside `max`", async () => {
    mount({
      fieldProps: {
        variant: "text",
        smallestUnit: "minute",
        step: 15,
        max: 2 * HOUR,
      },
    });

    await user.type(field(), "3h{Enter}");
    expect(bound()).toBe(String(2 * HOUR));

    await user.clear(field());
    await user.type(field(), "22m{Enter}");
    expect(bound()).toBe(String(15 * MINUTE));
  });

  it("empties the value for empty text, and announces the parsed duration", async () => {
    mount({ fieldProps: { variant: "text" } });

    await user.type(field(), "90m{Enter}");
    expect(screen.getByRole("status")).toHaveTextContent("1 hour, 30 minutes");

    await user.clear(field());
    await fireEvent.change(field());
    expect(bound()).toBe("null");
  });
});
