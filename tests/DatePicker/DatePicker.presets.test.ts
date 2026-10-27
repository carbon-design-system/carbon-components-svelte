import { render, screen } from "@testing-library/svelte";
import { datePresets } from "carbon-components-svelte/DatePicker/date-presets.js";
import { tick } from "svelte";
import { user } from "../utils/user";
import DatePickerPresets from "./DatePickerPresets.test.svelte";
import { openCalendar } from "./helpers";

const lastWeek = { label: "Last 7 days", value: datePresets.lastDays(7) };
const today = { label: "Today", value: datePresets.today };
const thisMonth = { label: "This month", value: datePresets.thisMonth };

describe("DatePicker presets", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"], now: new Date(2026, 9, 14, 9) });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("picks a range, fires change and closes", async () => {
    const onchange = vi.fn();
    render(DatePickerPresets, { presets: [lastWeek], onchange });

    const calendar = await openCalendar("Start");
    await user.click(screen.getByRole("button", { name: "Last 7 days" }));
    await tick();

    expect(screen.getByTestId("value")).toHaveTextContent(
      "10/08/2026 - 10/14/2026",
    );
    expect(onchange.mock.lastCall?.[0].detail.selectedDates).toEqual([
      new Date(2026, 9, 8),
      new Date(2026, 9, 14),
    ]);
    expect(calendar).not.toHaveClass("bx--date-picker__calendar--open");
  });

  it("marks the preset that matches the selection", async () => {
    render(DatePickerPresets, {
      presets: [today, lastWeek],
      valueFrom: "10/08/2026",
      valueTo: "10/14/2026",
    });

    await openCalendar("Start");

    expect(screen.getByRole("button", { name: "Last 7 days" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(screen.getByRole("button", { name: "Today" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("cuts a preset to maxDate, and disables one past it", async () => {
    render(DatePickerPresets, {
      datePickerType: "range",
      presets: [today, thisMonth],
      maxDate: "10/10/2026",
    });

    await openCalendar("Start");
    expect(screen.getByRole("button", { name: "Today" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "This month" }));
    await tick();

    expect(screen.getByTestId("value")).toHaveTextContent(
      "10/01/2026 - 10/10/2026",
    );
  });

  it("moves through the presets with the arrow keys and picks with Enter", async () => {
    render(DatePickerPresets, {
      datePickerType: "single",
      presets: [today, lastWeek],
    });

    await openCalendar("Start");
    screen.getByRole("button", { name: "Today" }).focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("button", { name: "Last 7 days" })).toHaveFocus();
    await user.keyboard("{Enter}");
    await tick();

    // A single date takes the start of the span.
    expect(screen.getByTestId("value")).toHaveTextContent("10/08/2026");
  });

  it("warns once when the type has no single date or range", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(DatePickerPresets, { datePickerType: "month", presets: [today] });

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('presets only apply to datePickerType="single"'),
    );
  });
});
