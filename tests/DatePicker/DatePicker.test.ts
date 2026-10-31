import { fireEvent, render, screen, within } from "@testing-library/svelte";
import type DatePickerComponent from "carbon-components-svelte/DatePicker/DatePicker.svelte";
import type { ComponentProps } from "svelte";
import { tick } from "svelte";
import { flushMacrotask } from "../utils/flush-macrotask";
import { getBoundText } from "../utils/get-bound-text";
import { user } from "../utils/user";
import DatePickerFluidRange from "./DatePicker.fluidRange.test.svelte";
import DatePicker from "./DatePicker.test.svelte";
import DatePickerDisplayFormat from "./DatePickerDisplayFormat.test.svelte";
import DatePickerHost from "./DatePickerHost.test.svelte";
import DatePickerIgnoredFocus from "./DatePickerIgnoredFocus.test.svelte";
import DatePickerInlineOptions from "./DatePickerInlineOptions.test.svelte";
import DatePickerRange from "./DatePickerRange.test.svelte";
import DatePickerSelectedDates from "./DatePickerSelectedDates.test.svelte";
import { getCalendarInstance, renderCalendar } from "./calendar-instance";
import {
  clickNextMonth,
  dayByLabel,
  findDay,
  firstDay,
  getDayByNumber,
  getDays,
  openCalendar,
  yearFirst,
} from "./helpers";

/**
 * The calendar marks the current date as today. Pin it so assertions about
 * the shown month cannot depend on the real date.
 */
function pinToday(date: Date) {
  vi.useFakeTimers({ toFake: ["Date"], now: date });
}

describe("DatePicker", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("does not select text in multiple mode when selectTextOnFocus is true", async () => {
    render(DatePicker, {
      datePickerType: "multiple",
      selectTextOnFocus: true,
      value: "01/01/2023",
    });

    const input = screen.getByLabelText("Date");
    assert(input instanceof HTMLInputElement);
    const select = vi.spyOn(input, "select");
    await user.click(input);
    await tick();

    expect(select).not.toHaveBeenCalled();
  });

  it("applies the size prop to the input", () => {
    render(DatePicker, { size: "sm" });

    expect(screen.getByLabelText("Date")).toHaveClass(
      "bx--date-picker__input--sm",
    );
  });

  it("renders single mode", async () => {
    const { container } = render(DatePicker, { datePickerType: "single" });

    const input = screen.getByLabelText("Date");
    expect(input).toHaveAttribute("placeholder", "mm/dd/yyyy");

    const wrapper = container.querySelector(".bx--date-picker");
    expect(wrapper).toHaveClass("bx--date-picker--single");

    expect(screen.queryByLabelText(/^Choose a /)).not.toBeInTheDocument();
    const calendar = await openCalendar();
    expect(calendar).toBeInTheDocument();
    expect(calendar).not.toHaveClass("bx--date-picker__calendar--month");
  });

  // Each of these types reuses the single-mode input width styling.
  it.each(["multiple", "month", "year", "week"] as const)(
    "uses single-width styling for %s mode",
    (datePickerType) => {
      const { container } = render(DatePicker, { datePickerType });

      expect(container.querySelector(".bx--date-picker")).toHaveClass(
        "bx--date-picker--single",
      );
    },
  );

  it("renders single-letter weekday shorthands for locale='en'", async () => {
    const { container } = render(DatePicker, { datePickerType: "single" });

    await openCalendar();

    const weekdays = Array.from(
      container.querySelectorAll(".bx--date-picker__weekday"),
    ).map((node) => node.textContent?.trim());

    expect(weekdays).toEqual(["S", "M", "T", "W", "Th", "F", "S"]);
  });

  it("starts the week on `firstDayOfWeek`, and follows it when it changes", async () => {
    const { container, rerender } = render(DatePicker, {
      datePickerType: "single",
      firstDayOfWeek: 1,
    });
    const weekdays = () =>
      Array.from(container.querySelectorAll(".bx--date-picker__weekday")).map(
        (node) => node.textContent?.trim(),
      );

    await openCalendar();
    expect(weekdays()).toEqual(["M", "T", "W", "Th", "F", "S", "S"]);

    await rerender({ datePickerType: "single", firstDayOfWeek: 6 });
    expect(weekdays()).toEqual(["S", "S", "M", "T", "W", "Th", "F"]);
  });

  it("shows week numbers with `weekNumbers`, and removes them when unset", async () => {
    const { container, rerender } = render(DatePicker, {
      datePickerType: "single",
      value: "01/15/2026",
      weekNumbers: true,
    });

    await openCalendar();
    const weeks = () =>
      Array.from(
        container.querySelectorAll(".bx--date-picker__week-number"),
      ).map((node) => node.textContent);
    expect(weeks().slice(0, 3)).toEqual(["1", "2", "3"]);

    await rerender({
      datePickerType: "single",
      value: "01/15/2026",
      weekNumbers: false,
    });
    await vi.waitFor(() => expect(weeks()).toEqual([]));
  });

  it("renders month before year in the calendar header for locale='en'", async () => {
    const { container } = render(DatePicker, {
      datePickerType: "single",
      locale: "en",
    });

    await openCalendar();

    expect(yearFirst(container)).toBe(false);
  });

  it("renders year before month in the calendar header for locale='ja'", async () => {
    const { container } = render(DatePicker, {
      datePickerType: "single",
      locale: "ja",
    });

    await openCalendar();

    expect(yearFirst(container)).toBe(true);
  });

  describe("changing locale while open", () => {
    const de = {
      months: {
        longhand:
          "Januar Februar März April Mai Juni Juli August September Oktober November Dezember".split(
            " ",
          ),
        shorthand: [],
      },
      weekdays: {
        shorthand: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
        longhand: [],
      },
      firstDayOfWeek: 1,
    };

    async function openThenSetLocale(locale: unknown) {
      const { rerender } = render(DatePicker, {
        datePickerType: "single",
        value: "03/15/2024",
      });
      const calendar = await openCalendar();
      await rerender({
        datePickerType: "single",
        value: "03/15/2024",
        locale: locale as never,
      });
      await tick();
      const month = calendar.querySelector(".bx--date-picker__month-label");
      assert(month);
      return { calendar, month };
    }

    it("updates the header month", async () => {
      const { calendar, month } = await openThenSetLocale(de);

      expect(month).toHaveTextContent("März");
      expect(yearFirst(calendar)).toBe(false);
    });

    it("keeps the new locale's header after a month change", async () => {
      const { calendar } = await openThenSetLocale("ja");
      await clickNextMonth(calendar);

      expect(yearFirst(calendar)).toBe(true);
    });

    it("moves the year first for a year-first locale", async () => {
      const { calendar } = await openThenSetLocale("ja");

      expect(yearFirst(calendar)).toBe(true);
    });
  });

  it("renders range mode", async () => {
    const { container } = render(DatePickerRange);

    const inputStart = screen.getByLabelText("Start date");
    const inputEnd = screen.getByLabelText("End date");

    expect(inputStart).toHaveAttribute("placeholder", "mm/dd/yyyy");
    expect(inputEnd).toHaveAttribute("placeholder", "mm/dd/yyyy");

    const wrapper = container.querySelector(".bx--date-picker");
    expect(wrapper).toHaveClass("bx--date-picker--range");

    expect(screen.queryByLabelText(/^Choose a /)).not.toBeInTheDocument();
    await user.click(inputStart);
    expect(await screen.findByLabelText(/^Choose a /)).toBeInTheDocument();
  });

  // Regression test: the invalid/warn/calendar icons all render after the
  // input in the DOM, so a `.icon ~ .input` CSS sibling selector for
  // padding-right can never match. Long values (for example many dates in
  // "multiple" mode) would render underneath the icon undetected until now.
  describe("icon padding", () => {
    it("adds padding for the calendar icon", () => {
      render(DatePicker, { datePickerType: "single" });
      const input = screen.getByLabelText("Date");
      expect(input).toHaveClass("bx--date-picker__input--with-icon");
    });

    it("does not add icon padding without a calendar (simple mode)", () => {
      render(DatePicker);
      const input = screen.getByLabelText("Date");
      expect(input).not.toHaveClass("bx--date-picker__input--with-icon");
    });

    it("adds icon padding when invalid, even without a calendar", () => {
      render(DatePicker, { invalid: true, invalidText: "Invalid" });
      const input = screen.getByLabelText("Date");
      expect(input).toHaveClass("bx--date-picker__input--with-icon");
    });
  });

  describe("readonly", () => {
    it("forwards the readonly attribute and marks the label", () => {
      render(DatePicker, { readonly: true });
      const input = screen.getByLabelText("Date");
      expect(input).toHaveAttribute("readonly");
      expect(screen.getByText("Date")).toHaveClass("bx--label--readonly");
    });

    it("does not open the calendar on click in single mode when readonly", async () => {
      render(DatePicker, { datePickerType: "single", readonly: true });
      const calendar = await openCalendar();
      expect(calendar).not.toHaveClass("bx--date-picker__calendar--open");
    });

    it("closes an open calendar when it becomes readonly", async () => {
      const { rerender } = render(DatePicker, { datePickerType: "single" });
      const calendar = await openCalendar();
      expect(calendar).toHaveClass("bx--date-picker__calendar--open");

      await rerender({ readonly: true });

      await vi.waitFor(() =>
        expect(calendar).not.toHaveClass("bx--date-picker__calendar--open"),
      );
    });

    it("does not open the calendar on ArrowDown when readonly", async () => {
      render(DatePicker, { datePickerType: "single", readonly: true });
      const input = screen.getByLabelText("Date");
      input.focus();
      await user.keyboard("{ArrowDown}");
      const calendar = await screen.findByLabelText(/^Choose a /);
      expect(calendar).not.toHaveClass("bx--date-picker__calendar--open");
    });

    it("forwards the readonly attribute to both inputs in range mode", async () => {
      render(DatePickerRange, { readonly: true });
      // Wait for flatpickr (including the range plugin's onReady) to finish.
      await screen.findByLabelText(/^Choose a /);
      const start = screen.getByLabelText("Start date");
      const end = screen.getByLabelText("End date");
      expect(start).toHaveAttribute("readonly");
      expect(end).toHaveAttribute("readonly");
    });
  });

  describe("ArrowDown", () => {
    /** Collects errors thrown by event listeners, which jsdom reports on window. */
    function captureListenerErrors() {
      const errors: unknown[] = [];
      const onError = (event: ErrorEvent) => {
        errors.push(event.error);
        event.preventDefault();
      };
      window.addEventListener("error", onError);
      return {
        errors,
        stop: () => window.removeEventListener("error", onError),
      };
    }

    it("is ignored when the calendar failed to initialize", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const capture = captureListenerErrors();
      render(DatePicker, {
        datePickerType: "single",
        value: "03/15/2024",
        formatDate: () => {
          throw new Error("format failed");
        },
      });
      await vi.waitFor(() =>
        expect(consoleError).toHaveBeenCalledWith(
          expect.objectContaining({ message: "format failed" }),
        ),
      );
      const input = screen.getByLabelText("Date");
      input.focus();

      const notPrevented = await fireEvent.keyDown(input, { key: "ArrowDown" });
      capture.stop();

      expect(notPrevented).toBe(true);
      expect(capture.errors).toEqual([]);
    });

    it("focuses an enabled day when today is disabled", async () => {
      const now = new Date();
      render(DatePicker, {
        datePickerType: "single",
        disabledDates: [
          new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        ],
      });
      const calendar = await screen.findByLabelText(/^Choose a /);
      const input = screen.getByLabelText("Date");
      input.focus();

      await fireEvent.keyDown(input, { key: "ArrowDown" });

      expect(calendar).toHaveClass("bx--date-picker__calendar--open");
      expect(document.activeElement).toHaveClass("bx--date-picker__day");
      expect(document.activeElement).not.toHaveClass(
        "bx--date-picker__day--disabled",
      );
    });

    it("focuses a day in the displayed month after navigating away from today", async () => {
      render(DatePicker, { datePickerType: "single" });
      const input = screen.getByLabelText("Date");
      const calendar = await openCalendar();
      await clickNextMonth(calendar);
      const shownMonth = calendar.querySelector(
        ".bx--date-picker__month-label",
      )?.textContent;
      input.focus();

      await fireEvent.keyDown(input, { key: "ArrowDown" });

      expect(calendar.contains(document.activeElement)).toBe(true);
      expect(document.activeElement).toHaveClass("bx--date-picker__day");
      expect(
        calendar.querySelector(".bx--date-picker__month-label")?.textContent,
      ).toBe(shownMonth);
    });

    it("opens the calendar and moves focus into it", async () => {
      render(DatePicker, { datePickerType: "single" });
      const calendar = await screen.findByLabelText(/^Choose a /);
      const input = screen.getByLabelText("Date");
      input.focus();

      const notPrevented = await fireEvent.keyDown(input, { key: "ArrowDown" });

      expect(notPrevented).toBe(false);
      expect(calendar).toHaveClass("bx--date-picker__calendar--open");
      expect(document.activeElement).toHaveClass("bx--date-picker__day");
    });
  });

  describe("Enter in the calendar", () => {
    // A browser's Enter carries `keyCode`, which flatpickr's grid handler
    // switches on. user-event's `{Enter}` does not, so fire it by hand.
    async function pressEnterOnFocusedDay() {
      const day = document.activeElement;
      assert(day instanceof HTMLElement);
      const label = day.getAttribute("aria-label");
      await fireEvent.keyDown(day, { key: "Enter", keyCode: 13 });
      await tick();
      await flushMacrotask();
      return label;
    }

    it("keeps focus on the day after adding it in multiple mode", async () => {
      // ArrowRight from the last day of a month opens the next month, where
      // the first selected day is not shown. Start mid-month.
      vi.useFakeTimers({ toFake: ["Date"], now: new Date(2026, 9, 15, 12) });
      onTestFinished(() => vi.useRealTimers());
      render(DatePicker, { datePickerType: "multiple" });
      const input = screen.getByLabelText("Date");
      const calendar = await screen.findByLabelText(/^Choose a /);
      input.focus();
      await fireEvent.keyDown(input, { key: "ArrowDown" });

      const label = await pressEnterOnFocusedDay();

      expect(calendar).toHaveClass("bx--date-picker__calendar--open");
      expect(document.activeElement).toHaveClass("bx--date-picker__day");
      expect(document.activeElement).toHaveClass(
        "bx--date-picker__day--selected",
      );
      expect(document.activeElement).toHaveAttribute("aria-label", label);

      // The next day can be added from the keyboard as well.
      assert(document.activeElement instanceof HTMLElement);
      await fireEvent.keyDown(document.activeElement, {
        key: "ArrowRight",
        keyCode: 39,
      });
      await pressEnterOnFocusedDay();
      expect(
        calendar.querySelectorAll(
          ".bx--date-picker__day.bx--date-picker__day--selected",
        ),
      ).toHaveLength(2);
    });

    it("keeps focus on the start day in range mode", async () => {
      render(DatePickerRange);
      const input = screen.getByLabelText("Start date");
      const calendar = await screen.findByLabelText(/^Choose a /);
      input.focus();
      await fireEvent.keyDown(input, { key: "ArrowDown" });

      const label = await pressEnterOnFocusedDay();

      expect(calendar).toHaveClass("bx--date-picker__calendar--open");
      expect(document.activeElement).toHaveClass("bx--date-picker__day");
      expect(document.activeElement).toHaveAttribute("aria-label", label);
    });

    it("still returns focus to the input when a single pick closes", async () => {
      render(DatePicker, { datePickerType: "single" });
      const input = screen.getByLabelText("Date");
      const calendar = await screen.findByLabelText(/^Choose a /);
      input.focus();
      await fireEvent.keyDown(input, { key: "ArrowDown" });

      await pressEnterOnFocusedDay();

      expect(calendar).not.toHaveClass("bx--date-picker__calendar--open");
      expect(input).toHaveFocus();
    });
  });

  describe("clearable", () => {
    const queryClear = () =>
      screen.queryByRole("button", { name: "Clear date" });

    it("renders no clear button by default or without a value", () => {
      const { unmount } = render(DatePicker, { value: "01/15/2024" });
      expect(queryClear()).not.toBeInTheDocument();
      unmount();

      render(DatePicker, { clearable: true });
      expect(queryClear()).not.toBeInTheDocument();
    });

    it("clears a single date, dispatches change and clear, and refocuses the input", async () => {
      const onchange = vi.fn();
      const onclear = vi.fn();
      render(DatePicker, {
        datePickerType: "single",
        value: "01/15/2024",
        clearable: true,
        onchange,
        onclear,
      });
      const calendar = await screen.findByLabelText(/^Choose a /);
      const input = screen.getByLabelText("Date");

      await user.click(queryClear() as HTMLElement);

      expect(input).toHaveValue("");
      expect(onchange).toHaveBeenCalledTimes(1);
      expect(onchange.mock.calls[0][0].detail.selectedDates).toEqual([]);
      expect(onclear).toHaveBeenCalledTimes(1);
      expect(input).toHaveFocus();
      expect(calendar).toHaveClass("bx--date-picker__calendar--open");
      expect(
        calendar.querySelector(
          ".bx--date-picker__day.bx--date-picker__day--selected",
        ),
      ).toBeNull();
      expect(queryClear()).not.toBeInTheDocument();
    });

    it("clears a simple field", async () => {
      const onchange = vi.fn();
      const onclear = vi.fn();
      render(DatePicker, { clearable: true, onchange, onclear });
      const input = screen.getByLabelText("Date");
      await user.type(input, "01/15/2024");

      // Clicking the button first blurs the input, which commits the typed
      // text with its own `change`.
      await user.click(queryClear() as HTMLElement);

      expect(input).toHaveValue("");
      expect(onchange.mock.calls.at(-1)?.[0].detail).toBe("");
      expect(onclear).toHaveBeenCalledTimes(1);
    });

    it("renders one button on the end input and clears both dates", async () => {
      const onchange = vi.fn();
      render(DatePickerRange, {
        clearable: true,
        valueFrom: "01/10/2024",
        valueTo: "01/20/2024",
        onchange,
      });
      await screen.findByLabelText(/^Choose a /);
      const buttons = screen.getAllByRole("button", { name: "Clear date" });
      expect(buttons).toHaveLength(1);
      const endWrapper = screen
        .getByLabelText("End date")
        .closest(".bx--date-picker-input__wrapper");
      expect(endWrapper).toContainElement(buttons[0]);

      await user.click(buttons[0]);

      expect(screen.getByLabelText("Start date")).toHaveValue("");
      expect(screen.getByLabelText("End date")).toHaveValue("");
      expect(onchange.mock.calls.at(-1)?.[0].detail.dateStr).toEqual({
        from: "",
        to: "",
      });
    });

    it.each([
      ["readonly", { readonly: true }],
      ["disabled", { disabled: true }],
    ])("renders no clear button when %s", (_, props) => {
      render(DatePicker, { value: "01/15/2024", clearable: true, ...props });
      expect(queryClear()).not.toBeInTheDocument();
    });
  });

  it("keeps allowInput={false} across mount and readonly toggles", async () => {
    const props: ComponentProps<DatePicker> = {
      datePickerType: "single",
      allowInput: false,
    };
    const { rerender } = render(DatePicker, props);

    const input = screen.getByLabelText("Date");
    await vi.waitFor(() => getCalendarInstance(input));
    await tick();
    const fp = getCalendarInstance(input);
    expect(fp.config.allowInput).toBe(false);
    expect(fp.config.clickOpens).toBe(true);

    await rerender({ ...props, readonly: true });
    await tick();
    expect(fp.config.clickOpens).toBe(false);
    await rerender({ ...props, readonly: false });
    await tick();
    expect(fp.config.allowInput).toBe(false);
    expect(fp.config.clickOpens).toBe(true);
  });

  describe("change event count", () => {
    it("dispatches change once for a calendar selection", async () => {
      const onchange = vi.fn();
      render(DatePicker, {
        datePickerType: "single",
        value: "03/15/2024",
        onchange,
      });
      const calendar = await openCalendar();
      const day = findDay(calendar, "10");
      onchange.mockClear();

      await user.click(day);
      await tick();
      expect(onchange).toHaveBeenCalledTimes(1);
      expect(onchange.mock.calls[0][0].detail.dateStr).toBe("03/10/2024");
    });

    it("still dispatches change once for a native change on the input", async () => {
      const onchange = vi.fn();
      render(DatePicker, { datePickerType: "single", onchange });
      const input = screen.getByLabelText("Date");
      await screen.findByLabelText(/^Choose a /);
      onchange.mockClear();

      input.dispatchEvent(new Event("change", { bubbles: true }));
      await tick();
      expect(onchange).toHaveBeenCalledTimes(1);
    });
  });

  it("types the open event", () => {
    type Events = import("svelte").ComponentEvents<DatePickerComponent>;

    expectTypeOf<Events>().toHaveProperty("open");
    expectTypeOf<Events["open"]["detail"]["selectedDates"]>().toEqualTypeOf<
      Date[]
    >();
  });

  describe("short on a non-simple picker", () => {
    it("warns once that short has no effect", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { rerender } = render(DatePicker, {
        datePickerType: "single",
        short: true,
      });
      await rerender({ datePickerType: "single", short: true });

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        '[carbon-components-svelte] DatePicker: short only applies to datePickerType="simple"; it has no effect on "single".',
      );
    });

    it("stays silent on a simple picker", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(DatePicker, { datePickerType: "simple", short: true });
      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe("reactive datePickerType", () => {
    it("rebuilds the calendar when the type changes after mount", async () => {
      const { rerender } = render(DatePicker, { datePickerType: "single" });
      const dayCalendar = await openCalendar();
      expect(
        dayCalendar.querySelector(".bx--date-picker__grid"),
      ).not.toBeInTheDocument();

      await rerender({ datePickerType: "month", dateFormat: "F Y" });
      await vi.waitFor(() => {
        const calendars = screen.getAllByLabelText(/^Choose a /);
        expect(calendars).toHaveLength(1);
        expect(
          calendars[0].querySelector(".bx--date-picker__grid"),
        ).toBeInTheDocument();
      });
      expect(dayCalendar).not.toBeInTheDocument();
    });

    it("drops the calendar for simple and creates one when leaving it", async () => {
      const { rerender } = render(DatePicker, { datePickerType: "single" });
      await screen.findByLabelText(/^Choose a /);

      await rerender({ datePickerType: "simple" });
      await vi.waitFor(() =>
        expect(screen.queryByLabelText(/^Choose a /)).not.toBeInTheDocument(),
      );

      await rerender({ datePickerType: "single" });
      expect(await screen.findByLabelText(/^Choose a /)).toBeInTheDocument();
    });

    it("keeps the selected date across a type change with the same format", async () => {
      const { rerender } = render(DatePicker, {
        datePickerType: "single",
        value: "03/15/2024",
      });
      await screen.findByLabelText(/^Choose a /);

      await rerender({ datePickerType: "multiple", value: "03/15/2024" });
      const input = screen.getByLabelText("Date");
      await vi.waitFor(() => {
        const calendar = getCalendarInstance(input);
        expect(calendar.config.mode).toBe("multiple");
        expect(calendar.selectedDates).toHaveLength(1);
      });
      expect(input).toHaveValue("03/15/2024");
    });
  });

  it("handles invalid state", () => {
    const { container } = render(DatePicker, {
      invalid: true,
      invalidText: "Invalid date",
    });
    const wrapper = container.querySelector(".bx--date-picker-input__wrapper");
    expect(wrapper).toHaveClass("bx--date-picker-input__wrapper--invalid");
  });

  it("handles warning state", () => {
    const { container } = render(DatePicker, {
      warn: true,
      warnText: "Warning message",
    });
    const wrapper = container.querySelector(".bx--date-picker-input__wrapper");
    expect(wrapper).toHaveClass("bx--date-picker-input__wrapper--warn");
  });

  it.each(["disabled", "readonly"] as const)(
    "suppresses invalid and warn states when %s",
    (state) => {
      const { container } = render(DatePicker, {
        [state]: true,
        invalid: true,
        invalidText: "Invalid date",
        warn: true,
        warnText: "Warning message",
      });

      const wrapper = container.querySelector(
        ".bx--date-picker-input__wrapper",
      );
      expect(wrapper).not.toHaveClass(
        "bx--date-picker-input__wrapper--invalid",
      );
      expect(wrapper).not.toHaveClass("bx--date-picker-input__wrapper--warn");
      expect(
        container.querySelector(".bx--date-picker__icon--invalid"),
      ).toBeNull();
      expect(
        container.querySelector(".bx--date-picker__icon--warn"),
      ).toBeNull();
    },
  );

  it("forwards focus event from the input", () => {
    const focusHandler = vi.fn();
    render(DatePicker, {
      props: {
        onfocus: focusHandler,
      },
    });

    const input = screen.getByLabelText("Date");
    input.focus();

    expect(focusHandler).toHaveBeenCalled();
    expect(focusHandler.mock.lastCall?.[0]).toBeInstanceOf(FocusEvent);
  });

  it("dispatches change event when manually typing in simple mode", async () => {
    const changeHandler = vi.fn();
    render(DatePicker, {
      props: {
        datePickerType: "simple",
        onchange: changeHandler,
      },
    });

    const input = screen.getByLabelText("Date");
    await user.type(input, "01/15/2024");
    await user.tab();

    expect(changeHandler).toHaveBeenCalled();
    expect(changeHandler.mock.lastCall?.[0]?.detail).toBe("01/15/2024");
  });

  it("dispatches change event when manually typing in single mode", async () => {
    const changeHandler = vi.fn();
    render(DatePicker, {
      props: {
        datePickerType: "single",
        onchange: changeHandler,
      },
    });

    const input = screen.getByLabelText("Date");
    await user.type(input, "01/15/2024");
    await user.tab();

    expect(changeHandler).toHaveBeenCalled();
    expect(changeHandler.mock.lastCall?.[0]?.detail).toMatchObject({
      dateStr: "01/15/2024",
    });
  });

  // Regression tests for https://github.com/carbon-design-system/carbon-components-svelte/issues/314
  // and https://github.com/carbon-design-system/carbon-components-svelte/issues/950
  it("dispatches change event when manually clearing in single mode", async () => {
    const changeHandler = vi.fn();
    render(DatePicker, {
      props: {
        datePickerType: "single",
        value: "01/15/2024",
        onchange: changeHandler,
      },
    });

    const input = screen.getByLabelText("Date");
    await user.clear(input);
    await user.tab();

    expect(changeHandler).toHaveBeenCalled();
    expect(changeHandler.mock.lastCall?.[0]?.detail).toMatchObject({
      dateStr: "",
    });
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/1862
  it("allows clearing range dates by setting valueFrom and valueTo to empty strings", async () => {
    const { rerender } = render(DatePickerRange, {
      props: {
        valueFrom: "01/15/2024",
        valueTo: "01/20/2024",
      },
    });

    const inputStart = screen.getByLabelText("Start date");
    const inputEnd = screen.getByLabelText("End date");

    await user.click(inputStart);
    expect(await screen.findByLabelText(/^Choose a /)).toBeInTheDocument();
    expect(inputStart).toHaveValue("01/15/2024");
    expect(inputEnd).toHaveValue("01/20/2024");

    rerender({ valueFrom: "", valueTo: "" });
    await tick();

    expect(inputStart).toHaveValue("");
    expect(inputEnd).toHaveValue("");
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/893
  it("syncs both inputs when range values are programmatically updated", async () => {
    const { rerender } = render(DatePickerRange, {
      props: {
        valueFrom: "01/01/2024",
        valueTo: "12/31/2024",
      },
    });

    const inputStart = screen.getByLabelText("Start date");
    const inputEnd = screen.getByLabelText("End date");

    await user.click(inputStart);
    expect(await screen.findByLabelText(/^Choose a /)).toBeInTheDocument();
    expect(inputStart).toHaveValue("01/01/2024");
    expect(inputEnd).toHaveValue("12/31/2024");

    // Simulate programmatic update (e.g., from a month filter).
    rerender({ valueFrom: "01/01/2024", valueTo: "01/31/2024" });
    await tick();

    expect(inputStart).toHaveValue("01/01/2024");
    expect(inputEnd).toHaveValue("01/31/2024");

    rerender({ valueFrom: "03/01/2024", valueTo: "03/31/2024" });
    await tick();

    expect(inputStart).toHaveValue("03/01/2024");
    expect(inputEnd).toHaveValue("03/31/2024");
  });

  // Regression test: afterUpdate should not call calendar.setDate
  // when the bound value has not actually changed. Previously every
  // reactive tick (e.g. an unrelated prop update) re-applied setDate.
  it("does not call calendar.setDate on unrelated reactive updates", async () => {
    const { rerender } = render(DatePicker, {
      props: {
        datePickerType: "single",
        // Not zero-padded, so it differs from the formatted selection and
        // only the `$inputValue !== prevValue` guard keeps setDate away.
        value: "1/15/2024",
      },
    });

    const input = screen.getByLabelText("Date");
    await openCalendar();

    const fp = getCalendarInstance(input);
    const setDateSpy = vi.spyOn(fp, "setDate");

    // Trigger a reactive update that does not change value/min/max/format.
    await rerender({ fullWidth: true });
    await tick();

    expect(setDateSpy).not.toHaveBeenCalled();
  });

  // Regression tests for https://github.com/carbon-design-system/carbon-components-svelte/issues/1362
  describe("pattern derived from dateFormat", () => {
    it("allows explicit pattern override on DatePickerInput", () => {
      render(DatePicker, {
        dateFormat: "Y-m-d",
        pattern: "\\d{4}-\\d{2}-\\d{2}",
      });

      const input = screen.getByLabelText("Date");
      expect(input).toHaveAttribute("pattern", "\\d{4}-\\d{2}-\\d{2}");
    });

    // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/2689
    // The HTML pattern attribute is evaluated with the `u` (Unicode) flag.
    // Escaped hyphens (`\-`) are invalid in Unicode mode and cause a SyntaxError,
    // which makes native form validation always fail.
    it.each([
      ["m/d/Y", "\\d{1,2}\\/\\d{1,2}\\/\\d{4}", "02/10/2026"],
      ["Y-m-d", "\\d{4}-\\d{1,2}-\\d{1,2}", "2026-02-10"],
      ["d.m.Y", "\\d{1,2}\\.\\d{1,2}\\.\\d{4}", "10.02.2026"],
      ["d/m/y", "\\d{1,2}\\/\\d{1,2}\\/\\d{2}", "10/02/26"],
      [
        "M j, Y",
        "(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \\d{1,2}, \\d{4}",
        "Feb 10, 2026",
      ],
    ])(
      "derives a Unicode (u) flag valid pattern for %s",
      (dateFormat, expectedPattern, sampleValue) => {
        render(DatePicker, { dateFormat });

        const input = screen.getByLabelText("Date");
        expect(input).toHaveAttribute("pattern", expectedPattern);

        // This is how browsers evaluate the HTML pattern attribute.
        const re = new RegExp(`^(?:${expectedPattern})$`, "u");
        expect(re.test(sampleValue)).toBe(true);
      },
    );

    // datePickerType="multiple" joins selected dates with flatpickr's default
    // ", " conjunction into one input value, so the pattern must accept one
    // or more repetitions instead of a single date.
    it("derives a pattern that accepts one or more comma-joined dates for datePickerType='multiple'", () => {
      render(DatePicker, { datePickerType: "multiple" });

      const input = screen.getByLabelText("Date");
      const pattern = input.getAttribute("pattern");
      const re = new RegExp(`^${pattern}$`);
      expect(re.test("02/10/2026")).toBe(true);
      expect(re.test("02/10/2026, 02/15/2026")).toBe(true);
      expect(re.test("02/10/2026, 02/15/2026, 03/01/2026")).toBe(true);
      expect(re.test("not a date")).toBe(false);

      // The HTML pattern attribute is evaluated with the `u` (Unicode) flag.
      const unicodeRe = new RegExp(`^(?:${pattern})$`, "u");
      expect(unicodeRe.test("02/10/2026, 02/15/2026")).toBe(true);
    });
  });

  describe("minDate and maxDate", () => {
    describe("dropping a selection that falls out of bounds", () => {
      const getDates = () => screen.getByTestId("dates").textContent?.trim();

      it("clears value in single mode", async () => {
        const onchange = vi.fn();
        const { rerender } = render(DatePickerSelectedDates, {
          value: "03/15/2024",
          onchange,
        });
        await screen.findByLabelText(/^Choose a /);

        await rerender({ minDate: "04/01/2024" });
        await tick();

        expect(screen.getByLabelText("Date")).toHaveValue("");
        expect(getBoundText()).toBe("||");
        expect(getDates()).toBe("");
        expect(onchange).not.toHaveBeenCalled();
      });

      it("drops only the out-of-bounds dates in multiple mode", async () => {
        const { rerender } = render(DatePickerSelectedDates, {
          datePickerType: "multiple",
          value: "03/10/2024, 03/20/2024",
        });
        await screen.findByLabelText(/^Choose a /);

        await rerender({ maxDate: "03/15/2024" });
        await tick();

        expect(screen.getByLabelText("Date")).toHaveValue("03/10/2024");
        expect(getBoundText()).toBe("03/10/2024||");
        expect(getDates()).toBe(new Date(2024, 2, 10).toDateString());
      });

      it("clears both ends of a range", async () => {
        const consoleError = vi.spyOn(console, "error");
        const onchange = vi.fn();
        const { rerender } = render(DatePickerSelectedDates, {
          datePickerType: "range",
          valueFrom: "03/10/2024",
          valueTo: "03/20/2024",
          onchange,
        });
        await screen.findByLabelText(/^Choose a /);

        await rerender({ minDate: "04/01/2024" });
        await tick();

        expect(screen.getByLabelText("Start date")).toHaveValue("");
        expect(screen.getByLabelText("End date")).toHaveValue("");
        expect(getBoundText()).toBe("||");
        expect(getDates()).toBe("");
        expect(onchange).not.toHaveBeenCalled();
        // flatpickr's range plugin threw here, aborting the option sync.
        expect(consoleError).not.toHaveBeenCalled();
      });

      it("mirrors a range that loses one end", async () => {
        const { rerender } = render(DatePickerSelectedDates, {
          datePickerType: "range",
          valueFrom: "03/10/2024",
          valueTo: "03/20/2024",
        });
        await screen.findByLabelText(/^Choose a /);

        await rerender({ maxDate: "03/15/2024" });
        await tick();

        expect(screen.getByLabelText("Start date")).toHaveValue("03/10/2024");
        expect(screen.getByLabelText("End date")).toHaveValue("");
        expect(getBoundText()).toBe("|03/10/2024|");
        expect(getDates()).toBe(new Date(2024, 2, 10).toDateString());
      });
    });
  });

  describe("initialMonth", () => {
    it("clamps into minDate when it falls outside", async () => {
      render(DatePicker, {
        datePickerType: "single",
        initialMonth: "01/01/2020",
        minDate: new Date(2021, 5, 10),
      });

      const calendar = await openCalendar();

      expect(
        calendar.querySelector(".bx--date-picker__month-label"),
      ).toHaveTextContent("June");
      expect(
        calendar.querySelector(".bx--date-picker__year-input"),
      ).toHaveValue(2021);
    });

    it("applies again when the calendar reopens after the selection is cleared", async () => {
      render(DatePicker, {
        datePickerType: "single",
        value: "01/05/2024",
        initialMonth: "04/01/2027",
        clearable: true,
      });

      const calendar = await openCalendar();
      expect(
        calendar.querySelector(".bx--date-picker__month-label"),
      ).toHaveTextContent("January");

      await user.click(screen.getByRole("button", { name: "Clear date" }));
      await user.keyboard("{Escape}");
      await user.click(screen.getByLabelText("Date"));

      expect(
        calendar.querySelector(".bx--date-picker__month-label"),
      ).toHaveTextContent("April");
      expect(
        calendar.querySelector(".bx--date-picker__year-input"),
      ).toHaveValue(2027);
    });

    it.each([
      ["month", "F Y", "April 2027", ".bx--date-picker__year-input", "2020"],
      ["year", "Y", "2027", ".bx--date-picker__decade", "2019 - 2030"],
    ] as const)(
      "is ignored in %s mode",
      async (datePickerType, dateFormat, initialMonth, selector, expected) => {
        pinToday(new Date(2020, 0, 10));
        render(DatePicker, {
          datePickerType,
          dateFormat,
          initialMonth,
        });

        const calendar = await openCalendar();

        const shown = calendar.querySelector(selector);
        assert(shown);
        expect(
          shown instanceof HTMLInputElement ? shown.value : shown.textContent,
        ).toBe(expected);
      },
    );

    it("shows the initial month when there is no selection", async () => {
      pinToday(new Date(2020, 0, 10));
      render(DatePicker, {
        datePickerType: "single",
        initialMonth: "04/01/2027",
      });

      const input = screen.getByLabelText("Date");
      const calendar = await openCalendar();

      expect(
        calendar.querySelector(".bx--date-picker__month-label"),
      ).toHaveTextContent("April");
      expect(
        calendar.querySelector(".bx--date-picker__year-input"),
      ).toHaveValue(2027);
      expect(input).toHaveValue("");
      expect(
        calendar.querySelector(
          ".bx--date-picker__day.bx--date-picker__day--selected",
        ),
      ).toBeNull();
      expect(
        calendar.querySelector(
          ".bx--date-picker__day.bx--date-picker__day--today",
        ),
      ).toBeNull();
    });

    it("is ignored once a value is selected", async () => {
      render(DatePicker, {
        datePickerType: "single",
        value: "01/05/2024",
        initialMonth: "04/01/2027",
      });

      const calendar = await openCalendar();

      expect(
        calendar.querySelector(".bx--date-picker__month-label"),
      ).toHaveTextContent("January");
      expect(
        calendar.querySelector(".bx--date-picker__year-input"),
      ).toHaveValue(2024);
    });

    it("clamps into maxDate when it falls outside", async () => {
      render(DatePicker, {
        datePickerType: "single",
        initialMonth: "08/01/2027",
        maxDate: new Date(2027, 2, 15),
      });

      const calendar = await openCalendar();

      expect(
        calendar.querySelector(".bx--date-picker__month-label"),
      ).toHaveTextContent("March");
      expect(
        calendar.querySelector(".bx--date-picker__year-input"),
      ).toHaveValue(2027);
    });

    it("updates the header when the prop changes with no selection", async () => {
      const { rerender } = render(DatePicker, {
        datePickerType: "single",
        initialMonth: "04/01/2027",
      });

      const calendar = await openCalendar();
      expect(
        calendar.querySelector(".bx--date-picker__month-label"),
      ).toHaveTextContent("April");

      await rerender({ datePickerType: "single", initialMonth: "09/01/2028" });
      await tick();

      expect(
        calendar.querySelector(".bx--date-picker__month-label"),
      ).toHaveTextContent("September");
      expect(
        calendar.querySelector(".bx--date-picker__year-input"),
      ).toHaveValue(2028);
    });

    it("does not update the header when the prop changes with a selection", async () => {
      const { rerender } = render(DatePicker, {
        datePickerType: "single",
        value: "01/05/2024",
        initialMonth: "04/01/2027",
      });

      const calendar = await openCalendar();
      expect(
        calendar.querySelector(".bx--date-picker__month-label"),
      ).toHaveTextContent("January");

      await rerender({
        datePickerType: "single",
        value: "01/05/2024",
        initialMonth: "09/01/2028",
      });
      await tick();

      expect(
        calendar.querySelector(".bx--date-picker__month-label"),
      ).toHaveTextContent("January");
    });

    it("ignores an unparseable value without throwing or logging an error", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      render(DatePicker, {
        datePickerType: "single",
        initialMonth: "not-a-date",
      });

      const calendar = await openCalendar();

      const currentMonthName = new Date().toLocaleString("en-US", {
        month: "long",
      });
      expect(
        calendar.querySelector(".bx--date-picker__month-label"),
      ).toHaveTextContent(currentMonthName);
      expect(consoleError).not.toHaveBeenCalled();
    });

    it("keeps a manually navigated month across an unrelated re-render", async () => {
      const { rerender } = render(DatePicker, {
        datePickerType: "single",
        initialMonth: "04/01/2027",
      });

      const calendar = await openCalendar();
      expect(
        calendar.querySelector(".bx--date-picker__month-label"),
      ).toHaveTextContent("April");

      await clickNextMonth(calendar);
      expect(
        calendar.querySelector(".bx--date-picker__month-label"),
      ).toHaveTextContent("May");
      expect(
        calendar.querySelector(".bx--date-picker__year-input"),
      ).toHaveValue(2027);

      // Unrelated re-render: same `initialMonth`, but `short` changes,
      // which re-triggers the `initCalendar` reactive statement.
      await rerender({
        datePickerType: "single",
        initialMonth: "04/01/2027",
        short: true,
      });
      await tick();

      expect(
        calendar.querySelector(".bx--date-picker__month-label"),
      ).toHaveTextContent("May");
      expect(
        calendar.querySelector(".bx--date-picker__year-input"),
      ).toHaveValue(2027);
    });
  });

  it("exposes the calendar as a labelled dialog with a grid of weeks", async () => {
    render(DatePicker, { datePickerType: "single", value: "03/15/2024" });

    await openCalendar();

    const dialog = screen.getByRole("dialog", { name: "Choose a date" });
    const grid = within(dialog).getByRole("grid", { name: "March 2024" });
    for (const row of within(grid).getAllByRole("row")) {
      expect(within(row).getAllByRole("gridcell")).toHaveLength(7);
    }
    expect(
      within(grid).getByRole("gridcell", { selected: true }),
    ).toHaveAccessibleName("Friday, March 15, 2024");
    expect(
      within(dialog).getByRole("button", { name: "Next month" }),
    ).toBeInTheDocument();
  });

  describe("calendar option props", () => {
    it("shows two months with months={2}", async () => {
      render(DatePicker, { datePickerType: "single", months: 2 });

      const calendar = await openCalendar();

      expect(calendar.querySelectorAll(".bx--date-picker__month").length).toBe(
        2,
      );
    });

    it("stays usable as a plain input when the calendar fails to initialize", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const { unmount } = render(DatePicker, {
        datePickerType: "single",
        value: "03/15/2024",
        formatDate: () => {
          throw new Error("format failed");
        },
      });

      const input = screen.getByLabelText("Date");
      await user.clear(input);
      await user.type(input, "01/01/2023");
      expect(input).toHaveValue("01/01/2023");
      // The failure is reported, not swallowed.
      expect(consoleError).toHaveBeenCalledWith(
        expect.objectContaining({ message: "format failed" }),
      );
      expect(() => unmount()).not.toThrow();
    });

    it("keeps the picked date when formatDate output is not parseable", async () => {
      render(DatePicker, {
        datePickerType: "single",
        value: "03/15/2024",
        formatDate: (date: Date) => `Day ${date.getDate()}`,
      });

      const input = screen.getByLabelText("Date");
      const calendar = await openCalendar();
      const day = findDay(calendar, "10");
      await user.click(day);
      await tick();

      expect(input).toHaveValue("Day 10");
      await user.click(input);
      const selected = calendar.querySelector(
        ".bx--date-picker__day.bx--date-picker__day--selected",
      );
      expect(selected).toHaveTextContent("10");
      expect(
        calendar.querySelector(".bx--date-picker__month-label"),
      ).toHaveTextContent("March");
    });

    it("labels the visible input when displayFormat is set", async () => {
      render(DatePicker, {
        datePickerType: "single",
        dateFormat: "Y-m-d",
        value: "2024-03-15",
        displayFormat: "F j, Y",
      });

      await vi.waitFor(() => {
        const input = screen.getByLabelText("Date");
        expect(input).toHaveAttribute("type", "text");
        expect(input).toHaveValue("March 15, 2024");
      });
      expect(document.querySelectorAll("[id]")).toHaveLength(
        new Set(Array.from(document.querySelectorAll("[id]"), (n) => n.id))
          .size,
      );
    });

    it("mirrors later state changes onto the displayFormat input", async () => {
      const props = {
        datePickerType: "single",
        helperText: "Pick a weekday",
        displayFormat: "F j, Y",
      } as const;
      const { rerender } = render(DatePicker, props);

      await vi.waitFor(() =>
        expect(screen.getByLabelText("Date")).toHaveAttribute("type", "text"),
      );
      const visible = screen.getByLabelText("Date");
      expect(visible).toBeEnabled();
      expect(visible).toHaveAccessibleDescription("Pick a weekday");

      await rerender({ ...props, disabled: true });
      await vi.waitFor(() => expect(visible).toBeDisabled());

      await rerender({ ...props, disabled: false, readonly: true });
      await vi.waitFor(() => {
        expect(visible).toBeEnabled();
        expect(visible).toHaveAttribute("readonly");
      });

      await rerender({
        ...props,
        readonly: false,
        invalid: true,
        invalidText: "Bad date",
      });
      await vi.waitFor(() => {
        expect(visible).not.toHaveAttribute("readonly");
        expect(visible).toHaveClass("bx--date-picker__input--invalid");
      });
      expect(visible).toHaveClass("bx--date-picker__input");
    });

    it("creates one calendar when props settle during init", async () => {
      const { container } = render(DatePicker, {
        datePickerType: "single",
        helperText: "Pick a weekday",
        displayFormat: "F j, Y",
      });

      const calendar = await screen.findByLabelText(/^Choose a /);
      await tick();
      const hidden =
        container.querySelector<HTMLInputElement>("input[type=hidden]");
      assert(hidden);
      expect(screen.getAllByLabelText(/^Choose a /)).toHaveLength(1);
      expect(getCalendarInstance(hidden).calendarContainer).toBe(calendar);
    });

    it("does not retry a failed init on every update", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const formatDate = vi.fn((): string => {
        throw new Error("format failed");
      });
      const props: ComponentProps<DatePicker> = {
        datePickerType: "single",
        value: "03/15/2024",
        formatDate,
      };
      const { rerender } = render(DatePicker, props);
      await tick();
      const attempts = formatDate.mock.calls.length;
      expect(attempts).toBeGreaterThan(0);

      await rerender({ ...props, helperText: "Changed" });
      await rerender({ ...props, invalid: true });
      await tick();
      expect(formatDate).toHaveBeenCalledTimes(attempts);
    });

    it("does not re-apply a range rule that is rebuilt with equal contents", async () => {
      function props(to = 14): ComponentProps<DatePicker> {
        return {
          datePickerType: "single",
          disabledDates: [{ from: "03/10/2024", to: new Date(2024, 2, to) }],
        };
      }
      const { rerender } = render(DatePicker, props());
      const input = screen.getByLabelText("Date");
      await screen.findByLabelText(/^Choose a /);
      const calendar = getCalendarInstance(input);
      const set = vi.spyOn(calendar, "set");

      await rerender(props());
      await rerender(props());
      expect(set).not.toHaveBeenCalled();

      await rerender(props(20));
      expect(set).toHaveBeenCalledWith("disable", expect.anything());
    });

    it("re-applies anchor when it points at another element", async () => {
      const first = document.createElement("div");
      const second = document.createElement("div");
      const props: ComponentProps<DatePicker> = {
        datePickerType: "single",
        portalMenu: true,
      };
      // `anchor` is also a mount option, so pass the props explicitly.
      const { rerender } = render(DatePicker, {
        props: { ...props, anchor: first },
      });
      const input = screen.getByLabelText("Date");
      await screen.findByLabelText(/^Choose a /);
      const calendar = getCalendarInstance(input);
      const set = vi.spyOn(calendar, "set");

      await rerender({ ...props, anchor: second });
      expect(set).toHaveBeenCalledWith("positionElement", second);
    });

    it("does not re-apply a Date that is rebuilt with an equal value", async () => {
      function props(): ComponentProps<DatePicker> {
        return {
          datePickerType: "single",
          minDate: new Date(2024, 0, 1),
          maxDate: new Date(2024, 11, 31),
          disabledDates: [new Date(2024, 5, 15)],
        };
      }
      const { rerender } = render(DatePicker, props());
      const input = screen.getByLabelText("Date");
      await screen.findByLabelText(/^Choose a /);
      const calendar = getCalendarInstance(input);
      const set = vi.spyOn(calendar, "set");

      await rerender(props());
      await rerender(props());
      expect(set).not.toHaveBeenCalled();

      await rerender({ ...props(), minDate: new Date(2024, 1, 1) });
      expect(set).toHaveBeenCalledWith("minDate", new Date(2024, 1, 1));
    });

    it("does not re-apply an inline disabledDates array with equal items", async () => {
      let ready = false;
      const { rerender } = render(DatePickerInlineOptions, {
        oncalendar: (cal) => {
          ready = Boolean(cal);
        },
      });
      await vi.waitFor(() => expect(ready).toBe(true));
      const set = vi.spyOn(
        getCalendarInstance(screen.getByLabelText("Date")),
        "set",
      );

      await rerender({ renders: 1 });
      await rerender({ renders: 2 });
      expect(screen.getByText("Render 2")).toBeInTheDocument();
      expect(set).not.toHaveBeenCalledWith("disable", expect.anything());
    });

    it("stays open when a keepOpenFor element is clicked", async () => {
      render(DatePickerIgnoredFocus);

      await user.click(await screen.findByLabelText("Date"));
      const calendar = await screen.findByLabelText(/^Choose a /);
      expect(calendar).toHaveClass("bx--date-picker__calendar--open");

      await user.click(screen.getByRole("button", { name: "Preset" }));
      expect(calendar).toHaveClass("bx--date-picker__calendar--open");

      await user.click(screen.getByRole("button", { name: "Elsewhere" }));
      expect(calendar).not.toHaveClass("bx--date-picker__calendar--open");
    });

    it('abbreviates the month label when monthLabel is "short"', async () => {
      render(DatePicker, {
        datePickerType: "single",
        value: "09/15/2024",
        monthLabel: "short",
      });

      const calendar = await openCalendar();
      const month = calendar.querySelector(".bx--date-picker__month-label");
      expect(month).toHaveTextContent(/^Sep$/);

      // The label is rewritten on month change as well as on open.
      await clickNextMonth(calendar);
      expect(
        calendar.querySelector(".bx--date-picker__month-label"),
      ).toHaveTextContent(/^Oct$/);
    });

    it("keeps the calendar open after selecting a date when closeOnSelect is false", async () => {
      render(DatePicker, { datePickerType: "single", closeOnSelect: false });

      const calendar = await openCalendar();
      const day = firstDay(calendar);

      expect(calendar).toHaveClass("bx--date-picker__calendar--open");
      expect(day).toBeInTheDocument();

      await user.click(day);

      expect(calendar).toHaveClass("bx--date-picker__calendar--open");
    });

    it("disables the open/close animation by default", async () => {
      const { unmount } = render(DatePicker, { datePickerType: "single" });

      let input = screen.getByLabelText("Date");
      await user.click(input);
      await screen.findByLabelText(/^Choose a /);
      expect(getCalendarInstance(input).config.animate).toBe(false);

      unmount();

      render(DatePicker, { datePickerType: "single", animate: true });
      input = screen.getByLabelText("Date");
      await user.click(input);
      await screen.findByLabelText(/^Choose a /);
      expect(getCalendarInstance(input).config.animate).toBe(true);
    });

    // axe-core flags out-of-range days for contrast unless they carry
    // aria-disabled, which WCAG 1.4.3 exempts as an inactive component.
    it("marks out-of-range and disabledDates days aria-disabled", async () => {
      const { container } = render(DatePicker, {
        datePickerType: "single",
        value: "03/01/2024",
        minDate: new Date(2024, 2, 1),
        maxDate: new Date(2024, 2, 31),
        disabledDates: ["03/15/2024"],
      });

      const calendar = await openCalendar();

      const disabledDays = container.querySelectorAll(
        ".bx--date-picker__day.bx--date-picker__day--disabled",
      );
      expect(disabledDays.length).toBeGreaterThan(1);
      for (const day of disabledDays) {
        expect(day).toHaveAttribute("aria-disabled", "true");
      }
      expect(getDayByNumber(calendar, 15)).toHaveClass(
        "bx--date-picker__day--disabled",
      );
    });
  });

  describe("disabledDates and enabledDates", () => {
    it("disables dates matching a string, a Date, a range, and a predicate", async () => {
      render(DatePicker, {
        datePickerType: "single",
        value: "03/01/2024",
        disabledDates: [
          "03/09/2024",
          new Date(2024, 2, 10),
          { from: "03/12/2024", to: "03/14/2024" },
          (date: Date) => date.getDate() === 20,
        ],
      });

      const input = screen.getByLabelText("Date");
      const calendar = await openCalendar();

      for (const day of [9, 10, 12, 13, 14, 20]) {
        const dayElem = getDayByNumber(calendar, day);
        expect(dayElem).toHaveClass("bx--date-picker__day--disabled");
        expect(dayElem).toHaveAttribute("aria-disabled", "true");
      }

      const day9 = getDayByNumber(calendar, 9);
      await user.click(day9);
      expect(input).toHaveValue("03/01/2024");
    });

    it("enables only matching dates via enabledDates", async () => {
      // The anchor `value` must itself be an enabled date: flatpickr
      // filters an invalid preloaded date against `enable`/`disable` before
      // picking the displayed month, so an anchor outside the rule would
      // silently fall back to today's month instead of March 2024.
      render(DatePicker, {
        datePickerType: "single",
        value: "03/15/2024",
        enabledDates: ["03/15/2024"],
      });

      const calendar = await openCalendar();

      expect(getDayByNumber(calendar, 15)).not.toHaveClass(
        "bx--date-picker__day--disabled",
      );
      expect(getDayByNumber(calendar, 16)).toHaveClass(
        "bx--date-picker__day--disabled",
      );
    });

    it("reassigning disabledDates updates an open calendar", async () => {
      const { rerender } = render(DatePicker, {
        datePickerType: "single",
        value: "03/01/2024",
      });

      const calendar = await openCalendar();

      expect(getDayByNumber(calendar, 9)).not.toHaveClass(
        "bx--date-picker__day--disabled",
      );

      await rerender({ disabledDates: ["03/09/2024"] });
      await tick();

      const day9 = getDayByNumber(calendar, 9);
      expect(day9).toHaveClass("bx--date-picker__day--disabled");
      // Days are rebuilt on redraw, so aria-disabled must still be applied.
      expect(day9).toHaveAttribute("aria-disabled", "true");
    });

    it("keeps the selected value when a rule change disables it", async () => {
      const { rerender } = render(DatePicker, {
        datePickerType: "single",
        value: "03/09/2024",
      });

      const input = screen.getByLabelText("Date");
      await openCalendar();

      await rerender({ disabledDates: ["03/09/2024"] });
      await tick();

      expect(input).toHaveValue("03/09/2024");
    });

    it("does not call calendar.set for disable when the reference is unchanged", async () => {
      const disabledDates = ["03/09/2024"];
      const { rerender } = render(DatePicker, {
        datePickerType: "single",
        disabledDates,
      });

      const input = screen.getByLabelText("Date");
      await openCalendar();

      const setSpy = vi.spyOn(getCalendarInstance(input), "set");

      // Trigger a reactive update that keeps the same `disabledDates` reference.
      await rerender({ disabledDates, fullWidth: true });
      await tick();

      expect(setSpy).not.toHaveBeenCalledWith("disable", expect.anything());
    });

    it("applies enabledDates set after mount and lifts the restriction when emptied", async () => {
      const { rerender } = render(DatePicker, {
        datePickerType: "single",
        value: "03/15/2024",
      });

      const calendar = await openCalendar();
      expect(getDayByNumber(calendar, 16)).not.toHaveClass(
        "bx--date-picker__day--disabled",
      );

      await rerender({ enabledDates: ["03/15/2024"] });
      await tick();

      expect(getDayByNumber(calendar, 15)).not.toHaveClass(
        "bx--date-picker__day--disabled",
      );
      expect(getDayByNumber(calendar, 16)).toHaveClass(
        "bx--date-picker__day--disabled",
      );

      // Lifting the rule goes around flatpickr's `set("enable", undefined)`,
      // which throws.
      await rerender({ enabledDates: [] });
      await tick();

      expect(getDayByNumber(calendar, 16)).not.toHaveClass(
        "bx--date-picker__day--disabled",
      );
    });
  });

  describe("disabledDates/enabledDates generics", () => {
    it("accepts each DatePickerDateRule shape and rejects a number", () => {
      type Props = ComponentProps<DatePickerComponent>;
      type Rule =
        | string
        | Date
        | { from: string | Date; to: string | Date }
        | ((date: Date) => boolean);

      expectTypeOf<Props["disabledDates"]>().toEqualTypeOf<
        ReadonlyArray<Rule> | undefined
      >();
      expectTypeOf<Props["enabledDates"]>().toEqualTypeOf<
        ReadonlyArray<Rule> | undefined
      >();

      // @ts-expect-error a number is not a valid DatePickerDateRule
      const invalid: Props["disabledDates"] = [42];
      expect(invalid).toBeDefined();
    });
  });

  describe("error event", () => {
    it("dispatches an error event once for an unparseable initial value", async () => {
      const errorHandler = vi.fn();
      render(DatePicker, {
        datePickerType: "single",
        value: "not-a-date",
        onerror: errorHandler,
      });

      await vi.waitFor(() => expect(errorHandler).toHaveBeenCalledTimes(1));
      const detail = errorHandler.mock.lastCall?.[0]?.detail;
      expect(detail.error).toBeInstanceOf(Error);
      expect(detail.error.message).toBe("Invalid date provided: not-a-date");
      expect(detail.value).toBe("not-a-date");
    });

    it("dispatches once for an unparseable initial valueFrom in range mode", async () => {
      const errorHandler = vi.fn();
      render(DatePickerRange, {
        valueFrom: "not-a-date",
        valueTo: "",
        onerror: errorHandler,
      });

      await vi.waitFor(() => expect(errorHandler).toHaveBeenCalledTimes(1));
      expect(errorHandler.mock.lastCall?.[0]?.detail).toMatchObject({
        value: "not-a-date",
      });
    });
  });

  describe("bind:calendar", () => {
    it("exposes the flatpickr instance in single mode", async () => {
      const { instance } = await renderCalendar({ datePickerType: "single" });

      // Smoke-check the flatpickr API surface — these are the methods
      // consumers are most likely to call imperatively.
      expect(typeof instance.open).toBe("function");
      expect(typeof instance.close).toBe("function");
      expect(typeof instance.setDate).toBe("function");
      expect(typeof instance.jumpToDate).toBe("function");
      expect(typeof instance.set).toBe("function");
      expect(instance.isOpen).toBe(false);
    });

    it("can open and close the calendar via the bound instance", async () => {
      const { instance } = await renderCalendar({ datePickerType: "single" });

      expect(instance.isOpen).toBe(false);

      instance.open();
      await tick();
      expect(instance.isOpen).toBe(true);
      const calendar = await screen.findByLabelText(/^Choose a /);
      expect(calendar).toHaveClass("bx--date-picker__calendar--open");

      instance.close();
      await tick();
      expect(instance.isOpen).toBe(false);
      expect(calendar).not.toHaveClass("bx--date-picker__calendar--open");
    });

    it("exposes the flatpickr instance in multiple mode", async () => {
      const { instance } = await renderCalendar({ datePickerType: "multiple" });

      expect(instance.config.mode).toBe("multiple");
      expect(typeof instance.setDate).toBe("function");
    });
  });

  it("does not clear the input when value is an epoch (0) timestamp", async () => {
    render(DatePicker, { datePickerType: "single", value: 0 });
    const input = screen.getByLabelText("Date");
    assert(input instanceof HTMLInputElement);
    await vi.waitFor(() => expect(input.value).not.toBe(""));
  });

  it("moves focus to an outside element on the first click after Enter on the end date input", async () => {
    render(DatePickerRange);
    const outside = document.createElement("input");
    outside.setAttribute("aria-label", "Outside input");
    document.body.appendChild(outside);

    const end = screen.getByLabelText("End date");
    await user.click(end);
    await user.type(end, "02/15/2026{enter}");

    await user.click(outside);
    expect(document.activeElement).toBe(outside);

    document.body.removeChild(outside);
  });

  describe("portalMenu", () => {
    afterEach(() => {
      // Clean up any flatpickr calendars appended to document.body.
      for (const el of document.body.querySelectorAll(
        ".bx--date-picker__calendar",
      )) {
        el.remove();
      }
    });

    it.each([
      [
        "inside the date picker wrapper by default",
        () => render(DatePicker, { datePickerType: "single" }),
        true,
      ],
      [
        "at document.body when portalMenu is true",
        () =>
          render(DatePicker, { datePickerType: "single", portalMenu: true }),
        false,
      ],
      [
        "at document.body when inside Modal (portalMenu not passed)",
        () =>
          render(DatePickerHost, {
            container: "modal",
            inheritPortalMenu: true,
          }),
        false,
      ],
      [
        "inside the wrapper when inside Modal with portalMenu=false",
        () => render(DatePickerHost, { container: "modal", portalMenu: false }),
        true,
      ],
    ])(
      "renders the calendar %s",
      async (_name, renderPicker, insideWrapper) => {
        const { container } = renderPicker();

        const calendar = await openCalendar();
        const wrapper = container.querySelector(".bx--date-picker");
        expect(wrapper?.contains(calendar)).toBe(insideWrapper);
        expect(document.body.contains(calendar)).toBe(true);
        expect(
          calendar.classList.contains("bx--date-picker__calendar--static"),
        ).toBe(insideWrapper);
      },
    );

    it("removes a portalled calendar from the document on unmount while open", async () => {
      const { unmount } = render(DatePicker, {
        datePickerType: "single",
        portalMenu: true,
      });
      const calendar = await openCalendar();
      expect(document.body.contains(calendar)).toBe(true);

      unmount();

      expect(document.body.contains(calendar)).toBe(false);
    });

    it("does not reapply static:true on a reactive re-run (#3444)", async () => {
      const { rerender } = render(DatePicker, {
        datePickerType: "single",
        portalMenu: true,
      });

      const input = screen.getByLabelText("Date");
      await openCalendar();

      const fp = getCalendarInstance(input);
      expect(fp.config.static).toBe(false);

      // Trigger the `initCalendar` reactive statement to re-run (e.g. a
      // minDate update) without touching `portalMenu`.
      await rerender({
        datePickerType: "single",
        portalMenu: true,
        minDate: "01/01/2024",
      });
      await tick();

      expect(fp.config.static).toBe(false);
    });
  });

  describe("multiple mode", () => {
    it("toggles a day in and out of selection on repeated clicks", async () => {
      render(DatePicker, { datePickerType: "multiple" });

      const calendar = await openCalendar();
      // flatpickr rebuilds the days grid from scratch on every selection, so
      // the day element must be re-queried after each click.
      const getDay = () => firstDay(calendar);

      await user.click(getDay());
      expect(getDay()).toHaveClass("bx--date-picker__day--selected");

      await user.click(getDay());
      expect(getDay()).not.toHaveClass("bx--date-picker__day--selected");
    });

    it("does not close the calendar after selecting a date", async () => {
      render(DatePicker, { datePickerType: "multiple" });

      const calendar = await openCalendar();
      await user.click(firstDay(calendar));
      expect(calendar).toHaveClass("bx--date-picker__calendar--open");
    });

    it("dispatches change with all selected dates joined by a comma", async () => {
      const changeHandler = vi.fn();
      render(DatePicker, {
        datePickerType: "multiple",
        onchange: changeHandler,
      });

      const calendar = await openCalendar();
      // flatpickr rebuilds the days grid from scratch on every selection, so
      // the day elements must be re-queried after each click.
      await user.click(getDays(calendar)[0]);
      await user.click(getDays(calendar)[1]);

      const input = screen.getByLabelText("Date");
      assert(input instanceof HTMLInputElement);
      expect(input.value).toContain(", ");
      expect(changeHandler.mock.lastCall?.[0]?.detail).toMatchObject({
        dateStr: input.value,
      });
      expect(
        changeHandler.mock.lastCall?.[0]?.detail.selectedDates,
      ).toHaveLength(2);
    });

    it("supports a custom dateFormat", async () => {
      render(DatePicker, { datePickerType: "multiple", dateFormat: "Y-m-d" });

      const calendar = await openCalendar();
      await user.click(getDays(calendar)[0]);
      await user.click(getDays(calendar)[1]);

      const input = screen.getByLabelText("Date");
      assert(input instanceof HTMLInputElement);
      expect(input.value).toMatch(/^\d{4}-\d{2}-\d{2}, \d{4}-\d{2}-\d{2}$/);
    });

    // Regression test: the input has no maxlength and the derived pattern
    // (see "pattern derived from dateFormat" above) allows unbounded
    // repetitions, so selecting many dates must not lose any of them.
    it("does not truncate the input value when many dates are selected", async () => {
      const { instance } = await renderCalendar({ datePickerType: "multiple" });

      const dates = Array.from(
        { length: 20 },
        (_, i) => new Date(2026, 0, i + 1),
      );
      instance.setDate(dates, true);
      await tick();

      const input = screen.getByLabelText("Date");
      assert(input instanceof HTMLInputElement);
      expect(input.value.split(", ")).toHaveLength(20);
      expect(input.value).toContain("01/20/2026");
    });

    it("mirrors typed text in the aria-hidden ghost overlay before blur", async () => {
      render(DatePicker, { datePickerType: "multiple" });

      await user.type(screen.getByLabelText("Date"), "01/0");

      const overlay = document.querySelector(".bx--date-picker__input-overlay");
      expect(overlay).toHaveAttribute("aria-hidden", "true");
      expect(overlay?.querySelector("span")).toHaveTextContent("01/0");
    });

    describe("shift-click range selection", () => {
      function getSelectedDayNumbers(calendar: HTMLElement) {
        return Array.from(
          calendar.querySelectorAll<HTMLElement>(
            ".bx--date-picker__day.bx--date-picker__day--selected",
          ),
        )
          .map((el) => Number(el.textContent?.trim()))
          .sort((a, b) => a - b);
      }

      it("extends the selection to a contiguous range on shift-click", async () => {
        render(DatePicker, { datePickerType: "multiple", value: "03/10/2024" });

        const calendar = await openCalendar();

        const day5 = getDayByNumber(calendar, 5);
        await user.click(day5);

        await user.keyboard("{Shift>}");
        const day10 = getDayByNumber(calendar, 10);
        await user.click(day10);
        await user.keyboard("{/Shift}");

        expect(getSelectedDayNumbers(calendar)).toEqual([5, 6, 7, 8, 9, 10]);
      });

      it("adds the shift-click range to the existing selection instead of replacing it", async () => {
        render(DatePicker, { datePickerType: "multiple", value: "03/20/2024" });

        const calendar = await openCalendar();

        const day5 = getDayByNumber(calendar, 5);
        await user.click(day5);

        await user.keyboard("{Shift>}");
        const day8 = getDayByNumber(calendar, 8);
        await user.click(day8);
        await user.keyboard("{/Shift}");

        // day 20 (from the initial value) survives alongside the new range.
        expect(getSelectedDayNumbers(calendar)).toEqual([5, 6, 7, 8, 20]);
      });

      it("skips disabled dates within a shift-click range", async () => {
        render(DatePicker, {
          datePickerType: "multiple",
          value: "03/10/2024",
          disabledDates: ["03/07/2024"],
        });

        const calendar = await openCalendar();

        const day5 = getDayByNumber(calendar, 5);
        await user.click(day5);

        await user.keyboard("{Shift>}");
        const day9 = getDayByNumber(calendar, 9);
        await user.click(day9);
        await user.keyboard("{/Shift}");

        // day 7 is disabled and skipped; day 10 (initial value) survives.
        expect(getSelectedDayNumbers(calendar)).toEqual([5, 6, 8, 9, 10]);
      });

      it("moves the anchor on the next plain click after a shift-click", async () => {
        render(DatePicker, { datePickerType: "multiple", value: "03/01/2024" });

        const calendar = await openCalendar();

        const day5 = getDayByNumber(calendar, 5);
        await user.click(day5);

        await user.keyboard("{Shift>}");
        const day7 = getDayByNumber(calendar, 7);
        await user.click(day7);
        await user.keyboard("{/Shift}");

        // Plain click on day 20 moves the anchor there instead of day 5.
        const day20 = getDayByNumber(calendar, 20);
        await user.click(day20);

        await user.keyboard("{Shift>}");
        const day18 = getDayByNumber(calendar, 18);
        await user.click(day18);
        await user.keyboard("{/Shift}");

        expect(getSelectedDayNumbers(calendar)).toEqual([
          1, 5, 6, 7, 18, 19, 20,
        ]);
      });
    });
  });

  describe("month mode", () => {
    it("renders a 12-month grid instead of days", async () => {
      render(DatePicker, { datePickerType: "month", dateFormat: "F Y" });

      const calendar = await openCalendar();

      expect(
        calendar.querySelectorAll(".bx--date-picker__grid-cell"),
      ).toHaveLength(12);
      expect(calendar.querySelectorAll(".bx--date-picker__day")).toHaveLength(
        0,
      );
    });

    it("marks the current month with the today class and aria-current", async () => {
      render(DatePicker, { datePickerType: "month", dateFormat: "F Y" });

      const calendar = await openCalendar();

      const months = calendar.querySelectorAll(".bx--date-picker__grid-cell");
      const currentMonth = months[new Date().getMonth()];
      expect(currentMonth).toHaveClass("bx--date-picker__grid-cell--today");
      expect(currentMonth).toHaveAttribute("aria-current", "date");
    });
  });

  it("doesn't re-apply a range the calendar just picked", async () => {
    render(DatePickerRange, {});
    const calendar = await openCalendar("Start date");
    const engine = getCalendarInstance(screen.getByLabelText("Start date"));
    const setDate = vi.spyOn(engine, "setDate");

    await user.click(dayByLabel(calendar, 10));
    await user.click(dayByLabel(calendar, 14));
    await tick();

    expect(engine.selectedDates).toHaveLength(2);
    expect(setDate).not.toHaveBeenCalled();
  });

  describe("range length limits", () => {
    async function pickStart(props: Record<string, unknown>) {
      const result = render(DatePickerRange, props);
      const calendar = await openCalendar("Start date");
      await user.click(dayByLabel(calendar, 10));
      return { ...result, calendar };
    }

    it("disables days beyond maxRangeDays while the start is pending", async () => {
      const { calendar } = await pickStart({ maxRangeDays: 7 });

      expect(dayByLabel(calendar, 16)).not.toHaveClass(
        "bx--date-picker__day--disabled",
      );
      expect(dayByLabel(calendar, 4)).not.toHaveClass(
        "bx--date-picker__day--disabled",
      );
      for (const n of [17, 3]) {
        expect(dayByLabel(calendar, n)).toHaveClass(
          "bx--date-picker__day--disabled",
        );
        expect(dayByLabel(calendar, n)).toHaveAttribute(
          "aria-disabled",
          "true",
        );
      }
    });

    it("only completes the range inside the window", async () => {
      const { calendar } = await pickStart({ maxRangeDays: 7 });

      await user.click(dayByLabel(calendar, 17));
      expect(screen.getByLabelText("End date")).toHaveValue("");
      expect(calendar).toHaveClass("bx--date-picker__calendar--open");

      await user.click(dayByLabel(calendar, 16));
      expect(screen.getByLabelText("End date")).not.toHaveValue("");
    });

    it("disables days closer than minRangeDays, including the start", async () => {
      const { calendar } = await pickStart({ minRangeDays: 3 });

      expect(dayByLabel(calendar, 10)).toHaveClass(
        "bx--date-picker__day--disabled",
      );
      expect(dayByLabel(calendar, 10)).toHaveClass(
        "bx--date-picker__day--selected",
      );
      expect(dayByLabel(calendar, 11)).toHaveClass(
        "bx--date-picker__day--disabled",
      );
      expect(dayByLabel(calendar, 12)).not.toHaveClass(
        "bx--date-picker__day--disabled",
      );
    });

    it("drops the window once the range is complete", async () => {
      const { calendar } = await pickStart({ maxRangeDays: 7 });
      await user.click(dayByLabel(calendar, 16));

      await user.click(screen.getByLabelText("Start date"));

      expect(dayByLabel(calendar, 17)).not.toHaveClass(
        "bx--date-picker__day--disabled",
      );
      expect(dayByLabel(calendar, 3)).not.toHaveClass(
        "bx--date-picker__day--disabled",
      );
    });

    it("repaints a pending window when the limit changes", async () => {
      const { calendar, rerender } = await pickStart({ maxRangeDays: 7 });

      await rerender({ maxRangeDays: 3 });

      expect(dayByLabel(calendar, 12)).not.toHaveClass(
        "bx--date-picker__day--disabled",
      );
      expect(dayByLabel(calendar, 13)).toHaveClass(
        "bx--date-picker__day--disabled",
      );
    });

    describe("arrow keys while the start is pending", () => {
      async function press(
        key: string,
        { times = 1, ...init }: KeyboardEventInit & { times?: number } = {},
      ) {
        const keyCode = {
          ArrowLeft: 37,
          ArrowUp: 38,
          ArrowRight: 39,
          ArrowDown: 40,
        }[key];
        for (let i = 0; i < times; i++) {
          // biome-ignore lint/performance/noAwaitInLoops: key presses are sequential
          await fireEvent.keyDown(document.activeElement as HTMLElement, {
            key,
            keyCode,
            ...init,
          });
        }
      }

      it("stays on the last open day at the window's edge", async () => {
        const { calendar } = await pickStart({ maxRangeDays: 3 });
        dayByLabel(calendar, 10).focus();

        await press("ArrowRight", { times: 4 });

        expect(document.activeElement).toBe(dayByLabel(calendar, 12));
        await press("ArrowLeft");
        expect(document.activeElement).toBe(dayByLabel(calendar, 11));
      });

      it("skips the days minRangeDays blocks", async () => {
        const { calendar } = await pickStart({ minRangeDays: 3 });
        dayByLabel(calendar, 10).focus();

        await press("ArrowRight");
        expect(document.activeElement).toBe(dayByLabel(calendar, 12));

        dayByLabel(calendar, 10).focus();
        await press("ArrowLeft");
        expect(document.activeElement).toBe(dayByLabel(calendar, 8));
      });

      it("moves a week, then on, with up and down", async () => {
        const { calendar } = await pickStart({ maxRangeDays: 9 });
        dayByLabel(calendar, 10).focus();

        await press("ArrowDown");
        expect(document.activeElement).toBe(dayByLabel(calendar, 17));
        await press("ArrowDown");
        expect(document.activeElement).toBe(dayByLabel(calendar, 17));
        await press("ArrowUp");
        expect(document.activeElement).toBe(dayByLabel(calendar, 10));
      });

      it("shows the month an open day falls in", async () => {
        const { calendar } = await pickStart({ minRangeDays: 40 });
        dayByLabel(calendar, 10).focus();

        await press("ArrowRight");

        const now = new Date();
        const expected = new Date(now.getFullYear(), now.getMonth(), 49);
        const focused = document.activeElement as HTMLElement & {
          dateObj?: Date;
        };
        expect(focused.dateObj?.getTime()).toBe(expected.getTime());
        expect(
          calendar.querySelector(".bx--date-picker__month-label"),
        ).toHaveTextContent(
          expected.toLocaleDateString("en-US", { month: "long" }),
        );
      });

      it("stays put on Ctrl+arrow when the next month has no open day", async () => {
        const { calendar } = await pickStart({ maxRangeDays: 3 });
        const month = calendar.querySelector(
          ".bx--date-picker__month-label",
        )?.textContent;
        dayByLabel(calendar, 10).focus();

        await press("ArrowRight", { ctrlKey: true });

        expect(document.activeElement).toBe(dayByLabel(calendar, 10));
        expect(
          calendar.querySelector(".bx--date-picker__month-label"),
        ).toHaveTextContent(month ?? "");
      });

      it("follows a limit changed while the start is pending", async () => {
        const { calendar, rerender } = await pickStart({ maxRangeDays: 7 });
        await rerender({ maxRangeDays: 3 });
        dayByLabel(calendar, 10).focus();

        await press("ArrowRight", { times: 4 });

        expect(document.activeElement).toBe(dayByLabel(calendar, 12));
      });

      it("leaves flatpickr's navigation alone without limits", async () => {
        const { calendar } = await pickStart({});
        dayByLabel(calendar, 10).focus();

        await press("ArrowRight", { times: 4 });

        expect(document.activeElement).toBe(dayByLabel(calendar, 14));
      });
    });

    it("ignores the limits outside range mode", async () => {
      render(DatePickerRange, { datePickerType: "single", maxRangeDays: 2 });
      const calendar = await openCalendar("Start date");
      await user.click(dayByLabel(calendar, 10));
      await user.click(screen.getByLabelText("Start date"));

      expect(
        calendar.querySelectorAll(".bx--date-picker__day--disabled"),
      ).toHaveLength(0);
    });

    it("does not check a range set from outside", async () => {
      render(DatePickerRange, {
        maxRangeDays: 7,
        valueFrom: "01/01/2024",
        valueTo: "03/01/2024",
      });
      await screen.findByLabelText(/^Choose a /);

      expect(screen.getByLabelText("Start date")).toHaveValue("01/01/2024");
      expect(screen.getByLabelText("End date")).toHaveValue("03/01/2024");
    });
  });

  describe("week mode", () => {
    /** A current-month day cell, by day of the month. */
    function dayCell(calendar: HTMLElement, day: number) {
      const now = new Date();
      return {
        cell: dayByLabel(calendar, day),
        date: new Date(now.getFullYear(), now.getMonth(), day),
      };
    }

    const formatted = (date: Date) =>
      `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}/${date.getFullYear()}`;

    it("selects the first day of the picked week", async () => {
      const onchange = vi.fn();
      render(DatePicker, { datePickerType: "week", onchange });
      const calendar = await openCalendar();
      const { cell, date } = dayCell(calendar, 17);
      const sunday = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() - date.getDay(),
      );

      await user.click(cell);

      expect(screen.getByLabelText("Date")).toHaveValue(formatted(sunday));
      expect(onchange).toHaveBeenCalledTimes(1);
      expect(onchange.mock.calls[0][0].detail.selectedDates[0]).toEqual(sunday);
    });

    it("follows the locale's first day of the week", async () => {
      render(DatePicker, {
        datePickerType: "week",
        locale: { firstDayOfWeek: 1 },
      });
      const calendar = await openCalendar();
      const { cell, date } = dayCell(calendar, 17);
      const monday = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() - ((date.getDay() + 6) % 7),
      );

      await user.click(cell);

      expect(screen.getByLabelText("Date")).toHaveValue(formatted(monday));
    });

    it("highlights all seven days of the selected week", async () => {
      render(DatePicker, { datePickerType: "week" });
      const input = screen.getByLabelText("Date");
      const calendar = await openCalendar();
      await user.click(dayCell(calendar, 17).cell);

      await user.click(input);

      expect(
        calendar.querySelectorAll(
          ".bx--date-picker__day.bx--date-picker__day--week.bx--date-picker__day--selected",
        ),
      ).toHaveLength(7);
    });

    it("numbers the week by the days it shows", async () => {
      // Sunday, September 13, 2026 starts a week that is mostly ISO week 38.
      render(DatePickerDisplayFormat, {
        datePickerType: "week",
        displayFormat: "\\W\\e\\e\\k W, Y",
        value: "2026-09-16",
      });
      const calendar = await screen.findByLabelText(/^Choose a /);
      await user.click(screen.getByLabelText("Date"));
      const day = calendar.querySelector<HTMLElement>(
        '[aria-label="Wednesday, September 16, 2026"]',
      );
      assert(day);

      await user.click(day);

      expect(screen.getByLabelText("Date")).toHaveValue("Week 38, 2026");
    });

    it("keeps a value set from outside as given", async () => {
      const { rerender } = render(DatePicker, { datePickerType: "week" });
      await screen.findByLabelText(/^Choose a /);

      await rerender({ value: "01/18/2024" });

      expect(screen.getByLabelText("Date")).toHaveValue("01/18/2024");
    });
  });

  describe("year mode", () => {
    it("renders a year grid instead of days", async () => {
      render(DatePicker, { datePickerType: "year", dateFormat: "Y" });

      const calendar = await openCalendar();

      expect(
        calendar.querySelectorAll(".bx--date-picker__grid-cell"),
      ).toHaveLength(12);
      expect(calendar.querySelectorAll(".bx--date-picker__day")).toHaveLength(
        0,
      );
    });

    it("marks the current year with the today class and aria-current", async () => {
      render(DatePicker, { datePickerType: "year", dateFormat: "Y" });

      const calendar = await openCalendar();

      const currentYear = calendar.querySelector(
        `.bx--date-picker__grid-cell[data-year="${new Date().getFullYear()}"]`,
      );
      expect(currentYear).toHaveClass("bx--date-picker__grid-cell--today");
      expect(currentYear).toHaveAttribute("aria-current", "date");
    });

    it.each([
      ["minDate", (year: number, current: number) => year < current],
      ["maxDate", (year: number, current: number) => year > current],
    ] as const)(
      "marks years outside %s as aria-disabled",
      async (bound, isOutside) => {
        const current = new Date().getFullYear();
        render(DatePicker, {
          datePickerType: "year",
          dateFormat: "Y",
          [bound]: String(current),
        });

        const calendar = await openCalendar();

        for (const cell of calendar.querySelectorAll(
          ".bx--date-picker__grid-cell",
        )) {
          const year = Number(cell.getAttribute("data-year"));
          if (isOutside(year, current)) {
            expect(cell).toHaveAttribute("aria-disabled", "true");
          } else {
            expect(cell).not.toHaveAttribute("aria-disabled");
          }
        }
      },
    );

    it("labels the range to match the first and last rendered year", async () => {
      render(DatePicker, { datePickerType: "year", dateFormat: "Y" });

      const calendar = await openCalendar();

      const years = calendar.querySelectorAll(".bx--date-picker__grid-cell");
      const firstYear = years[0].textContent;
      const lastYear = years[years.length - 1].textContent;

      expect(
        calendar.querySelector(".bx--date-picker__decade"),
      ).toHaveTextContent(`${firstYear} - ${lastYear}`);
    });

    it("removes the leftover year-input wrapper so the range label is the only child", async () => {
      render(DatePicker, { datePickerType: "year", dateFormat: "Y" });

      const calendar = await openCalendar();

      const currentMonth = calendar.querySelector(".bx--date-picker__heading");
      expect(currentMonth?.querySelector(".bx--date-picker__year")).toBeNull();
      expect(currentMonth?.children).toHaveLength(1);
    });

    it("rebuilds the grid and range label when changeYear is called programmatically", async () => {
      const { instance } = await renderCalendar({
        datePickerType: "year",
        dateFormat: "Y",
      });

      instance.open();
      await tick();
      const calendar = await screen.findByLabelText(/^Choose a /);
      const yearsBefore = Array.from(
        calendar.querySelectorAll(".bx--date-picker__grid-cell"),
      ).map((el) => el.textContent);

      instance.changeYear(instance.currentYear + 10);
      await tick();

      const yearsAfter = Array.from(
        calendar.querySelectorAll(".bx--date-picker__grid-cell"),
      ).map((el) => el.textContent);
      expect(yearsAfter).not.toEqual(yearsBefore);
      expect(
        calendar.querySelector(".bx--date-picker__decade"),
      ).toHaveTextContent(
        `${yearsAfter[0]} - ${yearsAfter[yearsAfter.length - 1]}`,
      );
    });

    describe("keyboard", () => {
      const ArrowLeft = 37;
      const ArrowUp = 38;
      const ArrowRight = 39;
      const ArrowDown = 40;
      const Enter = 13;

      // flatpickr's key handlers read `keyCode`, which user-event omits.
      // The first key lands on the calendar, which focuses the selected
      // year; later keys follow the focused year cell.
      const press = (calendar: HTMLElement, keyCode: number) =>
        fireEvent.keyDown(
          document.activeElement && calendar.contains(document.activeElement)
            ? document.activeElement
            : calendar,
          { keyCode },
        );
      const focusedYear = () => document.activeElement?.textContent;

      it("moves focus by one year with left and right and by a row with up and down", async () => {
        render(DatePicker, {
          datePickerType: "year",
          dateFormat: "Y",
          value: "2024",
        });
        const calendar = await openCalendar();

        await press(calendar, ArrowRight);
        expect(focusedYear()).toBe("2025");

        await press(calendar, ArrowDown);
        expect(focusedYear()).toBe("2028");

        await press(calendar, ArrowUp);
        expect(focusedYear()).toBe("2025");

        await press(calendar, ArrowLeft);
        expect(focusedYear()).toBe("2024");
      });

      it("wraps focus around the grid", async () => {
        // 2019 is the 11th cell of the 2009-2020 grid: one row down wraps
        // to the 2nd cell.
        render(DatePicker, {
          datePickerType: "year",
          dateFormat: "Y",
          value: "2019",
        });
        const calendar = await openCalendar();

        await press(calendar, ArrowDown);

        expect(focusedYear()).toBe("2010");
      });

      it("selects the focused year with Enter", async () => {
        const onchange = vi.fn();
        render(DatePicker, {
          datePickerType: "year",
          dateFormat: "Y",
          value: "2024",
          onchange,
        });
        const calendar = await openCalendar();

        await press(calendar, ArrowDown);
        await press(calendar, Enter);

        expect(screen.getByLabelText("Date")).toHaveValue("2027");
        expect(onchange).toHaveBeenCalledTimes(1);
        expect(
          calendar.querySelector(
            ".bx--date-picker__grid-cell.bx--date-picker__grid-cell--selected",
          ),
        ).toHaveTextContent("2027");
      });
    });

    it("highlights the selected year when the calendar opens", async () => {
      render(DatePicker, {
        datePickerType: "year",
        dateFormat: "Y",
        value: "2024",
      });

      const calendar = await openCalendar();

      expect(
        calendar.querySelector(
          ".bx--date-picker__grid-cell.bx--date-picker__grid-cell--selected",
        ),
      ).toHaveTextContent("2024");
    });

    it("pages by decade with the arrows and disables them at the min and max bounds", async () => {
      render(DatePicker, {
        datePickerType: "year",
        dateFormat: "Y",
        value: "2024",
        minDate: "2020",
        maxDate: "2035",
      });
      const calendar = await openCalendar();
      const range = () =>
        calendar.querySelector(".bx--date-picker__decade")?.textContent;
      const prev = calendar.querySelector(
        ".bx--date-picker__nav-button--previous",
      );
      const next = calendar.querySelector(".bx--date-picker__nav-button--next");
      assert(prev && next);

      expect(range()).toBe("2019 - 2030");
      expect(prev).toHaveClass("bx--date-picker__nav-button--disabled");
      expect(next).not.toHaveClass("bx--date-picker__nav-button--disabled");

      await user.click(next);

      expect(range()).toBe("2029 - 2040");
      expect(prev).not.toHaveClass("bx--date-picker__nav-button--disabled");
      expect(next).toHaveClass("bx--date-picker__nav-button--disabled");

      await user.click(prev);

      expect(range()).toBe("2019 - 2030");
    });

    it("ignores a click on a year outside minDate", async () => {
      const onchange = vi.fn();
      render(DatePicker, {
        datePickerType: "year",
        dateFormat: "Y",
        value: "2024",
        minDate: "2022",
        onchange,
      });
      const calendar = await openCalendar();

      await user.click(within(calendar).getByText("2021"));

      expect(screen.getByLabelText("Date")).toHaveValue("2024");
      expect(onchange).not.toHaveBeenCalled();
      expect(calendar).toHaveClass("bx--date-picker__calendar--open");
    });
  });

  // Regression test: SCSS scopes the shorter calendar height to these modes
  // via a marker class instead of `:has()` (unsupported at the Svelte 5
  // browser baseline).
  it.each([
    ["month", "F Y"],
    ["year", "Y"],
  ] as const)(
    "marks the calendar container for %s-specific height styling",
    async (datePickerType, dateFormat) => {
      render(DatePicker, { datePickerType, dateFormat });

      const calendar = await openCalendar();

      expect(calendar).toHaveClass(
        `bx--date-picker__calendar--${datePickerType}`,
      );
    },
  );

  // Pick a year that is always in the initial decade grid (decadeStart - 1
  // through decadeStart + 10), avoiding the current year cell when possible.
  const decadeStart =
    new Date().getFullYear() - (new Date().getFullYear() % 10);

  it.each([
    ["month", "F Y", "Mar", /^March \d{4}$/],
    ["year", "Y", String(decadeStart + 3), new RegExp(`^${decadeStart + 3}$`)],
  ] as const)(
    "selects in %s mode, dispatches change with the formatted date, and closes",
    async (datePickerType, dateFormat, cellText, valuePattern) => {
      const changeHandler = vi.fn();
      render(DatePicker, {
        datePickerType,
        dateFormat,
        onchange: changeHandler,
      });

      const calendar = await openCalendar();
      expect(calendar).toHaveClass("bx--date-picker__calendar--open");

      await user.click(within(calendar).getByText(cellText));

      const input = screen.getByLabelText("Date");
      assert(input instanceof HTMLInputElement);
      expect(input.value).toMatch(valuePattern);
      expect(changeHandler).toHaveBeenCalled();
      expect(changeHandler.mock.lastCall?.[0]?.detail).toMatchObject({
        dateStr: input.value,
      });
      expect(calendar).not.toHaveClass("bx--date-picker__calendar--open");
    },
  );

  describe("fluid variant", () => {
    it("renders the error message inside the fluid container", () => {
      const { container } = render(DatePicker, {
        fluid: true,
        datePickerType: "single",
        invalid: true,
        invalidText: "Invalid date",
      });

      expect(
        screen.getByText("Invalid date").closest(".bx--date-picker-container"),
      ).toHaveClass("bx--date-picker--fluid--invalid");
      expect(
        container.querySelector(".bx--date-picker--fluid--invalid"),
      ).not.toBeNull();
    });

    it("renders the warning message inside the fluid container", () => {
      render(DatePicker, {
        fluid: true,
        datePickerType: "single",
        warn: true,
        warnText: "Warning message",
      });

      expect(
        screen
          .getByText("Warning message")
          .closest(".bx--date-picker-container"),
      ).toHaveClass("bx--date-picker--fluid--warn");
    });

    // The status icon sits beside the message in fluid, so the calendar
    // keeps its corner.
    it.each([
      { invalid: true, invalidText: "Invalid date" },
      { warn: true, warnText: "Warning message" },
    ])("keeps the calendar icon when %o", (props) => {
      const { container } = render(DatePicker, {
        fluid: true,
        datePickerType: "single",
        ...props,
      });

      const icons = container.querySelectorAll(".bx--date-picker__icon");
      expect(icons).toHaveLength(2);
      expect(
        [...icons].filter(
          (icon) =>
            !icon.classList.contains("bx--date-picker__icon--invalid") &&
            !icon.classList.contains("bx--date-picker__icon--warn"),
        ),
      ).toHaveLength(1);
    });

    it("swaps the calendar for the status icon outside fluid", () => {
      const { container } = render(DatePicker, {
        datePickerType: "single",
        invalid: true,
        invalidText: "Invalid date",
      });

      const icons = container.querySelectorAll(".bx--date-picker__icon");
      expect(icons).toHaveLength(1);
      expect(icons[0]).toHaveClass("bx--date-picker__icon--invalid");
    });

    it.each([{ disabled: true }, { readonly: true }])(
      "suppresses invalid and warn states when %o",
      (props) => {
        const { container } = render(DatePicker, {
          fluid: true,
          datePickerType: "single",
          invalid: true,
          invalidText: "Invalid date",
          warn: true,
          warnText: "Warning message",
          ...props,
        });

        expect(screen.queryByText("Invalid date")).not.toBeInTheDocument();
        expect(screen.queryByText("Warning message")).not.toBeInTheDocument();
        expect(
          container.querySelector(".bx--date-picker--fluid--invalid"),
        ).toBeNull();
        expect(
          container.querySelector(".bx--date-picker--fluid--warn"),
        ).toBeNull();
      },
    );

    it("marks only the invalid range cell in fluid mode", () => {
      render(DatePickerFluidRange, {
        invalidFrom: true,
        invalidText: "Invalid start date",
      });

      const message = screen.getByText("Invalid start date");
      const invalidContainer = message.closest(".bx--date-picker-container");
      expect(invalidContainer).toHaveClass("bx--date-picker--fluid--invalid");

      const containers = document.querySelectorAll(
        ".bx--date-picker-container",
      );
      const invalidCells = [...containers].filter((el) =>
        el.classList.contains("bx--date-picker--fluid--invalid"),
      );
      expect(invalidCells).toHaveLength(1);
    });

    it("marks a read-only fluid cell on its own container", () => {
      const { container } = render(DatePicker, {
        fluid: true,
        datePickerType: "single",
        readonly: true,
      });

      expect(container.querySelector(".bx--date-picker-container")).toHaveClass(
        "bx--date-picker--fluid--readonly",
      );
    });

    it("does not mark an editable fluid cell read-only", () => {
      const { container } = render(DatePicker, {
        fluid: true,
        datePickerType: "single",
      });

      expect(
        container.querySelector(".bx--date-picker-container"),
      ).not.toHaveClass("bx--date-picker--fluid--readonly");
    });

    // The read-only border keys off the picker's `--invalid` too, so a
    // status on another cell still overrides it.
    it("marks the picker invalid beside a read-only range cell", () => {
      const { container } = render(DatePickerFluidRange, {
        invalidFrom: true,
        invalidText: "Invalid start date",
        readonlyTo: true,
      });

      const [from, to] = container.querySelectorAll(
        ".bx--date-picker-container",
      );
      expect(from).not.toHaveClass("bx--date-picker--fluid--readonly");
      expect(to).toHaveClass("bx--date-picker--fluid--readonly");
      expect(
        container.querySelector(".bx--date-picker--fluid--invalid"),
      ).not.toBeNull();
    });

    it.each([
      ["sets", "neither invalid nor warn applies", {}, true],
      [
        "keeps",
        "readonly (readonly alone does not override it)",
        { readonly: true },
        true,
      ],
      [
        "clears",
        "invalid",
        { invalid: true, invalidText: "Invalid date" },
        false,
      ],
      ["clears", "warn", { warn: true, warnText: "Warning" }, false],
    ])("%s the neutral class when %s", (_verb, _when, props, hasNeutral) => {
      const { container } = render(DatePicker, {
        fluid: true,
        datePickerType: "single",
        ...props,
      });

      const neutral = container.querySelector(
        ".bx--date-picker--fluid--neutral",
      );
      expect(neutral !== null).toBe(hasNeutral);
    });
  });
});
