import flatpickr from "flatpickr";

/**
 * Carbon-styled English locale: single-letter weekday abbreviations
 * with "Th" disambiguating Thursday from Tuesday.
 * Longhand is included so flatpickr's shallow locale merge does not
 * drop the weekday longhand (used by ARIA labels on day cells).
 */
const ENGLISH_LOCALE = {
  weekdays: {
    shorthand: ["S", "M", "T", "W", "Th", "F", "S"],
    longhand: [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
  },
};

/**
 * @param {unknown} locale
 * @returns {unknown}
 */
export function resolveLocale(locale) {
  return locale === "en" ? ENGLISH_LOCALE : locale;
}

/**
 * Minimal flatpickr instance shape used by updateClasses and updateMonthNode.
 * Matches flatpickr's Instance where some elements may be optional.
 * @typedef {{
 *   calendarContainer: HTMLElement;
 *   input: HTMLInputElement;
 *   altInput?: HTMLInputElement;
 *   days: HTMLElement;
 *   daysContainer?: HTMLElement;
 *   weekdayContainer: HTMLElement;
 *   selectedDates: unknown[];
 *   l10n: { months: { longhand: string[]; shorthand: string[] }; weekdays?: { shorthand?: string[] } };
 *   config: { shorthandCurrentMonth?: boolean };
 *   currentMonth: number;
 *   monthNav: HTMLElement;
 *   monthsDropdownContainer: HTMLElement;
 * }} FlatpickrInstance
 */

/**
 * @param {FlatpickrInstance} instance
 * @param {{ isMonth?: boolean; isYear?: boolean }} [modifiers]
 */
function updateClasses(instance, { isMonth = false, isYear = false } = {}) {
  const {
    calendarContainer,
    days,
    daysContainer,
    weekdayContainer,
    selectedDates,
  } = instance;

  calendarContainer.classList.add("bx--date-picker__calendar");
  // Marker classes so SCSS can target the shorter month/year grids without `:has()`.
  calendarContainer.classList.toggle(
    "bx--date-picker__calendar--month",
    isMonth,
  );
  calendarContainer.classList.toggle("bx--date-picker__calendar--year", isYear);
  calendarContainer
    .querySelector(".flatpickr-month")
    ?.classList.add("bx--date-picker__month");

  weekdayContainer.classList.add("bx--date-picker__weekdays");
  for (const node of weekdayContainer.querySelectorAll(".flatpickr-weekday")) {
    node.classList.add("bx--date-picker__weekday");
  }

  if (daysContainer) {
    daysContainer.classList.add("bx--date-picker__days");
  }
  for (const node of days.querySelectorAll(".flatpickr-day")) {
    node.classList.add("bx--date-picker__day");
    if (node.classList.contains("today")) {
      node.classList.toggle("no-border", selectedDates.length > 0);
    }
  }
}

/**
 * Marks flatpickr's own disabled day elements (out-of-range days, and
 * previous/next-month days that fall outside minDate/maxDate) as
 * aria-disabled. Without this, axe-core's color-contrast check flags
 * these days: WCAG 1.4.3 exempts inactive UI component text from the
 * contrast requirement, but axe only recognizes that exemption via
 * aria-disabled="true", not the flatpickr-disabled CSS class.
 *
 * @param {any} _dObj
 * @param {any} _dStr
 * @param {any} _fp
 * @param {HTMLElement} dayElem
 */
function markDisabledDayAriaState(_dObj, _dStr, _fp, dayElem) {
  if (dayElem.classList.contains("flatpickr-disabled")) {
    dayElem.setAttribute("aria-disabled", "true");
  }
}

/**
 * flatpickr's bundled monthSelect plugin has no concept of "today"; mark
 * the current year's current month the same way flatpickr core marks the
 * current day, since the month cells persist (and their `dateObj` year is
 * mutated in place) across `onYearChange` instead of being rebuilt.
 *
 * @param {FlatpickrInstance} instance
 */
function markTodayMonth(instance) {
  const now = new Date();
  for (const node of instance.rContainer?.querySelectorAll(
    ".flatpickr-monthSelect-month",
  ) ?? []) {
    const isToday =
      node.dateObj.getFullYear() === now.getFullYear() &&
      node.dateObj.getMonth() === now.getMonth();
    node.classList.toggle("today", isToday);
    if (isToday) {
      node.setAttribute("aria-current", "date");
    } else {
      node.removeAttribute("aria-current");
    }
  }
}

/**
 * Whether `locale` orders the month before the year (e.g. "January 2000"),
 * as opposed to year before month (e.g. "2000年1月" in Japanese).
 *
 * @param {unknown} locale
 * @returns {boolean}
 */
function isMonthFirst(locale) {
  if (typeof locale !== "string") return true;
  try {
    const parts = new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
    }).formatToParts(new Date(2000, 0, 1));
    const monthIndex = parts.findIndex((part) => part.type === "month");
    const yearIndex = parts.findIndex((part) => part.type === "year");
    return monthIndex < yearIndex;
  } catch {
    return true;
  }
}

/**
 * @param {FlatpickrInstance} instance
 * @param {unknown} locale
 */
export function updateMonthNode(instance, locale) {
  const { longhand, shorthand } = instance.l10n.months;
  const monthText = (
    instance.config.shorthandCurrentMonth ? shorthand : longhand
  )[instance.currentMonth];
  let monthNode = instance.monthNav.querySelector(".cur-month");

  if (monthNode) {
    monthNode.textContent = monthText;
  } else {
    const monthSelectNode = instance.monthsDropdownContainer;
    const span = document.createElement("span");
    span.setAttribute("class", "cur-month");
    span.textContent = monthText;
    monthSelectNode.parentNode?.replaceChild(span, monthSelectNode);
    monthNode = span;
  }

  // Depending on the locale, toggle the order of the month and year.
  const yearWrapper = monthNode.parentNode?.querySelector(".numInputWrapper");
  if (!yearWrapper) return;
  if (isMonthFirst(locale)) {
    if (monthNode.nextSibling !== yearWrapper) {
      yearWrapper.parentNode?.insertBefore(monthNode, yearWrapper);
    }
  } else if (yearWrapper.nextSibling !== monthNode) {
    yearWrapper.insertAdjacentElement("afterend", monthNode);
  }
}

/**
 * @typedef {{
 *   options: { locale?: string; mode?: string; [option: string]: unknown };
 *   base: HTMLElement;
 *   input: HTMLInputElement;
 *   dispatch: (event: string) => void;
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

/** @type {WeakMap<object, Record<string, Function[]>>} */
const hooksByInstance = new WeakMap();

/**
 * flatpickr accepts a hook as a single function or an array of them.
 *
 * @param {unknown} hook
 * @returns {Function[]}
 */
function toHookArray(hook) {
  if (Array.isArray(hook)) return hook;
  return hook ? [hook] : [];
}

/**
 * Carries the current `errorHandler` for a running calendar. flatpickr's own
 * `calendar.set("errorHandler", fn)` replaces `config.errorHandler` outright,
 * which would drop Carbon's wrapper (and the `error` event it dispatches), so
 * reactive updates go through `setErrorHandler` and this map instead.
 * @type {WeakMap<FlatpickrInstance, { current: ((error: Error) => void) | undefined }>}
 */
const errorHandlerBoxes = new WeakMap();

/**
 * @param {FlatpickrInstance} instance
 * @param {((error: Error) => void) | undefined} handler
 */
export function setErrorHandler(instance, handler) {
  const box = errorHandlerBoxes.get(instance);
  if (box) box.current = handler;
}

/**
 * @param {CreateCalendarArgs} args
 * @returns {Promise<FlatpickrInstance | null>}
 */
export async function createCalendar({ options, base, input, dispatch }) {
  /** @type {((new (config: { position: string; input: HTMLInputElement }) => unknown) | undefined)} */
  let RangePlugin;
  /** @type {((config?: { shorthand?: boolean; dateFormat?: string; altFormat?: string }) => unknown) | undefined} */
  let monthSelectPlugin;
  /** @type {((config?: { dateFormat?: string; altFormat?: string }) => unknown) | undefined} */
  let yearSelectPlugin;

  if (options.mode === "range") {
    const importee = await import("flatpickr/dist/esm/plugins/rangePlugin");
    RangePlugin = importee.default;
  }

  if (options.mode === "month") {
    const importee = await import("flatpickr/dist/esm/plugins/monthSelect");
    monthSelectPlugin = importee.default;
  }

  if (options.mode === "year") {
    const importee = await import("./year-select-plugin.js");
    yearSelectPlugin = importee.yearSelectPlugin;
  }

  const plugins = [
    options.mode === "range" && RangePlugin
      ? new RangePlugin({ position: "left", input })
      : false,
    options.mode === "month" && monthSelectPlugin
      ? monthSelectPlugin({
          shorthand: true,
          dateFormat: options.dateFormat,
          altFormat: options.altFormat ?? options.dateFormat,
        })
      : false,
    options.mode === "year" && yearSelectPlugin
      ? yearSelectPlugin({
          dateFormat: options.dateFormat,
          altFormat: options.altFormat ?? options.dateFormat,
        })
      : false,
  ].filter(Boolean);

  /** @type {MutationObserver | undefined} */
  let altInputObserver;

  /**
   * Runs before flatpickr removes the `altInput`, so hand the id back or the
   * label would point at nothing once the calendar is rebuilt without one.
   *
   * @param {any} _s
   * @param {any} _d
   * @param {FlatpickrInstance} instance
   */
  function disconnectAltInputObserver(_s, _d, instance) {
    altInputObserver?.disconnect();
    altInputObserver = undefined;
    if (instance?.altInput?.id) {
      instance.input.id = instance.altInput.id;
      instance.altInput.removeAttribute("id");
    }
    // `prepareOnReady` moved an inline calendar out of flatpickr's wrapper.
    // flatpickr's teardown unwraps `calendarContainer.parentNode` and drops
    // its last child, so put the calendar back or it dismantles Carbon's
    // own container instead.
    if (options.inline && instance?.calendarContainer) {
      instance.input.parentNode?.appendChild(instance.calendarContainer);
    }
  }

  const errorHandlerBox = { current: options.errorHandler };

  /**
   * flatpickr's `errorHandler` is a single function, not a hook array, and
   * it never says which input produced the bad text. The focused range
   * input (if any) is assumed to be the source, since that is the field
   * flatpickr just tried to parse; `base` is the only candidate otherwise.
   * @param {Error} error
   */
  function handleParseError(error) {
    const value =
      input && document.activeElement === input ? input.value : base.value;
    dispatch("error", { error, value });
    const userErrorHandler = errorHandlerBox.current;
    if (userErrorHandler) {
      userErrorHandler(error);
    } else {
      // Matches flatpickr's own default `errorHandler` so nobody loses the
      // log they get today when they have not opted into anything else.
      console.warn(error);
    }
  }

  /**
   * @param {any} _s
   * @param {any} _d
   * @param {FlatpickrInstance} instance
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
    applyCarbonMarkup(instance);
    // flatpickr mounts it next to the input, inside the wrapper whose
    // height vertically centers the calendar icon. Move it just below.
    instance.input
      .closest(".bx--date-picker-input__wrapper")
      ?.after(instance.calendarContainer);
  }

  /** @param {FlatpickrInstance} instance */
  function applyCarbonMarkup(instance) {
    updateClasses(instance, {
      isMonth: options.mode === "month",
      isYear: options.mode === "year",
    });
    if (options.mode !== "month" && options.mode !== "year") {
      updateMonthNode(instance, options.locale);
    }
    if (options.mode === "month") {
      markTodayMonth(instance);
    }
  }

  /**
   * Carbon's own flatpickr hooks. They are merged with the consumer's rather
   * than spread under `...options`, where a `flatpickrProps.onOpen` or an
   * inline `onDayCreate` would silently replace them.
   *
   * @type {Record<string, Function[]>}
   */
  const carbonHooks = {
    onChange: [
      () => {
        dispatch("change");
      },
    ],
    onClose: [
      () => {
        dispatch("close");
      },
    ],
    onMonthChange: [
      (
        /** @type {any} */ _s,
        /** @type {any} */ _d,
        /** @type {FlatpickrInstance} */ instance,
      ) => {
        // The monthSelect / yearSelect plugins remove the month-label node, so
        // there is nothing for updateMonthNode to patch.
        if (options.mode !== "month" && options.mode !== "year") {
          updateMonthNode(instance, options.locale);
        }
      },
    ],
    onYearChange: [
      (
        /** @type {any} */ _s,
        /** @type {any} */ _d,
        /** @type {FlatpickrInstance} */ instance,
      ) => {
        // The monthSelect plugin mutates its month cells' `dateObj` in place
        // on year change rather than rebuilding them, so re-mark "today" here.
        if (options.mode === "month") {
          markTodayMonth(instance);
        }
      },
    ],
    onOpen: [
      (
        /** @type {any} */ _s,
        /** @type {any} */ _d,
        /** @type {FlatpickrInstance} */ instance,
      ) => {
        dispatch("open");
        applyCarbonMarkup(instance);
      },
    ],
    onReady: [prepareOnReady],
    onDestroy: [disconnectAltInputObserver],
    onDayCreate: [
      markDisabledDayAriaState,
      // Days are rebuilt on every redraw (month change, `set`), not only on
      // open, so class them as they are created.
      (_dObj, _dStr, _fp, /** @type {HTMLElement} */ dayElem) => {
        dayElem.classList.add("bx--date-picker__day");
      },
    ],
  };

  /** @type {Record<string, Function[]>} */
  const mergedHooks = {};
  for (const [name, hooks] of Object.entries(carbonHooks)) {
    mergedHooks[name] = [...hooks, ...toHookArray(options[name])];
  }

  const config = {
    allowInput: true,
    disableMobile: true,
    clickOpens: true,
    animate: false,
    ariaDateFormat: "l, F j, Y",
    plugins,
    nextArrow:
      '<svg width="16px" height="16px" viewBox="0 0 16 16"><polygon points="11,8 6,13 5.3,12.3 9.6,8 5.3,3.7 6,3 "/><rect width="16" height="16" style="fill: none" /></svg>',
    prevArrow:
      '<svg width="16px" height="16px" viewBox="0 0 16 16"><polygon points="5,8 10,3 10.7,3.7 6.4,8 10.7,12.3 10,13 "/><rect width="16" height="16" style="fill: none" /></svg>',
    ...options,
    // `options.mode` also carries Carbon's "month"/"year" datePickerType,
    // used above to pick a plugin. flatpickr's own `mode` only understands
    // "single" | "multiple" | "range": pass "range"/"multiple" through as-is,
    // else fall back to "single" so the bundled monthSelect plugin's
    // setMonth() (which switches on fp.config.mode) still updates the value.
    mode:
      options.mode === "range" || options.mode === "multiple"
        ? options.mode
        : "single",
    locale: resolveLocale(options.locale),
    // `wrap` expects `base` to be a wrapper holding a `[data-input]` child.
    // Carbon always passes the input itself, so flatpickr would throw.
    wrap: false,
    ...mergedHooks,
    // Placed after `...options` so a consumer's own `errorHandler` (from
    // `flatpickrProps`) can never replace this wrapper; it is still called,
    // via `errorHandlerBox`, from inside `handleParseError`.
    errorHandler: handleParseError,
  };
  const instance = new /** @type {any} */ (flatpickr)(base, config);
  // flatpickr catches its own init errors, logs them, and returns an empty
  // array. Report that as "no calendar" so callers never treat it as one.
  if (Array.isArray(instance)) return null;
  hooksByInstance.set(instance, carbonHooks);
  errorHandlerBoxes.set(instance, errorHandlerBox);
  return instance;
}

/**
 * Value to pass to `calendar.set(name, ...)` for a consumer option, keeping
 * Carbon's hooks in front of a consumer hook instead of replacing them.
 *
 * @param {object} instance
 * @param {string} name
 * @param {unknown} value
 * @returns {unknown}
 */
export function resolveOptionValue(instance, name, value) {
  const carbonHooks = hooksByInstance.get(instance)?.[name];
  return carbonHooks ? [...carbonHooks, ...toHookArray(value)] : value;
}
