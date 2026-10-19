// @ts-check

/**
 * @typedef {{
 *   open: () => void;
 *   close: () => void;
 *   showMonth: (date: Date) => void;
 *   focusDate: (date: Date) => void;
 *   readonly isOpen: boolean;
 *   readonly selectedDates: ReadonlyArray<Date>;
 *   readonly engine: import("./calendar.js").CalendarInstance;
 * }} DatePickerCalendar
 */

/**
 * The documented surface `bind:calendar` hands out, over the engine
 * instance. `engine` keeps the raw instance reachable for one release.
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
        ...engine.calendarContainer.querySelectorAll(".flatpickr-day"),
      ]).find(
        (cell) =>
          !cell.classList.contains("hidden") &&
          /** @type {any} */ (cell).dateObj?.toDateString() ===
            date.toDateString(),
      );
      target?.focus();
    },
    get isOpen() {
      return engine.isOpen;
    },
    get selectedDates() {
      return engine.selectedDates.map((date) => new Date(date.getTime()));
    },
    get engine() {
      return engine;
    },
  };
}
