import { fireEvent, render, screen, within } from "@testing-library/svelte";
import type DatePickerComponent from "carbon-components-svelte/DatePicker/DatePicker.svelte";
import { english } from "flatpickr/dist/l10n/default";
import type { Instance } from "flatpickr/dist/types/instance";
import type { ComponentProps } from "svelte";
import { tick } from "svelte";
import { flushMacrotask } from "../utils/flush-macrotask";
import { user } from "../utils/user";
import DatePickerFluidForm from "./DatePicker.fluidForm.test.svelte";
import DatePickerFluidRange from "./DatePicker.fluidRange.test.svelte";
import DatePickerFluidSlot from "./DatePicker.fluidSlot.test.svelte";
import DatePicker from "./DatePicker.test.svelte";
import DatePickerCalendar from "./DatePickerCalendar.test.svelte";
import DatePickerDefaultDate from "./DatePickerDefaultDate.test.svelte";
import DatePickerDisplayFormat from "./DatePickerDisplayFormat.test.svelte";
import DatePickerIgnoredFocus from "./DatePickerIgnoredFocus.test.svelte";
import DatePickerInlineOptions from "./DatePickerInlineOptions.test.svelte";
import DatePickerInModal from "./DatePickerInModal.test.svelte";
import DatePickerInputSlot from "./DatePickerInput.slot.test.svelte";
import DatePickerRange from "./DatePickerRange.test.svelte";
import { getFlatpickrInstance } from "./flatpickr-instance";
import { findDay, getDayByNumber } from "./helpers";

describe("DatePicker", () => {
  it("renders with default props", async () => {
    render(DatePicker);

    const input = screen.getByLabelText("Date");

    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("placeholder", "mm/dd/yyyy");

    await user.type(input, "01/01/2023");
    expect(input).toHaveValue("01/01/2023");
  });

  it("selects the full value on focus when selectTextOnFocus is true", async () => {
    render(DatePicker, { selectTextOnFocus: true, value: "01/01/2023" });

    const input = screen.getByLabelText("Date");
    assert(input instanceof HTMLInputElement);
    await user.click(input);
    await tick();

    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe("01/01/2023".length);
  });

  it("does not select all text on focus when selectTextOnFocus is false (default)", async () => {
    render(DatePicker, { value: "01/01/2023" });

    const input = screen.getByLabelText("Date");
    assert(input instanceof HTMLInputElement);
    await user.click(input);
    await tick();

    expect(input.selectionStart).toBe(input.selectionEnd);
  });

  it("does not select text on focus when disabled", async () => {
    render(DatePicker, {
      selectTextOnFocus: true,
      disabled: true,
      value: "01/01/2023",
    });

    const input = screen.getByLabelText("Date");
    assert(input instanceof HTMLInputElement);
    const select = vi.spyOn(input, "select");
    await fireEvent.focus(input);

    expect(select).not.toHaveBeenCalled();
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

  it("renders light variant", () => {
    const { container } = render(DatePicker, { light: true });

    const wrapper = container.querySelector(".bx--date-picker");
    expect(wrapper).toHaveClass("bx--date-picker--light");
  });

  it("renders short variant", () => {
    const { container } = render(DatePicker, { short: true });

    const wrapper = container.querySelector(".bx--date-picker");
    expect(wrapper).toHaveClass("bx--date-picker--short");
  });

  it("renders single mode", async () => {
    const { container } = render(DatePicker, { datePickerType: "single" });

    const input = screen.getByLabelText("Date");
    expect(input).toHaveAttribute("placeholder", "mm/dd/yyyy");

    const wrapper = container.querySelector(".bx--date-picker");
    expect(wrapper).toHaveClass("bx--date-picker--single");

    expect(
      screen.queryByLabelText("calendar-container"),
    ).not.toBeInTheDocument();
    await user.click(input);
    const calendar = await screen.findByLabelText("calendar-container");
    expect(calendar).toBeInTheDocument();
    expect(calendar).not.toHaveClass("bx--date-picker__calendar--month");
  });

  it("renders single-letter weekday shorthands for locale='en'", async () => {
    const { container } = render(DatePicker, { datePickerType: "single" });

    await user.click(screen.getByLabelText("Date"));
    await screen.findByLabelText("calendar-container");

    const weekdays = Array.from(
      container.querySelectorAll(".flatpickr-weekday"),
    ).map((node) => node.textContent?.trim());

    expect(weekdays).toEqual(["S", "M", "T", "W", "Th", "F", "S"]);
  });

  it("renders month before year in the calendar header for locale='en'", async () => {
    const { container } = render(DatePicker, {
      datePickerType: "single",
      locale: "en",
    });

    await user.click(screen.getByLabelText("Date"));
    await screen.findByLabelText("calendar-container");

    const header = container.querySelector(".flatpickr-current-month");
    const month = header?.querySelector(".cur-month");
    const year = header?.querySelector(".numInputWrapper");
    assert(month);
    assert(year);
    expect(month.compareDocumentPosition(year)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("renders year before month in the calendar header for locale='ja'", async () => {
    const { container } = render(DatePicker, {
      datePickerType: "single",
      locale: "ja",
    });

    await user.click(screen.getByLabelText("Date"));
    await screen.findByLabelText("calendar-container");

    const header = container.querySelector(".flatpickr-current-month");
    const month = header?.querySelector(".cur-month");
    const year = header?.querySelector(".numInputWrapper");
    assert(month);
    assert(year);
    expect(year.compareDocumentPosition(month)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("renders range mode", async () => {
    const { container } = render(DatePickerRange);

    const inputStart = screen.getByLabelText("Start date");
    const inputEnd = screen.getByLabelText("End date");

    expect(inputStart).toHaveAttribute("placeholder", "mm/dd/yyyy");
    expect(inputEnd).toHaveAttribute("placeholder", "mm/dd/yyyy");

    const wrapper = container.querySelector(".bx--date-picker");
    expect(wrapper).toHaveClass("bx--date-picker--range");

    expect(
      screen.queryByLabelText("calendar-container"),
    ).not.toBeInTheDocument();
    await user.click(inputStart);
    expect(
      await screen.findByLabelText("calendar-container"),
    ).toBeInTheDocument();
  });

  it("handles disabled state", () => {
    render(DatePicker, { disabled: true });
    const input = screen.getByPlaceholderText("mm/dd/yyyy");
    expect(input).toBeDisabled();
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

    it("prevents typing into the input when readonly", async () => {
      render(DatePicker, { datePickerType: "single", readonly: true });
      const input = screen.getByLabelText("Date");
      assert(input instanceof HTMLInputElement);
      await user.type(input, "01/15/2024");
      expect(input.value).toBe("");
    });

    it("does not open the calendar on click in single mode when readonly", async () => {
      render(DatePicker, { datePickerType: "single", readonly: true });
      const input = screen.getByLabelText("Date");
      await user.click(input);
      const calendar = await screen.findByLabelText("calendar-container");
      expect(calendar).not.toHaveClass("open");
    });

    it("does not open the calendar on ArrowDown when readonly", async () => {
      render(DatePicker, { datePickerType: "single", readonly: true });
      const input = screen.getByLabelText("Date");
      input.focus();
      await user.keyboard("{ArrowDown}");
      const calendar = await screen.findByLabelText("calendar-container");
      expect(calendar).not.toHaveClass("open");
    });

    it("keeps native tab order when readonly (no calendar hijack)", async () => {
      render(DatePicker, { datePickerType: "single", readonly: true });
      const input = screen.getByLabelText("Date");
      input.focus();
      await user.tab();
      expect(input).not.toHaveFocus();
      expect(document.activeElement).not.toHaveClass("flatpickr-day");
    });

    it("forwards the readonly attribute to both inputs in range mode", async () => {
      render(DatePickerRange, { readonly: true });
      // Wait for flatpickr (including the range plugin's onReady) to finish.
      await screen.findByLabelText("calendar-container");
      const start = screen.getByLabelText("Start date");
      const end = screen.getByLabelText("End date");
      expect(start).toHaveAttribute("readonly");
      expect(end).toHaveAttribute("readonly");
    });

    it("keeps flatpickr's allowInput option in sync when readonly toggles after mount", async () => {
      const { rerender } = render(DatePicker, {
        datePickerType: "single",
        readonly: false,
      });

      const input = screen.getByLabelText("Date");
      await user.click(input);
      await screen.findByLabelText("calendar-container");

      const fp = getFlatpickrInstance(input);
      expect(fp.config.allowInput).toBe(true);

      await rerender({
        datePickerType: "single",
        readonly: true,
      });
      await tick();

      expect(fp.config.allowInput).toBe(false);
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

    it("is ignored in simple mode", async () => {
      const capture = captureListenerErrors();
      render(DatePicker, { datePickerType: "simple" });
      const input = screen.getByLabelText("Date");
      input.focus();

      const notPrevented = await fireEvent.keyDown(input, { key: "ArrowDown" });
      capture.stop();

      expect(notPrevented).toBe(true);
      expect(capture.errors).toEqual([]);
    });

    it("is ignored when flatpickr failed to initialize", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const capture = captureListenerErrors();
      render(DatePicker, {
        datePickerType: "single",
        flatpickrProps: {
          plugins: [
            () => {
              throw new Error("plugin failed");
            },
          ],
        },
      });
      await vi.waitFor(() =>
        expect(consoleError).toHaveBeenCalledWith(
          expect.objectContaining({ message: "plugin failed" }),
        ),
      );
      const input = screen.getByLabelText("Date");
      input.focus();

      const notPrevented = await fireEvent.keyDown(input, { key: "ArrowDown" });
      capture.stop();
      consoleError.mockRestore();

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
      const calendar = await screen.findByLabelText("calendar-container");
      const input = screen.getByLabelText("Date");
      input.focus();

      await fireEvent.keyDown(input, { key: "ArrowDown" });

      expect(calendar).toHaveClass("open");
      expect(document.activeElement).toHaveClass("flatpickr-day");
      expect(document.activeElement).not.toHaveClass("flatpickr-disabled");
    });

    it("focuses a day in the displayed month after navigating away from today", async () => {
      render(DatePicker, { datePickerType: "single" });
      const input = screen.getByLabelText("Date");
      await user.click(input);
      const calendar = await screen.findByLabelText("calendar-container");
      const next = calendar.querySelector<HTMLElement>(".flatpickr-next-month");
      if (!next) throw new Error("expected a next-month button");
      await user.click(next);
      const shownMonth = calendar.querySelector(".cur-month")?.textContent;
      input.focus();

      await fireEvent.keyDown(input, { key: "ArrowDown" });

      expect(calendar.contains(document.activeElement)).toBe(true);
      expect(document.activeElement).toHaveClass("flatpickr-day");
      expect(calendar.querySelector(".cur-month")?.textContent).toBe(
        shownMonth,
      );
    });

    it("opens the calendar and moves focus into it", async () => {
      render(DatePicker, { datePickerType: "single" });
      const calendar = await screen.findByLabelText("calendar-container");
      const input = screen.getByLabelText("Date");
      input.focus();

      const notPrevented = await fireEvent.keyDown(input, { key: "ArrowDown" });

      expect(notPrevented).toBe(false);
      expect(calendar).toHaveClass("open");
      expect(document.activeElement).toHaveClass("flatpickr-day");
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
      render(DatePicker, { datePickerType: "multiple" });
      const input = screen.getByLabelText("Date");
      const calendar = await screen.findByLabelText("calendar-container");
      input.focus();
      await fireEvent.keyDown(input, { key: "ArrowDown" });

      const label = await pressEnterOnFocusedDay();

      expect(calendar).toHaveClass("open");
      expect(document.activeElement).toHaveClass("flatpickr-day");
      expect(document.activeElement).toHaveClass("selected");
      expect(document.activeElement).toHaveAttribute("aria-label", label);

      // The next day can be added from the keyboard as well.
      assert(document.activeElement instanceof HTMLElement);
      await fireEvent.keyDown(document.activeElement, {
        key: "ArrowRight",
        keyCode: 39,
      });
      await pressEnterOnFocusedDay();
      expect(calendar.querySelectorAll(".flatpickr-day.selected")).toHaveLength(
        2,
      );
    });

    it("keeps focus on the start day in range mode", async () => {
      render(DatePickerRange);
      const input = screen.getByLabelText("Start date");
      const calendar = await screen.findByLabelText("calendar-container");
      input.focus();
      await fireEvent.keyDown(input, { key: "ArrowDown" });

      const label = await pressEnterOnFocusedDay();

      expect(calendar).toHaveClass("open");
      expect(document.activeElement).toHaveClass("flatpickr-day");
      expect(document.activeElement).toHaveAttribute("aria-label", label);
    });

    it("still returns focus to the input when a single pick closes", async () => {
      render(DatePicker, { datePickerType: "single" });
      const input = screen.getByLabelText("Date");
      const calendar = await screen.findByLabelText("calendar-container");
      input.focus();
      await fireEvent.keyDown(input, { key: "ArrowDown" });

      await pressEnterOnFocusedDay();

      expect(calendar).not.toHaveClass("open");
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
      const calendar = await screen.findByLabelText("calendar-container");
      const input = screen.getByLabelText("Date");

      await user.click(queryClear() as HTMLElement);

      expect(input).toHaveValue("");
      expect(onchange).toHaveBeenCalledTimes(1);
      expect(onchange.mock.calls[0][0].detail.selectedDates).toEqual([]);
      expect(onclear).toHaveBeenCalledTimes(1);
      expect(input).toHaveFocus();
      expect(calendar).toHaveClass("open");
      expect(calendar.querySelector(".flatpickr-day.selected")).toBeNull();
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
      await screen.findByLabelText("calendar-container");
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

    it("uses clearButtonLabelText as the accessible name", () => {
      render(DatePicker, {
        value: "01/15/2024",
        clearable: true,
        clearButtonLabelText: "Remove date",
      });
      expect(
        screen.getByRole("button", { name: "Remove date" }),
      ).toBeInTheDocument();
    });
  });

  it("keeps a consumer allowInput: false across mount and readonly toggles", async () => {
    const props: ComponentProps<typeof DatePicker> = {
      datePickerType: "single",
      flatpickrProps: { allowInput: false, clickOpens: false },
    };
    const { rerender } = render(DatePicker, props);

    const input = screen.getByLabelText("Date");
    await vi.waitFor(() => getFlatpickrInstance(input));
    await tick();
    const fp = getFlatpickrInstance(input);
    expect(fp.config.allowInput).toBe(false);
    expect(fp.config.clickOpens).toBe(false);

    await rerender({ ...props, readonly: true });
    await tick();
    await rerender({ ...props, readonly: false });
    await tick();
    expect(fp.config.allowInput).toBe(false);
    expect(fp.config.clickOpens).toBe(false);
  });

  describe("inline calendar interaction states", () => {
    it.each(["readonly", "disabled"] as const)(
      "blocks selection while the input is %s and restores it after",
      async (state) => {
        const props: ComponentProps<typeof DatePicker> = {
          datePickerType: "single",
          value: "03/15/2024",
          flatpickrProps: { inline: true },
        };
        const { rerender } = render(DatePicker, { ...props, [state]: true });
        const calendar = await screen.findByLabelText("calendar-container");
        const input = screen.getByLabelText("Date");
        await vi.waitFor(() =>
          expect(calendar).toHaveAttribute("aria-disabled", "true"),
        );

        await user.click(findDay(calendar, "10"));
        expect(input).toHaveValue("03/15/2024");
        const next = calendar.querySelector<HTMLElement>(
          ".flatpickr-next-month",
        );
        assert(next);
        await user.click(next);
        expect(calendar.querySelector(".cur-month")).toHaveTextContent("March");

        await rerender({ ...props, [state]: false });
        await vi.waitFor(() =>
          expect(calendar).not.toHaveAttribute("aria-disabled"),
        );
        await user.click(findDay(calendar, "10"));
        expect(input).toHaveValue("03/10/2024");
      },
    );
  });

  describe("change event count", () => {
    it("dispatches change once for a calendar selection", async () => {
      const onchange = vi.fn();
      render(DatePicker, {
        datePickerType: "single",
        value: "03/15/2024",
        onchange,
      });
      await user.click(screen.getByLabelText("Date"));
      const calendar = await screen.findByLabelText("calendar-container");
      const day = Array.from(
        calendar.querySelectorAll<HTMLElement>(
          ".flatpickr-day:not(.prevMonthDay):not(.nextMonthDay)",
        ),
      ).find((node) => node.textContent === "10");
      assert(day);
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
      await screen.findByLabelText("calendar-container");
      onchange.mockClear();

      input.dispatchEvent(new Event("change", { bubbles: true }));
      await tick();
      expect(onchange).toHaveBeenCalledTimes(1);
    });
  });

  it("leaves Carbon's markup intact when an inline calendar is rebuilt", async () => {
    const props: ComponentProps<typeof DatePicker> = {
      helperText: "Pick a weekday",
      flatpickrProps: { inline: true },
    };
    const { container, rerender } = render(DatePicker, {
      ...props,
      datePickerType: "single",
    });
    await screen.findByLabelText("calendar-container");

    await rerender({ ...props, datePickerType: "multiple" });
    await vi.waitFor(() =>
      expect(screen.getAllByLabelText("calendar-container")).toHaveLength(1),
    );
    expect(screen.getByText("Pick a weekday")).toBeInTheDocument();
    expect(
      container.querySelector(".bx--date-picker-container"),
    ).toContainElement(screen.getByLabelText("Date"));
  });

  it("types the open event", () => {
    type Events = import("svelte").ComponentEvents<DatePickerComponent>;

    expectTypeOf<Events>().toHaveProperty("open");
    expectTypeOf<Events["open"]["detail"]["selectedDates"]>().toEqualTypeOf<
      Date[]
    >();
  });

  describe("unsupported flatpickrProps warnings", () => {
    it("warns once per option, not on every update", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      function props(): ComponentProps<typeof DatePicker> {
        return {
          datePickerType: "single",
          // @ts-expect-error `mode` is omitted from the type; JS callers can still pass it.
          flatpickrProps: { mode: "multiple" },
        };
      }
      const { rerender } = render(DatePicker, props());
      await screen.findByLabelText("calendar-container");
      await rerender(props());
      await rerender(props());

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        "[carbon-components-svelte] DatePicker: flatpickrProps.mode is ignored. Use datePickerType instead.",
      );
      warn.mockRestore();
    });

    it("stays silent for ordinary use", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(DatePicker, {
        datePickerType: "single",
        flatpickrProps: { static: true, showMonths: 2 },
      });
      await user.click(screen.getByLabelText("Date"));
      await screen.findByLabelText("calendar-container");

      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
    });
  });

  describe("reactive datePickerType", () => {
    it("rebuilds the calendar when the type changes after mount", async () => {
      const { rerender } = render(DatePicker, { datePickerType: "single" });
      const input = screen.getByLabelText("Date");
      await user.click(input);
      const dayCalendar = await screen.findByLabelText("calendar-container");
      expect(
        dayCalendar.querySelector(".flatpickr-monthSelect-months"),
      ).not.toBeInTheDocument();

      await rerender({ datePickerType: "month", dateFormat: "F Y" });
      await vi.waitFor(() => {
        const calendars = screen.getAllByLabelText("calendar-container");
        expect(calendars).toHaveLength(1);
        expect(
          calendars[0].querySelector(".flatpickr-monthSelect-months"),
        ).toBeInTheDocument();
      });
      expect(dayCalendar).not.toBeInTheDocument();
    });

    it("drops the calendar for simple and creates one when leaving it", async () => {
      const { rerender } = render(DatePicker, { datePickerType: "single" });
      await screen.findByLabelText("calendar-container");

      await rerender({ datePickerType: "simple" });
      await vi.waitFor(() =>
        expect(
          screen.queryByLabelText("calendar-container"),
        ).not.toBeInTheDocument(),
      );

      await rerender({ datePickerType: "single" });
      expect(
        await screen.findByLabelText("calendar-container"),
      ).toBeInTheDocument();
    });

    it("keeps the selected date across a type change with the same format", async () => {
      const { rerender } = render(DatePicker, {
        datePickerType: "single",
        value: "03/15/2024",
      });
      await screen.findByLabelText("calendar-container");

      await rerender({ datePickerType: "multiple", value: "03/15/2024" });
      const input = screen.getByLabelText("Date");
      await vi.waitFor(() => {
        const calendar = getFlatpickrInstance(input);
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
    expect(screen.getByText("Invalid date")).toBeInTheDocument();
    const wrapper = container.querySelector(".bx--date-picker-input__wrapper");
    expect(wrapper).toHaveClass("bx--date-picker-input__wrapper--invalid");
  });

  it("handles warning state", () => {
    const { container } = render(DatePicker, {
      warn: true,
      warnText: "Warning message",
    });
    expect(screen.getByText("Warning message")).toBeInTheDocument();
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
      expect(screen.queryByText("Invalid date")).not.toBeInTheDocument();
      expect(screen.queryByText("Warning message")).not.toBeInTheDocument();
    },
  );

  it("handles helper text", () => {
    render(DatePicker, { helperText: "Helper message" });
    expect(screen.getByText("Helper message")).toBeInTheDocument();
  });

  it("associates helper text with the input via aria-describedby", () => {
    render(DatePicker, { helperText: "Helper message" });
    const input = screen.getByLabelText("Date");
    const helperText = screen.getByText("Helper message");
    expect(input).toHaveAttribute("aria-describedby", helperText.id);
  });

  it("associates invalid text with the input via aria-errormessage and marks it aria-invalid", () => {
    render(DatePicker, { invalid: true, invalidText: "Invalid date" });
    const input = screen.getByLabelText("Date");
    const invalidText = screen.getByText("Invalid date");
    expect(input).toHaveAttribute("aria-errormessage", invalidText.id);
    expect(input).not.toHaveAttribute("aria-describedby");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(invalidText).toHaveAttribute("role", "alert");
  });

  it("associates warning text with the input via aria-describedby", () => {
    render(DatePicker, { warn: true, warnText: "Warning message" });
    const input = screen.getByLabelText("Date");
    const warnText = screen.getByText("Warning message");
    expect(input).toHaveAttribute("aria-describedby", warnText.id);
  });

  it("handles hidden label", () => {
    render(DatePicker, { hideLabel: true });
    const input = screen.getByLabelText("Date");
    expect(input).toHaveAttribute("placeholder", "mm/dd/yyyy");
    expect(screen.getByText("Date")).toHaveClass("bx--visually-hidden");
  });

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
    expect(
      await screen.findByLabelText("calendar-container"),
    ).toBeInTheDocument();
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
    expect(
      await screen.findByLabelText("calendar-container"),
    ).toBeInTheDocument();
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
        value: "01/15/2024",
      },
    });

    const input = screen.getByLabelText("Date");
    await user.click(input);
    await screen.findByLabelText("calendar-container");

    const fp = getFlatpickrInstance(input);
    expect(fp).toBeTruthy();
    const setDateSpy = vi.spyOn(fp, "setDate");

    // Trigger a reactive update that does not change value/min/max/format.
    await rerender({ light: true });
    await tick();

    expect(setDateSpy).not.toHaveBeenCalled();
  });

  it("supports custom label slot for DatePickerInput", () => {
    render(DatePickerInputSlot);

    const customLabel = screen.getByText("Custom label content");
    expect(customLabel).toBeInTheDocument();
  });

  // Regression tests for https://github.com/carbon-design-system/carbon-components-svelte/issues/1362
  describe("pattern derived from dateFormat", () => {
    it("derives a default pattern matching the default dateFormat (m/d/Y)", () => {
      render(DatePicker);

      const input = screen.getByLabelText("Date");
      expect(input).toHaveAttribute("pattern", "\\d{1,2}\\/\\d{1,2}\\/\\d{4}");
    });

    it("derives pattern for Y-m-d dateFormat", () => {
      render(DatePicker, { dateFormat: "Y-m-d" });

      const input = screen.getByLabelText("Date");
      expect(input).toHaveAttribute("pattern", "\\d{4}-\\d{1,2}-\\d{1,2}");
    });

    it("derives pattern for d.m.Y dateFormat", () => {
      render(DatePicker, { dateFormat: "d.m.Y" });

      const input = screen.getByLabelText("Date");
      expect(input).toHaveAttribute("pattern", "\\d{1,2}\\.\\d{1,2}\\.\\d{4}");
    });

    it("derives pattern for d/m/y dateFormat (2-digit year)", () => {
      render(DatePicker, { dateFormat: "d/m/y" });

      const input = screen.getByLabelText("Date");
      expect(input).toHaveAttribute("pattern", "\\d{1,2}\\/\\d{1,2}\\/\\d{2}");
    });

    it("derives pattern for M j, Y dateFormat (text month)", () => {
      render(DatePicker, { dateFormat: "M j, Y" });

      const input = screen.getByLabelText("Date");
      expect(input).toHaveAttribute("pattern", "\\w+ \\d{1,2}, \\d{4}");
    });

    it("allows explicit pattern override on DatePickerInput", () => {
      render(DatePicker, {
        dateFormat: "Y-m-d",
        pattern: "\\d{4}-\\d{2}-\\d{2}",
      });

      const input = screen.getByLabelText("Date");
      expect(input).toHaveAttribute("pattern", "\\d{4}-\\d{2}-\\d{2}");
    });

    it("derived pattern validates Y-m-d formatted values", () => {
      render(DatePicker, { dateFormat: "Y-m-d" });

      const input = screen.getByLabelText("Date");
      const pattern = input.getAttribute("pattern");
      const re = new RegExp(`^${pattern}$`);
      expect(re.test("2026-02-10")).toBe(true);
      expect(re.test("02/10/2026")).toBe(false);
    });

    it("derived pattern validates m/d/Y formatted values", () => {
      render(DatePicker);

      const input = screen.getByLabelText("Date");
      const pattern = input.getAttribute("pattern");
      const re = new RegExp(`^${pattern}$`);
      expect(re.test("02/10/2026")).toBe(true);
      expect(re.test("2026-02-10")).toBe(false);
    });

    // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/2689
    // The HTML pattern attribute is evaluated with the `u` (Unicode) flag.
    // Escaped hyphens (`\-`) are invalid in Unicode mode and cause a SyntaxError,
    // which makes native form validation always fail.
    it.each([
      ["m/d/Y", "02/10/2026"],
      ["Y-m-d", "2026-02-10"],
      ["d.m.Y", "10.02.2026"],
      ["d/m/y", "10/02/26"],
      ["M j, Y", "Feb 10, 2026"],
    ])(
      "derived pattern for %s is valid with the Unicode (u) flag",
      (dateFormat, sampleValue) => {
        render(DatePicker, { dateFormat });

        const input = screen.getByLabelText("Date");
        const pattern = input.getAttribute("pattern");
        expect(pattern).toBeTruthy();

        // This is how browsers evaluate the HTML pattern attribute.
        const re = new RegExp(`^(?:${pattern})$`, "u");
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
    });

    it("derived multiple-mode pattern is valid with the Unicode (u) flag", () => {
      render(DatePicker, { datePickerType: "multiple" });

      const input = screen.getByLabelText("Date");
      const pattern = input.getAttribute("pattern");
      expect(pattern).toBeTruthy();

      const re = new RegExp(`^(?:${pattern})$`, "u");
      expect(re.test("02/10/2026, 02/15/2026")).toBe(true);
    });
  });

  describe("minDate and maxDate", () => {
    it("passes bounds to flatpickr config", async () => {
      const minDate = new Date(2026, 0, 10);
      const maxDate = new Date(2026, 0, 20);
      render(DatePicker, {
        datePickerType: "single",
        minDate,
        maxDate,
      });

      const input = screen.getByLabelText("Date");
      await user.click(input);
      await screen.findByLabelText("calendar-container");

      const fp = getFlatpickrInstance(input);
      expect(fp).toBeTruthy();
      expect(fp.config.minDate?.getTime?.()).toBe(minDate.getTime());
      expect(fp.config.maxDate?.getTime?.()).toBe(maxDate.getTime());
    });
  });

  describe("initialMonth", () => {
    it("shows the initial month when there is no selection", async () => {
      render(DatePicker, {
        datePickerType: "single",
        initialMonth: "04/01/2027",
      });

      const input = screen.getByLabelText("Date");
      await user.click(input);
      const calendar = await screen.findByLabelText("calendar-container");

      expect(calendar.querySelector(".cur-month")).toHaveTextContent("April");
      expect(calendar.querySelector(".cur-year")).toHaveValue(2027);
      expect(input).toHaveValue("");
      expect(calendar.querySelector(".flatpickr-day.selected")).toBeNull();
      expect(calendar.querySelector(".flatpickr-day.today")).toBeNull();
    });

    it("is ignored once a value is selected", async () => {
      render(DatePicker, {
        datePickerType: "single",
        value: "01/05/2024",
        initialMonth: "04/01/2027",
      });

      await user.click(screen.getByLabelText("Date"));
      const calendar = await screen.findByLabelText("calendar-container");

      expect(calendar.querySelector(".cur-month")).toHaveTextContent("January");
      expect(calendar.querySelector(".cur-year")).toHaveValue(2024);
    });

    it("clamps into maxDate when it falls outside", async () => {
      render(DatePicker, {
        datePickerType: "single",
        initialMonth: "08/01/2027",
        maxDate: new Date(2027, 2, 15),
      });

      await user.click(screen.getByLabelText("Date"));
      const calendar = await screen.findByLabelText("calendar-container");

      expect(calendar.querySelector(".cur-month")).toHaveTextContent("March");
      expect(calendar.querySelector(".cur-year")).toHaveValue(2027);
    });

    it("updates the header when the prop changes with no selection", async () => {
      const { rerender } = render(DatePicker, {
        datePickerType: "single",
        initialMonth: "04/01/2027",
      });

      await user.click(screen.getByLabelText("Date"));
      const calendar = await screen.findByLabelText("calendar-container");
      expect(calendar.querySelector(".cur-month")).toHaveTextContent("April");

      await rerender({ datePickerType: "single", initialMonth: "09/01/2028" });
      await tick();

      expect(calendar.querySelector(".cur-month")).toHaveTextContent(
        "September",
      );
      expect(calendar.querySelector(".cur-year")).toHaveValue(2028);
    });

    it("does not update the header when the prop changes with a selection", async () => {
      const { rerender } = render(DatePicker, {
        datePickerType: "single",
        value: "01/05/2024",
        initialMonth: "04/01/2027",
      });

      await user.click(screen.getByLabelText("Date"));
      const calendar = await screen.findByLabelText("calendar-container");
      expect(calendar.querySelector(".cur-month")).toHaveTextContent("January");

      await rerender({
        datePickerType: "single",
        value: "01/05/2024",
        initialMonth: "09/01/2028",
      });
      await tick();

      expect(calendar.querySelector(".cur-month")).toHaveTextContent("January");
    });

    it("ignores an unparseable value without throwing or logging an error", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      render(DatePicker, {
        datePickerType: "single",
        initialMonth: "not-a-date",
      });

      await user.click(screen.getByLabelText("Date"));
      const calendar = await screen.findByLabelText("calendar-container");

      const currentMonthName = new Date().toLocaleString("en-US", {
        month: "long",
      });
      expect(calendar.querySelector(".cur-month")).toHaveTextContent(
        currentMonthName,
      );
      expect(consoleError).not.toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it("keeps a manually navigated month across an unrelated re-render", async () => {
      const { rerender } = render(DatePicker, {
        datePickerType: "single",
        initialMonth: "04/01/2027",
      });

      const input = screen.getByLabelText("Date");
      await user.click(input);
      const calendar = await screen.findByLabelText("calendar-container");
      expect(calendar.querySelector(".cur-month")).toHaveTextContent("April");

      const next = calendar.querySelector<HTMLElement>(".flatpickr-next-month");
      assert(next);
      await user.click(next);
      expect(calendar.querySelector(".cur-month")).toHaveTextContent("May");
      expect(calendar.querySelector(".cur-year")).toHaveValue(2027);

      // Unrelated re-render: same `initialMonth`, but `short` changes,
      // which re-triggers the `initCalendar` reactive statement.
      await rerender({
        datePickerType: "single",
        initialMonth: "04/01/2027",
        short: true,
      });
      await tick();

      expect(calendar.querySelector(".cur-month")).toHaveTextContent("May");
      expect(calendar.querySelector(".cur-year")).toHaveValue(2027);
    });
  });

  describe("flatpickrProps", () => {
    it("merges showMonths into the calendar", async () => {
      render(DatePicker, {
        datePickerType: "single",
        flatpickrProps: { showMonths: 2 },
      });

      const input = screen.getByLabelText("Date");
      await user.click(input);
      const calendar = await screen.findByLabelText("calendar-container");

      expect(calendar.querySelectorAll(".flatpickr-month").length).toBe(2);
    });

    it("ignores the unsupported wrap option instead of crashing", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      render(DatePicker, {
        datePickerType: "single",
        // @ts-expect-error `wrap` is omitted from the type; JS callers can still pass it.
        flatpickrProps: { wrap: true },
      });

      await user.click(screen.getByLabelText("Date"));
      expect(
        await screen.findByLabelText("calendar-container"),
      ).toBeInTheDocument();
      expect(consoleError).not.toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it("stays usable as a plain input when flatpickr fails to initialize", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const { unmount } = render(DatePicker, {
        datePickerType: "single",
        flatpickrProps: {
          plugins: [
            () => {
              throw new Error("plugin failed");
            },
          ],
        },
      });

      const input = screen.getByLabelText("Date");
      await user.type(input, "01/01/2023");
      expect(input).toHaveValue("01/01/2023");
      // flatpickr reports the failure itself; it must not be silent.
      expect(consoleError).toHaveBeenCalledWith(
        expect.objectContaining({ message: "plugin failed" }),
      );
      expect(() => unmount()).not.toThrow();
      consoleError.mockRestore();
    });

    it("preselects flatpickrProps.defaultDate when value is empty", async () => {
      render(DatePicker, {
        datePickerType: "single",
        flatpickrProps: { defaultDate: "03/12/2024" },
      });

      const input = screen.getByLabelText("Date");
      await vi.waitFor(() => expect(input).toHaveValue("03/12/2024"));
    });

    it("syncs flatpickrProps.defaultDate to the bound value", async () => {
      render(DatePickerDefaultDate);

      await vi.waitFor(() =>
        expect(screen.getByTestId("value")).toHaveTextContent("03/12/2024"),
      );
    });

    it("prefers value over flatpickrProps.defaultDate", async () => {
      render(DatePicker, {
        datePickerType: "single",
        value: "01/05/2024",
        flatpickrProps: { defaultDate: "03/12/2024" },
      });

      const input = screen.getByLabelText("Date");
      await user.click(input);
      const calendar = await screen.findByLabelText("calendar-container");
      expect(input).toHaveValue("01/05/2024");
      expect(calendar.querySelector(".flatpickr-day.selected")).toHaveAttribute(
        "aria-label",
        "Friday, January 5, 2024",
      );
    });

    it("keeps the picked date when formatDate output is not parseable", async () => {
      render(DatePicker, {
        datePickerType: "single",
        value: "03/15/2024",
        flatpickrProps: {
          formatDate: (date: Date) => `Day ${date.getDate()}`,
        },
      });

      const input = screen.getByLabelText("Date");
      await user.click(input);
      const calendar = await screen.findByLabelText("calendar-container");
      const day = Array.from(
        calendar.querySelectorAll<HTMLElement>(
          ".flatpickr-day:not(.prevMonthDay):not(.nextMonthDay)",
        ),
      ).find((node) => node.textContent === "10");
      assert(day);
      await user.click(day);
      await tick();

      expect(input).toHaveValue("Day 10");
      await user.click(input);
      const selected = calendar.querySelector(".flatpickr-day.selected");
      expect(selected).toHaveTextContent("10");
      expect(calendar.querySelector(".cur-month")).toHaveTextContent("March");
    });

    it("applies Carbon classes to an inline calendar that never opens", async () => {
      render(DatePicker, {
        datePickerType: "single",
        flatpickrProps: { inline: true },
      });

      const calendar = await screen.findByLabelText("calendar-container");
      expect(calendar).toHaveClass("inline", "bx--date-picker__calendar");
      expect(calendar.querySelector(".flatpickr-day")).toHaveClass(
        "bx--date-picker__day",
      );
      // Inside the input wrapper it would stretch the box that vertically
      // centers the calendar icon.
      expect(calendar.closest(".bx--date-picker-input__wrapper")).toBeNull();
      expect(calendar.previousElementSibling).toHaveClass(
        "bx--date-picker-input__wrapper",
      );
      // The month dropdown is replaced by Carbon's static label.
      expect(calendar.querySelector(".cur-month")).toBeInTheDocument();
      expect(
        calendar.querySelector(".flatpickr-monthDropdown-months"),
      ).not.toBeInTheDocument();
    });

    it("labels the visible altInput instead of the hidden original", async () => {
      render(DatePicker, {
        datePickerType: "single",
        dateFormat: "Y-m-d",
        value: "2024-03-15",
        flatpickrProps: { altInput: true, altFormat: "F j, Y" },
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

    it("mirrors later state changes onto the visible altInput", async () => {
      const props = {
        datePickerType: "single",
        helperText: "Pick a weekday",
        flatpickrProps: { altInput: true, altFormat: "F j, Y" },
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
      // flatpickr's own classes on the visible input survive the sync.
      expect(visible).toHaveClass("bx--date-picker__input");
      expect(visible).not.toHaveClass("flatpickr-input");
    });

    it("creates one flatpickr instance when props settle during init", async () => {
      const onReady = vi.fn();
      const onDestroy = vi.fn();
      render(DatePicker, {
        datePickerType: "single",
        helperText: "Pick a weekday",
        flatpickrProps: {
          altInput: true,
          altFormat: "F j, Y",
          onReady,
          onDestroy,
        },
      });

      await screen.findByLabelText("calendar-container");
      await tick();
      expect(onReady).toHaveBeenCalledTimes(1);
      expect(onDestroy).not.toHaveBeenCalled();
    });

    it("does not retry a failed flatpickr init on every update", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const plugin = vi.fn(() => {
        throw new Error("plugin failed");
      });
      const props: ComponentProps<typeof DatePicker> = {
        datePickerType: "single",
        flatpickrProps: { plugins: [plugin] },
      };
      const { rerender } = render(DatePicker, props);
      await tick();
      const attempts = plugin.mock.calls.length;
      expect(attempts).toBeGreaterThan(0);

      await rerender({ ...props, helperText: "Changed" });
      await rerender({ ...props, invalid: true });
      await tick();
      expect(plugin).toHaveBeenCalledTimes(attempts);
      consoleError.mockRestore();
    });

    it("omits the options Carbon overrides from the prop type", () => {
      type FlatpickrProps = NonNullable<
        ComponentProps<DatePickerComponent>["flatpickrProps"]
      >;

      expectTypeOf<FlatpickrProps>().toHaveProperty("showMonths");
      expectTypeOf<FlatpickrProps>().not.toHaveProperty("wrap");
      expectTypeOf<FlatpickrProps>().not.toHaveProperty("mode");
    });

    it("does not re-apply a range rule that is rebuilt with equal contents", async () => {
      function props(): ComponentProps<typeof DatePicker> {
        return {
          datePickerType: "single",
          flatpickrProps: {
            disable: [{ from: "03/10/2024", to: new Date(2024, 2, 14) }],
          },
        };
      }
      const { rerender } = render(DatePicker, props());
      const input = screen.getByLabelText("Date");
      await screen.findByLabelText("calendar-container");
      const calendar = getFlatpickrInstance(input);
      const set = vi.spyOn(calendar, "set");

      await rerender(props());
      await rerender(props());
      expect(set).not.toHaveBeenCalled();

      await rerender({
        ...props(),
        flatpickrProps: {
          disable: [{ from: "03/10/2024", to: new Date(2024, 2, 20) }],
        },
      });
      expect(set).toHaveBeenCalledWith("disable", expect.anything());
    });

    it("re-applies positionElement when it points at another element", async () => {
      const first = document.createElement("div");
      const second = document.createElement("div");
      const props: ComponentProps<typeof DatePicker> = {
        datePickerType: "single",
        portalMenu: true,
      };
      const { rerender } = render(DatePicker, {
        ...props,
        flatpickrProps: { positionElement: first },
      });
      const input = screen.getByLabelText("Date");
      await screen.findByLabelText("calendar-container");
      const calendar = getFlatpickrInstance(input);
      const set = vi.spyOn(calendar, "set");

      await rerender({ ...props, flatpickrProps: { positionElement: second } });
      expect(set).toHaveBeenCalledWith("positionElement", second);
    });

    it("does not re-apply a Date that is rebuilt with an equal value", async () => {
      function props(): ComponentProps<typeof DatePicker> {
        return {
          datePickerType: "single",
          minDate: new Date(2024, 0, 1),
          maxDate: new Date(2024, 11, 31),
          flatpickrProps: { disable: [new Date(2024, 5, 15)] },
        };
      }
      const { rerender } = render(DatePicker, props());
      const input = screen.getByLabelText("Date");
      await screen.findByLabelText("calendar-container");
      const calendar = getFlatpickrInstance(input);
      const set = vi.spyOn(calendar, "set");

      await rerender(props());
      await rerender(props());
      expect(set).not.toHaveBeenCalled();

      await rerender({ ...props(), minDate: new Date(2024, 1, 1) });
      expect(set).toHaveBeenCalledWith("minDate", new Date(2024, 1, 1));
    });

    it("does not re-apply an inline option whose contents are unchanged", async () => {
      let calendar: Instance | null = null;
      const { rerender } = render(DatePickerInlineOptions, {
        oncalendar: (cal) => {
          calendar = cal ?? null;
        },
      });
      await vi.waitFor(() => expect(calendar).not.toBeNull());
      assert(calendar);
      const set = vi.spyOn(calendar as Instance, "set");

      await rerender({ renders: 1 });
      await rerender({ renders: 2 });
      expect(screen.getByText("Render 2")).toBeInTheDocument();
      expect(set).not.toHaveBeenCalledWith("disable", expect.anything());
    });

    it("keeps Carbon's hooks when a consumer hook changes after mount", async () => {
      const props: ComponentProps<typeof DatePicker> = {
        datePickerType: "single",
        value: "03/15/2024",
        minDate: "03/10/2024",
      };
      const { rerender } = render(DatePicker, {
        ...props,
        flatpickrProps: { onDayCreate: () => {} },
      });
      await user.click(screen.getByLabelText("Date"));
      const calendar = await screen.findByLabelText("calendar-container");

      const onDayCreate = vi.fn();
      await rerender({ ...props, flatpickrProps: { onDayCreate } });
      const next = calendar.querySelector<HTMLElement>(".flatpickr-next-month");
      const prev = calendar.querySelector<HTMLElement>(".flatpickr-prev-month");
      assert(next && prev);
      await user.click(next);
      await user.click(prev);

      expect(onDayCreate).toHaveBeenCalled();
      expect(
        calendar.querySelectorAll(".flatpickr-day[aria-disabled='true']")
          .length,
      ).toBeGreaterThan(0);
      expect(calendar.querySelector(".flatpickr-day")).toHaveClass(
        "bx--date-picker__day",
      );
    });

    it("runs Carbon's open handling alongside flatpickrProps.onOpen", async () => {
      const onOpen = vi.fn();
      render(DatePicker, {
        datePickerType: "single",
        flatpickrProps: { onOpen },
      });
      await user.click(screen.getByLabelText("Date"));
      const calendar = await screen.findByLabelText("calendar-container");

      expect(onOpen).toHaveBeenCalled();
      expect(calendar).toHaveClass("bx--date-picker__calendar");
      expect(calendar.querySelector(".cur-month")).toBeInTheDocument();
    });

    it("still runs a consumer onReady hook", async () => {
      const onReady = vi.fn();
      render(DatePicker, {
        datePickerType: "single",
        flatpickrProps: { onReady },
      });

      await vi.waitFor(() => expect(onReady).toHaveBeenCalledTimes(1));
    });

    it("stays open when an ignoredFocusElements element is clicked", async () => {
      render(DatePickerIgnoredFocus);

      await user.click(await screen.findByLabelText("Date"));
      const calendar = await screen.findByLabelText("calendar-container");
      expect(calendar).toHaveClass("open");

      await user.click(screen.getByRole("button", { name: "Preset" }));
      expect(calendar).toHaveClass("open");

      await user.click(screen.getByRole("button", { name: "Elsewhere" }));
      expect(calendar).not.toHaveClass("open");
    });

    it("abbreviates the month label when shorthandCurrentMonth is set", async () => {
      render(DatePicker, {
        datePickerType: "single",
        value: "09/15/2024",
        flatpickrProps: { shorthandCurrentMonth: true },
      });

      await user.click(screen.getByLabelText("Date"));
      const calendar = await screen.findByLabelText("calendar-container");
      const month = calendar.querySelector(".cur-month");
      expect(month).toHaveTextContent(/^Sep$/);

      // The label is rewritten on month change as well as on open.
      const next = calendar.querySelector<HTMLElement>(".flatpickr-next-month");
      assert(next);
      await user.click(next);
      expect(calendar.querySelector(".cur-month")).toHaveTextContent(/^Oct$/);
    });

    it("keeps the calendar open after selecting a date when closeOnSelect is false", async () => {
      render(DatePicker, {
        datePickerType: "single",
        flatpickrProps: { closeOnSelect: false },
      });

      const input = screen.getByLabelText("Date");
      await user.click(input);
      const calendar = await screen.findByLabelText("calendar-container");
      const day = calendar.querySelector<HTMLElement>(
        ".flatpickr-day:not(.prevMonthDay):not(.nextMonthDay)",
      );

      expect(calendar).toHaveClass("open");
      expect(day).toBeInTheDocument();
      if (!day) throw new Error("expected a selectable day");

      await user.click(day);

      expect(calendar).toHaveClass("open");
    });

    // Regression test: axe-core flags out-of-range calendar days for
    // insufficient color contrast because they carry no ARIA signal that
    // they are disabled (only the meaningless flatpickr-disabled CSS class).
    // WCAG 1.4.3 exempts text belonging to an inactive UI component, and
    // axe-core's color-contrast check specifically skips aria-disabled="true"
    // elements, so marking these days closes the gap correctly.
    it("marks out-of-range calendar days as aria-disabled", async () => {
      const { container } = render(DatePicker, {
        datePickerType: "single",
        value: "03/01/2024",
        minDate: new Date(2024, 2, 1),
        maxDate: new Date(2024, 2, 31),
      });

      await user.click(screen.getByLabelText("Date"));
      await screen.findByLabelText("calendar-container");

      const disabledDays = container.querySelectorAll(
        ".flatpickr-day.flatpickr-disabled",
      );
      expect(disabledDays.length).toBeGreaterThan(0);
      for (const day of disabledDays) {
        expect(day).toHaveAttribute("aria-disabled", "true");
      }
    });

    it("composes a consumer-supplied onDayCreate with the default aria-disabled hook", async () => {
      const onDayCreate = vi.fn();
      const { container } = render(DatePicker, {
        datePickerType: "single",
        value: "03/01/2024",
        minDate: new Date(2024, 2, 1),
        maxDate: new Date(2024, 2, 31),
        flatpickrProps: { onDayCreate },
      });

      await user.click(screen.getByLabelText("Date"));
      await screen.findByLabelText("calendar-container");

      expect(onDayCreate).toHaveBeenCalled();
      const disabledDays = container.querySelectorAll(
        ".flatpickr-day.flatpickr-disabled",
      );
      expect(disabledDays.length).toBeGreaterThan(0);
      for (const day of disabledDays) {
        expect(day).toHaveAttribute("aria-disabled", "true");
      }
    });

    it("disables the open/close animation by default, overridable via flatpickrProps", async () => {
      const { unmount } = render(DatePicker, {
        datePickerType: "single",
      });

      let input = screen.getByLabelText("Date");
      await user.click(input);
      await screen.findByLabelText("calendar-container");
      expect(getFlatpickrInstance(input).config.animate).toBe(false);

      unmount();

      render(DatePicker, {
        datePickerType: "single",
        flatpickrProps: { animate: true },
      });
      input = screen.getByLabelText("Date");
      await user.click(input);
      await screen.findByLabelText("calendar-container");
      expect(getFlatpickrInstance(input).config.animate).toBe(true);
    });

    it("marks explicitly disabled dates from flatpickrProps.disable as aria-disabled", async () => {
      const { container } = render(DatePicker, {
        datePickerType: "single",
        value: "03/01/2024",
        flatpickrProps: { disable: ["03/15/2024"] },
      });

      await user.click(screen.getByLabelText("Date"));
      await screen.findByLabelText("calendar-container");

      const days = Array.from(
        container.querySelectorAll<HTMLElement>(".flatpickr-day"),
      );
      const day15 = days.find(
        (day) =>
          day.textContent?.trim() === "15" &&
          !day.classList.contains("prevMonthDay") &&
          !day.classList.contains("nextMonthDay"),
      );
      expect(day15).toHaveClass("flatpickr-disabled");
      expect(day15).toHaveAttribute("aria-disabled", "true");

      const disabledDays = container.querySelectorAll(
        ".flatpickr-day.flatpickr-disabled",
      );
      expect(disabledDays.length).toBe(1);
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
      await user.click(input);
      const calendar = await screen.findByLabelText("calendar-container");

      for (const day of [9, 10, 12, 13, 14, 20]) {
        const dayElem = getDayByNumber(calendar, day);
        expect(dayElem).toHaveClass("flatpickr-disabled");
        expect(dayElem).toHaveAttribute("aria-disabled", "true");
      }

      const day9 = getDayByNumber(calendar, 9);
      if (!day9) throw new Error("expected day 9");
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

      await user.click(screen.getByLabelText("Date"));
      const calendar = await screen.findByLabelText("calendar-container");

      expect(getDayByNumber(calendar, 15)).not.toHaveClass(
        "flatpickr-disabled",
      );
      expect(getDayByNumber(calendar, 16)).toHaveClass("flatpickr-disabled");
    });

    it("treats empty arrays as no rule", async () => {
      const { container } = render(DatePicker, {
        datePickerType: "single",
        disabledDates: [],
        enabledDates: [],
      });

      await user.click(screen.getByLabelText("Date"));
      await screen.findByLabelText("calendar-container");

      expect(
        container.querySelectorAll(".flatpickr-day.flatpickr-disabled").length,
      ).toBe(0);
    });

    it("reassigning disabledDates updates an open calendar", async () => {
      const { rerender } = render(DatePicker, {
        datePickerType: "single",
        value: "03/01/2024",
      });

      await user.click(screen.getByLabelText("Date"));
      const calendar = await screen.findByLabelText("calendar-container");

      expect(getDayByNumber(calendar, 9)).not.toHaveClass("flatpickr-disabled");

      await rerender({ disabledDates: ["03/09/2024"] });
      await tick();

      const day9 = getDayByNumber(calendar, 9);
      expect(day9).toHaveClass("flatpickr-disabled");
      // Days are rebuilt on redraw, so aria-disabled must still be applied.
      expect(day9).toHaveAttribute("aria-disabled", "true");
    });

    it("keeps the selected value when a rule change disables it", async () => {
      const { rerender } = render(DatePicker, {
        datePickerType: "single",
        value: "03/09/2024",
      });

      const input = screen.getByLabelText("Date");
      await user.click(input);
      await screen.findByLabelText("calendar-container");

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
      await user.click(input);
      await screen.findByLabelText("calendar-container");

      const setSpy = vi.spyOn(getFlatpickrInstance(input), "set");

      // Trigger a reactive update that keeps the same `disabledDates` reference.
      await rerender({ disabledDates, light: true });
      await tick();

      expect(setSpy).not.toHaveBeenCalledWith("disable", expect.anything());
    });

    it("wins over flatpickrProps.disable; flatpickrProps.disable still applies once the prop is empty", async () => {
      const { rerender } = render(DatePicker, {
        datePickerType: "single",
        value: "03/01/2024",
        disabledDates: ["03/09/2024"],
        flatpickrProps: { disable: ["03/15/2024"] },
      });

      await user.click(screen.getByLabelText("Date"));
      const calendar = await screen.findByLabelText("calendar-container");

      expect(getDayByNumber(calendar, 9)).toHaveClass("flatpickr-disabled");
      expect(getDayByNumber(calendar, 15)).not.toHaveClass(
        "flatpickr-disabled",
      );

      await rerender({
        disabledDates: [],
        flatpickrProps: { disable: ["03/15/2024"] },
      });
      await tick();

      expect(getDayByNumber(calendar, 9)).not.toHaveClass("flatpickr-disabled");
      expect(getDayByNumber(calendar, 15)).toHaveClass("flatpickr-disabled");
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

    it("does not dispatch an error for a valid initial value", async () => {
      const errorHandler = vi.fn();
      render(DatePicker, {
        datePickerType: "single",
        value: "01/01/2024",
        onerror: errorHandler,
      });

      const input = screen.getByLabelText("Date");
      await vi.waitFor(() => expect(input).toHaveValue("01/01/2024"));
      expect(errorHandler).not.toHaveBeenCalled();
    });

    it("calls a consumer flatpickrProps.errorHandler in addition to dispatching", async () => {
      const errorHandler = vi.fn();
      const userErrorHandler = vi.fn();
      render(DatePicker, {
        datePickerType: "single",
        value: "not-a-date",
        flatpickrProps: { errorHandler: userErrorHandler },
        onerror: errorHandler,
      });

      await vi.waitFor(() => expect(errorHandler).toHaveBeenCalledTimes(1));
      expect(userErrorHandler).toHaveBeenCalledTimes(1);
      expect(userErrorHandler.mock.lastCall?.[0]).toBeInstanceOf(Error);
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

    it("uses the latest flatpickrProps.errorHandler after it changes", async () => {
      const handlerA = vi.fn();
      const handlerB = vi.fn();
      let captured: Instance | null | undefined = null;
      const { rerender } = render(DatePickerCalendar, {
        datePickerType: "single",
        flatpickrProps: { errorHandler: handlerA },
        oncalendar: (cal: Instance | null | undefined) => {
          captured = cal;
        },
      });

      const instance = await vi.waitFor(() => {
        if (!captured) throw new Error("calendar not set");
        return captured;
      });

      await rerender({
        datePickerType: "single",
        flatpickrProps: { errorHandler: handlerB },
        oncalendar: (cal: Instance | null | undefined) => {
          captured = cal;
        },
      });
      await tick();

      instance.setDate("not-a-date", true);

      expect(handlerA).not.toHaveBeenCalled();
      expect(handlerB).toHaveBeenCalledTimes(1);
    });
  });

  describe("bind:calendar", () => {
    it("is null in simple mode (no calendar is created)", async () => {
      let captured: unknown = "unset";
      render(DatePickerCalendar, {
        props: {
          datePickerType: "simple",
          oncalendar: (cal: Instance | null | undefined) => {
            captured = cal;
          },
        },
      });

      await tick();
      expect(captured).toBeNull();
    });

    it("exposes the flatpickr instance in single mode", async () => {
      let captured: Instance | null | undefined = null;
      render(DatePickerCalendar, {
        props: {
          datePickerType: "single",
          oncalendar: (cal: Instance | null | undefined) => {
            captured = cal;
          },
        },
      });

      const instance = await vi.waitFor(() => {
        if (!captured) throw new Error("calendar not set");
        return captured;
      });

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
      let captured: Instance | null | undefined = null;
      render(DatePickerCalendar, {
        props: {
          datePickerType: "single",
          oncalendar: (cal: Instance | null | undefined) => {
            captured = cal;
          },
        },
      });

      const instance = await vi.waitFor(() => {
        if (!captured) throw new Error("calendar not set");
        return captured;
      });

      expect(instance.isOpen).toBe(false);

      instance.open();
      await tick();
      expect(instance.isOpen).toBe(true);
      const calendar = await screen.findByLabelText("calendar-container");
      expect(calendar).toHaveClass("open");

      instance.close();
      await tick();
      expect(instance.isOpen).toBe(false);
      expect(calendar).not.toHaveClass("open");
    });

    it("exposes the flatpickr instance in multiple mode", async () => {
      let captured: Instance | null | undefined = null;
      render(DatePickerCalendar, {
        props: {
          datePickerType: "multiple",
          oncalendar: (cal: Instance | null | undefined) => {
            captured = cal;
          },
        },
      });

      const instance = await vi.waitFor(() => {
        if (!captured) throw new Error("calendar not set");
        return captured;
      });

      expect(instance.config.mode).toBe("multiple");
      expect(typeof instance.setDate).toBe("function");
    });

    it("exposes the flatpickr instance in range mode", async () => {
      let captured: Instance | null | undefined = null;
      render(DatePickerCalendar, {
        props: {
          datePickerType: "range",
          oncalendar: (cal: Instance | null | undefined) => {
            captured = cal;
          },
        },
      });

      const instance = await vi.waitFor(() => {
        if (!captured) throw new Error("calendar not set");
        return captured;
      });

      expect(typeof instance.setDate).toBe("function");
      expect(typeof instance.open).toBe("function");
      expect(typeof instance.close).toBe("function");
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
      for (const el of document.body.querySelectorAll(".flatpickr-calendar")) {
        el.remove();
      }
    });

    it("renders calendar inside the date picker wrapper by default", async () => {
      const { container } = render(DatePicker, {
        datePickerType: "single",
      });

      const input = screen.getByLabelText("Date");
      await user.click(input);

      const calendar = await screen.findByLabelText("calendar-container");
      const wrapper = container.querySelector(".bx--date-picker");
      expect(wrapper?.contains(calendar)).toBe(true);
      expect(calendar.classList.contains("static")).toBe(true);
    });

    it("renders calendar at document.body when portalMenu is true", async () => {
      const { container } = render(DatePicker, {
        datePickerType: "single",
        portalMenu: true,
      });

      const input = screen.getByLabelText("Date");
      await user.click(input);

      const calendar = await screen.findByLabelText("calendar-container");
      const wrapper = container.querySelector(".bx--date-picker");
      expect(wrapper?.contains(calendar)).toBe(false);
      expect(document.body.contains(calendar)).toBe(true);
      expect(calendar.classList.contains("static")).toBe(false);
    });

    it("renders calendar at document.body when inside Modal (portalMenu not passed)", async () => {
      const { container } = render(DatePickerInModal, {
        modalOpen: true,
      });

      const input = screen.getByLabelText("Date");
      await user.click(input);

      const calendar = await screen.findByLabelText("calendar-container");
      const wrapper = container.querySelector(".bx--date-picker");
      expect(wrapper?.contains(calendar)).toBe(false);
      expect(document.body.contains(calendar)).toBe(true);
      expect(calendar.classList.contains("static")).toBe(false);
    });

    it("renders calendar inside wrapper when inside Modal with portalMenu=false", async () => {
      const { container } = render(DatePickerInModal, {
        modalOpen: true,
        portalMenu: false,
      });

      const input = screen.getByLabelText("Date");
      await user.click(input);

      const calendar = await screen.findByLabelText("calendar-container");
      const wrapper = container.querySelector(".bx--date-picker");
      expect(wrapper?.contains(calendar)).toBe(true);
      expect(calendar.classList.contains("static")).toBe(true);
    });

    it("does not reapply static:true on a reactive re-run (#3444)", async () => {
      const { rerender } = render(DatePicker, {
        datePickerType: "single",
        portalMenu: true,
      });

      const input = screen.getByLabelText("Date");
      await user.click(input);
      await screen.findByLabelText("calendar-container");

      const fp = getFlatpickrInstance(input);
      expect(fp.config.static).toBe(false);

      // Trigger the `initCalendar` reactive statement to re-run (e.g. a
      // minDate update) without touching `portalMenu` or `flatpickrProps`.
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
    it("renders multiple mode", async () => {
      const { container } = render(DatePicker, {
        datePickerType: "multiple",
      });

      const input = screen.getByLabelText("Date");
      const wrapper = container.querySelector(".bx--date-picker");
      // Multiple mode reuses the single-mode input width styling.
      expect(wrapper).toHaveClass("bx--date-picker--single");

      expect(
        screen.queryByLabelText("calendar-container"),
      ).not.toBeInTheDocument();
      await user.click(input);
      expect(
        await screen.findByLabelText("calendar-container"),
      ).toBeInTheDocument();
    });

    it("toggles a day in and out of selection on repeated clicks", async () => {
      render(DatePicker, { datePickerType: "multiple" });

      await user.click(screen.getByLabelText("Date"));
      const calendar = await screen.findByLabelText("calendar-container");
      // flatpickr rebuilds the days grid from scratch on every selection, so
      // the day element must be re-queried after each click.
      const getDay = () =>
        calendar.querySelector<HTMLElement>(
          ".flatpickr-day:not(.prevMonthDay):not(.nextMonthDay)",
        );

      const day = getDay();
      if (!day) throw new Error("expected a selectable day");
      await user.click(day);
      expect(getDay()).toHaveClass("selected");

      const dayAgain = getDay();
      if (!dayAgain) throw new Error("expected a selectable day");
      await user.click(dayAgain);
      expect(getDay()).not.toHaveClass("selected");
    });

    it("does not close the calendar after selecting a date", async () => {
      render(DatePicker, { datePickerType: "multiple" });

      await user.click(screen.getByLabelText("Date"));
      const calendar = await screen.findByLabelText("calendar-container");
      const day = calendar.querySelector<HTMLElement>(
        ".flatpickr-day:not(.prevMonthDay):not(.nextMonthDay)",
      );
      if (!day) throw new Error("expected a selectable day");

      await user.click(day);
      expect(calendar).toHaveClass("open");
    });

    it("dispatches change with all selected dates joined by a comma", async () => {
      const changeHandler = vi.fn();
      render(DatePicker, {
        datePickerType: "multiple",
        onchange: changeHandler,
      });

      await user.click(screen.getByLabelText("Date"));
      const calendar = await screen.findByLabelText("calendar-container");
      // flatpickr rebuilds the days grid from scratch on every selection, so
      // the day elements must be re-queried after each click.
      const getDays = () =>
        calendar.querySelectorAll<HTMLElement>(
          ".flatpickr-day:not(.prevMonthDay):not(.nextMonthDay)",
        );

      await user.click(getDays()[0]);
      await user.click(getDays()[1]);

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

      await user.click(screen.getByLabelText("Date"));
      const calendar = await screen.findByLabelText("calendar-container");
      const getDays = () =>
        calendar.querySelectorAll<HTMLElement>(
          ".flatpickr-day:not(.prevMonthDay):not(.nextMonthDay)",
        );

      await user.click(getDays()[0]);
      await user.click(getDays()[1]);

      const input = screen.getByLabelText("Date");
      assert(input instanceof HTMLInputElement);
      expect(input.value).toMatch(/^\d{4}-\d{2}-\d{2}, \d{4}-\d{2}-\d{2}$/);
    });

    // Regression test: the input has no maxlength and the derived pattern
    // (see "pattern derived from dateFormat" above) allows unbounded
    // repetitions, so selecting many dates must not lose any of them.
    it("does not truncate the input value when many dates are selected", async () => {
      let captured: Instance | null | undefined = null;
      render(DatePickerCalendar, {
        props: {
          datePickerType: "multiple",
          oncalendar: (cal: Instance | null | undefined) => {
            captured = cal;
          },
        },
      });

      const instance = await vi.waitFor(() => {
        if (!captured) throw new Error("calendar not set");
        return captured;
      });

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

    describe("shift-click range selection", () => {
      function getSelectedDayNumbers(calendar: HTMLElement) {
        return Array.from(
          calendar.querySelectorAll<HTMLElement>(".flatpickr-day.selected"),
        )
          .map((el) => Number(el.textContent?.trim()))
          .sort((a, b) => a - b);
      }

      it("extends the selection to a contiguous range on shift-click", async () => {
        render(DatePicker, { datePickerType: "multiple", value: "03/10/2024" });

        await user.click(screen.getByLabelText("Date"));
        const calendar = await screen.findByLabelText("calendar-container");

        const day5 = getDayByNumber(calendar, 5);
        if (!day5) throw new Error("expected day 5");
        await user.click(day5);

        await user.keyboard("{Shift>}");
        const day10 = getDayByNumber(calendar, 10);
        if (!day10) throw new Error("expected day 10");
        await user.click(day10);
        await user.keyboard("{/Shift}");

        expect(getSelectedDayNumbers(calendar)).toEqual([5, 6, 7, 8, 9, 10]);
      });

      it("adds the shift-click range to the existing selection instead of replacing it", async () => {
        render(DatePicker, { datePickerType: "multiple", value: "03/20/2024" });

        await user.click(screen.getByLabelText("Date"));
        const calendar = await screen.findByLabelText("calendar-container");

        const day5 = getDayByNumber(calendar, 5);
        if (!day5) throw new Error("expected day 5");
        await user.click(day5);

        await user.keyboard("{Shift>}");
        const day8 = getDayByNumber(calendar, 8);
        if (!day8) throw new Error("expected day 8");
        await user.click(day8);
        await user.keyboard("{/Shift}");

        // day 20 (from the initial value) survives alongside the new range.
        expect(getSelectedDayNumbers(calendar)).toEqual([5, 6, 7, 8, 20]);
      });

      it("skips disabled dates within a shift-click range", async () => {
        render(DatePicker, {
          datePickerType: "multiple",
          value: "03/10/2024",
          flatpickrProps: { disable: ["03/07/2024"] },
        });

        await user.click(screen.getByLabelText("Date"));
        const calendar = await screen.findByLabelText("calendar-container");

        const day5 = getDayByNumber(calendar, 5);
        if (!day5) throw new Error("expected day 5");
        await user.click(day5);

        await user.keyboard("{Shift>}");
        const day9 = getDayByNumber(calendar, 9);
        if (!day9) throw new Error("expected day 9");
        await user.click(day9);
        await user.keyboard("{/Shift}");

        // day 7 is disabled and skipped; day 10 (initial value) survives.
        expect(getSelectedDayNumbers(calendar)).toEqual([5, 6, 8, 9, 10]);
      });

      it("moves the anchor on the next plain click after a shift-click", async () => {
        render(DatePicker, { datePickerType: "multiple", value: "03/01/2024" });

        await user.click(screen.getByLabelText("Date"));
        const calendar = await screen.findByLabelText("calendar-container");

        const day5 = getDayByNumber(calendar, 5);
        if (!day5) throw new Error("expected day 5");
        await user.click(day5);

        await user.keyboard("{Shift>}");
        const day7 = getDayByNumber(calendar, 7);
        if (!day7) throw new Error("expected day 7");
        await user.click(day7);
        await user.keyboard("{/Shift}");

        // Plain click on day 20 moves the anchor there instead of day 5.
        const day20 = getDayByNumber(calendar, 20);
        if (!day20) throw new Error("expected day 20");
        await user.click(day20);

        await user.keyboard("{Shift>}");
        const day18 = getDayByNumber(calendar, 18);
        if (!day18) throw new Error("expected day 18");
        await user.click(day18);
        await user.keyboard("{/Shift}");

        expect(getSelectedDayNumbers(calendar)).toEqual([
          1, 5, 6, 7, 18, 19, 20,
        ]);
      });
    });
  });

  describe("month mode", () => {
    it("renders month mode", async () => {
      const { container } = render(DatePicker, {
        datePickerType: "month",
        dateFormat: "F Y",
      });

      const input = screen.getByLabelText("Date");

      const wrapper = container.querySelector(".bx--date-picker");
      // Month mode reuses the single-mode input width styling.
      expect(wrapper).toHaveClass("bx--date-picker--single");

      expect(
        screen.queryByLabelText("calendar-container"),
      ).not.toBeInTheDocument();
      await user.click(input);
      expect(
        await screen.findByLabelText("calendar-container"),
      ).toBeInTheDocument();
    });

    it("renders a 12-month grid instead of days", async () => {
      render(DatePicker, { datePickerType: "month", dateFormat: "F Y" });

      await user.click(screen.getByLabelText("Date"));
      const calendar = await screen.findByLabelText("calendar-container");

      expect(
        calendar.querySelectorAll(".flatpickr-monthSelect-month"),
      ).toHaveLength(12);
      expect(calendar.querySelectorAll(".flatpickr-day")).toHaveLength(0);
    });

    it("marks the current month with the today class and aria-current", async () => {
      render(DatePicker, { datePickerType: "month", dateFormat: "F Y" });

      await user.click(screen.getByLabelText("Date"));
      const calendar = await screen.findByLabelText("calendar-container");

      const months = calendar.querySelectorAll(".flatpickr-monthSelect-month");
      const currentMonth = months[new Date().getMonth()];
      expect(currentMonth).toHaveClass("today");
      expect(currentMonth).toHaveAttribute("aria-current", "date");
    });

    // Regression test: SCSS scopes the shorter calendar height to month mode
    // via this marker class instead of `:has()` (unsupported at the Svelte 5
    // browser baseline).
    it("marks the calendar container for month-specific height styling", async () => {
      render(DatePicker, { datePickerType: "month", dateFormat: "F Y" });

      await user.click(screen.getByLabelText("Date"));
      const calendar = await screen.findByLabelText("calendar-container");

      expect(calendar).toHaveClass("bx--date-picker__calendar--month");
    });

    it("selects a month and dispatches change with the formatted date", async () => {
      const changeHandler = vi.fn();
      render(DatePicker, {
        datePickerType: "month",
        dateFormat: "F Y",
        onchange: changeHandler,
      });

      await user.click(screen.getByLabelText("Date"));
      const calendar = await screen.findByLabelText("calendar-container");

      await user.click(within(calendar).getByText("Mar"));

      const input = screen.getByLabelText("Date");
      assert(input instanceof HTMLInputElement);
      expect(input.value).toMatch(/^March \d{4}$/);
      expect(changeHandler).toHaveBeenCalled();
      expect(changeHandler.mock.lastCall?.[0]?.detail).toMatchObject({
        dateStr: input.value,
      });
    });

    it("closes the calendar after selecting a month", async () => {
      render(DatePicker, { datePickerType: "month", dateFormat: "F Y" });

      await user.click(screen.getByLabelText("Date"));
      const calendar = await screen.findByLabelText("calendar-container");
      expect(calendar).toHaveClass("open");

      await user.click(within(calendar).getByText("Jun"));
      expect(calendar).not.toHaveClass("open");
    });
  });

  describe("week mode", () => {
    /** A current-month day cell, by day of the month. */
    function dayCell(calendar: HTMLElement, day: number) {
      const now = new Date();
      const date = new Date(now.getFullYear(), now.getMonth(), day);
      const label = date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      const cell = calendar.querySelector<HTMLElement>(
        `[aria-label="${label}"]`,
      );
      if (!cell) throw new Error(`expected day ${day}`);
      return { cell, date };
    }

    const formatted = (date: Date) =>
      `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}/${date.getFullYear()}`;

    it("renders a single-width day grid", async () => {
      const { container } = render(DatePicker, { datePickerType: "week" });
      await user.click(screen.getByLabelText("Date"));
      const calendar = await screen.findByLabelText("calendar-container");

      expect(container.querySelector(".bx--date-picker")).toHaveClass(
        "bx--date-picker--single",
      );
      expect(
        calendar.querySelectorAll(".flatpickr-day").length,
      ).toBeGreaterThan(27);
    });

    it("selects the first day of the picked week", async () => {
      const onchange = vi.fn();
      render(DatePicker, { datePickerType: "week", onchange });
      await user.click(screen.getByLabelText("Date"));
      const calendar = await screen.findByLabelText("calendar-container");
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
        locale: { ...english, firstDayOfWeek: 1 },
      });
      await user.click(screen.getByLabelText("Date"));
      const calendar = await screen.findByLabelText("calendar-container");
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
      await user.click(input);
      const calendar = await screen.findByLabelText("calendar-container");
      await user.click(dayCell(calendar, 17).cell);

      await user.click(input);

      expect(
        calendar.querySelectorAll(".flatpickr-day.week.selected"),
      ).toHaveLength(7);
    });

    it("numbers the week by the days it shows", async () => {
      // Sunday, September 13, 2026 starts a week that is mostly ISO week 38.
      render(DatePickerDisplayFormat, {
        datePickerType: "week",
        displayFormat: "\\W\\e\\e\\k W, Y",
        value: "2026-09-16",
      });
      const calendar = await screen.findByLabelText("calendar-container");
      await user.click(screen.getByLabelText("Date"));
      const day = calendar.querySelector<HTMLElement>(
        '[aria-label="Wednesday, September 16, 2026"]',
      );
      if (!day) throw new Error("expected September 16, 2026");

      await user.click(day);

      expect(screen.getByLabelText("Date")).toHaveValue("Week 38, 2026");
    });

    it("keeps a value set from outside as given", async () => {
      const { rerender } = render(DatePicker, { datePickerType: "week" });
      await screen.findByLabelText("calendar-container");

      await rerender({ value: "01/18/2024" });

      expect(screen.getByLabelText("Date")).toHaveValue("01/18/2024");
    });
  });

  describe("year mode", () => {
    it("renders year mode", async () => {
      const { container } = render(DatePicker, {
        datePickerType: "year",
        dateFormat: "Y",
      });

      const input = screen.getByLabelText("Date");

      const wrapper = container.querySelector(".bx--date-picker");
      // Year mode reuses the single-mode input width styling.
      expect(wrapper).toHaveClass("bx--date-picker--single");

      expect(
        screen.queryByLabelText("calendar-container"),
      ).not.toBeInTheDocument();
      await user.click(input);
      expect(
        await screen.findByLabelText("calendar-container"),
      ).toBeInTheDocument();
    });

    it("renders a year grid instead of days", async () => {
      render(DatePicker, { datePickerType: "year", dateFormat: "Y" });

      await user.click(screen.getByLabelText("Date"));
      const calendar = await screen.findByLabelText("calendar-container");

      expect(
        calendar.querySelectorAll(".flatpickr-yearSelect-year"),
      ).toHaveLength(12);
      expect(calendar.querySelectorAll(".flatpickr-day")).toHaveLength(0);
    });

    it("marks the current year with the today class and aria-current", async () => {
      render(DatePicker, { datePickerType: "year", dateFormat: "Y" });

      await user.click(screen.getByLabelText("Date"));
      const calendar = await screen.findByLabelText("calendar-container");

      const currentYear = calendar.querySelector(
        `.flatpickr-yearSelect-year[data-year="${new Date().getFullYear()}"]`,
      );
      expect(currentYear).toHaveClass("today");
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

        await user.click(screen.getByLabelText("Date"));
        const calendar = await screen.findByLabelText("calendar-container");

        for (const cell of calendar.querySelectorAll(
          ".flatpickr-yearSelect-year",
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

    it("does not mark any year aria-disabled without bounds", async () => {
      render(DatePicker, { datePickerType: "year", dateFormat: "Y" });

      await user.click(screen.getByLabelText("Date"));
      const calendar = await screen.findByLabelText("calendar-container");

      expect(
        calendar.querySelectorAll(".flatpickr-yearSelect-year[aria-disabled]"),
      ).toHaveLength(0);
    });

    it("labels the range to match the first and last rendered year", async () => {
      render(DatePicker, { datePickerType: "year", dateFormat: "Y" });

      await user.click(screen.getByLabelText("Date"));
      const calendar = await screen.findByLabelText("calendar-container");

      const years = calendar.querySelectorAll(".flatpickr-yearSelect-year");
      const firstYear = years[0].textContent;
      const lastYear = years[years.length - 1].textContent;

      expect(
        calendar.querySelector(".flatpickr-yearSelect-range"),
      ).toHaveTextContent(`${firstYear} - ${lastYear}`);
    });

    it("removes the leftover year-input wrapper so the range label is the only child", async () => {
      render(DatePicker, { datePickerType: "year", dateFormat: "Y" });

      await user.click(screen.getByLabelText("Date"));
      const calendar = await screen.findByLabelText("calendar-container");

      const currentMonth = calendar.querySelector(".flatpickr-current-month");
      expect(currentMonth?.querySelector(".numInputWrapper")).toBeNull();
      expect(currentMonth?.children).toHaveLength(1);
    });

    it("rebuilds the grid and range label when changeYear is called programmatically", async () => {
      let captured: Instance | null | undefined = null;
      render(DatePickerCalendar, {
        props: {
          datePickerType: "year",
          dateFormat: "Y",
          oncalendar: (cal: Instance | null | undefined) => {
            captured = cal;
          },
        },
      });

      const instance = await vi.waitFor(() => {
        if (!captured) throw new Error("calendar not set");
        return captured;
      });

      instance.open();
      await tick();
      const calendar = await screen.findByLabelText("calendar-container");
      const yearsBefore = Array.from(
        calendar.querySelectorAll(".flatpickr-yearSelect-year"),
      ).map((el) => el.textContent);

      instance.changeYear(instance.currentYear + 10);
      await tick();

      const yearsAfter = Array.from(
        calendar.querySelectorAll(".flatpickr-yearSelect-year"),
      ).map((el) => el.textContent);
      expect(yearsAfter).not.toEqual(yearsBefore);
      expect(
        calendar.querySelector(".flatpickr-yearSelect-range"),
      ).toHaveTextContent(
        `${yearsAfter[0]} - ${yearsAfter[yearsAfter.length - 1]}`,
      );
    });

    it("marks the calendar container for year-specific height styling", async () => {
      render(DatePicker, { datePickerType: "year", dateFormat: "Y" });

      await user.click(screen.getByLabelText("Date"));
      const calendar = await screen.findByLabelText("calendar-container");

      expect(calendar).toHaveClass("bx--date-picker__calendar--year");
    });

    it("selects a year and dispatches change with the formatted date", async () => {
      const changeHandler = vi.fn();
      const currentDecadeStart =
        new Date().getFullYear() - (new Date().getFullYear() % 10);
      // Pick a year that is always in the initial decade grid (decadeStart - 1
      // through decadeStart + 10), avoiding the current year cell when possible.
      const targetYear = String(currentDecadeStart + 3);

      render(DatePicker, {
        datePickerType: "year",
        dateFormat: "Y",
        onchange: changeHandler,
      });

      await user.click(screen.getByLabelText("Date"));
      const calendar = await screen.findByLabelText("calendar-container");

      await user.click(within(calendar).getByText(targetYear));

      const input = screen.getByLabelText("Date");
      assert(input instanceof HTMLInputElement);
      expect(input.value).toBe(targetYear);
      expect(changeHandler).toHaveBeenCalled();
      expect(changeHandler.mock.lastCall?.[0]?.detail).toMatchObject({
        dateStr: targetYear,
      });
    });

    it("closes the calendar after selecting a year", async () => {
      const currentDecadeStart =
        new Date().getFullYear() - (new Date().getFullYear() % 10);
      const targetYear = String(currentDecadeStart + 4);

      render(DatePicker, { datePickerType: "year", dateFormat: "Y" });

      await user.click(screen.getByLabelText("Date"));
      const calendar = await screen.findByLabelText("calendar-container");
      expect(calendar).toHaveClass("open");

      await user.click(within(calendar).getByText(targetYear));
      expect(calendar).not.toHaveClass("open");
    });
  });

  describe("fluid variant", () => {
    it("does not render fluid classes by default", () => {
      const { container } = render(DatePicker);

      expect(container.querySelector(".bx--date-picker--fluid")).toBeNull();
    });

    it("renders the fluid modifier on the form-item wrapper", () => {
      const { container } = render(DatePicker, {
        fluid: true,
        datePickerType: "single",
      });

      const formItem = container.querySelector(".bx--date-picker--fluid");
      expect(formItem).toHaveClass("bx--form-item");
      // The label stays in the DOM so it can be embedded inside the field.
      expect(screen.getByText("Date")).toBeInTheDocument();
    });

    it("renders the error message inside the fluid container", () => {
      const { container } = render(DatePicker, {
        fluid: true,
        datePickerType: "single",
        invalid: true,
        invalidText: "Invalid date",
      });

      const message = screen.getByText("Invalid date");
      expect(message).toHaveClass("bx--form-requirement");
      expect(message.closest(".bx--date-picker-container")).toHaveClass(
        "bx--date-picker--fluid--invalid",
      );
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

      const message = screen.getByText("Warning message");
      expect(message).toHaveClass("bx--form-requirement");
      expect(message.closest(".bx--date-picker-container")).toHaveClass(
        "bx--date-picker--fluid--warn",
      );
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

    it("inherits fluid from the FluidForm context", () => {
      const { container } = render(DatePickerFluidForm);

      expect(container.querySelector(".bx--date-picker--fluid")).not.toBeNull();
    });

    it("marks the label as slotted when fluid", () => {
      render(DatePickerFluidSlot);

      expect(screen.getByText("Custom label content")).toHaveClass(
        "bx--label--slotted",
      );
    });

    it("does not mark the label as slotted when not fluid", () => {
      render(DatePickerFluidSlot, { fluid: false });

      expect(screen.getByText("Custom label content")).not.toHaveClass(
        "bx--label--slotted",
      );
    });

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

    it("sets the readonly-only class when readonly and not overridden by invalid/warn", () => {
      const { container } = render(DatePicker, {
        fluid: true,
        datePickerType: "single",
        readonly: true,
      });

      expect(
        container.querySelector(".bx--date-picker--fluid--readonly-only"),
      ).not.toBeNull();
    });

    it("does not set the readonly-only class when not readonly", () => {
      const { container } = render(DatePicker, {
        fluid: true,
        datePickerType: "single",
      });

      expect(
        container.querySelector(".bx--date-picker--fluid--readonly-only"),
      ).toBeNull();
    });

    it("clears the readonly-only class when another range cell is invalid", () => {
      const { container } = render(DatePickerFluidRange, {
        invalidFrom: true,
        invalidText: "Invalid start date",
        readonlyTo: true,
      });

      expect(
        container.querySelector(".bx--date-picker--fluid--readonly-only"),
      ).toBeNull();
    });

    it("sets the neutral class when neither invalid nor warn applies", () => {
      const { container } = render(DatePicker, {
        fluid: true,
        datePickerType: "single",
      });

      expect(
        container.querySelector(".bx--date-picker--fluid--neutral"),
      ).not.toBeNull();
    });

    it("keeps the neutral class when readonly (readonly alone does not override it)", () => {
      const { container } = render(DatePicker, {
        fluid: true,
        datePickerType: "single",
        readonly: true,
      });

      expect(
        container.querySelector(".bx--date-picker--fluid--neutral"),
      ).not.toBeNull();
    });

    it("clears the neutral class when invalid", () => {
      const { container } = render(DatePicker, {
        fluid: true,
        datePickerType: "single",
        invalid: true,
        invalidText: "Invalid date",
      });

      expect(
        container.querySelector(".bx--date-picker--fluid--neutral"),
      ).toBeNull();
    });

    it("clears the neutral class when warn", () => {
      const { container } = render(DatePicker, {
        fluid: true,
        datePickerType: "single",
        warn: true,
        warnText: "Warning",
      });

      expect(
        container.querySelector(".bx--date-picker--fluid--neutral"),
      ).toBeNull();
    });
  });
});
