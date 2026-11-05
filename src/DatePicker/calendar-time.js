// @ts-check

/**
 * @typedef {"hour" | "minute" | "second"} TimeGranularity
 * @typedef {"12" | "24"} HourCycle
 * @typedef {{ hours: number; minutes: number; seconds: number }} TimeParts
 */

const TIME_TOKENS = new Set(["H", "G", "h", "i", "S", "s", "K"]);
const TWELVE_HOUR_TOKENS = /[hGK]/;
const DIGIT = /^\d$/;

/**
 * Whether `format` writes a time: an unescaped hour, minute, second, or
 * AM/PM token.
 *
 * @param {string} format
 */
export function hasTimeToken(format) {
  for (let i = 0; i < format.length; i++) {
    if (format[i] === "\\") i++;
    else if (TIME_TOKENS.has(format[i])) return true;
  }
  return false;
}

/**
 * The clock a time row shows. An explicit `hourFormat` wins; `"auto"`
 * follows a time already in `dateFormat`, else the locale's own clock.
 *
 * @param {"auto" | HourCycle} hourFormat
 * @param {string} dateFormat
 * @param {unknown} locale
 * @returns {HourCycle}
 */
export function resolveHourCycle(hourFormat, dateFormat, locale) {
  if (hourFormat === "12" || hourFormat === "24") return hourFormat;
  if (hasTimeToken(dateFormat)) {
    let unescaped = "";
    for (let i = 0; i < dateFormat.length; i++) {
      if (dateFormat[i] === "\\") i++;
      else unescaped += dateFormat[i];
    }
    return TWELVE_HOUR_TOKENS.test(unescaped) ? "12" : "24";
  }
  const tag =
    typeof locale === "string" && locale !== "default" ? locale : "en";
  try {
    const { hourCycle } = new Intl.DateTimeFormat(tag, {
      hour: "numeric",
    }).resolvedOptions();
    return hourCycle === "h11" || hourCycle === "h12" ? "12" : "24";
  } catch {
    return "12";
  }
}

/**
 * The time a row writes after the date: `h:i K` or `H:i`, with seconds for
 * the `"second"` granularity. The `"hour"` granularity keeps the minutes,
 * which stay at `00`.
 *
 * @param {TimeGranularity} granularity
 * @param {HourCycle} hourCycle
 */
export function timeFormat(granularity, hourCycle) {
  const seconds = granularity === "second" ? ":S" : "";
  return hourCycle === "12" ? `h:i${seconds} K` : `H:i${seconds}`;
}

/**
 * The format the calendar reads and writes: `dateFormat`, plus a time when
 * the row is on and `dateFormat` has none of its own.
 *
 * @param {string} dateFormat
 * @param {TimeGranularity | undefined} granularity
 * @param {HourCycle} hourCycle
 */
export function effectiveDateFormat(dateFormat, granularity, hourCycle) {
  if (!granularity || hasTimeToken(dateFormat)) return dateFormat;
  return `${dateFormat} ${timeFormat(granularity, hourCycle)}`;
}

const TIME_STRING = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;

/**
 * Reads a 24-hour `"HH:mm"` or `"HH:mm:ss"`.
 *
 * @param {unknown} text
 * @returns {TimeParts | undefined}
 */
export function parseTimeString(text) {
  const match = typeof text === "string" ? TIME_STRING.exec(text.trim()) : null;
  if (!match) return undefined;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] ?? 0);
  if (hours > 23 || minutes > 59 || seconds > 59) return undefined;
  return { hours, minutes, seconds };
}

/** @param {Date} date @returns {TimeParts} */
export function timeOf(date) {
  return {
    hours: date.getHours(),
    minutes: date.getMinutes(),
    seconds: date.getSeconds(),
  };
}

/**
 * `date`'s day at `time`. Snaps the parts the row does not show: seconds
 * below `"second"`, minutes too for `"hour"`.
 *
 * @param {Date} date
 * @param {TimeParts} time
 * @param {TimeGranularity} [granularity]
 */
export function withTime(date, time, granularity = "second") {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    time.hours,
    granularity === "hour" ? 0 : time.minutes,
    granularity === "second" ? time.seconds : 0,
  );
}

/**
 * Whether `date`'s day has the clock time `time`. A day that skips an hour
 * for daylight saving time has no 2:30 AM, so `new Date` moves it on.
 *
 * @param {Date} date
 * @param {TimeParts} time
 */
export function isTimeOnDay(date, time) {
  const moved = withTime(date, time);
  return moved.getHours() === time.hours && moved.getMinutes() === time.minutes;
}

/** @param {number} value */
const pad = (value) => String(value).padStart(2, "0");

/**
 * @typedef {{
 *   label: string;
 *   granularity: TimeGranularity;
 *   hourCycle: HourCycle;
 *   minuteStep: number;
 *   l10n: import("./calendar-dates.js").CalendarLocale;
 *   idPrefix: string;
 *   onChange: (time: TimeParts) => void;
 *   onEnter: () => void;
 *   isAllowed?: (time: TimeParts) => boolean;
 * }} TimeRowOptions
 */

/**
 * @typedef {{
 *   name: "hours" | "minutes" | "seconds";
 *   input: HTMLInputElement;
 *   buffer: string;
 * }} Segment
 */

/**
 * The time row under the calendar: hour, minute and second spinbuttons, and
 * an AM/PM select on a 12-hour clock. Values are kept on a 24-hour clock;
 * `onChange` gets each committed time.
 *
 * @param {TimeRowOptions} options
 */
export function createTimeRow(options) {
  const { granularity, hourCycle, l10n, idPrefix } = options;
  const twelve = hourCycle === "12";
  const minuteStep =
    Number.isInteger(options.minuteStep) &&
    options.minuteStep > 0 &&
    60 % options.minuteStep === 0
      ? options.minuteStep
      : 1;
  /** @type {TimeParts} */
  let time = { hours: 0, minutes: 0, seconds: 0 };

  const row = document.createElement("div");
  row.className = "bx--date-picker__time";
  row.setAttribute("role", "group");
  row.setAttribute("aria-label", options.label);

  // Digits and separators read left to right in every language.
  const fields = document.createElement("div");
  fields.className = "bx--date-picker__time-fields";
  fields.dir = "ltr";
  row.appendChild(fields);

  /** @type {Segment[]} */
  const segments = [];
  /**
   * @param {Segment["name"]} name
   * @param {string} label
   */
  function addSegment(name, label) {
    if (segments.length > 0) {
      const separator = document.createElement("span");
      separator.className = "bx--date-picker__time-separator";
      separator.setAttribute("aria-hidden", "true");
      separator.textContent = ":";
      fields.appendChild(separator);
    }
    const input = document.createElement("input");
    input.className = "bx--date-picker__time-input";
    input.type = "text";
    input.id = `${idPrefix}-${name}`;
    input.inputMode = "numeric";
    input.autocomplete = "off";
    input.maxLength = 2;
    input.setAttribute("role", "spinbutton");
    input.setAttribute("aria-label", label);
    fields.appendChild(input);
    segments.push({ name, input, buffer: "" });
  }
  addSegment("hours", l10n.hourAriaLabel ?? "Hours");
  if (granularity !== "hour") {
    addSegment("minutes", l10n.minuteAriaLabel ?? "Minutes");
  }
  if (granularity === "second") {
    addSegment("seconds", l10n.secondAriaLabel ?? "Seconds");
  }

  const amPM = l10n.amPM ?? ["AM", "PM"];
  /** @type {HTMLSelectElement | undefined} */
  let period;
  if (twelve) {
    const wrapper = document.createElement("div");
    wrapper.className = "bx--date-picker__time-period";
    period = document.createElement("select");
    period.className = "bx--date-picker__time-period-select";
    period.id = `${idPrefix}-period`;
    period.setAttribute("aria-label", l10n.periodAriaLabel ?? "AM/PM");
    for (const [index, text] of amPM.entries()) {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = text;
      period.appendChild(option);
    }
    wrapper.appendChild(period);
    row.appendChild(wrapper);
  }

  /**
   * The range and step of a segment, as shown: 1 to 12 for a 12-hour hour.
   *
   * @param {Segment["name"]} name
   */
  function bounds(name) {
    if (name === "hours") return twelve ? [1, 12, 1] : [0, 23, 1];
    return [0, 59, name === "minutes" ? minuteStep : 1];
  }

  /** The shown value of a segment. @param {Segment["name"]} name */
  function shown(name) {
    if (name !== "hours" || !twelve) return time[name];
    return time.hours % 12 || 12;
  }

  /**
   * The 24-hour time for a shown value of one segment.
   *
   * @param {Segment["name"]} name
   * @param {number} value
   * @returns {TimeParts}
   */
  function timeWith(name, value) {
    if (name !== "hours") return { ...time, [name]: value };
    const pm = time.hours >= 12;
    return {
      ...time,
      hours: twelve ? (value % 12) + (pm ? 12 : 0) : value,
    };
  }

  function render() {
    for (const segment of segments) {
      const [min, max] = bounds(segment.name);
      const value = shown(segment.name);
      segment.buffer = "";
      segment.input.value = pad(value);
      segment.input.setAttribute("aria-valuemin", String(min));
      segment.input.setAttribute("aria-valuemax", String(max));
      segment.input.setAttribute("aria-valuenow", String(value));
      if (segment.name === "hours" && twelve) {
        segment.input.setAttribute(
          "aria-valuetext",
          `${value} ${amPM[time.hours >= 12 ? 1 : 0]}`,
        );
      } else {
        segment.input.setAttribute("aria-valuetext", pad(value));
      }
    }
    if (period) period.value = time.hours >= 12 ? "1" : "0";
  }

  /** @param {TimeParts} next */
  function commit(next) {
    time = next;
    render();
    options.onChange({ ...time });
  }

  /**
   * Steps a segment by `delta` steps, wrapping at its ends and skipping
   * values that `isAllowed` rejects.
   *
   * @param {Segment} segment
   * @param {number} delta
   */
  function step(segment, delta) {
    const [min, max, size] = bounds(segment.name);
    const span = max - min + 1;
    const current = shown(segment.name);
    const snapped = current - ((current - min) % size);
    for (let n = 1; n <= Math.ceil(span / size); n++) {
      const next =
        ((((snapped - min + n * delta * size) % span) + span) % span) + min;
      const candidate = timeWith(segment.name, next);
      if (options.isAllowed?.(candidate) ?? true) {
        commit(candidate);
        return;
      }
    }
  }

  /**
   * Applies typed digits. Two digits, or one that no second digit could
   * extend, commit and move on to the next segment.
   *
   * @param {Segment} segment
   * @param {string} digit
   */
  function type(segment, digit) {
    const [min, max, size] = bounds(segment.name);
    const buffer = segment.buffer + digit;
    const value = Number(buffer);
    const complete = buffer.length === 2 || value * 10 > max;
    if (!complete) {
      segment.buffer = buffer;
      segment.input.value = buffer;
      return;
    }
    let next = Math.min(Math.max(value, min), max);
    next = Math.round(next / size) * size;
    if (next > max) next -= size;
    commit(timeWith(segment.name, next));
    const index = segments.indexOf(segment);
    (segments[index + 1]?.input ?? period)?.focus();
  }

  /** Commits a lone typed digit, as on blur. @param {Segment} segment */
  function flush(segment) {
    if (!segment.buffer) return;
    const [min, max] = bounds(segment.name);
    const value = Math.min(Math.max(Number(segment.buffer), min), max);
    segment.buffer = "";
    commit(timeWith(segment.name, value));
  }

  /** @param {KeyboardEvent} event */
  function onKeyDown(event) {
    const target = /** @type {HTMLElement} */ (event.target);
    const segment = segments.find((s) => s.input === target);
    if (event.key === "Enter") {
      if (segment) flush(segment);
      event.preventDefault();
      event.stopPropagation();
      options.onEnter();
      return;
    }
    if (!segment || event.altKey || event.ctrlKey || event.metaKey) return;
    const index = segments.indexOf(segment);
    /** @type {(() => void) | undefined} */
    let action;
    const [min, max, size] = bounds(segment.name);
    switch (event.key) {
      case "ArrowUp":
        action = () => step(segment, 1);
        break;
      case "ArrowDown":
        action = () => step(segment, -1);
        break;
      case "PageUp":
        action = () =>
          step(segment, segment.name === "hours" ? 6 : Math.ceil(10 / size));
        break;
      case "PageDown":
        action = () =>
          step(segment, segment.name === "hours" ? -6 : -Math.ceil(10 / size));
        break;
      case "Home":
        action = () => commit(timeWith(segment.name, min));
        break;
      case "End":
        action = () =>
          commit(timeWith(segment.name, max - ((max - min) % size)));
        break;
      case "ArrowLeft":
        action = () => {
          flush(segment);
          segments[index - 1]?.input.focus();
        };
        break;
      case "ArrowRight":
        action = () => {
          flush(segment);
          (segments[index + 1]?.input ?? period)?.focus();
        };
        break;
      case "Backspace":
      case "Delete":
        action = () => {
          segment.buffer = "";
          segment.input.value = "";
        };
        break;
      default:
        if (DIGIT.test(event.key)) action = () => type(segment, event.key);
        else if (event.key.length === 1) action = () => {};
    }
    if (!action) return;
    event.preventDefault();
    event.stopPropagation();
    action();
  }

  /**
   * Text that arrives without a key event, from a soft keyboard or an
   * IME, goes through the same digit handling.
   *
   * @param {InputEvent} event
   */
  function onBeforeInput(event) {
    const segment = segments.find((s) => s.input === event.target);
    if (!segment) return;
    event.preventDefault();
    for (const char of event.data ?? "") {
      if (DIGIT.test(char)) type(segment, char);
    }
  }

  /** @param {FocusEvent} event */
  function onFocusOut(event) {
    const segment = segments.find((s) => s.input === event.target);
    if (segment?.buffer) flush(segment);
    else if (segment && segment.input.value === "") render();
  }

  /** @param {FocusEvent} event */
  function onFocusIn(event) {
    const segment = segments.find((s) => s.input === event.target);
    segment?.input.select();
  }

  function onPeriodChange() {
    if (!period) return;
    const pm = period.value === "1";
    commit({ ...time, hours: (time.hours % 12) + (pm ? 12 : 0) });
  }

  row.addEventListener("keydown", onKeyDown);
  row.addEventListener("beforeinput", onBeforeInput);
  row.addEventListener("focusout", onFocusOut);
  row.addEventListener("focusin", onFocusIn);
  period?.addEventListener("change", onPeriodChange);
  render();

  return {
    element: row,
    /** Shows `next` without reporting it. @param {TimeParts} next */
    setTime(next) {
      time = { ...next };
      render();
    },
    /** @param {boolean} disabled */
    setDisabled(disabled) {
      row.classList.toggle("bx--date-picker__time--disabled", disabled);
      for (const segment of segments) segment.input.disabled = disabled;
      if (period) period.disabled = disabled;
    },
    /**
     * Keeps the fields focusable and their text color, and blocks typing
     * and pasting. The picker blocks the AM/PM select's keys and clicks.
     *
     * @param {boolean} readOnly
     */
    setReadOnly(readOnly) {
      for (const segment of segments) segment.input.readOnly = readOnly;
    },
  };
}
