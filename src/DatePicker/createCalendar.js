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
 *   days: HTMLElement;
 *   daysContainer?: HTMLElement;
 *   weekdayContainer: HTMLElement;
 *   selectedDates: unknown[];
 *   l10n: { months: { longhand: string[] }; weekdays?: { shorthand?: string[] } };
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
    if (node.classList.contains("today") && selectedDates.length > 0) {
      node.classList.add("no-border");
    } else if (node.classList.contains("today") && selectedDates.length === 0) {
      node.classList.remove("no-border");
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
function updateMonthNode(instance, locale) {
  const monthText = instance.l10n.months.longhand[instance.currentMonth];
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
 *   options: { locale?: string; mode?: string };
 *   base: HTMLElement;
 *   input: HTMLInputElement;
 *   dispatch: (event: string) => void;
 * }} CreateCalendarArgs
 */

/**
 * @param {CreateCalendarArgs} args
 * @returns {Promise<FlatpickrInstance>}
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
    const importee = await import("./yearSelectPlugin.js");
    yearSelectPlugin = importee.default;
  }

  const plugins = [
    options.mode === "range" && RangePlugin
      ? new RangePlugin({ position: "left", input })
      : false,
    options.mode === "month" && monthSelectPlugin
      ? monthSelectPlugin({
          shorthand: true,
          dateFormat: options.dateFormat,
          altFormat: options.dateFormat,
        })
      : false,
    options.mode === "year" && yearSelectPlugin
      ? yearSelectPlugin({
          dateFormat: options.dateFormat,
          altFormat: options.dateFormat,
        })
      : false,
  ].filter(Boolean);

  const userOnDayCreate = options.onDayCreate;

  const config = {
    allowInput: true,
    disableMobile: true,
    clickOpens: true,
    ariaDateFormat: "l, F j, Y",
    plugins,
    nextArrow:
      '<svg width="16px" height="16px" viewBox="0 0 16 16"><polygon points="11,8 6,13 5.3,12.3 9.6,8 5.3,3.7 6,3 "/><rect width="16" height="16" style="fill: none" /></svg>',
    prevArrow:
      '<svg width="16px" height="16px" viewBox="0 0 16 16"><polygon points="5,8 10,3 10.7,3.7 6.4,8 10.7,12.3 10,13 "/><rect width="16" height="16" style="fill: none" /></svg>',
    onChange: () => {
      dispatch("change");
    },
    onClose: () => {
      dispatch("close");
    },
    onMonthChange: (
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
    onYearChange: (
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
    onOpen: (
      /** @type {any} */ _s,
      /** @type {any} */ _d,
      /** @type {FlatpickrInstance} */ instance,
    ) => {
      dispatch("open");
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
    },
    ...options,
    locale: resolveLocale(options.locale),
    onDayCreate: [
      markDisabledDayAriaState,
      ...(Array.isArray(userOnDayCreate)
        ? userOnDayCreate
        : userOnDayCreate
          ? [userOnDayCreate]
          : []),
    ],
  };
  return new /** @type {any} */ (flatpickr)(base, config);
}
