import flatpickr from "flatpickr";

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
 * Locale override with optional en.weekdays.shorthand for custom formatting.
 * @typedef {{ en?: { weekdays: { shorthand: string[] } } }} L10nOverrides
 */

/** @type {L10nOverrides | undefined} */
let l10n;

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
async function createCalendar({ options, base, input, dispatch }) {
  /** @type {string | L10nOverrides["en"]} */
  let locale = options.locale;

  if (options.locale === "en" && l10n && l10n.en) {
    const shorthand = l10n.en.weekdays.shorthand;
    if (shorthand) {
      for (let index = 0; index < shorthand.length; index++) {
        const _ = shorthand[index];
        const s = _.slice(0, 2);
        shorthand[index] = s === "Th" ? "Th" : s.charAt(0);
      }
    }
    locale = l10n.en;
  }

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
    locale,
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
  };
  return new /** @type {any} */ (flatpickr)(base, config);
}

export { createCalendar };
