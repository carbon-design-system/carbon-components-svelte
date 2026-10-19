import { fireEvent } from "@testing-library/svelte";
import {
  type CalendarInstance,
  type CalendarOptions,
  createCalendarEngine,
} from "../../src/DatePicker/calendar.js";

const instances: CalendarInstance[] = [];

function create(options: CalendarOptions = {}) {
  const host = document.createElement("div");
  const input = document.createElement("input");
  host.appendChild(input);
  document.body.appendChild(host);
  const instance = createCalendarEngine(input, {
    dateFormat: "Y-m-d",
    ...options,
  });
  assert(instance);
  instances.push(instance);
  return { instance, input, host };
}

const day = (instance: CalendarInstance, n: number) => {
  const cell = [
    ...instance.calendarContainer.querySelectorAll<HTMLElement>(
      ".flatpickr-day:not(.prevMonthDay):not(.nextMonthDay)",
    ),
  ].find((el) => el.textContent === String(n));
  assert(cell);
  return cell;
};

afterEach(() => {
  for (const instance of instances.splice(0)) instance.destroy();
  document.body.replaceChildren();
});

describe("createCalendarEngine", () => {
  it("renders Carbon's classes", () => {
    const { instance } = create({ defaultDate: "2024-03-15" });
    const { calendarContainer } = instance;

    expect(calendarContainer).toHaveClass("bx--date-picker__calendar");
    expect(calendarContainer.querySelector(".flatpickr-month")).toHaveClass(
      "bx--date-picker__month",
    );
    expect(day(instance, 15)).toHaveClass("bx--date-picker__day", "selected");
  });

  it("selects a day on click and writes the value", () => {
    const onChange = vi.fn();
    const { instance, input } = create({
      defaultDate: "2024-03-01",
      onChange,
    });

    day(instance, 20).click();

    expect(input.value).toBe("2024-03-20");
    expect(instance.selectedDates).toEqual([new Date(2024, 2, 20)]);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("marks disabled days with aria-disabled and does not select them", () => {
    const { instance, input } = create({
      defaultDate: "2024-03-01",
      disable: ["2024-03-15"],
    });

    day(instance, 15).click();

    expect(day(instance, 15)).toHaveClass("flatpickr-disabled");
    expect(day(instance, 15)).toHaveAttribute("aria-disabled", "true");
    expect(input.value).toBe("2024-03-01");
  });

  it("only enables the dates in `enable`", () => {
    const { instance } = create({
      defaultDate: "2024-03-01",
      enable: [{ from: "2024-03-10", to: "2024-03-12" }],
    });

    expect(instance.isEnabled(new Date(2024, 2, 11))).toBe(true);
    expect(instance.isEnabled(new Date(2024, 2, 13))).toBe(false);
  });

  it("disables the navigation arrow at the date bounds", () => {
    const { instance } = create({
      defaultDate: "2024-03-15",
      minDate: "2024-03-01",
      maxDate: "2024-04-30",
    });

    expect(instance.prevMonthNav).toHaveClass("flatpickr-disabled");
    expect(instance.nextMonthNav).not.toHaveClass("flatpickr-disabled");

    instance.changeMonth(1);

    expect(instance.nextMonthNav).toHaveClass("flatpickr-disabled");
  });

  it("only listens on the document while open", () => {
    const add = vi.spyOn(document, "addEventListener");
    const remove = vi.spyOn(document, "removeEventListener");
    const { instance } = create();
    const count = (spy: typeof add, type: string) =>
      spy.mock.calls.filter(([t]) => t === type).length;

    expect(count(add, "mousedown")).toBe(0);

    instance.open();
    expect(count(add, "mousedown")).toBe(1);

    instance.close();
    expect(count(remove, "mousedown")).toBe(1);

    instance.open();
    expect(count(add, "mousedown")).toBe(2);
    add.mockRestore();
    remove.mockRestore();
  });

  it("removes every listener it added, without AbortSignal.any", () => {
    const anySpy = vi.spyOn(AbortSignal, "any");
    const add = vi.spyOn(document, "addEventListener");
    const remove = vi.spyOn(document, "removeEventListener");
    const { instance } = create();

    instance.open();
    instance.destroy();

    expect(anySpy).not.toHaveBeenCalled();
    const net = (type: string) =>
      add.mock.calls.filter(([t]) => t === type).length -
      remove.mock.calls.filter(([t]) => t === type).length;
    expect(net("mousedown")).toBe(0);
    expect(net("focus")).toBe(0);
    anySpy.mockRestore();
    add.mockRestore();
    remove.mockRestore();
  });

  it("restores the input and removes the calendar on destroy", () => {
    const { instance, input, host } = create({ static: true });
    expect(host.querySelector(".flatpickr-wrapper")).not.toBeNull();

    instance.destroy();

    expect(host.querySelector(".flatpickr-wrapper")).toBeNull();
    expect(host.querySelector(".flatpickr-calendar")).toBeNull();
    expect(input).not.toHaveClass("flatpickr-input");
    expect(input.parentElement).toBe(host);
  });

  it("takes down a calendar whose build throws", () => {
    const host = document.createElement("div");
    const input = document.createElement("input");
    host.appendChild(input);
    document.body.appendChild(host);
    const add = vi.spyOn(input, "addEventListener");
    const remove = vi.spyOn(input, "removeEventListener");

    expect(() =>
      createCalendarEngine(input, {
        static: true,
        defaultDate: "2024-03-15",
        formatDate: () => {
          throw new Error("format failed");
        },
      }),
    ).toThrow("format failed");

    expect(host.querySelector(".flatpickr-calendar")).toBeNull();
    expect(input).not.toHaveClass("flatpickr-input");
    expect(input.parentElement).toBe(host);
    expect(remove).toHaveBeenCalledTimes(add.mock.calls.length);
  });

  it("fires onOpen and onClose", () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();
    const { instance } = create({ onOpen, onClose });

    instance.open();
    instance.open();
    instance.close();

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape from the input", () => {
    const { instance, input } = create();
    instance.open();

    fireEvent.keyDown(input, { key: "Escape", keyCode: 27 });
    // Escape reaches the handler through the calendar, not the input.
    fireEvent.keyDown(instance.calendarContainer, {
      key: "Escape",
      keyCode: 27,
    });

    expect(instance.isOpen).toBe(false);
  });
});

describe("multiple mode", () => {
  it("toggles days and joins them with the conjunction", () => {
    const { instance, input } = create({
      mode: "multiple",
      defaultDate: "2024-03-01",
      conjunction: " | ",
    });

    day(instance, 5).click();
    expect(input.value).toBe("2024-03-01 | 2024-03-05");

    day(instance, 1).click();
    expect(input.value).toBe("2024-03-05");
  });
});

describe("range mode", () => {
  it("keeps the second input ignored when ignoredFocusElements is replaced", () => {
    const second = document.createElement("input");
    document.body.appendChild(second);
    const { instance } = create({ mode: "range", secondInput: second });
    const other = document.createElement("button");

    instance.set("ignoredFocusElements", [other]);

    expect(instance.config.ignoredFocusElements).toEqual([other, second]);
  });

  const rangeInputs = () => {
    const second = document.createElement("input");
    document.body.appendChild(second);
    return second;
  };

  it("writes each end to its own input", () => {
    const second = rangeInputs();
    const { instance, input } = create({
      mode: "range",
      secondInput: second,
    });
    instance.jumpToDate("2024-03-01");

    day(instance, 4).click();
    day(instance, 9).click();

    expect(input.value).toBe("2024-03-04");
    expect(second.value).toBe("2024-03-09");
  });

  it("swaps the ends when the second pick is earlier", () => {
    const second = rangeInputs();
    const { instance, input } = create({
      mode: "range",
      secondInput: second,
    });
    instance.jumpToDate("2024-03-01");

    day(instance, 12).click();
    day(instance, 6).click();

    expect(input.value).toBe("2024-03-06");
    expect(second.value).toBe("2024-03-12");
  });

  it("marks the range", () => {
    const second = rangeInputs();
    const { instance } = create({
      mode: "range",
      secondInput: second,
    });
    instance.jumpToDate("2024-03-01");

    day(instance, 4).click();
    day(instance, 8).click();

    expect(day(instance, 4)).toHaveClass("startRange");
    expect(day(instance, 6)).toHaveClass("inRange");
    expect(day(instance, 8)).toHaveClass("endRange");
  });
});

describe("week mode", () => {
  it("selects the first day of the clicked week and highlights it", () => {
    const { instance, input } = create({
      mode: "week",
      dateFormat: "Y-m-d",
      locale: { firstDayOfWeek: 1 },
      defaultDate: "2024-03-01",
    });

    day(instance, 13).click();

    expect(input.value).toBe("2024-03-11");
    for (const n of [11, 12, 13, 14, 15, 16, 17]) {
      expect(day(instance, n)).toHaveClass("week", "selected");
    }
    expect(day(instance, 18)).not.toHaveClass("week");
  });

  it("numbers a week by its middle day", () => {
    const { instance } = create({
      mode: "week",
      weekNumbers: true,
      locale: { firstDayOfWeek: 0 },
      defaultDate: "2024-03-01",
    });

    const weeks = [
      ...instance.calendarContainer.querySelectorAll(
        ".flatpickr-weeks .flatpickr-day",
      ),
    ].map((el) => el.textContent);

    expect(weeks).toEqual(["9", "10", "11", "12", "13", "14"]);
  });
});

describe("month mode", () => {
  it("selects a month and keeps the year", () => {
    const { instance, input } = create({
      mode: "month",
      dateFormat: "F Y",
      defaultDate: "March 2024",
    });

    const months = instance.calendarContainer.querySelectorAll<HTMLElement>(
      ".flatpickr-monthSelect-month",
    );
    expect(months).toHaveLength(12);
    expect(months[2]).toHaveClass("selected");

    months[5].click();

    expect(input.value).toBe("June 2024");
  });

  it("steps the year", () => {
    const { instance } = create({ mode: "month", defaultDate: "2024-03-01" });

    instance.nextMonthNav.click();

    expect(instance.currentYear).toBe(2025);
  });

  it("moves between months with the arrow keys", () => {
    const { instance } = create({ mode: "month", defaultDate: "2024-03-01" });
    instance.open();
    const months = instance.calendarContainer.querySelectorAll<HTMLElement>(
      ".flatpickr-monthSelect-month",
    );
    months[2].focus();

    fireEvent.keyDown(months[2], { key: "ArrowRight", keyCode: 39 });

    expect(document.activeElement).toBe(months[3]);
  });
});

describe("year mode", () => {
  it("shows a decade and labels it", () => {
    const { instance, input } = create({
      mode: "year",
      dateFormat: "Y",
      defaultDate: "2024",
    });

    expect(
      instance.calendarContainer.querySelector(".flatpickr-yearSelect-range"),
    ).toHaveTextContent("2019 - 2030");

    instance.calendarContainer
      .querySelector<HTMLElement>('[data-year="2026"]')
      ?.click();

    expect(input.value).toBe("2026");
  });

  it("moves a decade at a time", () => {
    const { instance } = create({
      mode: "year",
      dateFormat: "Y",
      defaultDate: "2024",
    });

    instance.nextMonthNav.click();

    expect(
      instance.calendarContainer.querySelector(".flatpickr-yearSelect-range"),
    ).toHaveTextContent("2029 - 2040");
  });
});

describe("keyboard", () => {
  it("moves focus across days and selects with Enter", () => {
    const { instance, input } = create({ defaultDate: "2024-03-10" });
    instance.open();
    day(instance, 10).focus();

    fireEvent.keyDown(document.activeElement as HTMLElement, {
      key: "ArrowRight",
      keyCode: 39,
    });
    expect(document.activeElement).toBe(day(instance, 11));

    fireEvent.keyDown(document.activeElement as HTMLElement, {
      key: "ArrowDown",
      keyCode: 40,
    });
    expect(document.activeElement).toBe(day(instance, 18));

    fireEvent.keyDown(document.activeElement as HTMLElement, {
      key: "Enter",
      keyCode: 13,
    });
    expect(input.value).toBe("2024-03-18");
  });

  const press = (key: string, keyCode: number, init: KeyboardEventInit = {}) =>
    fireEvent.keyDown(document.activeElement as HTMLElement, {
      key,
      keyCode,
      ...init,
    });
  const focusedDate = () =>
    (
      document.activeElement as HTMLElement & { dateObj?: Date }
    ).dateObj?.toDateString();

  it("moves a month with PageUp/PageDown and a year with Shift", () => {
    const { instance } = create({ defaultDate: "2024-01-31" });
    instance.open();
    day(instance, 31).focus();

    press("PageDown", 34);
    // February 2024 has 29 days.
    expect(focusedDate()).toBe(new Date(2024, 1, 29).toDateString());
    press("PageDown", 34, { shiftKey: true });
    expect(focusedDate()).toBe(new Date(2025, 1, 28).toDateString());
    press("PageUp", 33);
    expect(focusedDate()).toBe(new Date(2025, 0, 28).toDateString());
  });

  it("moves to the first and last day of the week with Home/End", () => {
    const { instance } = create({
      defaultDate: "2024-03-13",
      locale: { firstDayOfWeek: 1 },
    });
    instance.open();
    day(instance, 13).focus();

    press("Home", 36);
    expect(focusedDate()).toBe(new Date(2024, 2, 11).toDateString());
    press("End", 35);
    expect(focusedDate()).toBe(new Date(2024, 2, 17).toDateString());
  });

  it("selects the focused day with Space", () => {
    const { instance, input } = create({ defaultDate: "2024-03-01" });
    instance.open();
    day(instance, 12).focus();

    press(" ", 32);

    expect(input.value).toBe("2024-03-12");
  });

  it("steps the year with PageDown in the month grid", () => {
    const { instance } = create({
      mode: "month",
      defaultDate: "2024-03-01",
    });
    instance.open();
    const cells = () =>
      instance.calendarContainer.querySelectorAll<HTMLElement>(
        ".flatpickr-monthSelect-month",
      );
    cells()[4].focus();

    press("PageDown", 34);

    expect(instance.currentYear).toBe(2025);
    expect(document.activeElement).toBe(cells()[4]);
  });

  it("announces the month the view moves to", () => {
    const { instance } = create({ defaultDate: "2024-03-15" });
    const live = instance.calendarContainer.querySelector("[aria-live]");

    instance.changeMonth(1);

    expect(live).toHaveAttribute("aria-live", "polite");
    expect(live).toHaveTextContent("April 2024");
  });

  it("changes month with ctrl+arrow", () => {
    const { instance } = create({ defaultDate: "2024-03-10" });
    instance.open();
    day(instance, 10).focus();

    fireEvent.keyDown(document.activeElement as HTMLElement, {
      key: "ArrowRight",
      keyCode: 39,
      ctrlKey: true,
    });

    expect(instance.currentMonth).toBe(3);
  });
});

describe("flatpickr compatibility", () => {
  it("puts a year-first locale's year, its word, then the month", () => {
    const { instance } = create({ locale: "ja", defaultDate: "2024-03-15" });
    const header = instance.calendarContainer.querySelector(
      ".flatpickr-current-month",
    );
    const parts = [...(header?.children ?? [])].map((el) =>
      el.classList.contains("numInputWrapper")
        ? (el.querySelector("input") as HTMLInputElement).value
        : el.textContent,
    );

    expect(parts).toEqual(["2024", "年", "3月"]);
  });

  it("treats the `now` option as today", () => {
    const { instance } = create({ now: "2020-01-10" });

    expect(instance.currentYear).toBe(2020);
    expect(instance.currentMonth).toBe(0);
    expect(day(instance, 10)).toHaveClass("today");
  });

  it("renders a flatpickr l10n module", () => {
    // flatpickr/dist/l10n/de, verbatim.
    const German = {
      weekdays: {
        shorthand: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
        longhand: [
          "Sonntag",
          "Montag",
          "Dienstag",
          "Mittwoch",
          "Donnerstag",
          "Freitag",
          "Samstag",
        ],
      },
      months: {
        shorthand: [
          "Jan",
          "Feb",
          "Mär",
          "Apr",
          "Mai",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Okt",
          "Nov",
          "Dez",
        ],
        longhand: [
          "Januar",
          "Februar",
          "März",
          "April",
          "Mai",
          "Juni",
          "Juli",
          "August",
          "September",
          "Oktober",
          "November",
          "Dezember",
        ],
      },
      firstDayOfWeek: 1,
      weekAbbreviation: "KW",
      rangeSeparator: " bis ",
      scrollTitle: "Zum Ändern scrollen",
      toggleTitle: "Zum Umschalten klicken",
      time_24hr: true,
    };
    const { instance } = create({
      locale: German,
      defaultDate: "2024-03-15",
      weekNumbers: true,
    });
    const { calendarContainer } = instance;
    const text = (selector: string) =>
      [...calendarContainer.querySelectorAll(selector)].map(
        (el) => el.textContent,
      );

    expect(text(".cur-month")).toEqual(["März"]);
    expect(text(".flatpickr-weekday")).toEqual([
      "KW",
      "Mo",
      "Di",
      "Mi",
      "Do",
      "Fr",
      "Sa",
      "So",
    ]);
    expect(day(instance, 15)).toHaveAttribute("aria-label", "März 15, 2024");
  });
});
