// @ts-check

import { isImeComposition } from "../utils/ime-composition.js";
import { resolveLayoutDirection } from "../utils/inline-direction.js";
import {
  compareDays,
  DAY_MS,
  daysInMonth,
  formatDate,
  getCalendarLocale,
  isMonthFirst,
  isoWeek,
  parseDate,
  yearSuffix,
} from "./calendar-dates.js";
import { DAY_STATE_CLASSES, dayState } from "./day-state.js";

const PREV_ARROW =
  '<svg width="16px" height="16px" viewBox="0 0 16 16"><polygon points="5,8 10,3 10.7,3.7 6.4,8 10.7,12.3 10,13 "/><rect width="16" height="16" style="fill: none" /></svg>';
const NEXT_ARROW =
  '<svg width="16px" height="16px" viewBox="0 0 16 16"><polygon points="11,8 6,13 5.3,12.3 9.6,8 5.3,3.7 6,3 "/><rect width="16" height="16" style="fill: none" /></svg>';

const HOOKS = [
  "onChange",
  "onClose",
  "onDayCreate",
  "onDestroy",
  "onKeyDown",
  "onMonthChange",
  "onOpen",
  "onParseConfig",
  "onPreCalendarPosition",
  "onReady",
  "onValueUpdate",
  "onYearChange",
];

const KEY_CODES = {
  Backspace: 8,
  Tab: 9,
  Enter: 13,
  Escape: 27,
  " ": 32,
  PageUp: 33,
  PageDown: 34,
  End: 35,
  Home: 36,
  ArrowLeft: 37,
  ArrowUp: 38,
  ArrowRight: 39,
  ArrowDown: 40,
  Delete: 46,
};

const WHITESPACE = /\s+/;

/** Options that change behaviour only: `set` doesn't redraw for them. */
const QUIET_OPTIONS = new Set([
  "allowInput",
  "animate",
  "clickOpens",
  "closeOnSelect",
  "errorHandler",
  "ignoredFocusElements",
  "parseDate",
  "position",
  "positionElement",
  "presets",
  "presetsLabelText",
  "prevLabel",
  "nextLabel",
  "rtl",
  "static",
]);

/** Options that change only the field's text: `set` rewrites the value. */
const TEXT_OPTIONS = new Set(["altFormat", "conjunction", "formatDate"]);

// Class names stay literal, so the CSS pruning can find them.
const IN_RANGE = "bx--date-picker__day--in-range";
const RANGE_START = "bx--date-picker__day--range-start";
const RANGE_END = "bx--date-picker__day--range-end";

/** Months and years are picked in a 3-wide grid of 12 cells. */
const GRID_SHIFTS = { 40: 3, 38: -3 };

/**
 * The step ArrowLeft (37) or ArrowRight (39) takes through the cells: the
 * next cell is to the right in LTR and to the left in RTL, as in React
 * Aria's calendar. `0` for any other key.
 *
 * @param {number} code
 * @param {boolean} rtl
 * @returns {-1 | 0 | 1}
 */
export function inlineStep(code, rtl) {
  if (code !== 37 && code !== 39) return 0;
  return (code === 39) === rtl ? -1 : 1;
}

/**
 * The key code of a keyboard event. `keyCode` is deprecated, but it is what
 * flatpickr reads, so synthetic events that only set it still work.
 *
 * @param {KeyboardEvent} event
 */
function keyCodeOf(event) {
  return (
    event.keyCode ||
    KEY_CODES[/** @type {keyof typeof KEY_CODES} */ (event.key)] ||
    0
  );
}

/**
 * The first day cell of a month grid.
 *
 * @param {Element} grid
 * @returns {any}
 */
function firstDay(grid) {
  return grid.querySelector(".bx--date-picker__day");
}

/**
 * @param {string} tag
 * @param {string} [className]
 * @param {string} [content]
 * @returns {any}
 */
function createElement(tag, className, content) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content !== undefined) element.textContent = content;
  return element;
}

/**
 * @param {Element} element
 * @param {string} className
 * @param {unknown} force
 */
function toggleClass(element, className, force) {
  element.classList.toggle(className, !!force);
}

/** @param {unknown} value */
function arrayify(value) {
  return Array.isArray(value) ? value : [value];
}

/** @param {Event} event */
function eventTarget(event) {
  return /** @type {any} */ (
    typeof event.composedPath === "function"
      ? (event.composedPath()[0] ?? event.target)
      : event.target
  );
}

/**
 * A set of listeners that can be removed together. `AbortSignal` listener
 * options are newer than Carbon's browser baseline, so remove by hand.
 */
function createListenerGroup() {
  /** @type {Array<() => void>} */
  let removers = [];
  return {
    /**
     * @param {EventTarget} target
     * @param {string} type
     * @param {EventListener} handler
     * @param {AddEventListenerOptions | boolean} [options]
     */
    add(target, type, handler, options) {
      target.addEventListener(type, handler, options);
      removers.push(() => target.removeEventListener(type, handler, options));
    },
    clear() {
      for (const remove of removers) remove();
      removers = [];
    },
  };
}

/**
 * Compact calendar engine that drives Carbon's date picker. Produces the
 * same DOM, hooks, and instance surface that flatpickr did (class names and
 * all), so Carbon's styles and `bind:calendar` consumers keep working, but
 * with the single/multiple/range/week/month/year modes built in.
 *
 * @param {HTMLInputElement} element
 * @param {Record<string, any>} [userConfig]
 * @returns {import("./calendar.js").CalendarInstance | null}
 */
export function createCalendarEngine(element, userConfig = {}) {
  /** @type {any} */
  const self = {};
  const listeners = createListenerGroup();
  /** Opens the calendar from the inputs; rebound when `clickOpens` changes. */
  const triggerListeners = createListenerGroup();
  /** Listeners that only matter while the calendar is open. */
  const openListeners = createListenerGroup();

  /** @type {any} */
  const config = {
    allowInput: false,
    allowInvalidPreload: false,
    altFormat: "F j, Y",
    altInput: false,
    animate: true,
    ariaDateFormat: "F j, Y",
    clickOpens: true,
    closeOnSelect: true,
    conjunction: ", ",
    dateFormat: "Y-m-d",
    errorHandler: (/** @type {Error} */ error) => console.warn(error),
    getWeek: isoWeek,
    ignoredFocusElements: [],
    inline: false,
    locale: "en",
    mode: "single",
    nextArrow: NEXT_ARROW,
    position: "auto",
    presets: [],
    presetsLabelText: "Shortcuts",
    prevArrow: PREV_ARROW,
    shorthandCurrentMonth: false,
    showMonths: 1,
    static: false,
    weekNumbers: false,
  };
  self.config = config;
  self.element = self.input = element;
  self.isOpen = false;
  self.selectedDates = [];
  self.now = new Date();

  // --- Config -----------------------------------------------------------

  /** @param {string} message */
  const report = (message) => config.errorHandler(new Error(message));

  /**
   * Whether the calendar runs right to left: the `rtl` option, else the
   * calendar's computed direction. Read when a key arrives or the calendar
   * is placed, since nothing reports a `dir` change.
   */
  function isRtl() {
    if (typeof config.rtl === "function") return !!config.rtl();
    return (
      resolveLayoutDirection(
        undefined,
        self.calendarContainer?.isConnected
          ? self.calendarContainer
          : self._input,
      ) === "rtl"
    );
  }

  /** @type {import("./calendar-dates.js").ParseContext} */
  const parseContext = {
    get l10n() {
      return self.l10n;
    },
    get dateFormat() {
      return config.dateFormat;
    },
    get parseDate() {
      return config.parseDate;
    },
    onError: (error) => config.errorHandler(error),
  };

  /**
   * @param {unknown} value
   * @param {string} [format]
   * @param {boolean} [timeless]
   */
  self.parseDate = (value, format, timeless) =>
    parseDate(value, parseContext, format, timeless);

  /**
   * @param {Date} date
   * @param {string} format
   */
  self.formatDate = (date, format) => {
    if (config.formatDate) return config.formatDate(date, format, self.l10n);
    return formatDate(date, format, self.l10n, { getWeek: config.getWeek });
  };

  /** @param {any[]} rules */
  function parseDateRules(rules) {
    return rules
      .slice()
      .map((rule) => {
        if (
          typeof rule === "string" ||
          typeof rule === "number" ||
          rule instanceof Date
        ) {
          return self.parseDate(rule, undefined, true);
        }
        if (rule && typeof rule === "object" && rule.from && rule.to) {
          return {
            from: self.parseDate(rule.from),
            to: self.parseDate(rule.to),
          };
        }
        return rule;
      })
      .filter(Boolean);
  }

  let built = false;

  /** @param {"min" | "max"} type */
  function boundSetter(type) {
    return (/** @type {unknown} */ date) => {
      config[`_${type}Date`] = self.parseDate(date, config.dateFormat);
      if (built) {
        self.selectedDates = self.selectedDates.filter(
          (/** @type {Date} */ d) => isEnabled(d),
        );
        updateValue();
      }
      if (self.daysContainer) {
        redraw();
        syncYearBounds();
      }
    };
  }

  Object.defineProperties(config, {
    enable: {
      get: () => config._enable,
      set: (dates) => {
        config._enable = dates && parseDateRules(dates);
      },
      enumerable: true,
    },
    disable: {
      get: () => config._disable,
      set: (dates) => {
        config._disable = parseDateRules(dates);
      },
      enumerable: true,
    },
    minDate: {
      get: () => config._minDate,
      set: boundSetter("min"),
      enumerable: true,
    },
    maxDate: {
      get: () => config._maxDate,
      set: boundSetter("max"),
      enumerable: true,
    },
  });
  config.disable = [];

  /** The locale's strings, with `firstDayOfWeek` overriding its own. */
  function resolveL10n() {
    const l10n = getCalendarLocale(config.locale);
    const first = config.firstDayOfWeek;
    return Number.isInteger(first) && first >= 0 && first <= 6
      ? { ...l10n, firstDayOfWeek: first }
      : l10n;
  }

  /** @param {Record<string, any>} options */
  function applyConfig(options) {
    // The locale must be in place before date rules and bounds are parsed.
    if (options.locale !== undefined) config.locale = options.locale;
    if (options.firstDayOfWeek !== undefined) {
      config.firstDayOfWeek = options.firstDayOfWeek;
    }
    self.l10n = resolveL10n();
    // Rules and bounds are parsed with `dateFormat`, so they go last.
    const parsedLast = ["minDate", "maxDate", "enable", "disable"];
    for (const [key, value] of Object.entries(options)) {
      if (!parsedLast.includes(key)) config[key] = value;
    }
    for (const key of parsedLast) {
      if (options[key] !== undefined) config[key] = options[key];
    }
  }

  applyConfig(userConfig);
  if (config.now !== undefined) {
    self.now = self.parseDate(config.now) ?? self.now;
  }
  for (const option of [
    "allowInput",
    "allowInvalidPreload",
    "altInput",
    "clickOpens",
    "inline",
    "shorthandCurrentMonth",
    "static",
    "weekNumbers",
  ]) {
    config[option] = config[option] === true || config[option] === "true";
  }

  const pickerMode = config.mode;
  if (pickerMode === "week" && !userConfig.getWeek) {
    // A week's value is its first day, which for a Sunday-first locale sits
    // in the previous ISO week. Number the week the row shows instead: the
    // ISO week of its middle day.
    config.getWeek = (/** @type {Date} */ date) => {
      const offset = (date.getDay() - self.l10n.firstDayOfWeek + 7) % 7;
      return isoWeek(
        new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate() - offset + 3,
        ),
      );
    };
  }
  // The week picker selects a single date and highlights its week.
  const isQuarter = pickerMode === "quarter";
  // The month and quarter grids both show one year.
  const isYearView = pickerMode === "month" || isQuarter;
  const isGridMode = isYearView || pickerMode === "year";
  const isRange = pickerMode === "range";
  const isMultiple = pickerMode === "multiple";
  /** Presets pick one date or one range. */
  const hasPresetRail = pickerMode === "single" || isRange;
  config.pickerMode = pickerMode;
  if (isGridMode || pickerMode === "week") config.mode = "single";
  if (config.showMonths < 1 || isGridMode) config.showMonths = 1;
  config.showMonths = Math.floor(config.showMonths);

  for (const hook of HOOKS) {
    config[hook] = arrayify(config[hook] || []).map(
      (/** @type {Function} */ fn) => fn.bind(self),
    );
  }
  triggerEvent("onParseConfig");

  // --- Inputs -----------------------------------------------------------

  /** @type {any} */ (element)._type = element.type;
  element.type = "text";
  self._input = element;
  /** The second input of a range, when the consumer renders one. */
  /** @type {HTMLInputElement | undefined} */
  const secondInput = isRange ? config.secondInput : undefined;
  self.secondInput = secondInput;

  if (config.altInput) {
    const alt = createElement(element.nodeName, element.className);
    alt.placeholder = element.placeholder;
    alt.disabled = element.disabled;
    alt.required = element.required;
    alt.tabIndex = element.tabIndex;
    alt.type = "text";
    element.setAttribute("type", "hidden");
    if (!config.static && element.parentNode) {
      element.parentNode.insertBefore(alt, element.nextSibling);
    }
    self.altInput = alt;
    self._input = alt;
  }
  /** `allowInput` decides whether the fields can be typed into. */
  function syncReadonly() {
    for (const input of [self._input, secondInput]) {
      if (!input) continue;
      if (config.allowInput) input.removeAttribute("readonly");
      else input.setAttribute("readonly", "readonly");
    }
  }
  if (!config.allowInput || secondInput) syncReadonly();
  if (secondInput) {
    secondInput.setAttribute("data-fp-omit", "");
    config.ignoredFocusElements.push(secondInput);
  }
  self._positionElement = config.positionElement || self._input;

  // --- Dates ------------------------------------------------------------

  /** @param {unknown} input @param {string} [format] */
  function setSelectedDate(input, format) {
    /** @type {any[]} */
    let dates = [];
    if (Array.isArray(input)) {
      dates = input.map((d) => self.parseDate(d, format));
    } else if (input instanceof Date || typeof input === "number") {
      dates = [self.parseDate(input, format)];
    } else if (typeof input === "string") {
      if (isRange) {
        dates = input
          .split(self.l10n.rangeSeparator)
          .map((d) => self.parseDate(d, format));
      } else if (isMultiple) {
        dates = input
          .split(config.conjunction)
          .map((d) => self.parseDate(d, format));
      } else {
        dates = [self.parseDate(input, format)];
      }
    } else {
      report(`Invalid date supplied: ${JSON.stringify(input)}`);
    }
    self.selectedDates = config.allowInvalidPreload
      ? dates
      : dates.filter((d) => d instanceof Date && isEnabled(d, false));
    if (isRange) {
      self.selectedDates.sort(
        (/** @type {Date} */ a, /** @type {Date} */ b) =>
          a.getTime() - b.getTime(),
      );
    }
  }

  const placeholderIsValue =
    element.placeholder && element.value === element.placeholder;
  const preloaded =
    config.defaultDate || (placeholderIsValue ? null : element.value);
  if (preloaded) setSelectedDate(preloaded, config.dateFormat);
  if (secondInput?.value) {
    const second = self.parseDate(secondInput.value);
    if (second) self.selectedDates.push(second);
  }

  const { minDate, maxDate } = config;
  self._initialDate =
    self.selectedDates[0] ??
    (minDate && minDate.getTime() > self.now.getTime()
      ? minDate
      : maxDate && maxDate.getTime() < self.now.getTime()
        ? maxDate
        : self.now);
  self.currentYear = self._initialDate.getFullYear();
  self.currentMonth = self._initialDate.getMonth();
  if (self.selectedDates.length > 0) {
    self.latestSelectedDateObj = self.selectedDates[0];
  }

  /** @param {Date} date @param {boolean} [timeless] */
  function isEnabled(date, timeless = true) {
    const { _minDate: min, _maxDate: max } = config;
    // The common case, every day of every grid, needs no parsing at all.
    if (!min && !max && !config._enable && config._disable.length === 0) {
      return true;
    }
    const target = self.parseDate(date, undefined, timeless);
    if (
      (min && target && compareDays(target, min) < 0) ||
      (max && target && compareDays(target, max) > 0)
    ) {
      return false;
    }
    if (!config._enable && config._disable.length === 0) return true;
    if (target === undefined) return false;
    const allow = !!config._enable;
    for (const rule of config._enable ?? config._disable) {
      if (typeof rule === "function" && rule(target)) return allow;
      if (rule instanceof Date && rule.getTime() === target.getTime()) {
        return allow;
      }
      if (typeof rule === "string") {
        const parsed = self.parseDate(rule, undefined, true);
        return parsed && parsed.getTime() === target.getTime() ? allow : !allow;
      }
      if (
        rule &&
        typeof rule === "object" &&
        rule.from &&
        rule.to &&
        target.getTime() >= rule.from.getTime() &&
        target.getTime() <= rule.to.getTime()
      ) {
        return allow;
      }
    }
    return !allow;
  }
  self.isEnabled = isEnabled;

  /**
   * Whether `date` can be picked or focused. `isDayBlocked` is for limits
   * that only apply to picking from the grid, such as the length of a range:
   * a typed or programmatic value is not checked against it, so it cannot be
   * a disable rule.
   *
   * @param {Date} date
   */
  function isOpenDay(date) {
    return isEnabled(date) && !config.isDayBlocked?.(date, self);
  }

  /** @param {Date} date */
  function selectedIndex(date) {
    return self.selectedDates.findIndex(
      (/** @type {unknown} */ d) =>
        d instanceof Date && compareDays(d, date) === 0,
    );
  }

  // --- Value ------------------------------------------------------------

  /** @param {string} [format] */
  function dateString(format) {
    const fmt =
      format || (config.altInput ? config.altFormat : config.dateFormat);
    return self.selectedDates
      .map((/** @type {Date} */ date) => self.formatDate(date, fmt))
      .filter(
        (
          /** @type {string} */ text,
          /** @type {number} */ i,
          /** @type {string[]} */ all,
        ) => !isRange || all.indexOf(text) === i,
      )
      .join(isRange ? self.l10n.rangeSeparator : config.conjunction);
  }

  /** @param {boolean} [notify] */
  function updateValue(notify = true) {
    if (secondInput) {
      // A range reflects each end into its own input.
      const format = config.altInput ? config.altFormat : config.dateFormat;
      const [from = "", to = ""] = self.selectedDates.map(
        (/** @type {Date} */ d) => self.formatDate(d, format),
      );
      self._input.value = from;
      secondInput.value = to;
      if (self.altInput) self.input.value = dateString(config.dateFormat);
    } else {
      self.input.value = dateString(config.dateFormat);
      if (self.altInput) self.altInput.value = dateString(config.altFormat);
    }
    syncPresets();
    if (notify) triggerEvent("onValueUpdate");
  }

  /**
   * @param {string} event
   * @param {unknown} [data]
   */
  function triggerEvent(event, data) {
    if (self.config === undefined) return;
    const hooks = config[event];
    if (hooks) {
      for (let i = 0; hooks[i] && i < hooks.length; i++) {
        hooks[i](self.selectedDates, self.input.value, self, data);
      }
    }
    if (event === "onChange") {
      for (const type of ["change", "input"]) {
        self.input.dispatchEvent(
          new Event(type, { bubbles: true, cancelable: true }),
        );
      }
    }
  }

  // --- DOM --------------------------------------------------------------

  /** @param {number} index */
  function monthLabel(index) {
    return self.l10n.months[
      config.shorthandCurrentMonth ? "shorthand" : "longhand"
    ][index];
  }

  function buildMonthNav() {
    const nav = createElement("div", "bx--date-picker__month-nav");
    self.monthNav = nav;
    // Out of the tab order, like the year input: Tab leaves the field and
    // PageUp/PageDown change the month from the grid. Screen readers still
    // find them as labelled buttons.
    self.prevMonthNav = createElement(
      "button",
      "bx--date-picker__nav-button bx--date-picker__nav-button--previous",
    );
    self.prevMonthNav.innerHTML = config.prevArrow;
    self.nextMonthNav = createElement(
      "button",
      "bx--date-picker__nav-button bx--date-picker__nav-button--next",
    );
    self.nextMonthNav.innerHTML = config.nextArrow;
    for (const button of [self.prevMonthNav, self.nextMonthNav]) {
      button.type = "button";
      button.tabIndex = -1;
    }
    labelNavButtons();
    buildMonths();
    return nav;
  }

  function labelNavButtons() {
    if (!self.prevMonthNav) return;
    const unit =
      pickerMode === "year" ? "decade" : isYearView ? "year" : "month";
    self.prevMonthNav.setAttribute(
      "aria-label",
      config.prevLabel ?? `Previous ${unit}`,
    );
    self.nextMonthNav.setAttribute(
      "aria-label",
      config.nextLabel ?? `Next ${unit}`,
    );
  }

  function buildMonths() {
    self.monthNav.replaceChildren(self.prevMonthNav);
    self.yearElements = [];
    self.monthElements = [];
    for (let i = 0; i < config.showMonths; i++) {
      const month = createElement("div", "bx--date-picker__month");
      const current = createElement("div", "bx--date-picker__heading");
      if (!isGridMode) {
        const label = createElement("span", "bx--date-picker__month-label");
        current.appendChild(label);
        self.monthElements.push(label);
      }
      const wrapper = createElement("div", "bx--date-picker__year");
      const year = createElement("input", "bx--date-picker__year-input");
      year.type = "number";
      year.tabIndex = -1;
      year.setAttribute("aria-label", self.l10n.yearAriaLabel ?? "Year");
      wrapper.append(
        year,
        createElement(
          "span",
          "bx--date-picker__year-step bx--date-picker__year-step--up",
        ),
        createElement(
          "span",
          "bx--date-picker__year-step bx--date-picker__year-step--down",
        ),
      );
      current.appendChild(wrapper);
      month.appendChild(current);
      self.yearElements.push(year);
      self.monthNav.appendChild(month);
    }
    self.monthNav.appendChild(self.nextMonthNav);
    self.currentYearElement = self.yearElements[0];
    syncYearBounds();
    updateNavigation();
  }

  function syncYearBounds() {
    const { _minDate: min, _maxDate: max } = config;
    for (const year of self.yearElements ?? []) {
      if (min) year.min = String(min.getFullYear());
      else year.removeAttribute("min");
      if (max) year.max = String(max.getFullYear());
      else year.removeAttribute("max");
      year.disabled = !!min && !!max && min.getFullYear() === max.getFullYear();
    }
  }

  function updateNavigation() {
    if (!self.monthNav) return;
    self.yearElements.forEach(
      (/** @type {HTMLInputElement} */ year, /** @type {number} */ i) => {
        const date = new Date(self.currentYear, self.currentMonth + i, 1);
        if (self.monthElements[i]) {
          self.monthElements[i].textContent =
            config.showMonths > 1
              ? `${monthLabel(date.getMonth())} `
              : monthLabel(date.getMonth());
        }
        year.value = String(date.getFullYear());
        const label = self.monthElements[i];
        const wrapper = /** @type {any} */ (year.parentNode);
        // Some locales put the year first, after which some write a word
        // the year input can't hold ("2000年1月").
        const suffix = yearSuffix(config.locale);
        let suffixElement = wrapper?.nextElementSibling?.classList.contains(
          "bx--date-picker__year-suffix",
        )
          ? wrapper.nextElementSibling
          : null;
        if (suffix && !suffixElement) {
          suffixElement = createElement("span", "bx--date-picker__year-suffix");
          suffixElement.setAttribute("aria-hidden", "true");
          wrapper?.after(suffixElement);
        } else if (!suffix && suffixElement) {
          suffixElement.remove();
          suffixElement = null;
        }
        if (suffixElement) suffixElement.textContent = suffix;
        wrapper?.classList.toggle("bx--date-picker__year--suffixed", !!suffix);
        if (label && wrapper) {
          const yearEnd = suffixElement ?? wrapper;
          if (isMonthFirst(config.locale)) {
            if (label.nextSibling !== wrapper) wrapper.before(label);
          } else if (yearEnd.nextSibling !== label) {
            yearEnd.after(label);
          }
        }
      },
    );
    const { _minDate: min, _maxDate: max } = config;
    let hidePrev = false;
    let hideNext = false;
    if (pickerMode === "year") {
      const start = decadeStart() - 1;
      hidePrev = !!min && start <= min.getFullYear();
      hideNext = !!max && start + 11 >= max.getFullYear();
    } else if (isYearView) {
      hidePrev = !!min && self.currentYear <= min.getFullYear();
      hideNext = !!max && self.currentYear >= max.getFullYear();
    } else {
      hidePrev =
        !!min &&
        (self.currentYear === min.getFullYear()
          ? self.currentMonth <= min.getMonth()
          : self.currentYear < min.getFullYear());
      hideNext =
        !!max &&
        (self.currentYear === max.getFullYear()
          ? self.currentMonth + 1 > max.getMonth()
          : self.currentYear > max.getFullYear());
    }
    self._hidePrevMonthArrow = hidePrev;
    self._hideNextMonthArrow = hideNext;
    for (const [button, hidden] of [
      [self.prevMonthNav, hidePrev],
      [self.nextMonthNav, hideNext],
    ]) {
      toggleClass(button, "bx--date-picker__nav-button--disabled", hidden);
      if (hidden) button.setAttribute("aria-disabled", "true");
      else button.removeAttribute("aria-disabled");
    }
    announceView();
  }

  /** Puts the shown month(s), year, or decade into the live region. */
  function announceView() {
    if (!self.viewAnnouncer) return;
    let text;
    if (pickerMode === "year") {
      const start = decadeStart() - 1;
      text = `${start} - ${start + 11}`;
    } else if (isYearView) {
      text = String(self.currentYear);
    } else {
      const monthFirst = isMonthFirst(config.locale);
      const suffix = yearSuffix(config.locale);
      text = Array.from({ length: config.showMonths }, (_, i) => {
        const date = new Date(self.currentYear, self.currentMonth + i, 1);
        const month = self.l10n.months.longhand[date.getMonth()];
        const year = date.getFullYear();
        return monthFirst ? `${month} ${year}` : `${year}${suffix} ${month}`;
      }).join(" – ");
    }
    if (self.viewAnnouncer.textContent !== text) {
      self.viewAnnouncer.textContent = text;
    }
  }

  function buildWeekdays() {
    self.weekdayContainer ??= createElement("div", "bx--date-picker__weekdays");
    // Each day's label already names its weekday.
    self.weekdayContainer.setAttribute("aria-hidden", "true");
    const { shorthand } = self.l10n.weekdays;
    const first = self.l10n.firstDayOfWeek;
    const labels = [...shorthand.slice(first), ...shorthand.slice(0, first)];
    self.weekdayContainer.replaceChildren();
    for (let m = 0; m < config.showMonths; m++) {
      const group = createElement("div", "bx--date-picker__weekday-row");
      for (const label of labels) {
        group.appendChild(
          createElement("span", "bx--date-picker__weekday", label),
        );
      }
      self.weekdayContainer.appendChild(group);
    }
    return self.weekdayContainer;
  }

  /**
   * A day cell. Days of the neighbouring months are `outside`; with two or
   * more months on show they are also `hidden`, since the next grid shows
   * them.
   *
   * @param {Date} date
   * @param {number} index
   * @param {import("./day-state.js").DayStateContext} context
   * @param {{ outside?: "previous" | "next"; hidden?: boolean; base?: string }} [kind]
   */
  function createDay(
    date,
    index,
    context,
    { outside, hidden, base = "bx--date-picker__day" } = {},
  ) {
    const day = createElement("span", base, String(date.getDate()));
    day.setAttribute(
      "role",
      base === "bx--date-picker__day" ? "gridcell" : "option",
    );
    if (outside) day.classList.add("bx--date-picker__day--outside-month");
    if (hidden) day.classList.add("bx--date-picker__day--hidden");
    day.dateObj = date;
    day.$i = index;
    day.$outside = outside;
    const label = self.formatDate(date, config.ariaDateFormat);
    const description = config.dayDescription?.(date);
    day.setAttribute(
      "aria-label",
      description ? `${label}, ${description}` : label,
    );
    if (description) day.classList.add("bx--date-picker__day--described");
    const extraClass = config.dayClass?.(date);
    if (extraClass)
      day.classList.add(...extraClass.split(WHITESPACE).filter(Boolean));
    const state = applyDayState(day, context, true);
    if (!hidden && state.today) {
      self.todayDateElem = day;
      day.classList.add("bx--date-picker__day--today");
      day.setAttribute("aria-current", "date");
    }
    if (
      self.weekNumbers &&
      config.showMonths === 1 &&
      outside !== "previous" &&
      index % 7 === 6
    ) {
      self.weekNumbers.appendChild(
        createElement(
          "span",
          "bx--date-picker__week-number",
          String(config.getWeek(date)),
        ),
      );
    }
    triggerEvent("onDayCreate", day);
    return day;
  }

  /**
   * Sets an attribute only when its value changes, so an unchanged cell
   * costs no DOM write.
   *
   * @param {Element} element
   * @param {string} name
   * @param {string | null} value
   */
  function setAttributeIfChanged(element, name, value) {
    if (element.getAttribute(name) === value) return;
    if (value === null) element.removeAttribute(name);
    else element.setAttribute(name, value);
  }

  /**
   * Sets a state class on a day. A fresh cell has no state classes yet, so
   * it only needs the ones that are on.
   *
   * @param {Element} day
   * @param {string} name
   * @param {boolean} on
   * @param {boolean} fresh
   */
  function setDayClass(day, name, on, fresh) {
    if (!fresh) toggleClass(day, name, on);
    else if (on) day.classList.add(name);
  }

  /** @param {Date} date */
  const isEnabledDay = (date) => isEnabled(date, true);
  /** @param {Date} date */
  const isBlockedDay = (date) => !!config.isDayBlocked?.(date, self);

  /**
   * What `dayState` reads, built once for each pass over the cells.
   * @returns {import("./day-state.js").DayStateContext}
   */
  function dayContext() {
    return {
      selected: self.selectedDates,
      range: isRange,
      today: self.now,
      isEnabled: isEnabledDay,
      isBlocked: isBlockedDay,
    };
  }

  /** The states a pick can change; `today` never does. */
  const SELECTION_STATES = /** @type {const} */ ([
    "selected",
    "rangeStart",
    "rangeEnd",
    "inRange",
    "disabled",
  ]);

  /**
   * Draws a day's state from `dayState`. A pick updates the cells already
   * built rather than rebuilding them.
   *
   * @param {any} day
   * @param {import("./day-state.js").DayStateContext} context
   * @param {boolean} [fresh] Whether the cell was just created.
   */
  function applyDayState(day, context, fresh = false) {
    const state = dayState(day.dateObj, context, day.$outside);
    if (state.selected) self.selectedDateElem = day;
    for (const key of SELECTION_STATES) {
      setDayClass(day, DAY_STATE_CLASSES[key], state[key], fresh);
    }
    // axe only exempts inactive text from the contrast check when it is
    // marked `aria-disabled`, not by a CSS class.
    if (fresh) {
      if (!state.disabled || state.blocked) day.tabIndex = -1;
      if (state.selected) day.setAttribute("aria-selected", "true");
      if (state.disabled) day.setAttribute("aria-disabled", "true");
      return state;
    }
    setAttributeIfChanged(day, "aria-selected", state.selected ? "true" : null);
    setAttributeIfChanged(day, "aria-disabled", state.disabled ? "true" : null);
    // Left by a range preview or a week highlight; both are redrawn after.
    toggleClass(day, "bx--date-picker__day--blocked", false);
    toggleClass(day, "bx--date-picker__day--week", false);
    return state;
  }

  /** Updates the built days for a new selection, in place. */
  function refreshDays() {
    self.selectedDateElem = undefined;
    const context = dayContext();
    for (const day of self.daysContainer.querySelectorAll(
      ".bx--date-picker__day",
    )) {
      applyDayState(day, context);
    }
    if (pickerMode === "week") highlightWeek();
    if (isRange && self.selectedDates.length === 1) previewRange();
  }

  /**
   * @param {number} year
   * @param {number} month
   */
  function buildMonthDays(year, month) {
    const offset =
      (new Date(year, month, 1).getDay() - self.l10n.firstDayOfWeek + 7) % 7;
    const prevDays = daysInMonth(year, month - 1);
    const days = daysInMonth(year, month);
    const hidden = config.showMonths > 1;
    const context = dayContext();
    const fragment = document.createDocumentFragment();
    let index = 0;
    for (let n = prevDays + 1 - offset; n <= prevDays; n++, index++) {
      fragment.appendChild(
        createDay(new Date(year, month - 1, n), index, context, {
          outside: "previous",
          hidden,
        }),
      );
    }
    for (let n = 1; n <= days; n++, index++) {
      fragment.appendChild(createDay(new Date(year, month, n), index, context));
    }
    for (
      let n = days + 1;
      n <= 42 - offset && (config.showMonths === 1 || index % 7 !== 0);
      n++, index++
    ) {
      fragment.appendChild(
        createDay(new Date(year, month + 1, n % days), index, context, {
          outside: "next",
          hidden,
        }),
      );
    }
    const container = createElement("div", "bx--date-picker__month-days");
    container.setAttribute("role", "grid");
    container.setAttribute(
      "aria-label",
      `${self.l10n.months.longhand[month]} ${year}`,
    );
    if (isMultiple || isRange) {
      container.setAttribute("aria-multiselectable", "true");
    }
    const cells = [...fragment.childNodes];
    for (let i = 0; i < cells.length; i += 7) {
      const row = createElement("div", "bx--date-picker__week");
      row.setAttribute("role", "row");
      row.append(...cells.slice(i, i + 7));
      container.appendChild(row);
    }
    return container;
  }

  function buildDays() {
    if (!self.daysContainer) return;
    self.daysContainer.replaceChildren();
    self.weekNumbers?.replaceChildren();
    self.selectedDateElem = undefined;
    self.todayDateElem = undefined;
    if (isGridMode) return buildGrid();
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < config.showMonths; i++) {
      const date = new Date(self.currentYear, self.currentMonth + i, 1);
      fragment.appendChild(buildMonthDays(date.getFullYear(), date.getMonth()));
    }
    self.daysContainer.appendChild(fragment);
    self.days = self.daysContainer.firstChild;
    if (pickerMode === "week") highlightWeek();
    if (isRange && self.selectedDates.length === 1) previewRange();
  }

  // --- Month and year grids ---------------------------------------------

  /** @param {number} [year] */
  function decadeStart(year = self.currentYear) {
    return year - (year % 10);
  }

  function buildGrid() {
    const isYear = pickerMode === "year";
    const container = createElement(
      "div",
      isYear
        ? "bx--date-picker__grid bx--date-picker__grid--years"
        : isQuarter
          ? "bx--date-picker__grid bx--date-picker__grid--quarters"
          : "bx--date-picker__grid bx--date-picker__grid--months",
    );
    container.tabIndex = -1;
    container.setAttribute("role", "listbox");
    container.setAttribute(
      "aria-label",
      isYear ? "Years" : isQuarter ? "Quarters" : "Months",
    );
    const start = decadeStart() - 1;
    const now = self.now;
    /** @param {Date} date */
    const quarterOf = (date) => Math.floor(date.getMonth() / 3);
    const context = dayContext();
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < (isQuarter ? 4 : 12); i++) {
      const date = isYear
        ? new Date(start + i, 0, 1)
        : new Date(self.currentYear, isQuarter ? i * 3 : i);
      const cell = createDay(date, i, context, {
        base: "bx--date-picker__grid-cell",
      });
      cell.classList.remove(
        "bx--date-picker__day--disabled",
        "bx--date-picker__day--selected",
        "bx--date-picker__day--today",
      );
      // A month or year is disabled only when it is out of bounds (below),
      // not because its first day is.
      cell.removeAttribute("aria-current");
      cell.removeAttribute("aria-disabled");
      cell.removeAttribute("aria-selected");
      cell.tabIndex = -1;
      const year = date.getFullYear();
      const outOfRange =
        (config._minDate &&
          (isYear
            ? year < config._minDate.getFullYear()
            : compareMonths(
                isQuarter ? new Date(year, i * 3 + 2) : date,
                config._minDate,
              ) < 0)) ||
        (config._maxDate &&
          (isYear
            ? year > config._maxDate.getFullYear()
            : compareMonths(date, config._maxDate) > 0));
      if (outOfRange) {
        cell.classList.add("bx--date-picker__grid-cell--disabled");
        cell.setAttribute("aria-disabled", "true");
      }
      const target = self.selectedDates[0];
      if (
        target &&
        target.getFullYear() === year &&
        (isYear ||
          (isQuarter ? quarterOf(target) === i : target.getMonth() === i))
      ) {
        cell.classList.add("bx--date-picker__grid-cell--selected");
        cell.setAttribute("aria-selected", "true");
        self.selectedDateElem = cell;
      }
      if (
        year === now.getFullYear() &&
        (isYear ||
          (isQuarter
            ? quarterOf(now) === i
            : date.getMonth() === now.getMonth()))
      ) {
        cell.classList.add("bx--date-picker__grid-cell--today");
        cell.setAttribute("aria-current", "date");
        self.todayDateElem = cell;
      }
      if (isYear) {
        cell.textContent = String(year);
        cell.setAttribute("data-year", String(year));
      } else if (isQuarter) {
        cell.textContent = `Q${i + 1}`;
        cell.setAttribute("aria-label", `Q${i + 1} ${year}`);
      } else {
        cell.textContent = self.l10n.months.shorthand[i];
      }
      fragment.appendChild(cell);
    }
    container.appendChild(fragment);
    self.daysContainer.appendChild(container);
    self.days = container;
    if (isYear) {
      self.yearRangeElement.textContent = `${start} - ${start + 11}`;
    }
  }

  /** @param {Date} a @param {Date} b */
  function compareMonths(a, b) {
    return (
      a.getFullYear() * 12 +
      a.getMonth() -
      (b.getFullYear() * 12 + b.getMonth())
    );
  }

  // --- Week picker ------------------------------------------------------

  /** First day of the week containing `date`. */
  /** @param {Date} date */
  function weekStartOf(date) {
    const offset = (date.getDay() - self.l10n.firstDayOfWeek + 7) % 7;
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() - offset,
    );
  }

  function highlightWeek() {
    const [selected] = self.selectedDates;
    if (!selected) return;
    const start = weekStartOf(selected).getTime();
    const end = start + 7 * DAY_MS;
    for (const day of self.daysContainer.querySelectorAll(
      ".bx--date-picker__day",
    )) {
      const time = day.dateObj.getTime();
      // Compare by day so a daylight-saving hour cannot drop an edge day.
      if (time >= start - DAY_MS / 2 && time < end - DAY_MS / 2) {
        day.classList.add(
          "bx--date-picker__day--week",
          "bx--date-picker__day--selected",
        );
      }
    }
  }

  /** @param {Event} event */
  function hoverWeek(event) {
    const day = eventTarget(event).closest?.(".bx--date-picker__day");
    if (!day?.dateObj) return;
    const start = weekStartOf(day.dateObj).getTime();
    for (const cell of self.daysContainer.querySelectorAll(
      ".bx--date-picker__day",
    )) {
      const time = cell.dateObj.getTime();
      toggleClass(
        cell,
        "bx--date-picker__day--in-range",
        time >= start - DAY_MS / 2 && time < start + 7 * DAY_MS - DAY_MS / 2,
      );
    }
  }

  function clearWeekHover() {
    for (const day of self.daysContainer?.querySelectorAll(
      ".bx--date-picker__day--in-range",
    ) ?? []) {
      day.classList.remove("bx--date-picker__day--in-range");
    }
  }

  // --- Range preview ----------------------------------------------------

  /** @param {HTMLElement} [hovered] */
  function previewRange(hovered) {
    if (
      self.selectedDates.length !== 1 ||
      (hovered &&
        (!hovered.classList.contains("bx--date-picker__day") ||
          hovered.classList.contains("bx--date-picker__day--disabled")))
    ) {
      return;
    }
    const anchor = self.selectedDates[0].getTime();
    const hover = hovered
      ? /** @type {any} */ (hovered).dateObj.getTime()
      : firstDay(self.days).dateObj.getTime();
    const from = Math.min(hover, anchor);
    const to = Math.max(hover, anchor);
    let containsDisabled = false;
    let minAllowed = 0;
    let maxAllowed = 0;
    for (let t = from; t < to; t += DAY_MS) {
      if (!isEnabled(new Date(t), true)) {
        containsDisabled ||= t > from && t < to;
        if (t < anchor && (!minAllowed || t > minAllowed)) minAllowed = t;
        else if (t > anchor && (!maxAllowed || t < maxAllowed)) maxAllowed = t;
      }
    }
    const cells = self.daysContainer.querySelectorAll(
      `.bx--date-picker__month-days:nth-child(-n+${config.showMonths}) .bx--date-picker__day`,
    );
    for (const cell of cells) {
      const time = cell.dateObj.getTime();
      const blocked =
        (minAllowed > 0 && time < minAllowed) ||
        (maxAllowed > 0 && time > maxAllowed);
      if (blocked) {
        cell.classList.add("bx--date-picker__day--blocked");
        cell.classList.remove(RANGE_START, IN_RANGE, RANGE_END);
        continue;
      }
      if (containsDisabled) continue;
      cell.classList.remove(
        RANGE_START,
        IN_RANGE,
        RANGE_END,
        "bx--date-picker__day--blocked",
      );
      if (hovered) {
        hovered.classList.add(hover <= anchor ? RANGE_START : RANGE_END);
        if (anchor < hover && time === anchor) cell.classList.add(RANGE_START);
        else if (anchor > hover && time === anchor)
          cell.classList.add(RANGE_END);
        if (
          time >= minAllowed &&
          (maxAllowed === 0 || time <= maxAllowed) &&
          time > Math.min(anchor, hover) &&
          time < Math.max(anchor, hover)
        ) {
          cell.classList.add(IN_RANGE);
        }
      }
    }
  }
  self.onMouseOver = previewRange;

  // --- Build ------------------------------------------------------------

  /**
   * Whether the header and grid exist yet. With `lazy`, a popup calendar
   * builds them on first open, so closed pickers cost one empty element
   * each. Inline calendars still build them up front.
   */
  let filled = false;

  function fillContents() {
    if (filled) return;
    filled = true;
    const container = self.calendarContainer;
    const fragment = document.createDocumentFragment();
    fragment.appendChild(buildMonthNav());
    self.innerContainer = createElement("div", "bx--date-picker__body");
    if (config.weekNumbers) {
      const wrapper = createElement("div", "bx--date-picker__week-numbers");
      wrapper.appendChild(
        createElement(
          "span",
          "bx--date-picker__weekday",
          self.l10n.weekAbbreviation ?? "Wk",
        ),
      );
      self.weekNumbers = createElement(
        "div",
        "bx--date-picker__week-number-list",
      );
      wrapper.appendChild(self.weekNumbers);
      self.innerContainer.appendChild(wrapper);
      self.weekWrapper = wrapper;
    }
    self.rContainer = createElement("div", "bx--date-picker__main");
    if (pickerMode === "year") {
      // The decade label stands in for the month and year inputs.
      self.yearRangeElement = createElement("span", "bx--date-picker__decade");
      self.monthNav
        .querySelector(".bx--date-picker__heading")
        .replaceChildren(self.yearRangeElement);
      self.yearElements = [];
    } else if (!isGridMode) {
      self.rContainer.appendChild(buildWeekdays());
    }
    self.daysContainer = createElement("div", "bx--date-picker__days");
    self.daysContainer.tabIndex = -1;
    self.rContainer.appendChild(self.daysContainer);
    self.innerContainer.appendChild(self.rContainer);
    fragment.appendChild(self.innerContainer);
    container.prepend(fragment);
    // Announces the month (or year, or decade) the arrows and keys move to.
    self.viewAnnouncer = createElement("span", "bx--assistive-text");
    self.viewAnnouncer.setAttribute("aria-live", "polite");
    self.innerContainer.after(self.viewAnnouncer);
    buildDays();
    updateNavigation();
    bindContentEvents();
    buildPresets();
  }

  function build() {
    const container = createElement("div", "bx--date-picker__calendar");
    self.calendarContainer = container;
    container.tabIndex = -1;
    toggleClass(container, "bx--date-picker__calendar--range", isRange);
    toggleClass(
      container,
      "bx--date-picker__calendar--animate",
      config.animate === true,
    );
    toggleClass(
      container,
      "bx--date-picker__calendar--multi-month",
      config.showMonths > 1,
    );
    toggleClass(
      container,
      "bx--date-picker__calendar--week-numbers",
      config.weekNumbers,
    );
    // The month, quarter, and year grids are shorter than the day grid.
    if (isGridMode) {
      container.classList.add(
        isQuarter
          ? "bx--date-picker__calendar--quarter"
          : pickerMode === "year"
            ? "bx--date-picker__calendar--year"
            : "bx--date-picker__calendar--month",
      );
    }
    if (!config.lazy || config.inline) {
      fillContents();
    }

    const custom = config.appendTo?.nodeType !== undefined;
    if (config.inline || config.static) {
      container.classList.add(
        config.inline
          ? "bx--date-picker__calendar--inline"
          : "bx--date-picker__calendar--static",
      );
      if (config.inline) {
        if (!custom && element.parentNode) {
          element.parentNode.insertBefore(container, self._input.nextSibling);
        } else if (config.appendTo) {
          config.appendTo.appendChild(container);
        }
      }
      if (config.static) staticAnchor().appendChild(container);
    }
    if (!config.static && !config.inline) {
      (config.appendTo ?? document.body).appendChild(container);
    }
  }

  /** @type {HTMLElement | undefined} */
  let anchor;
  /**
   * The wrapper a static calendar opens from, around the field.
   * @returns {HTMLElement}
   */
  function staticAnchor() {
    if (anchor) return anchor;
    const wrapper = createElement("div", "bx--date-picker__anchor");
    element.parentNode?.insertBefore(wrapper, element);
    wrapper.appendChild(element);
    if (self.altInput) wrapper.appendChild(self.altInput);
    anchor = wrapper;
    return wrapper;
  }

  /**
   * Moves the calendar to match `static`: under the field, or out to
   * `appendTo` (else the page) and placed there, as if built that way.
   * Focus inside the calendar stays where it was.
   */
  function placeContainer() {
    const container = self.calendarContainer;
    if (!container || config.inline) return;
    const active = document.activeElement;
    const focused =
      active instanceof HTMLElement && container.contains(active)
        ? active
        : null;
    container.classList.toggle(
      "bx--date-picker__calendar--static",
      config.static,
    );
    if (config.static) {
      container.style.removeProperty("top");
      container.style.removeProperty("left");
      container.style.removeProperty("right");
      staticAnchor().appendChild(container);
    } else {
      (config.appendTo ?? document.body).appendChild(container);
    }
    if (self.isOpen) {
      bindOpenListeners();
      positionCalendar();
    }
    focused?.focus({ preventScroll: true });
  }

  // --- Presets ----------------------------------------------------------

  /** What a preset's `value` reads: today, the week start, and time. */
  function presetContext() {
    return {
      today: config.now === undefined ? new Date() : new Date(self.now),
      firstDayOfWeek: self.l10n.firstDayOfWeek,
      time: !!config.timeGranularity,
    };
  }

  /**
   * A preset's dates for this calendar: its range (or its first date, for a
   * single picker) cut to `minDate` and `maxDate`. `undefined` when nothing
   * of it can be picked, or an end is a disabled date.
   *
   * @param {import("./date-presets.js").DatePickerPreset} preset
   * @returns {Date[] | undefined}
   */
  function presetDates(preset) {
    if (preset.disabled) return undefined;
    const value = preset.value(presetContext());
    const [start, end = start] = Array.isArray(value) ? value : [value];
    if (!(start instanceof Date) || !(end instanceof Date)) return undefined;
    let from = new Date(start);
    let to = new Date(end);
    const { _minDate: min, _maxDate: max } = config;
    if (min && compareDays(from, min) < 0) {
      from = new Date(min.getFullYear(), min.getMonth(), min.getDate());
    }
    if (max && compareDays(to, max) > 0) {
      to = new Date(max.getFullYear(), max.getMonth(), max.getDate());
      to.setHours(end.getHours(), end.getMinutes(), end.getSeconds());
    }
    if (compareDays(from, to) > 0) return undefined;
    const dates = isRange ? [from, to] : [from];
    return dates.every((date) => isEnabled(date)) ? dates : undefined;
  }

  /**
   * The shortcut buttons beside the calendar. With presets, the calendar
   * is a row: the rail, then everything else in a wrapper, in its order.
   */
  function buildPresets() {
    const container = self.calendarContainer;
    if (!filled || !container) return;
    const presets = hasPresetRail ? (config.presets ?? []) : [];
    if (self.presetsElement) {
      const main = self.presetsElement.nextElementSibling;
      self.presetsElement.remove();
      main?.replaceWith(...main.childNodes);
      self.presetsElement = undefined;
    }
    toggleClass(
      container,
      "bx--date-picker__calendar--presets",
      presets.length > 0,
    );
    if (presets.length === 0) return;
    const rail = createElement("div", "bx--date-picker__presets");
    rail.setAttribute("role", "group");
    rail.setAttribute("aria-label", config.presetsLabelText);
    for (const preset of presets) {
      const button = createElement(
        "button",
        "bx--date-picker__preset",
        preset.label,
      );
      button.type = "button";
      button.$preset = preset;
      rail.appendChild(button);
    }
    const main = createElement("div", "bx--date-picker__calendar-main");
    main.append(...container.childNodes);
    container.replaceChildren(rail, main);
    self.presetsElement = rail;
    syncPresets();
    applyBlocked();
  }

  /**
   * Whether a disabled or read-only input blocks the calendar. The picker
   * blocks the grid's and the presets' clicks and keys; a disabled
   * picker's presets are disabled too, so they leave the tab order.
   * @type {undefined | "disabled" | "readonly"}
   */
  let blocked;

  function applyBlocked() {
    for (const button of self.presetsElement?.children ?? []) {
      button.disabled = blocked === "disabled";
    }
  }

  /** @param {undefined | "disabled" | "readonly"} state */
  function setBlocked(state) {
    blocked = state;
    applyBlocked();
  }
  self.setBlocked = setBlocked;

  /**
   * Marks the preset that matches the selection (by day) and disables the
   * ones that can't be picked.
   */
  function syncPresets() {
    if (!self.presetsElement) return;
    const selected = self.selectedDates;
    for (const button of self.presetsElement.children) {
      const dates = presetDates(button.$preset);
      const active =
        !!dates &&
        selected.length === dates.length &&
        dates.every(
          (/** @type {Date} */ date, /** @type {number} */ i) =>
            compareDays(date, selected[i]) === 0,
        );
      // Unavailable presets stay focusable, as in a toolbar.
      if (dates) button.removeAttribute("aria-disabled");
      else button.setAttribute("aria-disabled", "true");
      toggleClass(button, "bx--date-picker__preset--active", active);
      if (active) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    }
    const buttons = [...self.presetsElement.children];
    const current = buttons.findIndex((button) =>
      button.hasAttribute("aria-current"),
    );
    setPresetStop(current === -1 ? presetStop : current);
  }

  /**
   * The rail is one tab stop: the current preset, else the one focused
   * last, else the first.
   */
  let presetStop = 0;

  /** @param {number} index */
  function setPresetStop(index) {
    const buttons = [...self.presetsElement.children];
    presetStop = index >= 0 && index < buttons.length ? index : 0;
    buttons.forEach((button, i) => {
      button.tabIndex = i === presetStop ? 0 : -1;
    });
  }

  /** @param {Event} event */
  function onPresetClick(event) {
    const button = eventTarget(event).closest?.(".bx--date-picker__preset");
    if (!button || button.getAttribute("aria-disabled") === "true") return;
    setPresetStop([...self.presetsElement.children].indexOf(button));
    const dates = presetDates(button.$preset);
    if (!dates) return;
    setDate(dates, true);
    if (config.closeOnSelect) focusAndClose();
  }

  /**
   * Up and Down move through the presets, Home and End to the first and
   * last. Enter and Space click the focused one, as on any button.
   *
   * @param {KeyboardEvent} event
   * @param {number} code
   */
  function onPresetKeyDown(event, code) {
    const buttons = [...self.presetsElement.children];
    if (buttons.length === 0) return;
    const index = buttons.indexOf(document.activeElement);
    const next =
      code === 36
        ? 0
        : code === 35
          ? buttons.length - 1
          : code === 40
            ? (index + 1) % buttons.length
            : code === 38
              ? (index - 1 + buttons.length) % buttons.length
              : -1;
    if (next === -1) return;
    event.preventDefault();
    setPresetStop(next);
    buttons[next].focus();
  }

  // --- Navigation -------------------------------------------------------

  /**
   * @param {number} value
   * @param {boolean} [isOffset]
   */
  function changeMonth(value, isOffset = true) {
    const delta = isOffset ? value : value - self.currentMonth;
    if (
      (delta < 0 && self._hidePrevMonthArrow) ||
      (delta > 0 && self._hideNextMonthArrow)
    ) {
      return;
    }
    self.currentMonth += delta;
    if (self.currentMonth < 0 || self.currentMonth > 11) {
      self.currentYear += self.currentMonth > 11 ? 1 : -1;
      self.currentMonth = (self.currentMonth + 12) % 12;
      triggerEvent("onYearChange");
    }
    buildDays();
    triggerEvent("onMonthChange");
    updateNavigation();
  }
  self.changeMonth = changeMonth;

  /** @param {number} newYear */
  function changeYear(newYear) {
    if (
      !newYear ||
      (config._minDate && newYear < config._minDate.getFullYear()) ||
      (config._maxDate && newYear > config._maxDate.getFullYear())
    ) {
      return;
    }
    const isNew = self.currentYear !== newYear;
    self.currentYear = newYear;
    if (config._maxDate && self.currentYear === config._maxDate.getFullYear()) {
      self.currentMonth = Math.min(
        config._maxDate.getMonth(),
        self.currentMonth,
      );
    } else if (
      config._minDate &&
      self.currentYear === config._minDate.getFullYear()
    ) {
      self.currentMonth = Math.max(
        config._minDate.getMonth(),
        self.currentMonth,
      );
    }
    if (isNew) {
      redraw();
      triggerEvent("onYearChange");
    }
  }
  self.changeYear = changeYear;

  /**
   * @param {unknown} [jumpDate]
   * @param {boolean} [notify]
   */
  function jumpToDate(jumpDate, notify) {
    const target =
      jumpDate === undefined
        ? (self.latestSelectedDateObj ??
          (config._minDate && config._minDate > self.now
            ? config._minDate
            : config._maxDate && config._maxDate < self.now
              ? config._maxDate
              : self.now))
        : self.parseDate(jumpDate);
    const oldYear = self.currentYear;
    const oldMonth = self.currentMonth;
    if (target !== undefined) {
      self.currentYear = target.getFullYear();
      self.currentMonth = target.getMonth();
    }
    if (notify && self.currentYear !== oldYear) triggerEvent("onYearChange");
    if (
      notify &&
      (self.currentYear !== oldYear || self.currentMonth !== oldMonth)
    ) {
      triggerEvent("onMonthChange");
    }
    redraw();
  }
  self.jumpToDate = jumpToDate;

  /**
   * Whether `date` falls in one of the months on show.
   *
   * @param {Date} date
   */
  function isMonthShown(date) {
    const offset =
      date.getFullYear() * 12 +
      date.getMonth() -
      (self.currentYear * 12 + self.currentMonth);
    return offset >= 0 && offset < config.showMonths;
  }

  function redraw() {
    updateNavigation();
    buildDays();
    syncPresets();
  }
  self.redraw = redraw;

  // --- Selection --------------------------------------------------------

  /** @param {Date} date */
  function selectDateValue(date) {
    const selected = new Date(date.getTime());
    self.latestSelectedDateObj = selected;
    if (isMultiple) {
      const index = selectedIndex(selected);
      if (index === -1) self.selectedDates.push(selected);
      else self.selectedDates.splice(index, 1);
    } else if (isRange) {
      if (self.selectedDates.length === 2 && secondInput) {
        // With both ends set, a click edits only the end whose input is
        // focused rather than starting a new range.
        const next = secondFocused
          ? [self.selectedDates[0], selected]
          : [selected, self.selectedDates[1]];
        if (next[0] > next[1]) {
          if (secondFocused) next[0] = next[1];
          else next[1] = next[0];
        }
        self.selectedDates = next;
      } else {
        if (self.selectedDates.length === 2) clear(false, false);
        self.selectedDates.push(selected);
        if (compareDays(selected, self.selectedDates[0]) !== 0) {
          self.selectedDates.sort(
            (/** @type {Date} */ a, /** @type {Date} */ b) =>
              a.getTime() - b.getTime(),
          );
        }
      }
    } else if (pickerMode === "week") {
      self.selectedDates = [weekStartOf(selected)];
    } else {
      self.selectedDates = [selected];
    }
    return selected;
  }

  /** @param {Event} event */
  function selectDate(event) {
    event.preventDefault();
    event.stopPropagation();
    let target = eventTarget(event);
    while (
      target &&
      !(
        target.classList?.contains("bx--date-picker__day") &&
        !target.classList.contains("bx--date-picker__day--disabled") &&
        !target.classList.contains("bx--date-picker__day--blocked")
      )
    ) {
      target = target.parentNode;
    }
    if (!target) return;
    const selected = selectDateValue(target.dateObj);
    const changeView =
      (selected.getMonth() < self.currentMonth ||
        selected.getMonth() > self.currentMonth + config.showMonths - 1) &&
      !isRange;
    self.selectedDateElem = target;
    if (changeView) {
      const isNewYear = self.currentYear !== selected.getFullYear();
      self.currentYear = selected.getFullYear();
      self.currentMonth = selected.getMonth();
      if (isNewYear) triggerEvent("onYearChange");
      triggerEvent("onMonthChange");
    }
    updateNavigation();
    // A pick inside the months on show only changes state, so patch the
    // cells; one that moves the view needs the new month built.
    if (changeView) buildDays();
    else refreshDays();
    updateValue();
    if (!changeView && !isRange && config.showMonths === 1) {
      focusDay(target);
    } else {
      self.selectedDateElem?.focus();
    }
    if (config.closeOnSelect) {
      if (!isRange && !isMultiple) focusAndClose();
      else if (isRange && self.selectedDates.length === 2) focusAndClose();
    }
    triggerEvent("onChange");
  }

  /** Clicks on the month or year grids. */
  /** @param {Event} event */
  function selectGridCell(event) {
    const cell = eventTarget(event).closest?.(".bx--date-picker__grid-cell");
    if (!cell) return;
    event.preventDefault();
    event.stopPropagation();
    if (cell.classList.contains("bx--date-picker__grid-cell--disabled")) return;
    setGridDate(cell.dateObj);
    if (config.closeOnSelect) self.close();
  }

  /** @param {Date} date */
  function setGridDate(date) {
    const next =
      pickerMode === "year"
        ? new Date(date.getFullYear(), 0, 1)
        : new Date(self.currentYear, date.getMonth(), date.getDate());
    self.setDate(next, true);
    if (isYearView) buildDays();
  }

  /** @param {boolean} [notify] @param {boolean} [toInitial] */
  function clear(notify = true, toInitial = true) {
    self.input.value = "";
    if (self.altInput) self.altInput.value = "";
    self.selectedDates = [];
    self.latestSelectedDateObj = undefined;
    if (toInitial) {
      self.currentYear = self._initialDate.getFullYear();
      self.currentMonth = self._initialDate.getMonth();
    }
    redraw();
    if (notify) triggerEvent("onChange");
  }
  self.clear = clear;

  /**
   * @param {unknown} date
   * @param {boolean} [notify]
   * @param {string} [format]
   */
  function setDate(date, notify = false, format = config.dateFormat) {
    if ((date !== 0 && !date) || (Array.isArray(date) && date.length === 0)) {
      return clear(notify);
    }
    setSelectedDate(date, format);
    self.latestSelectedDateObj =
      self.selectedDates[self.selectedDates.length - 1];
    redraw();
    jumpToDate(undefined, notify);
    if (self.selectedDates.length === 0) clear(false);
    updateValue(notify);
    if (notify) triggerEvent("onChange");
  }
  self.setDate = setDate;

  // --- Options ----------------------------------------------------------

  function applyL10n() {
    self.l10n = resolveL10n();
    if (self.weekdayContainer) buildWeekdays();
  }

  /** @type {Record<string, Array<() => void>>} */
  const CALLBACKS = {
    locale: [applyL10n],
    firstDayOfWeek: [applyL10n],
    allowInput: [syncReadonly],
    prevLabel: [labelNavButtons],
    nextLabel: [labelNavButtons],
    animate: [
      () =>
        toggleClass(
          self.calendarContainer,
          "bx--date-picker__calendar--animate",
          config.animate,
        ),
    ],
    // A replaced array would drop the range's second input, which then
    // closed the calendar when it took focus.
    ignoredFocusElements: [
      () => {
        config.ignoredFocusElements = [...(config.ignoredFocusElements ?? [])];
        if (secondInput && !config.ignoredFocusElements.includes(secondInput)) {
          config.ignoredFocusElements.push(secondInput);
        }
      },
    ],
    showMonths: [
      () => {
        if (!filled) return;
        buildMonths();
        buildWeekdays();
      },
    ],
    minDate: [() => jumpToDate()],
    maxDate: [() => jumpToDate()],
    positionElement: [
      () => {
        self._positionElement = config.positionElement || self._input;
      },
    ],
    clickOpens: [bindOpenTriggers],
    static: [placeContainer],
    presets: [buildPresets],
    presetsLabelText: [buildPresets],
  };

  /**
   * @param {string | Record<string, unknown>} option
   * @param {unknown} [value]
   */
  function set(option, value) {
    const keys =
      option !== null && typeof option === "object"
        ? Object.keys(option)
        : [option];
    if (option !== null && typeof option === "object") {
      Object.assign(config, option);
      for (const key of keys) {
        for (const callback of CALLBACKS[key] ?? []) callback();
      }
    } else {
      config[option] = value;
      if (CALLBACKS[option]) {
        for (const callback of CALLBACKS[option]) callback();
      } else if (HOOKS.includes(option)) {
        config[option] = arrayify(value);
      }
    }
    // Only options that change the grid redraw it; the rest change how the
    // calendar behaves, or only the field's text.
    if (keys.every((key) => QUIET_OPTIONS.has(key) || HOOKS.includes(key))) {
      return;
    }
    if (keys.every((key) => QUIET_OPTIONS.has(key) || TEXT_OPTIONS.has(key))) {
      updateValue(true);
      return;
    }
    redraw();
    updateValue(true);
  }
  self.set = set;

  // --- Open and close ---------------------------------------------------

  let secondFocused = false;

  function bindOpenTriggers() {
    triggerListeners.clear();
    if (!config.clickOpens) return;
    /** @param {HTMLInputElement} input @param {(e: Event) => void} handler */
    const bindInput = (input, handler) => {
      triggerListeners.add(input, "focus", handler);
      triggerListeners.add(input, "click", handler);
    };
    if (secondInput) {
      bindInput(self._input, (event) => {
        event.preventDefault();
        self.isOpen = false;
        open();
      });
      bindInput(secondInput, () => {
        if (self.selectedDates[1]) {
          self.latestSelectedDateObj = self.selectedDates[1];
          jumpToDate(self.selectedDates[1]);
        }
        secondFocused = true;
        self.isOpen = false;
        open();
      });
    } else {
      bindInput(self._input, open);
    }
  }

  /** @param {Event} [_event] @param {HTMLElement} [positionElement] */
  function open(_event, positionElement = self._positionElement) {
    if (self._input.disabled || config.inline) return;
    const wasOpen = self.isOpen;
    fillContents();
    self.isOpen = true;
    if (!wasOpen) {
      self.calendarContainer.classList.add("bx--date-picker__calendar--open");
      self._input.classList.add("active");
      bindOpenListeners();
      triggerEvent("onOpen");
      positionCalendar(positionElement);
    }
  }
  self.open = open;

  function close() {
    self.isOpen = false;
    self.calendarContainer?.classList.remove("bx--date-picker__calendar--open");
    if (self._input) self._input.classList.remove("active");
    openListeners.clear();
    triggerEvent("onClose");
  }
  self.close = close;
  self.toggle = (/** @type {Event} */ event) => {
    if (self.isOpen) return close();
    open(event);
  };

  function focusAndClose() {
    self._input.focus();
    close();
  }

  /** Document listeners that only matter while the calendar is open. */
  function bindOpenListeners() {
    openListeners.clear();
    openListeners.add(document, "mousedown", documentClick);
    openListeners.add(document, "focus", documentClick, { capture: true });
    if (!config.inline && !config.static) {
      openListeners.add(window, "resize", onResize);
    }
  }

  let resizeTimer = 0;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (self.isOpen && !config.static && !config.inline) positionCalendar();
    }, 50);
  }

  /** @param {Event} event */
  function documentClick(event) {
    if (!self.isOpen || config.inline) return;
    const target = eventTarget(event);
    const inCalendar = self.calendarContainer.contains(target);
    const isInput =
      target === self.input ||
      target === self.altInput ||
      target === secondInput ||
      self.element.contains(target);
    const related = /** @type {FocusEvent} */ (event).relatedTarget;
    const lostFocus =
      !isInput &&
      !inCalendar &&
      !(related instanceof Node && self.calendarContainer.contains(related));
    const ignored = config.ignoredFocusElements.some(
      (/** @type {Node} */ node) => node.contains(target),
    );
    if (lostFocus && !ignored) {
      if (config.allowInput) {
        self.setDate(
          self._input.value,
          false,
          config.altInput ? config.altFormat : config.dateFormat,
        );
      }
      close();
      if (isRange && self.selectedDates.length === 1) clear(false);
    }
  }

  /** @param {HTMLElement} [customPositionElement] */
  function positionCalendar(customPositionElement) {
    if (typeof config.position === "function") {
      return void config.position(self, customPositionElement);
    }
    if (!self.calendarContainer) return;
    triggerEvent("onPreCalendarPosition");
    const anchor = customPositionElement || self._positionElement;
    const container = self.calendarContainer;
    // The preset rail sits beside the calendar, or above it on a narrow
    // screen.
    const sideBySide =
      !!self.presetsElement &&
      getComputedStyle(container).flexDirection === "row";
    let height = 0;
    for (const child of /** @type {HTMLElement[]} */ ([
      ...container.children,
    ])) {
      height = sideBySide
        ? Math.max(height, child.offsetHeight)
        : height + child.offsetHeight;
    }
    const width = container.offsetWidth;
    const [vertical, horizontal] = String(config.position).split(" ");
    const bounds = anchor.getBoundingClientRect();
    const showOnTop =
      vertical === "above" ||
      (vertical !== "below" &&
        window.innerHeight - bounds.bottom < height &&
        bounds.top > height);
    const top =
      window.pageYOffset +
      bounds.top +
      (showOnTop ? -height - 2 : anchor.offsetHeight + 2);
    toggleClass(container, "arrowTop", !showOnTop);
    toggleClass(container, "arrowBottom", showOnTop);
    if (config.inline) return;
    const center = horizontal === "center";
    // `left` and `right` are physical. `start`, `end` and no alignment
    // follow the direction: in RTL the calendar's right edge meets the
    // anchor's.
    const right =
      horizontal === "right" ||
      (horizontal !== "left" && !center && (horizontal === "end") !== isRtl());
    let left = window.pageXOffset + bounds.left;
    if (center) left -= (width - bounds.width) / 2;
    else if (right) left -= width - bounds.width;
    toggleClass(container, "arrowLeft", !center && !right);
    toggleClass(container, "arrowCenter", center);
    toggleClass(container, "arrowRight", right);
    const bodyWidth = document.body.offsetWidth;
    const rightEdge = bodyWidth - (window.pageXOffset + bounds.right);
    const rightMost = left + width > bodyWidth;
    // Past the left edge, it lines up with the anchor's left edge instead,
    // as past the right edge it lines up with the right one.
    if (!rightMost && left < window.pageXOffset) {
      left = window.pageXOffset + Math.max(0, bounds.left);
    }
    toggleClass(container, "rightMost", rightMost);
    if (config.static) return;
    container.style.top = `${top}px`;
    if (rightMost) {
      container.style.left = "auto";
      container.style.right = `${Math.max(0, rightEdge)}px`;
    } else {
      container.style.left = `${left}px`;
      container.style.right = "auto";
    }
  }

  // --- Keyboard and pointer ---------------------------------------------

  /**
   * Whether focus is on a day of the grid, open or not: a blocked day (the
   * start of a range under `minRangeDays`, say) still navigates away.
   *
   * @param {HTMLElement} node
   */
  function isDayFocused(node) {
    return (
      self.daysContainer !== undefined &&
      !node.classList.contains("bx--date-picker__day--hidden") &&
      self.daysContainer.contains(node)
    );
  }

  /** @param {HTMLElement} node */
  function isInView(node) {
    return (
      self.daysContainer !== undefined &&
      !node.classList.contains("bx--date-picker__day--hidden") &&
      !node.classList.contains("bx--date-picker__day--disabled") &&
      self.daysContainer.contains(node)
    );
  }

  /** @param {HTMLElement} node */
  function focusDay(node) {
    node.focus();
    if (isRange) previewRange(node);
  }

  /** @param {number} delta */
  function firstAvailableDay(delta) {
    const from = delta > 0 ? 0 : config.showMonths - 1;
    const to = delta > 0 ? config.showMonths : -1;
    for (let m = from; m !== to; m += delta) {
      const cells = self.daysContainer.children[m].querySelectorAll(
        ".bx--date-picker__day",
      );
      const start = delta > 0 ? 0 : cells.length - 1;
      const end = delta > 0 ? cells.length : -1;
      for (let i = start; i !== end; i += delta) {
        const cell = cells[i];
        if (
          !cell.classList.contains("bx--date-picker__day--hidden") &&
          isOpenDay(cell.dateObj)
        ) {
          return cell;
        }
      }
    }
    return undefined;
  }

  /**
   * The first open day `offset` days from `from`, then on one day at a time
   * in the same direction. Gives up after a year.
   *
   * @param {Date} from
   * @param {number} offset
   */
  function findOpenDay(from, offset) {
    const step = Math.sign(offset);
    for (let days = offset; Math.abs(days) <= 366; days += step) {
      const date = new Date(
        from.getFullYear(),
        from.getMonth(),
        from.getDate() + days,
      );
      if (isOpenDay(date)) return date;
    }
    return undefined;
  }

  /**
   * Focuses the cell for `date`, moving the view a month at a time until it
   * is on screen.
   *
   * @param {Date} date
   */
  function focusDate(date) {
    const find = () =>
      /** @type {HTMLElement[]} */ ([
        ...self.daysContainer.querySelectorAll(".bx--date-picker__day"),
      ]).find(
        (cell) =>
          /** @type {any} */ (cell).dateObj.getTime() === date.getTime() &&
          !cell.classList.contains("bx--date-picker__day--hidden"),
      );
    let cell = find();
    const direction =
      date.getTime() < firstDay(self.days).dateObj.getTime() ? -1 : 1;
    for (let i = 0; !cell && i < 13; i++) {
      changeMonth(direction);
      cell = find();
    }
    if (cell) focusDay(cell);
  }

  /**
   * Focuses the first open day of the month that holds `month`.
   *
   * @param {Date} month
   */
  function focusFirstOpenDayOfMonth(month) {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const date = new Date(first);
    while (date.getMonth() === first.getMonth()) {
      if (isOpenDay(date)) {
        // Show the month first, as the first panel.
        jumpToDate(date, true);
        return focusDate(date);
      }
      date.setDate(date.getDate() + 1);
    }
  }

  /** @param {any} current @param {number} delta */
  function nextAvailableDay(current, delta) {
    const target = findOpenDay(current.dateObj, delta);
    if (target) focusDate(target);
  }

  /** @param {any} current @param {number} offset */
  function focusOnDay(current, offset) {
    const active = /** @type {HTMLElement} */ (document.activeElement);
    const dayFocused = isDayFocused(active || document.body);
    const start =
      current === undefined
        ? dayFocused
          ? active
          : self.selectedDateElem && isInView(self.selectedDateElem)
            ? self.selectedDateElem
            : self.todayDateElem && isInView(self.todayDateElem)
              ? self.todayDateElem
              : firstAvailableDay(offset > 0 ? 1 : -1)
        : current;
    if (start === undefined) self._input.focus();
    else if (dayFocused) nextAvailableDay(start, offset);
    else focusDay(start);
  }

  /** @param {KeyboardEvent} event */
  function onKeyDown(event) {
    const target = eventTarget(event);
    const isInput = target === self._input || target === secondInput;
    const { allowInput } = config;
    const allowKeydown = self.isOpen && (!allowInput || !isInput);
    const allowInlineKeydown = config.inline && isInput && !allowInput;
    const code = keyCodeOf(event);
    const inCalendar = self.calendarContainer.contains(target);
    if (code !== 27 && self.presetsElement?.contains(target)) {
      onPresetKeyDown(event, code);
      triggerEvent("onKeyDown", event);
      return;
    }

    if (code === 13 && isInput) {
      if (allowInput) {
        commitTypedValue(target);
        self.close();
        return target.blur();
      }
      open();
    } else if (inCalendar || allowKeydown || allowInlineKeydown) {
      switch (code) {
        case 13:
          if (isGridMode) break;
          selectDate(event);
          break;
        case 32:
          // Space selects a focused day, as Enter does.
          if (isGridMode || isInput || !isDayFocused(target)) break;
          event.preventDefault();
          selectDate(event);
          break;
        case 33:
        case 34:
        case 35:
        case 36:
          if (isGridMode || isInput || !isDayFocused(target)) break;
          event.preventDefault();
          focusByKey(target, code, event.shiftKey);
          break;
        case 27:
          // Escape that cancels an IME composition is not a close.
          if (isImeComposition(event)) break;
          event.preventDefault();
          focusAndClose();
          break;
        case 8:
        case 46:
          if (isInput && !allowInput) {
            event.preventDefault();
            clear();
          }
          break;
        case 37:
        case 39:
          if (isGridMode) break;
          if (!isInput) {
            event.preventDefault();
            const active = /** @type {HTMLElement} */ (document.activeElement);
            if (allowInput === false || (active && isDayFocused(active))) {
              const delta = inlineStep(code, isRtl());
              if (event.ctrlKey) {
                event.stopPropagation();
                focusFirstOpenDayOfMonth(
                  new Date(self.currentYear, self.currentMonth + delta, 1),
                );
              } else {
                focusOnDay(undefined, delta);
              }
            }
          }
          break;
        case 38:
        case 40: {
          if (isGridMode) break;
          event.preventDefault();
          const delta = code === 40 ? 1 : -1;
          if (target.$i !== undefined || isInput) {
            if (event.ctrlKey) {
              event.stopPropagation();
              focusFirstOpenDayOfMonth(
                new Date(self.currentYear - delta, self.currentMonth, 1),
              );
            } else {
              focusOnDay(undefined, delta * 7);
            }
          } else if (target === self.currentYearElement) {
            changeYear(self.currentYear - delta);
          }
          break;
        }
        case 9:
          if (
            !isGridMode &&
            self.daysContainer?.contains(target) &&
            event.shiftKey
          ) {
            event.preventDefault();
            // Back to the preset rail, which sits before the grid.
            const stop = self.presetsElement?.querySelector("[tabindex='0']");
            (stop ?? self._input).focus();
          }
          break;
        default:
          break;
      }
    }
    if (isGridMode && (inCalendar || isInput)) onGridKeyDown(event);
    if (isInput || inCalendar) triggerEvent("onKeyDown", event);
  }

  /**
   * PageUp/PageDown move to the same day a month (with Shift, a year) away,
   * or the month's last day when it is shorter. Home/End move to the
   * first/last day of the week. A closed day steps on, as the arrows do.
   *
   * @param {any} day
   * @param {number} code
   * @param {boolean} shiftKey
   */
  function focusByKey(day, code, shiftKey) {
    const from = day.dateObj;
    let target;
    if (code === 33 || code === 34) {
      const months = (code === 34 ? 1 : -1) * (shiftKey ? 12 : 1);
      const month = new Date(from.getFullYear(), from.getMonth() + months, 1);
      target = new Date(
        month.getFullYear(),
        month.getMonth(),
        Math.min(
          from.getDate(),
          daysInMonth(month.getFullYear(), month.getMonth()),
        ),
      );
    } else {
      const offset = (from.getDay() - self.l10n.firstDayOfWeek + 7) % 7;
      target = new Date(
        from.getFullYear(),
        from.getMonth(),
        from.getDate() + (code === 36 ? -offset : 6 - offset),
      );
    }
    const delta = Math.round(
      (Date.UTC(target.getFullYear(), target.getMonth(), target.getDate()) -
        Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())) /
        DAY_MS,
    );
    if (delta !== 0) nextAvailableDay(day, delta);
  }

  /** @param {KeyboardEvent} event */
  function onGridKeyDown(event) {
    let code = keyCodeOf(event);
    // Space picks like Enter; PageUp/PageDown step the year (or decade).
    if (code === 32) code = 13;
    const page = code === 33 ? -1 : code === 34 ? 1 : 0;
    const shift =
      code === 37 || code === 39
        ? inlineStep(code, isRtl())
        : /** @type {Record<number, number>} */ (GRID_SHIFTS)[code];
    if (shift === undefined && code !== 13 && !page) return;
    if (code !== keyCodeOf(event) || page) event.preventDefault();
    let cells = self.days?.children;
    if (!cells) return;
    let index = Array.prototype.indexOf.call(cells, document.activeElement);
    if (index === -1) {
      const target =
        self.daysContainer.querySelector(
          ".bx--date-picker__grid-cell--selected",
        ) ?? cells[0];
      target.focus();
      index = target.$i;
    }
    if (page) {
      stepView(/** @type {-1 | 1} */ (page));
      cells = self.days?.children;
      cells?.[index]?.focus();
    } else if (shift !== undefined) {
      // Up and down move a row: three cells, or two for quarters.
      const step =
        isQuarter && Math.abs(shift) === 3 ? Math.sign(shift) * 2 : shift;
      const count = cells.length;
      cells[(count + index + step) % count].focus();
    } else if (cells[0].parentNode.contains(document.activeElement)) {
      const active = /** @type {any} */ (document.activeElement);
      if (!active.classList.contains("bx--date-picker__grid-cell--disabled")) {
        setGridDate(active.dateObj);
        if (config.closeOnSelect) self.close();
      }
    }
  }

  /**
   * Applies what was typed in an input. Range inputs each edit one end.
   *
   * @param {HTMLInputElement} input
   */
  function commitTypedValue(input) {
    const format = config.altInput ? config.altFormat : config.dateFormat;
    if (secondInput) {
      if (input === secondInput) {
        self.setDate([self.selectedDates[0], secondInput.value], true, format);
      } else {
        self.setDate([self._input.value, self.selectedDates[1]], true, format);
      }
    } else {
      self.setDate(
        input.value,
        true,
        input === self.altInput ? config.altFormat : config.dateFormat,
      );
    }
  }

  /** @param {FocusEvent} event */
  function onBlur(event) {
    const target = eventTarget(event);
    if (target !== self._input || secondInput) return;
    const changed = self._input.value.trimEnd() !== dateString();
    const related = event.relatedTarget;
    if (
      changed &&
      !(related instanceof Node && self.calendarContainer.contains(related))
    ) {
      self.setDate(
        self._input.value,
        true,
        target === self.altInput ? config.altFormat : config.dateFormat,
      );
    }
  }

  /**
   * What the previous and next arrows do: a month, a year in the month
   * grid, or a decade in the year grid.
   *
   * @param {-1 | 1} direction
   */
  function stepView(direction) {
    const prev = direction < 0;
    if (pickerMode === "year") {
      changeYear(decadeStart() + direction * 10);
    } else if (isYearView) {
      const wanted = self.currentYear + direction;
      if (!(prev ? self._hidePrevMonthArrow : self._hideNextMonthArrow)) {
        changeYear(wanted);
        if (self.currentYear === wanted) buildDays();
      }
    } else {
      changeMonth(direction);
    }
  }

  /** @param {MouseEvent} event */
  function onNavClick(event) {
    const target = eventTarget(event);
    const prev = self.prevMonthNav.contains(target);
    const next = self.nextMonthNav.contains(target);
    if (prev || next) {
      const button = prev ? self.prevMonthNav : self.nextMonthNav;
      if (button.hasAttribute("aria-disabled")) return;
      stepView(prev ? -1 : 1);
    } else if (self.yearElements.includes(target)) {
      target.select();
    } else if (target.classList.contains("bx--date-picker__year-step--up")) {
      changeYear(self.currentYear + 1);
    } else if (target.classList.contains("bx--date-picker__year-step--down")) {
      changeYear(self.currentYear - 1);
    }
  }

  /** @param {Event} event */
  /**
   * A typed year, or flatpickr's `increment` event, which carries a `delta`
   * (its scroll plugin sends one on wheel).
   *
   * @param {KeyboardEvent & { delta?: number }} event
   */
  function onYearInput(event) {
    const target = eventTarget(event);
    const year = Number.parseInt(target.value, 10) + (event.delta || 0);
    if (!Number.isNaN(year) && (event.delta || target.value.length >= 4)) {
      changeYear(year);
    }
  }

  function bindEvents() {
    /**
     * @param {EventTarget | undefined} target
     * @param {string} type
     * @param {(event: any) => void} handler
     */
    const on = (target, type, handler) => {
      if (target) listeners.add(target, type, handler);
    };
    on(self._input, "keydown", onKeyDown);
    on(secondInput, "keydown", onKeyDown);
    if (!filled) {
      // Pre-warm: build the calendar as the pointer reaches an input, so a
      // click opens one that already exists. Keyboard focus opens it, and
      // `open()` builds it first anyway.
      on(self._input, "pointerenter", fillContents);
      on(secondInput, "pointerenter", fillContents);
    }
    on(self.calendarContainer, "keydown", onKeyDown);
    if (config.allowInput) on(self._input, "blur", onBlur);
    bindOpenTriggers();
    if (secondInput) {
      on(self._input, "focus", () => {
        self.latestSelectedDateObj = self.selectedDates[0];
        secondFocused = false;
        // Show the start's month, unless it already is: focus returns here
        // after every range pick, and a jump rebuilds the grid.
        const [start] = self.selectedDates;
        if (start && !isMonthShown(start)) jumpToDate(start);
      });
    }
  }

  /** Listeners on the header and grid, bound once they are built. */
  function bindContentEvents() {
    /**
     * @param {EventTarget | undefined} target
     * @param {string} type
     * @param {(event: any) => void} handler
     */
    const on = (target, type, handler) => {
      if (target) listeners.add(target, type, handler);
    };
    on(self.monthNav, "click", onNavClick);
    on(self.monthNav, "keyup", onYearInput);
    on(self.monthNav, "increment", onYearInput);
    on(self.monthNav, "input", onYearInput);
    on(self.daysContainer, "click", isGridMode ? selectGridCell : selectDate);
    if (hasPresetRail) on(self.calendarContainer, "click", onPresetClick);
    if (isRange) {
      on(self.daysContainer, "mouseover", (event) =>
        previewRange(eventTarget(event)),
      );
    } else if (pickerMode === "week") {
      on(self.daysContainer, "mouseover", hoverWeek);
      on(self.daysContainer, "mouseleave", clearWeekHover);
    }
  }

  // --- Lifecycle --------------------------------------------------------

  function destroy() {
    if (self.config !== undefined) triggerEvent("onDestroy");
    listeners.clear();
    triggerListeners.clear();
    openListeners.clear();
    clearTimeout(resizeTimer);
    self.calendarContainer?.remove();
    // Unwrap the field, wherever `static` left the calendar.
    if (anchor?.parentNode) {
      while (anchor.firstChild) {
        anchor.parentNode.insertBefore(anchor.firstChild, anchor);
      }
      anchor.remove();
    }
    anchor = undefined;
    if (self.altInput) {
      self.input.type = "text";
      self.altInput.parentNode?.removeChild(self.altInput);
      self.altInput = undefined;
    }
    if (secondInput) /** @type {any} */ (secondInput)._flatpickr = undefined;
    self.input.type = self.input._type;
    self.input.removeAttribute("readonly");
    self.input._flatpickr = undefined;
    for (const key of [
      "config",
      "calendarContainer",
      "daysContainer",
      "days",
      "monthNav",
      "rContainer",
      "weekdayContainer",
      "selectedDateElem",
      "todayDateElem",
      "_input",
      "_positionElement",
    ]) {
      self[key] = undefined;
    }
  }
  self.destroy = destroy;

  // --- Init -------------------------------------------------------------

  built = true;
  try {
    build();
    bindEvents();
    if (self.selectedDates.length || secondInput) updateValue(false);
  } catch (error) {
    // A consumer callback (`formatDate`, `onDayCreate`) can throw mid-build.
    // Take down what was built so the input is left as it was.
    destroy();
    throw error;
  }
  self.input._flatpickr = self;
  if (secondInput) /** @type {any} */ (secondInput)._flatpickr = self;
  triggerEvent("onReady");
  return self;
}
