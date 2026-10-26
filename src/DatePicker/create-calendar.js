// @ts-check
import { createCalendarEngine } from "./calendar.js";

/**
 * Minimal calendar instance shape used by the Carbon hooks.
 * @typedef {import("./calendar.js").CalendarInstance} CalendarInstance
 */

/**
 * @typedef {{
 *   options: {
 *     locale?: string;
 *     mode?: import("./calendar.js").CalendarMode;
 *     dateFormat?: string;
 *     altFormat?: string;
 *     ignoredFocusElements?: HTMLElement[];
 *     [option: string]: unknown;
 *   };
 *   base: HTMLInputElement;
 *   input: HTMLInputElement;
 *   dispatch: (event: string, detail?: unknown) => void;
 *   isDayBlocked?: (date: Date, instance: CalendarInstance) => boolean;
 * }} CreateCalendarArgs
 */

const MIRRORED_ATTRIBUTES = [
  "class",
  "disabled",
  "readonly",
  "placeholder",
  "pattern",
  "aria-describedby",
  "aria-invalid",
  "data-invalid",
];

/**
 * flatpickr copies the original input's attributes onto its `altInput` once,
 * at creation. Svelte keeps updating the original, which is hidden, so keep
 * the visible one in sync for state that changes later (`disabled`,
 * `readonly`, `invalid`).
 *
 * @param {HTMLInputElement} source
 * @param {HTMLInputElement} target
 * @returns {MutationObserver}
 */
function mirrorInputState(source, target) {
  function sync() {
    for (const name of MIRRORED_ATTRIBUTES) {
      if (name === "class") {
        // Only Carbon's classes: both inputs carry flatpickr's own as well.
        for (const token of [...target.classList]) {
          if (token.startsWith("bx--") && !source.classList.contains(token)) {
            target.classList.remove(token);
          }
        }
        for (const token of source.classList) {
          if (token.startsWith("bx--")) target.classList.add(token);
        }
        continue;
      }
      const value = source.getAttribute(name);
      if (value === null) target.removeAttribute(name);
      else target.setAttribute(name, value);
    }
  }

  sync();
  const observer = new MutationObserver(sync);
  observer.observe(source, {
    attributes: true,
    attributeFilter: MIRRORED_ATTRIBUTES,
  });
  return observer;
}

const FORWARDED_EVENTS = ["focus", "blur", "keydown", "keyup", "paste"];

/**
 * Consumer handlers (`on:focus`, `on:keydown`, ...) and Carbon's own are
 * bound to the original input, which `altInput` hides. Replay what happens
 * on the visible input there. The listeners die with the `altInput`.
 *
 * @param {HTMLInputElement} source
 * @param {HTMLInputElement} target
 */
function forwardInputEvents(source, target) {
  for (const type of FORWARDED_EVENTS) {
    source.addEventListener(type, (event) => {
      const EventType = /** @type {typeof Event} */ (event.constructor);
      const replay = new EventType(event.type, event);
      target.dispatchEvent(replay);
      if (replay.defaultPrevented) event.preventDefault();
    });
  }
}

/**
 * Builds the calendar synchronously, as soon as the input is mounted: moving
 * the input into the calendar's wrapper would otherwise blur it if the user,
 * or a test, focused it in the meantime.
 *
 * @param {CreateCalendarArgs} args
 * @returns {Promise<CalendarInstance | null>}
 */
export function createCalendar(args) {
  return Promise.resolve(buildCalendar(args));
}

/**
 * @param {CreateCalendarArgs} args
 * @returns {CalendarInstance | null}
 */
function buildCalendar({ options, base, input, dispatch, isDayBlocked }) {
  /** @type {MutationObserver | undefined} */
  let altInputObserver;

  /**
   * Runs before the engine removes the `altInput`, so hand the id back or
   * the label would point at nothing once the calendar is rebuilt without
   * one.
   *
   * @param {any} _s
   * @param {any} _d
   * @param {CalendarInstance} instance
   */
  function disconnectAltInputObserver(_s, _d, instance) {
    altInputObserver?.disconnect();
    altInputObserver = undefined;
    if (instance?.altInput?.id) {
      instance.input.id = instance.altInput.id;
      instance.altInput.removeAttribute("id");
    }
    // `prepareOnReady` moved an inline calendar out of the engine's mount
    // point. Teardown unwraps `calendarContainer.parentNode`, so put the
    // calendar back or it dismantles Carbon's own container instead.
    if (options.inline && instance?.calendarContainer) {
      instance.input.parentNode?.appendChild(instance.calendarContainer);
    }
  }

  /**
   * Reports unparseable text as the `error` event. The engine doesn't say
   * which input the text came from; the focused range input (if any) is
   * the field it just tried to parse, `base` otherwise.
   * @param {Error} error
   */
  function handleParseError(error) {
    const value =
      input && document.activeElement === input ? input.value : base.value;
    dispatch("error", { error, value });
  }

  /**
   * @param {any} _s
   * @param {any} _d
   * @param {CalendarInstance} instance
   */
  function prepareOnReady(_s, _d, instance) {
    // `altInput` hides the original input and shows a generated one.
    // Hand it the id so the label and `for` clicks reach a visible field.
    if (instance.altInput && instance.input.id) {
      instance.altInput.id = instance.input.id;
      instance.input.removeAttribute("id");
    }
    if (instance.altInput) {
      altInputObserver = mirrorInputState(instance.input, instance.altInput);
      forwardInputEvents(instance.altInput, instance.input);
    }
    // An `inline` calendar is always visible and never fires `onOpen`.
    if (!options.inline) return;
    // The engine mounts it next to the input, inside the wrapper whose
    // height vertically centers the calendar icon. Move it just below.
    instance.input
      .closest(".bx--date-picker-input__wrapper")
      ?.after(instance.calendarContainer);
  }

  /** Last range sent with `view`, so a month and year change send one. */
  let lastView = "";
  /**
   * Sends the dates on show: whole months in the day grid, the year in the
   * month grid, or the twelve years in the year grid.
   *
   * @param {Date[]} _s
   * @param {string} _d
   * @param {CalendarInstance} instance
   */
  function emitView(_s, _d, instance) {
    const { pickerMode, showMonths = 1 } = /** @type {any} */ (instance.config);
    const year = instance.currentYear;
    let start;
    let end;
    if (pickerMode === "year") {
      const first = year - (year % 10) - 1;
      start = new Date(first, 0, 1);
      end = new Date(first + 11, 11, 31);
    } else if (pickerMode === "month" || pickerMode === "quarter") {
      start = new Date(year, 0, 1);
      end = new Date(year, 11, 31);
    } else {
      start = new Date(year, instance.currentMonth, 1);
      end = new Date(year, instance.currentMonth + showMonths, 0);
    }
    const key = `${start.getTime()}-${end.getTime()}`;
    if (key === lastView) return;
    lastView = key;
    dispatch("view", { start, end });
  }

  const carbonHooks = {
    onChange: [() => dispatch("change")],
    onClose: [() => dispatch("close")],
    onOpen: [() => dispatch("open")],
    onMonthChange: [emitView],
    onYearChange: [emitView],
    onReady: [prepareOnReady, emitView],
    onDestroy: [disconnectAltInputObserver],
  };

  // Building moves the input into the calendar's wrapper, which blurs it.
  // A reader can focus the server-rendered input before hydration, so note
  // the focus and caret to hand back once the calendar is built.
  const focused = [base, input].find(
    (field) => field && field === document.activeElement,
  );
  const caret = focused && [focused.selectionStart, focused.selectionEnd];

  /** @type {CalendarInstance | null} */
  let instance = null;
  try {
    instance = createCalendarEngine(base, {
      allowInput: true,
      animate: false,
      clickOpens: true,
      ariaDateFormat: "l, F j, Y",
      lazy: true,
      ...options,
      ...carbonHooks,
      // The range calendar pushes its second input into
      // `ignoredFocusElements`. Copy `keepOpenFor` so that push never
      // mutates (and keeps alive) the consumer's array.
      ignoredFocusElements: [...(options.ignoredFocusElements ?? [])],
      ...(options.mode === "range" && input && { secondInput: input }),
      ...(isDayBlocked && { isDayBlocked }),
      errorHandler: handleParseError,
    });
  } catch (error) {
    // Report an init failure like flatpickr did: log it and return no
    // calendar, so callers never treat it as one.
    console.error(error);
    return null;
  }
  if (!instance) return null;
  if (focused)
    restoreFocus(
      focused === base && instance.altInput ? instance.altInput : focused,
      caret,
    );
  return instance;
}

/**
 * @param {HTMLInputElement} field
 * @param {(number | null)[] | undefined} caret
 */
function restoreFocus(field, caret) {
  if (document.activeElement === field) return;
  field.focus({ preventScroll: true });
  const [start, end] = caret ?? [];
  if (start != null && end != null) field.setSelectionRange(start, end);
}
