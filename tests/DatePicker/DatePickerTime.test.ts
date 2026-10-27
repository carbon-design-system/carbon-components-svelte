import { render, screen, within } from "@testing-library/svelte";
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

  it("disables the fields of a disabled inline picker, and locks a read-only one", async () => {
    const { rerender } = render(DatePickerTime, {
      props: { inline: true, disabled: true },
    });
    const hours = await screen.findByRole("spinbutton", { name: "Hours" });
    expect(hours).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "AM/PM" })).toBeDisabled();

    await rerender({ disabled: false, readonly: true });
    expect(hours).toBeEnabled();
    expect(hours).toHaveAttribute("readonly");

    await rerender({ readonly: false });
    expect(hours).not.toHaveAttribute("readonly");
  });
});

describe("DatePicker range time rows", () => {
  const rangeText = () => screen.getByTestId("range").textContent;

  async function pickRange(from: number, to: number) {
    const calendar = await openCalendar("Start date");
    await user.click(dayByLabel(calendar, from));
    await user.click(dayByLabel(calendar, to));
    return calendar;
  }

  it("gives each end its row's time, and edits one end at a time", async () => {
    render(DatePickerTime, {
      props: { datePickerType: "range", defaultTime: ["09:00", "17:00"] },
    });
    await pickRange(12, 14);

    expect(rangeText()).toBe(`${dayText(12)} 9:00 AM|${dayText(14)} 5:00 PM`);

    const end = screen.getByRole("group", { name: "End time" });
    await user.click(within(end).getByRole("spinbutton", { name: "Hours" }));
    await user.keyboard("{ArrowUp}");
    expect(rangeText()).toBe(`${dayText(12)} 9:00 AM|${dayText(14)} 6:00 PM`);
  });

  it("keeps a one-day range from ending before it starts", async () => {
    render(DatePickerTime, {
      props: {
        datePickerType: "range",
        hourFormat: "24",
        defaultTime: ["09:00", "10:00"],
      },
    });
    await pickRange(12, 12);
    const start = screen.getByRole("group", { name: "Start time" });
    await user.click(within(start).getByRole("spinbutton", { name: "Hours" }));
    await user.keyboard("{ArrowUp}{ArrowUp}");

    expect(rangeText()).toBe(`${dayText(12)} 11:00|${dayText(12)} 11:00`);
  });
});

describe("DatePicker time window", () => {
  const hours = () => screen.getByRole("spinbutton", { name: "Hours" });

  it("skips times outside minTime and maxTime when stepping", async () => {
    render(DatePickerTime, {
      props: {
        hourFormat: "24",
        defaultTime: "17:00",
        minTime: "08:00",
        maxTime: "18:00",
      },
    });
    await pickDay(15);
    await user.click(hours());
    await user.keyboard("{ArrowUp}");
    expect(valueText()).toBe(`${dayText(15)} 18:00`);

    await user.keyboard("{ArrowUp}");
    expect(valueText()).toBe(`${dayText(15)} 08:00`);
  });

  it("wraps a window that ends after midnight", async () => {
    render(DatePickerTime, {
      props: {
        hourFormat: "24",
        defaultTime: "22:00",
        minTime: "22:00",
        maxTime: "06:00",
      },
    });
    await pickDay(15);
    await user.click(hours());
    await user.keyboard("{ArrowDown}");

    expect(valueText()).toBe(`${dayText(15)} 06:00`);
  });

  it("brings a typed time into the window", async () => {
    render(DatePickerTime, {
      props: { hourFormat: "24", minTime: "08:00", maxTime: "18:00" },
    });
    await pickDay(15);
    await user.click(hours());
    await user.keyboard("20");

    expect(valueText()).toBe(`${dayText(15)} 18:00`);
  });

  it("keeps a minDate's day from starting before its time", async () => {
    const now = new Date();
    render(DatePickerTime, {
      props: {
        minDate: new Date(now.getFullYear(), now.getMonth(), 15, 14, 30),
      },
    });
    await pickDay(15);

    expect(valueText()).toBe(`${dayText(15)} 2:30 PM`);
  });
});
