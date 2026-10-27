import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import DatePickerTime from "./DatePickerTime.test.svelte";
import { dayByLabel, openCalendar } from "./helpers";

const valueText = () => screen.getByTestId("value").textContent;

/** Today's month and year as `dateFormat` writes them, around `day`. */
function dayText(day: number) {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${month}/${String(day).padStart(2, "0")}/${now.getFullYear()}`;
}

async function pickDay(day: number) {
  const calendar = await openCalendar();
  await user.click(dayByLabel(calendar, day));
  return calendar;
}

describe("DatePicker time row", () => {
  it("gives a picked day the default time and stays open for the time", async () => {
    render(DatePickerTime);
    const calendar = await pickDay(15);

    expect(valueText()).toBe(`${dayText(15)} 9:00 AM`);
    expect(calendar).toHaveClass("bx--date-picker__calendar--open");
    expect(screen.getByRole("spinbutton", { name: "Hours" })).toHaveAttribute(
      "aria-valuetext",
      "9 AM",
    );
  });

  it("steps a field with the arrow keys and reports the time", async () => {
    const onchange = vi.fn();
    render(DatePickerTime, { props: { onchange } });
    await pickDay(15);
    onchange.mockClear();

    await user.click(screen.getByRole("spinbutton", { name: "Hours" }));
    await user.keyboard("{ArrowUp}");

    expect(valueText()).toBe(`${dayText(15)} 10:00 AM`);
    expect(onchange).toHaveBeenCalledTimes(1);
    expect(onchange.mock.calls[0][0].detail.selectedDates[0].getHours()).toBe(
      10,
    );
  });

  it("keeps the time when another day is picked", async () => {
    render(DatePickerTime);
    const calendar = await pickDay(15);
    await user.click(screen.getByRole("spinbutton", { name: "Hours" }));
    await user.keyboard("{ArrowDown}");
    await user.click(dayByLabel(calendar, 20));

    expect(valueText()).toBe(`${dayText(20)} 8:00 AM`);
  });

  it("takes typed digits on a 24-hour clock and moves on", async () => {
    render(DatePickerTime, { props: { hourFormat: "24" } });
    await pickDay(15);
    await user.click(screen.getByRole("spinbutton", { name: "Hours" }));
    await user.keyboard("14");

    expect(screen.getByRole("spinbutton", { name: "Minutes" })).toHaveFocus();
    await user.keyboard("3");
    await user.keyboard("0");
    expect(valueText()).toBe(`${dayText(15)} 14:30`);
    expect(screen.queryByRole("combobox", { name: "AM/PM" })).toBeNull();
  });

  it("switches between AM and PM", async () => {
    render(DatePickerTime);
    await pickDay(15);
    await user.selectOptions(
      screen.getByRole("combobox", { name: "AM/PM" }),
      "PM",
    );

    expect(valueText()).toBe(`${dayText(15)} 9:00 PM`);
  });

  it("steps minutes by minuteStep, wrapping at the hour", async () => {
    render(DatePickerTime, { props: { minuteStep: 15 } });
    await pickDay(15);
    await user.click(screen.getByRole("spinbutton", { name: "Minutes" }));
    await user.keyboard("{ArrowDown}");

    expect(valueText()).toBe(`${dayText(15)} 9:45 AM`);
  });

  it("adds a seconds field for the second granularity", async () => {
    render(DatePickerTime, {
      props: { timeGranularity: "second", hourFormat: "24" },
    });
    await pickDay(15);
    await user.click(screen.getByRole("spinbutton", { name: "Seconds" }));
    await user.keyboard("{ArrowUp}");

    expect(valueText()).toBe(`${dayText(15)} 09:00:01`);
  });

  it("closes on Enter in a time field", async () => {
    render(DatePickerTime);
    const calendar = await pickDay(15);
    await user.click(screen.getByRole("spinbutton", { name: "Hours" }));
    await user.keyboard("{Enter}");

    expect(calendar).not.toHaveClass("bx--date-picker__calendar--open");
    expect(screen.getByLabelText("Date")).toHaveFocus();
  });
});
