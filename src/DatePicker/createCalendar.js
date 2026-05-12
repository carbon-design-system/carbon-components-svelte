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
 */
function updateClasses(instance) {
  const {
    calendarContainer,
    days,
    daysContainer,
    weekdayContainer,
    selectedDates,
  } = instance;

  calendarContainer.classList.add("bx--date-picker__calendar");
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
 * @param {FlatpickrInstance} instance
 */
function updateMonthNode(instance) {
  const monthText = instance.l10n.months.longhand[instance.currentMonth];
  const staticMonthNode = instance.monthNav.querySelector(".cur-month");

  if (staticMonthNode) {
    staticMonthNode.textContent = monthText;
  } else {
    const monthSelectNode = instance.monthsDropdownContainer;
    const span = document.createElement("span");
    span.setAttribute("class", "cur-month");
    span.textContent = monthText;
    monthSelectNode.parentNode?.replaceChild(span, monthSelectNode);
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

  if (options.mode === "range") {
    const importee = await import("flatpickr/dist/esm/plugins/rangePlugin");
    RangePlugin = importee.default;
  }

  const plugins = [
    options.mode === "range" && RangePlugin
      ? new RangePlugin({ position: "left", input })
      : false,
  ].filter(Boolean);

  const config = {
    allowInput: true,
    disableMobile: true,
    clickOpens: true,
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
      updateMonthNode(instance);
    },
    onOpen: (
      /** @type {any} */ _s,
      /** @type {any} */ _d,
      /** @type {FlatpickrInstance} */ instance,
    ) => {
      dispatch("open");
      updateClasses(instance);
      updateMonthNode(instance);
    },
    ...options,
    locale: resolveLocale(options.locale),
  };
  return new /** @type {any} */ (flatpickr)(base, config);
}
