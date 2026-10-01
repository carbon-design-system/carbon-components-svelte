// @ts-check
import {
  compareDays,
  DAY_MS,
  daysInMonth,
  formatDate,
  getCalendarLocale,
  isMonthFirst,
  isoWeek,
  parseDate,
} from "./calendar-dates.js";

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
  ArrowLeft: 37,
  ArrowUp: 38,
  ArrowRight: 39,
  ArrowDown: 40,
  Delete: 46,
};

/** Months and years are picked in a 3-wide grid of 12 cells. */
const GRID_SHIFTS = { 37: -1, 39: 1, 40: 3, 38: -3 };

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
 * with the single/multiple/range/week/month/year modes built in rather than
 * layered on as plugins.
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
    altInputClass: "form-control input",
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
    plugins: [],
    position: "auto",
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

  /** @param {Record<string, any>} options */
  function applyConfig(options) {
    // The locale must be in place before date rules and bounds are parsed.
    if (options.locale !== undefined) config.locale = options.locale;
    self.l10n = getCalendarLocale(config.locale);
    // Rules and bounds are parsed with `dateFormat`, so they go last.
    const parsedLast = ["minDate", "maxDate", "enable", "disable"];
    for (const [key, value] of Object.entries(options)) {
      if (key !== "plugins" && !parsedLast.includes(key)) config[key] = value;
    }
    for (const key of parsedLast) {
      if (options[key] !== undefined) config[key] = options[key];
    }
  }

  applyConfig(userConfig);
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
  const isGridMode = pickerMode === "month" || pickerMode === "year";
  const isRange = pickerMode === "range";
  const isMultiple = pickerMode === "multiple";
  config.pickerMode = pickerMode;
  if (isGridMode || pickerMode === "week") config.mode = "single";
  if (config.showMonths < 1 || isGridMode) config.showMonths = 1;
  config.showMonths = Math.floor(config.showMonths);

  for (const hook of HOOKS) {
    if (config[hook] !== undefined) {
      config[hook] = arrayify(config[hook] || []).map(
        (/** @type {Function} */ fn) => fn.bind(self),
      );
    }
  }
  for (const plugin of userConfig.plugins ?? []) {
    const pluginConfig = plugin(self) || {};
    for (const key of Object.keys(pluginConfig)) {
      if (HOOKS.includes(key)) {
        config[key] = arrayify(pluginConfig[key])
          .map((/** @type {Function} */ fn) => fn.bind(self))
          .concat(config[key] ?? []);
      } else if (userConfig[key] === undefined) {
        config[key] = pluginConfig[key];
      }
    }
  }
  if (!userConfig.altInputClass) {
    config.altInputClass = `${element.className} ${config.altInputClass}`;
  }
  triggerEvent("onParseConfig");

  // --- Inputs -----------------------------------------------------------

  /** @type {any} */ (element)._type = element.type;
  element.type = "text";
  element.classList.add("flatpickr-input");
  self._input = element;
  /** The second input of a range, when the consumer renders one. */
  /** @type {HTMLInputElement | undefined} */
  const secondInput = isRange ? config.secondInput : undefined;
  self.secondInput = secondInput;

  if (config.altInput) {
    const alt = createElement(element.nodeName, config.altInputClass);
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
  if (!config.allowInput) self._input.setAttribute("readonly", "readonly");
  if (secondInput) {
    if (config.allowInput) {
      self._input.removeAttribute("readonly");
      secondInput.removeAttribute("readonly");
    } else {
      secondInput.setAttribute("readonly", "readonly");
    }
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

  /** @param {Date} date */
  function selectedIndex(date) {
    return self.selectedDates.findIndex(
      (/** @type {unknown} */ d) =>
        d instanceof Date && compareDays(d, date) === 0,
    );
  }

  /** @param {Date} date */
  function isDateInRange(date) {
    return (
      isRange &&
      self.selectedDates.length === 2 &&
      compareDays(date, self.selectedDates[0]) >= 0 &&
      compareDays(date, self.selectedDates[1]) <= 0
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
    const nav = createElement("div", "flatpickr-months");
    self.monthNav = nav;
    self.prevMonthNav = createElement("span", "flatpickr-prev-month");
    self.prevMonthNav.innerHTML = config.prevArrow;
    self.nextMonthNav = createElement("span", "flatpickr-next-month");
    self.nextMonthNav.innerHTML = config.nextArrow;
    buildMonths();
    return nav;
  }

  function buildMonths() {
    self.monthNav.replaceChildren(self.prevMonthNav);
    self.yearElements = [];
    self.monthElements = [];
    for (let i = 0; i < config.showMonths; i++) {
      const month = createElement(
        "div",
        "flatpickr-month bx--date-picker__month",
      );
      const current = createElement("div", "flatpickr-current-month");
      if (!isGridMode) {
        const label = createElement("span", "cur-month");
        current.appendChild(label);
        self.monthElements.push(label);
      }
      const wrapper = createElement("div", "numInputWrapper");
      const year = createElement("input", "numInput cur-year");
      year.type = "number";
      year.tabIndex = -1;
      year.setAttribute("aria-label", "Year");
      wrapper.append(
        year,
        createElement("span", "arrowUp"),
        createElement("span", "arrowDown"),
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
        if (label && wrapper) {
          // Some locales put the year first ("2000年1月").
          if (isMonthFirst(config.locale)) {
            if (label.nextSibling !== wrapper) wrapper.before(label);
          } else if (wrapper.nextSibling !== label) {
            wrapper.after(label);
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
    } else if (pickerMode === "month") {
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
    toggleClass(self.prevMonthNav, "flatpickr-disabled", hidePrev);
    toggleClass(self.nextMonthNav, "flatpickr-disabled", hideNext);
  }

  function buildWeekdays() {
    self.weekdayContainer ??= createElement(
      "div",
      "flatpickr-weekdays bx--date-picker__weekdays",
    );
    const { shorthand } = self.l10n.weekdays;
    const first = self.l10n.firstDayOfWeek;
    const labels = [...shorthand.slice(first), ...shorthand.slice(0, first)];
    self.weekdayContainer.replaceChildren();
    for (let m = 0; m < config.showMonths; m++) {
      const group = createElement("div", "flatpickr-weekdaycontainer");
      for (const label of labels) {
        group.appendChild(
          createElement(
            "span",
            "flatpickr-weekday bx--date-picker__weekday",
            label,
          ),
        );
      }
      self.weekdayContainer.appendChild(group);
    }
    return self.weekdayContainer;
  }

  /**
   * @param {string} className
   * @param {Date} date
   * @param {number} index
   */
  function createDay(className, date, index) {
    const enabled = isEnabled(date, true);
    const day = createElement(
      "span",
      `${className} bx--date-picker__day`,
      String(date.getDate()),
    );
    day.dateObj = date;
    day.$i = index;
    day.setAttribute(
      "aria-label",
      self.formatDate(date, config.ariaDateFormat),
    );
    if (!className.includes("hidden") && compareDays(date, self.now) === 0) {
      self.todayDateElem = day;
      day.classList.add("today");
      day.setAttribute("aria-current", "date");
    }
    if (enabled) {
      day.tabIndex = -1;
      if (selectedIndex(date) !== -1) {
        day.classList.add("selected");
        self.selectedDateElem = day;
        if (isRange) {
          toggleClass(
            day,
            "startRange",
            self.selectedDates[0] &&
              compareDays(date, self.selectedDates[0]) === 0,
          );
          toggleClass(
            day,
            "endRange",
            self.selectedDates[1] &&
              compareDays(date, self.selectedDates[1]) === 0,
          );
          if (className === "nextMonthDay") day.classList.add("inRange");
        }
      }
    } else {
      // axe only exempts inactive text from the contrast check when it is
      // marked `aria-disabled`, not by a CSS class.
      day.classList.add("flatpickr-disabled");
      day.setAttribute("aria-disabled", "true");
    }
    if (isDateInRange(date) && selectedIndex(date) === -1) {
      day.classList.add("inRange");
    }
    if (
      self.weekNumbers &&
      config.showMonths === 1 &&
      className !== "prevMonthDay" &&
      index % 7 === 6
    ) {
      self.weekNumbers.appendChild(
        createElement("span", "flatpickr-day", String(config.getWeek(date))),
      );
    }
    triggerEvent("onDayCreate", day);
    return day;
  }
  self.createDay = (
    /** @type {string} */ className,
    /** @type {Date} */ date,
    /** @type {number} */ _number,
    /** @type {number} */ index,
  ) => createDay(className, date, index);

  /**
   * @param {number} year
   * @param {number} month
   */
  function buildMonthDays(year, month) {
    const offset =
      (new Date(year, month, 1).getDay() - self.l10n.firstDayOfWeek + 7) % 7;
    const prevDays = daysInMonth(year, month - 1);
    const days = daysInMonth(year, month);
    const multi = config.showMonths > 1;
    const prevClass = multi ? "prevMonthDay hidden" : "prevMonthDay";
    const nextClass = multi ? "nextMonthDay hidden" : "nextMonthDay";
    const fragment = document.createDocumentFragment();
    let index = 0;
    for (let n = prevDays + 1 - offset; n <= prevDays; n++, index++) {
      fragment.appendChild(
        createDay(
          `flatpickr-day ${prevClass}`,
          new Date(year, month - 1, n),
          index,
        ),
      );
    }
    for (let n = 1; n <= days; n++, index++) {
      fragment.appendChild(
        createDay("flatpickr-day", new Date(year, month, n), index),
      );
    }
    for (
      let n = days + 1;
      n <= 42 - offset && (config.showMonths === 1 || index % 7 !== 0);
      n++, index++
    ) {
      fragment.appendChild(
        createDay(
          `flatpickr-day ${nextClass}`,
          new Date(year, month + 1, n % days),
          index,
        ),
      );
    }
    const container = createElement("div", "dayContainer");
    container.appendChild(fragment);
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
    const className = isYear
      ? "flatpickr-yearSelect-year"
      : "flatpickr-monthSelect-month";
    const container = createElement(
      "div",
      isYear ? "flatpickr-yearSelect-years" : "flatpickr-monthSelect-months",
    );
    container.tabIndex = -1;
    const start = decadeStart() - 1;
    const now = new Date();
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 12; i++) {
      const date = isYear
        ? new Date(start + i, 0, 1)
        : new Date(self.currentYear, i);
      const cell = createDay(className, date, i);
      cell.classList.remove("flatpickr-disabled", "selected", "today");
      cell.removeAttribute("aria-current");
      cell.tabIndex = -1;
      const year = date.getFullYear();
      const outOfRange =
        (config._minDate &&
          (isYear
            ? year < config._minDate.getFullYear()
            : compareMonths(date, config._minDate) < 0)) ||
        (config._maxDate &&
          (isYear
            ? year > config._maxDate.getFullYear()
            : compareMonths(date, config._maxDate) > 0));
      if (outOfRange) {
        cell.classList.add(isYear ? "disabled" : "flatpickr-disabled");
        cell.setAttribute("aria-disabled", "true");
      }
      const target = self.selectedDates[0];
      if (
        target &&
        target.getFullYear() === year &&
        (isYear || target.getMonth() === i)
      ) {
        cell.classList.add("selected");
        self.selectedDateElem = cell;
      }
      if (
        year === now.getFullYear() &&
        (isYear || date.getMonth() === now.getMonth())
      ) {
        cell.classList.add("today");
        cell.setAttribute("aria-current", "date");
        self.todayDateElem = cell;
      }
      if (isYear) {
        cell.textContent = String(year);
        cell.setAttribute("data-year", String(year));
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
    for (const day of self.daysContainer.querySelectorAll(".flatpickr-day")) {
      const time = day.dateObj.getTime();
      // Compare by day so a daylight-saving hour cannot drop an edge day.
      if (time >= start - DAY_MS / 2 && time < end - DAY_MS / 2) {
        day.classList.add("week", "selected");
      }
    }
  }

  /** @param {Event} event */
  function hoverWeek(event) {
    const day = eventTarget(event).closest?.(".flatpickr-day");
    if (!day?.dateObj) return;
    const start = weekStartOf(day.dateObj).getTime();
    for (const cell of self.daysContainer.querySelectorAll(".flatpickr-day")) {
      const time = cell.dateObj.getTime();
      toggleClass(
        cell,
        "inRange",
        time >= start - DAY_MS / 2 && time < start + 7 * DAY_MS - DAY_MS / 2,
      );
    }
  }

  function clearWeekHover() {
    for (const day of self.daysContainer?.querySelectorAll(".inRange") ?? []) {
      day.classList.remove("inRange");
    }
  }

  // --- Range preview ----------------------------------------------------

  /** @param {HTMLElement} [hovered] */
  function previewRange(hovered) {
    if (
      self.selectedDates.length !== 1 ||
      (hovered &&
        (!hovered.classList.contains("flatpickr-day") ||
          hovered.classList.contains("flatpickr-disabled")))
    ) {
      return;
    }
    const anchor = self.selectedDates[0].getTime();
    const hover = hovered
      ? /** @type {any} */ (hovered).dateObj.getTime()
      : self.days.firstElementChild.dateObj.getTime();
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
      `*:nth-child(-n+${config.showMonths}) > .flatpickr-day`,
    );
    for (const cell of cells) {
      const time = cell.dateObj.getTime();
      const blocked =
        (minAllowed > 0 && time < minAllowed) ||
        (maxAllowed > 0 && time > maxAllowed);
      if (blocked) {
        cell.classList.add("notAllowed");
        cell.classList.remove("inRange", "startRange", "endRange");
        continue;
      }
      if (containsDisabled) continue;
      cell.classList.remove("startRange", "inRange", "endRange", "notAllowed");
      if (hovered) {
        hovered.classList.add(hover <= anchor ? "startRange" : "endRange");
        if (anchor < hover && time === anchor) cell.classList.add("startRange");
        else if (anchor > hover && time === anchor)
          cell.classList.add("endRange");
        if (
          time >= minAllowed &&
          (maxAllowed === 0 || time <= maxAllowed) &&
          time > Math.min(anchor, hover) &&
          time < Math.max(anchor, hover)
        ) {
          cell.classList.add("inRange");
        }
      }
    }
  }
  self.onMouseOver = previewRange;

  // --- Build ------------------------------------------------------------

  function build() {
    const container = createElement(
      "div",
      "flatpickr-calendar bx--date-picker__calendar",
    );
    self.calendarContainer = container;
    container.tabIndex = -1;
    const fragment = document.createDocumentFragment();
    fragment.appendChild(buildMonthNav());
    self.innerContainer = createElement("div", "flatpickr-innerContainer");
    if (config.weekNumbers) {
      const wrapper = createElement("div", "flatpickr-weekwrapper");
      wrapper.appendChild(createElement("span", "flatpickr-weekday", "Wk"));
      self.weekNumbers = createElement("div", "flatpickr-weeks");
      wrapper.appendChild(self.weekNumbers);
      self.innerContainer.appendChild(wrapper);
      self.weekWrapper = wrapper;
    }
    self.rContainer = createElement("div", "flatpickr-rContainer");
    if (pickerMode === "year") {
      // The decade label stands in for the month and year inputs.
      self.yearRangeElement = createElement(
        "span",
        "flatpickr-yearSelect-range",
      );
      self.monthNav
        .querySelector(".flatpickr-current-month")
        .replaceChildren(self.yearRangeElement);
      self.yearElements = [];
    } else if (!isGridMode) {
      self.rContainer.appendChild(buildWeekdays());
    }
    self.daysContainer = createElement(
      "div",
      "flatpickr-days bx--date-picker__days",
    );
    self.daysContainer.tabIndex = -1;
    self.rContainer.appendChild(self.daysContainer);
    self.innerContainer.appendChild(self.rContainer);
    fragment.appendChild(self.innerContainer);
    toggleClass(container, "rangeMode", isRange);
    toggleClass(container, "animate", config.animate === true);
    toggleClass(container, "multiMonth", config.showMonths > 1);
    // Marker classes so CSS can target the shorter month/year grids.
    toggleClass(
      container,
      "bx--date-picker__calendar--month",
      pickerMode === "month",
    );
    toggleClass(
      container,
      "bx--date-picker__calendar--year",
      pickerMode === "year",
    );
    if (isGridMode) {
      container.classList.add(`flatpickr-${pickerMode}Select-theme-light`);
    }
    container.appendChild(fragment);
    buildDays();
    updateNavigation();

    const custom = config.appendTo?.nodeType !== undefined;
    if (config.inline || config.static) {
      container.classList.add(config.inline ? "inline" : "static");
      if (config.inline) {
        if (!custom && element.parentNode) {
          element.parentNode.insertBefore(container, self._input.nextSibling);
        } else if (config.appendTo) {
          config.appendTo.appendChild(container);
        }
      }
      if (config.static) {
        const wrapper = createElement("div", "flatpickr-wrapper");
        element.parentNode?.insertBefore(wrapper, element);
        wrapper.appendChild(element);
        if (self.altInput) wrapper.appendChild(self.altInput);
        wrapper.appendChild(container);
      }
    }
    if (!config.static && !config.inline) {
      (config.appendTo ?? document.body).appendChild(container);
    }
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

  function redraw() {
    updateNavigation();
    buildDays();
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
        target.classList?.contains("flatpickr-day") &&
        !target.classList.contains("flatpickr-disabled") &&
        !target.classList.contains("notAllowed")
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
    buildDays();
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
    const cell = eventTarget(event).closest?.(
      ".flatpickr-monthSelect-month, .flatpickr-yearSelect-year",
    );
    if (!cell) return;
    event.preventDefault();
    event.stopPropagation();
    if (
      cell.classList.contains("flatpickr-disabled") ||
      cell.classList.contains("disabled")
    ) {
      return;
    }
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
    if (pickerMode === "month") buildDays();
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

  /** @type {Record<string, Array<() => void>>} */
  const CALLBACKS = {
    locale: [
      () => {
        self.l10n = getCalendarLocale(config.locale);
        if (self.weekdayContainer) buildWeekdays();
      },
    ],
    showMonths: [buildMonths, buildWeekdays],
    minDate: [() => jumpToDate()],
    maxDate: [() => jumpToDate()],
    positionElement: [
      () => {
        self._positionElement = config.positionElement || self._input;
      },
    ],
    clickOpens: [bindOpenTriggers],
  };

  /**
   * @param {string | Record<string, unknown>} option
   * @param {unknown} [value]
   */
  function set(option, value) {
    if (option !== null && typeof option === "object") {
      Object.assign(config, option);
      for (const key of Object.keys(option)) {
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
    self.isOpen = true;
    if (!wasOpen) {
      self.calendarContainer.classList.add("open");
      self._input.classList.add("active");
      bindOpenListeners();
      triggerEvent("onOpen");
      positionCalendar(positionElement);
    }
  }
  self.open = open;

  function close() {
    self.isOpen = false;
    if (self.calendarContainer) self.calendarContainer.classList.remove("open");
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
    let height = 0;
    for (const child of /** @type {HTMLElement[]} */ ([
      ...container.children,
    ])) {
      height += child.offsetHeight;
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
    let left = window.pageXOffset + bounds.left;
    const center = horizontal === "center";
    const right = horizontal === "right";
    if (center) left -= (width - bounds.width) / 2;
    else if (right) left -= width - bounds.width;
    toggleClass(container, "arrowLeft", !center && !right);
    toggleClass(container, "arrowCenter", center);
    toggleClass(container, "arrowRight", right);
    const bodyWidth = document.body.offsetWidth;
    const rightEdge = bodyWidth - (window.pageXOffset + bounds.right);
    const rightMost = left + width > bodyWidth;
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

  /** @param {HTMLElement} node */
  function isInView(node) {
    return (
      self.daysContainer !== undefined &&
      node.className.includes("hidden") === false &&
      node.className.includes("flatpickr-disabled") === false &&
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
      const month = self.daysContainer.children[m];
      const start = delta > 0 ? 0 : month.children.length - 1;
      const end = delta > 0 ? month.children.length : -1;
      for (let i = start; i !== end; i += delta) {
        const cell = month.children[i];
        if (!cell.className.includes("hidden") && isEnabled(cell.dateObj)) {
          return cell;
        }
      }
    }
    return undefined;
  }

  /** @param {any} current @param {number} delta */
  function nextAvailableDay(current, delta) {
    const given = current.className.includes("Month")
      ? self.currentMonth
      : current.dateObj.getMonth();
    const endMonth = delta > 0 ? config.showMonths : -1;
    const step = delta > 0 ? 1 : -1;
    for (let m = given - self.currentMonth; m !== endMonth; m += step) {
      const month = self.daysContainer.children[m];
      const start =
        given - self.currentMonth === m
          ? current.$i + delta
          : delta < 0
            ? month.children.length - 1
            : 0;
      const count = month.children.length;
      for (let i = start; i >= 0 && i < count; i += step) {
        const cell = month.children[i];
        if (
          !cell.className.includes("hidden") &&
          isEnabled(cell.dateObj) &&
          Math.abs(current.$i - i) >= Math.abs(delta)
        ) {
          return focusDay(cell);
        }
      }
    }
    changeMonth(step);
    focusOnDay(firstAvailableDay(step), 0);
  }

  /** @param {any} current @param {number} offset */
  function focusOnDay(current, offset) {
    const active = /** @type {HTMLElement} */ (document.activeElement);
    const dayFocused = isInView(active || document.body);
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
        case 27:
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
            if (allowInput === false || (active && isInView(active))) {
              const delta = code === 39 ? 1 : -1;
              if (event.ctrlKey) {
                event.stopPropagation();
                changeMonth(delta);
                focusOnDay(firstAvailableDay(1), 0);
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
              changeYear(self.currentYear - delta);
              focusOnDay(firstAvailableDay(1), 0);
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
            self._input.focus();
          }
          break;
        default:
          break;
      }
    }
    if (isGridMode && (inCalendar || isInput)) onGridKeyDown(event);
    if (isInput || inCalendar) triggerEvent("onKeyDown", event);
  }

  /** @param {KeyboardEvent} event */
  function onGridKeyDown(event) {
    const code = keyCodeOf(event);
    const shift = /** @type {Record<number, number>} */ (GRID_SHIFTS)[code];
    if (shift === undefined && code !== 13) return;
    const cells = self.days?.children;
    if (!cells) return;
    let index = Array.prototype.indexOf.call(cells, document.activeElement);
    if (index === -1) {
      const target = self.daysContainer.querySelector(".selected") ?? cells[0];
      target.focus();
      index = target.$i;
    }
    if (shift !== undefined) {
      cells[(12 + index + shift) % 12].focus();
    } else if (cells[0].parentNode.contains(document.activeElement)) {
      const active = /** @type {any} */ (document.activeElement);
      if (
        !active.classList.contains("disabled") &&
        !active.classList.contains("flatpickr-disabled")
      ) {
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

  /** @param {MouseEvent} event */
  function onNavClick(event) {
    const target = eventTarget(event);
    const prev = self.prevMonthNav.contains(target);
    const next = self.nextMonthNav.contains(target);
    if (prev || next) {
      if (pickerMode === "year") {
        changeYear(decadeStart() + (prev ? -10 : 10));
      } else if (pickerMode === "month") {
        const wanted = self.currentYear + (prev ? -1 : 1);
        if (!(prev ? self._hidePrevMonthArrow : self._hideNextMonthArrow)) {
          changeYear(wanted);
          if (self.currentYear === wanted) buildDays();
        }
      } else {
        changeMonth(prev ? -1 : 1);
      }
    } else if (self.yearElements.includes(target)) {
      target.select();
    } else if (target.classList.contains("arrowUp")) {
      changeYear(self.currentYear + 1);
    } else if (target.classList.contains("arrowDown")) {
      changeYear(self.currentYear - 1);
    }
  }

  /** @param {Event} event */
  function onYearInput(event) {
    const target = eventTarget(event);
    const year = Number.parseInt(target.value, 10);
    if (!Number.isNaN(year) && target.value.length >= 4) {
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
    on(self.calendarContainer, "keydown", onKeyDown);
    if (config.allowInput) on(self._input, "blur", onBlur);
    bindOpenTriggers();
    if (secondInput) {
      on(self._input, "focus", () => {
        self.latestSelectedDateObj = self.selectedDates[0];
        secondFocused = false;
        if (self.selectedDates[0]) jumpToDate(self.selectedDates[0]);
      });
    }
    on(self.monthNav, "click", onNavClick);
    on(self.monthNav, "keyup", onYearInput);
    on(self.monthNav, "input", onYearInput);
    on(self.daysContainer, "click", isGridMode ? selectGridCell : selectDate);
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
    const container = self.calendarContainer;
    if (container?.parentNode) {
      if (config.static) {
        const wrapper = container.parentNode;
        if (wrapper.lastChild) wrapper.removeChild(wrapper.lastChild);
        if (wrapper.parentNode) {
          while (wrapper.firstChild) {
            wrapper.parentNode.insertBefore(wrapper.firstChild, wrapper);
          }
          wrapper.parentNode.removeChild(wrapper);
        }
      } else {
        container.parentNode.removeChild(container);
      }
    }
    if (self.altInput) {
      self.input.type = "text";
      self.altInput.parentNode?.removeChild(self.altInput);
      self.altInput = undefined;
    }
    if (secondInput) /** @type {any} */ (secondInput)._flatpickr = undefined;
    self.input.type = self.input._type;
    self.input.classList.remove("flatpickr-input");
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
  build();
  bindEvents();
  if (self.selectedDates.length || secondInput) updateValue(false);
  self.input._flatpickr = self;
  if (secondInput) /** @type {any} */ (secondInput)._flatpickr = self;
  triggerEvent("onReady");
  return self;
}
