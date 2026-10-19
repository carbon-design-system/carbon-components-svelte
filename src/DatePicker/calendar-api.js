// @ts-check

/**
 * @typedef {{
 *   open: () => void;
 *   close: () => void;
 *   showMonth: (date: Date) => void;
 *   focusDate: (date: Date) => void;
 *   readonly isOpen: boolean;
 *   readonly view: Date;
 *   readonly selectedDates: ReadonlyArray<Date>;
 * }} DatePickerCalendar
 */

/**
 * The documented surface `bind:calendar` hands out, over the engine
 * instance.
 *
 * @param {import("./calendar.js").CalendarInstance} engine
 * @returns {DatePickerCalendar}
 */
export function createCalendarApi(engine) {
  return {
    open: () => engine.open(),
    close: () => engine.close(),
    showMonth: (date) => engine.jumpToDate(date),
    focusDate: (date) => {
      if (!engine.isOpen) engine.open();
      engine.jumpToDate(date);
      const target = /** @type {HTMLElement[]} */ ([
        ...engine.calendarContainer.querySelectorAll(".bx--date-picker__day"),
      ]).find(
        (cell) =>
          !cell.classList.contains("bx--date-picker__day--hidden") &&
          /** @type {any} */ (cell).dateObj?.toDateString() ===
            date.toDateString(),
      );
      target?.focus();
    },
    get isOpen() {
      return engine.isOpen;
    },
    get view() {
      return new Date(engine.currentYear, engine.currentMonth, 1);
    },
    get selectedDates() {
      return engine.selectedDates.map((date) => new Date(date.getTime()));
    },
  };
}
