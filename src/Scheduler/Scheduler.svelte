<script>
  /**
   * @restProps {div}
   * @template {SchedulerEvent} [Item=SchedulerEvent]
   * @event {{ start: Date; end: Date; allDay: boolean; trigger: "pointer" | "keyboard" }} create - Fires when the user picks a slot or drags across slots, or presses Enter on one. Cancelable: calling `preventDefault()` drops the selection instead of keeping it. `end` is exclusive.
   * @event {{ event: Item; start: Date; end: Date; allDay: boolean; kind: "move" | "resize"; trigger: "pointer" | "keyboard" }} change - Fires when the user moves or resizes an event. Cancelable: unless `preventDefault()` is called, the component replaces the event in `events` with a copy that has the new `start` and `end`.
   * @event {{ event: Item; trigger: "pointer" | "keyboard" }} click:event - Fires when the user clicks an event, or presses Enter or Space on it.
   * @event {{ date: Date }} click:day - Fires when the user opens a day from its heading or a "more" link. Cancelable: unless `preventDefault()` is called, the component switches to the `"day"` view on that date.
   */

  /**
   * @typedef {object} SchedulerEvent
   * @property {string | number} id - A unique id.
   * @property {string} title
   * @property {Date} start
   * @property {Date} [end] - Exclusive. Without it, a timed event lasts no time and an all-day event lasts a day.
   * @property {boolean} [allDay] - Show the event in the all-day row, ignoring the time of `start` and `end`.
   * @property {"gray" | "red" | "magenta" | "purple" | "blue" | "cyan" | "teal" | "green" | (string & {})} [color] - Defaults to `"blue"`. The union accepts any string so an array literal in plain JavaScript type-checks; an unknown name renders blue.
   * @property {boolean} [readonly] - Stop the user moving or resizing this event.
   */

  /**
   * @typedef {object} SchedulerSelection
   * @property {Date} start
   * @property {Date} end - Exclusive.
   * @property {boolean} allDay
   */

  /**
   * Specify the events to show. The component never mutates the array; a
   * move or resize assigns a new one, so `bind:events` keeps it current.
   * `end` is exclusive: a one-hour event at 10:00 ends at 11:00, and an
   * all-day event on Monday ends at Tuesday's midnight.
   * @bindable writable
   * @type {ReadonlyArray<Item>}
   */
  export let events = [];

  /**
   * Specify the view.
   * @bindable writable
   * @type {"day" | "week" | "month"}
   */
  export let view = "week";

  /**
   * Specify the date to show. The day view shows its day, the week view the
   * week that holds it, and the month view its month. Defaults to now when
   * the component is created, so pass a fixed date for server rendering.
   * @bindable writable
   * @type {Date}
   */
  export let date = new Date();

  /**
   * Specify an IANA time zone, such as `"America/New_York"`, to show events
   * in. Defaults to the browser's own zone. Event `Date`s are instants; the
   * zone decides which day and clock time each one falls on.
   * @type {string | undefined}
   */
  export let timeZone = undefined;

  /** Specify the locale for names, dates and the clock. */
  export let locale = "en";

  /**
   * Specify the first day of the week, from `0` (Sunday) to `6` (Saturday).
   * Defaults to the locale's.
   * @type {0 | 1 | 2 | 3 | 4 | 5 | 6 | undefined}
   */
  export let weekStartsOn = undefined;

  /**
   * Specify the clock of the time axis and the event times. `"auto"` follows
   * the locale.
   * @type {"auto" | "12" | "24"}
   */
  export let hourFormat = "auto";

  /**
   * Specify the minutes a row of the grid covers. Must divide 60.
   * @type {5 | 10 | 15 | 20 | 30 | 60}
   */
  export let slotMinutes = 30;

  /**
   * Specify the minutes a drag or an arrow-key move snaps to. Must divide
   * `slotMinutes`; otherwise it falls back to `slotMinutes`.
   * @type {number}
   */
  export let snapMinutes = 15;

  /** Specify the hour the grid scrolls to when it first shows, from 0 to 23. */
  export let scrollHour = 8;

  /** Specify the height of the scrolling grid, as a CSS length. */
  export let height = "40rem";

  /** Set to `true` to stop the user creating, moving and resizing events. */
  export let readonly = false;

  /** Set to `false` to hide the toolbar and drive `view` and `date` yourself. */
  export let toolbar = true;

  /** Set to `false` to hide the line that marks the current time. */
  export let nowIndicator = true;

  /** Specify how many lines of events a month day shows before "more". */
  export let monthEventLimit = 3;

  /**
   * The slot or day range the user has picked, kept until you clear it. The
   * `create` event fires when they pick, and you can set `selection` to
   * `null` once your dialog closes.
   * @bindable writable
   * @type {SchedulerSelection | null}
   */
  export let selection = null;

  /**
   * Specify the accessible name. Defaults to the shown date range.
   * @type {string | undefined}
   */
  export let labelText = undefined;

  /** Specify the text of the "Today" button. */
  export let todayText = "Today";

  /** Specify the label of the previous button. */
  export let previousText = "Previous";

  /** Specify the label of the next button. */
  export let nextText = "Next";

  /** Specify the label of the all-day row. */
  export let allDayText = "All day";

  /**
   * Specify the name of each view in the switcher.
   * @type {(view: "day" | "week" | "month") => string}
   */
  export let viewText = defaultViewText;

  /**
   * Specify the text of a month day's "more" link.
   * @type {(count: number) => string}
   */
  export let moreText = defaultMoreText;

  /**
   * Specify the accessible name of an event. `info` holds the event's dates
   * and times, already formatted for the locale and zone.
   * @type {(event: Item, info: SchedulerLabelInfo) => string}
   */
  export let eventLabelText = defaultEventLabelText;

  /**
   * @typedef {object} SchedulerLabelInfo
   * @property {boolean} allDay
   * @property {boolean} multiDay - The event spans more than one day.
   * @property {string} date - The date of a single-day event, such as "Tuesday, October 21, 2026".
   * @property {string} start - The start time, or the start date and time of a multi-day event.
   * @property {string} end - The end time, or the end date and time of a multi-day event.
   */

  /**
   * Specify the accessible name of a day's column or cell. `hours` is not 24
   * on the day a DST change makes the day shorter or longer.
   * @type {(info: { date: string; today: boolean; hours: number }) => string}
   */
  export let dayText = defaultDayText;

  /**
   * Specify the announcement when the keyboard cursor moves to a slot.
   * @type {(info: { date: string; start: string; end: string; count: number; allDay: boolean }) => string}
   */
  export let slotText = defaultSlotText;

  /**
   * Specify the heading for the shown range. Defaults to the month, or the
   * days, formatted for the locale.
   * @type {((range: { view: "day" | "week" | "month"; start: Date; end: Date }) => string) | undefined}
   */
  export let titleText = undefined;

  /** Specify an id for the top-level element. */
  export let id = uniqueId();

  /**
   * Obtain a reference to the top-level element.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  import { createEventDispatcher, onMount, tick } from "svelte";
  import Button from "../Button/Button.svelte";
  import ContentSwitcher from "../ContentSwitcher/ContentSwitcher.svelte";
  import Switch from "../ContentSwitcher/Switch.svelte";
  import { resolveWeekInfo } from "../DatePicker/week-info.js";
  import ChevronLeft from "../icons/ChevronLeft.svelte";
  import ChevronRight from "../icons/ChevronRight.svelte";
  import {
    getLayoutDirection,
    inlineKey,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";
  import { localeDirection } from "../utils/locale-direction.js";
  import { clamp } from "../utils/numeric-format.js";
  import { pointerDrag } from "../utils/pointer-drag.js";
  import { uniqueId } from "../utils/unique-id.js";
  import SchedulerEventBlock from "./SchedulerEventBlock.svelte";
  import {
    hiddenPerDay,
    layoutDay,
    moveRecord,
    packBars,
    readEvents,
    resizeRecord,
    snapMinute,
    splitByDay,
  } from "./scheduler-layout.js";
  import {
    axisFormatter,
    civilDay,
    dayFields,
    dayFormatter,
    dayInfo,
    getZone,
    MINUTES_PER_DAY,
    resolveHourCycle,
    resolveLocale,
    startOfWeek,
    timeFormatter,
  } from "./scheduler-time.js";

  const dispatch = createEventDispatcher();
  const layoutDirection = getLayoutDirection();
  const VIEWS = /** @type {const} */ (["day", "week", "month"]);
  const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
  const DRAG_THRESHOLD = 4;
  const SLICE_INDEX = /:\d+$/;
  const initialDate = date;

  /** @param {"day" | "week" | "month"} name */
  function defaultViewText(name) {
    return { day: "Day", week: "Week", month: "Month" }[name];
  }

  /** @param {{ date: string; today: boolean; hours: number }} info */
  function defaultDayText(info) {
    const parts = [info.date];
    if (info.today) parts.push("today");
    if (info.hours !== 24) parts.push(`${info.hours} hour day`);
    return parts.join(", ");
  }

  /** @param {number} count */
  function defaultMoreText(count) {
    return `+${count} more`;
  }

  /**
   * @param {{ title: string }} event
   * @param {SchedulerLabelInfo} info
   */
  function defaultEventLabelText(event, info) {
    if (info.allDay) {
      return info.multiDay
        ? `${event.title}, all day, ${info.start} to ${info.end}`
        : `${event.title}, all day, ${info.date}`;
    }
    return info.multiDay
      ? `${event.title}, ${info.start} to ${info.end}`
      : `${event.title}, ${info.start} to ${info.end}, ${info.date}`;
  }

  /**
   * @param {{ date: string; start: string; end: string; count: number; allDay: boolean }} info
   */
  function defaultSlotText(info) {
    const events =
      info.count === 0
        ? "no events"
        : info.count === 1
          ? "1 event"
          : `${info.count} events`;
    return info.allDay
      ? `${info.date}, ${events}`
      : `${info.start} to ${info.end}, ${info.date}, ${events}`;
  }

  /** @param {Date | number | undefined} value */
  function toMs(value) {
    const ms = value instanceof Date ? value.getTime() : Number(value);
    return Number.isFinite(ms) ? ms : Number.NaN;
  }

  /**
   * @param {"day" | "week" | "month"} name
   * @param {number} anchor
   * @param {number} firstDay
   */
  function getRange(name, anchor, firstDay) {
    if (name === "day") return { first: anchor, last: anchor };
    if (name === "week") {
      const first = startOfWeek(anchor, firstDay);
      return { first, last: first + 6 };
    }
    const { year, month } = dayFields(anchor);
    const first = startOfWeek(civilDay(year, month, 1), firstDay);
    const last = startOfWeek(civilDay(year, month + 1, 0), firstDay) + 6;
    return { first, last };
  }

  /**
   * @param {number} first
   * @param {number} last
   */
  function listDays(first, last) {
    return Array.from({ length: last - first + 1 }, (_, i) => first + i);
  }

  /**
   * @param {number} step
   * @param {number} divisor
   * @param {number} fallback
   */
  function divisorOr(step, divisor, fallback) {
    return Number.isInteger(step) && step > 0 && divisor % step === 0
      ? step
      : fallback;
  }

  /**
   * @param {number | undefined} value
   * @param {string} locale
   * @returns {number}
   */
  function resolveFirstDay(value, locale) {
    return value !== undefined &&
      Number.isInteger(value) &&
      value >= 0 &&
      value <= 6
      ? value
      : resolveWeekInfo(locale).firstDay;
  }

  // The inputs below are normalized once, so a bad prop never reaches a
  // layout calculation.
  $: zone = getZone(timeZone);
  $: resolvedLocale = resolveLocale(locale);
  $: localeDir = localeDirection(resolvedLocale);
  $: clock = resolveHourCycle(hourFormat, resolvedLocale);
  $: firstDayOfWeek = resolveFirstDay(weekStartsOn, resolvedLocale);
  $: slot = divisorOr(slotMinutes, 60, 30);
  $: snap = divisorOr(snapMinutes, slot, slot);
  $: slotCount = MINUTES_PER_DAY / slot;
  $: activeView = VIEWS.includes(view) ? view : "week";
  $: timeGrid = activeView !== "month";
  $: anchorMs = Number.isNaN(toMs(date)) ? toMs(initialDate) : toMs(date);
  $: anchorDay = zone.parts(anchorMs).day;
  $: range = getRange(activeView, anchorDay, firstDayOfWeek);
  $: days = listDays(
    range.first,
    activeView === "month" ? range.first + 6 : range.last,
  );
  $: weekCount =
    activeView === "month" ? (range.last - range.first + 1) / 7 : 0;

  // The current time is read after mount, so the server and the first client
  // paint agree.
  /** @type {number | null} */
  let nowMs = null;
  $: nowParts = nowMs === null ? null : zone.parts(nowMs);
  $: todayDay = nowParts ? nowParts.day : null;

  /** @param {string} locale @param {import("./scheduler-time.js").Zone} zone @param {"12" | "24"} clock */
  function createFormats(locale, zone, clock) {
    const weekday = dayFormatter(locale, { weekday: "short" });
    const weekdayLong = dayFormatter(locale, { weekday: "long" });
    const dayNumber = dayFormatter(locale, { day: "numeric" });
    const full = dayFormatter(locale, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const shortDate = dayFormatter(locale, { month: "short", day: "numeric" });
    const shortDateYear = dayFormatter(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const monthYear = dayFormatter(locale, { month: "long", year: "numeric" });
    const time = timeFormatter(locale, zone.timeZone, clock);
    return {
      weekday,
      weekdayLong,
      dayNumber,
      full,
      shortDate,
      shortDateYear,
      monthYear,
      axis: axisFormatter(locale, clock),
      time: (/** @type {number} */ ms) => time.format(ms),
      clockTime: (/** @type {number} */ minute) =>
        time.format(new Date(Date.UTC(2000, 0, 1, 0, minute))),
    };
  }

  $: formats = createFormats(resolvedLocale, zone, clock);

  /**
   * The text of a time on the wall clock, with no zone applied: the time
   * formatter reads instants, so a bare minute goes through the axis.
   * @param {ReturnType<typeof createFormats>} formats
   * @param {number} minute
   */
  function wallTime(formats, minute) {
    return formats.axis(minute % MINUTES_PER_DAY);
  }

  $: title = getTitle(range, activeView, formats, titleText, zone);

  /**
   * @param {{ first: number; last: number }} range
   * @param {"day" | "week" | "month"} name
   * @param {ReturnType<typeof createFormats>} formats
   * @param {typeof titleText} custom
   * @param {import("./scheduler-time.js").Zone} zone
   */
  function getTitle(range, name, formats, custom, zone) {
    const start = range.first;
    const end = range.last;
    if (custom) {
      return custom({
        view: name,
        start: new Date(zone.instant(start, 0)),
        end: new Date(zone.instant(end, 0)),
      });
    }
    if (name === "month") {
      const { year, month } = dayFields(anchorDay);
      return formats.monthYear(civilDay(year, month, 1));
    }
    if (name === "day") return formats.full(start);
    return `${formats.shortDate(start)} to ${formats.shortDateYear(end)}`;
  }

  $: rootLabel = labelText || title;

  // Events become records once; the layout, the labels and the pointer
  // lookups all read the same ones.
  $: records = readEvents(events, zone);
  $: recordsById = new Map(records.map((record) => [record.id, record]));

  /** @type {null | { id: string; startMs: number; endMs: number }} */
  let preview = null;
  /** @type {null | SchedulerSelection} */
  let draft = null;

  /**
   * @param {typeof records} records
   * @param {typeof preview} preview
   * @param {import("./scheduler-time.js").Zone} zone
   */
  function applyPreview(records, preview, zone) {
    if (!preview) return records;
    return records.map((record) => {
      if (record.id !== preview.id) return record;
      const moved = readEvents(
        [
          {
            ...record.event,
            start: new Date(preview.startMs),
            end: new Date(preview.endMs),
          },
        ],
        zone,
      )[0];
      return { ...moved, order: record.order };
    });
  }

  $: shownRecords = applyPreview(records, preview, zone);

  $: segmentsByDay = timeGrid
    ? splitByDay(shownRecords, range.first, range.last, slot).map(layoutDay)
    : [];
  $: allDay = timeGrid
    ? packBars(shownRecords, range.first, range.last)
    : { bars: [], lanes: 0 };
  $: dayInfos = timeGrid ? days.map((day) => dayInfo(zone, day)) : [];

  /**
   * @param {typeof shownRecords} records
   * @param {number} first
   * @param {number} count
   * @param {number} limit
   */
  function buildWeeks(records, first, count, limit) {
    return Array.from({ length: count }, (_, week) => {
      const start = first + week * 7;
      const { bars } = packBars(records, start, start + 6, false);
      const hidden = hiddenPerDay(bars, 7, limit);
      return {
        first: start,
        days: listDays(start, start + 6),
        bars: bars.filter((bar) => bar.lane < limit),
        hidden,
      };
    });
  }

  $: lineLimit = Math.max(1, Math.floor(monthEventLimit) || 1);
  $: weeks =
    activeView === "month"
      ? buildWeeks(shownRecords, range.first, weekCount, lineLimit)
      : [];
  $: monthOf = dayFields(anchorDay).month;
  $: monthHeadings = listDays(range.first, range.first + 6);

  // What the user is picking or has picked, as a record the layout can place.
  $: shown = draft || selection;
  $: shownRecord = shown
    ? readEvents(
        [
          {
            id: "__selection",
            start: shown.start,
            end: shown.end,
            allDay: shown.allDay,
          },
        ],
        zone,
      )[0]
    : undefined;
  $: shownSegments =
    shownRecord && timeGrid
      ? splitByDay([shownRecord], range.first, range.last, slot)
      : [];
  $: shownBars = shownRecord
    ? timeGrid
      ? packBars([shownRecord], range.first, range.last).bars
      : []
    : [];
  $: shownWeekDays =
    shownRecord && activeView === "month"
      ? weeks.map((week) => selectedDays(shownRecord, week.first))
      : [];

  /**
   * @param {NonNullable<typeof shownRecord>} record
   * @param {number} first
   */
  function selectedDays(record, first) {
    return Array.from(
      { length: 7 },
      (_, index) =>
        record.startDay <= first + index && record.lastDay >= first + index,
    );
  }

  /**
   * Describes an event once per record. The memo belongs to the formats it
   * was built with, so a new locale or zone starts a new one.
   * @param {ReturnType<typeof createFormats>} formats
   * @param {typeof eventLabelText} labelText
   */
  function createDescriber(formats, labelText) {
    /** @type {WeakMap<object, { label: string; timeText: string; endText: string }>} */
    const memo = new WeakMap();
    /** @param {(typeof records)[number]} record */
    function describeRecord(record) {
      let described = memo.get(record);
      if (described) return described;
      const multiDay = record.lastDay > record.startDay;
      const allDayEvent = record.banner;
      /** @type {SchedulerLabelInfo} */
      let info;
      let timeText = "";
      let endText = "";
      if (allDayEvent && record.allDay) {
        info = {
          allDay: true,
          multiDay,
          date: formats.full(record.startDay),
          start: formats.full(record.startDay),
          end: formats.full(record.lastDay),
        };
      } else {
        const startTime = formats.time(record.startMs);
        const endTime = formats.time(record.endMs);
        timeText = startTime;
        if (!multiDay && !record.banner) endText = endTime;
        info = {
          allDay: false,
          multiDay,
          date: formats.full(record.startDay),
          start: multiDay
            ? `${formats.full(record.startDay)}, ${startTime}`
            : startTime,
          end: multiDay
            ? `${formats.full(record.lastDay)}, ${endTime}`
            : endTime,
        };
      }
      described = {
        label: labelText(
          /** @type {Item} */ (/** @type {unknown} */ (record.event)),
          info,
        ),
        timeText,
        endText,
      };
      memo.set(record, described);
      return described;
    }
    return describeRecord;
  }

  $: describeEvent = createDescriber(formats, eventLabelText);

  // Keyboard cursor: the slot (or, in the month view, the day) the arrow keys
  // move. It starts on the date being shown.
  let cursor = {
    day: getZone(timeZone).parts(toMs(initialDate)).day,
    minute: scrollHourMinute(scrollHour),
  };

  /** @param {number} hour */
  function scrollHourMinute(hour) {
    return clamp(Math.floor(Number(hour) || 0), 0, 23) * 60;
  }

  // Keep the cursor on screen when the range changes under it.
  $: cursorDay =
    cursor.day >= range.first && cursor.day <= range.last
      ? cursor.day
      : anchorDay;
  $: cursorMinute = clamp(cursor.minute, 0, MINUTES_PER_DAY - slot);

  // The user's announcement for assistive technology.
  let announcement = "";

  /** @param {string} text */
  function announce(text) {
    announcement = text;
  }

  /**
   * @param {number} day
   * @param {number} minute
   * @param {boolean} allDayTarget
   */
  function describeSlot(day, minute, allDayTarget) {
    const count = shownRecords.filter((record) =>
      allDayTarget || record.banner
        ? record.startDay <= day && record.lastDay >= day
        : record.startDay <= day &&
          record.lastDay >= day &&
          (record.startDay < day || record.startMinute < minute + slot) &&
          (record.lastDay > day || record.endMinute > minute),
    ).length;
    return slotText({
      date: formats.full(day),
      start: wallTime(formats, minute),
      end: wallTime(formats, minute + slot),
      count,
      allDay: allDayTarget,
    });
  }

  /** @type {null | HTMLDivElement} */
  let scrollerRef = null;
  /** @type {null | HTMLDivElement} */
  let planeRef = null;
  /** @type {null | HTMLDivElement} */
  let allDayRef = null;
  /** @type {null | HTMLDivElement} */
  let monthRef = null;

  /**
   * Scrolls the grid so the hour's line sits below the sticky header. Hour
   * labels center on their line, so the scroll stops one label height early
   * and the first label shows whole.
   * @param {HTMLElement} node
   */
  function scrollToHour(node) {
    const body = node.querySelector(".bx--scheduler__body");
    if (body) {
      const label = node.querySelector(".bx--scheduler__hour");
      const room = label ? label.getBoundingClientRect().height : 0;
      node.scrollTop = Math.max(
        0,
        (scrollHourMinute(scrollHour) / MINUTES_PER_DAY) *
          body.getBoundingClientRect().height -
          room,
      );
    }
  }

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;
  function scheduleTick() {
    nowMs = Date.now();
    timer = setTimeout(scheduleTick, 60_000 - (nowMs % 60_000) + 50);
  }

  onMount(() => {
    scheduleTick();
    return () => clearTimeout(timer);
  });

  /** @param {number} day */
  function dayDate(day) {
    return new Date(zone.instant(day, 12 * 60));
  }

  /** Moves the shown range to `day`. @param {number} day */
  function showDay(day) {
    date = dayDate(day);
  }

  /**
   * `day` one view-length on: a day, a week, or a month, keeping the day of
   * the month where the next month is long enough.
   * @param {number} day
   * @param {number} direction
   */
  function shiftBy(day, direction) {
    if (activeView === "month") {
      const { year, month, date: dayOfMonth } = dayFields(day);
      const length = dayFields(civilDay(year, month + direction + 1, 0)).date;
      return (
        civilDay(year, month + direction, 1) + Math.min(dayOfMonth, length) - 1
      );
    }
    return day + direction * (activeView === "week" ? 7 : 1);
  }

  /** @param {number} direction */
  function step(direction) {
    showDay(shiftBy(anchorDay, direction));
  }

  function goToday() {
    date = new Date();
  }

  /** @param {CustomEvent<number>} event */
  function handleViewChange(event) {
    view = VIEWS[event.detail];
  }

  /** @param {number} day */
  function openDay(day) {
    if (!dispatch("click:day", { date: dayDate(day) }, { cancelable: true })) {
      return;
    }
    date = dayDate(day);
    view = "day";
  }

  /**
   * Finds one of the event's slices on screen again after a change.
   * @param {string} key
   */
  function findSlice(key) {
    if (!ref) return null;
    for (const element of ref.querySelectorAll("[data-slice-key]")) {
      if (/** @type {HTMLElement} */ (element).dataset.sliceKey === key) {
        return /** @type {HTMLElement} */ (element);
      }
    }
    return null;
  }

  /** @param {number} day */
  function findCell(day) {
    return ref?.querySelector(`[data-cell][data-day="${day}"]`) ?? null;
  }

  /** @param {number} day */
  async function focusCell(day) {
    await tick();
    /** @type {HTMLElement | null} */ (findCell(day))?.focus();
  }

  /** @param {string} key */
  async function focusSlice(key) {
    await tick();
    findSlice(key)?.focus();
  }

  // Pointer and keyboard changes funnel through these two. Each asks the
  // consumer first.

  /**
   * @param {number} startMs
   * @param {number} endMs
   * @param {boolean} allDayEvent
   * @param {"pointer" | "keyboard"} trigger
   */
  function commitCreate(startMs, endMs, allDayEvent, trigger) {
    const detail = {
      start: new Date(startMs),
      end: new Date(endMs),
      allDay: allDayEvent,
      trigger,
    };
    const proceed = dispatch("create", detail, { cancelable: true });
    selection = proceed
      ? { start: detail.start, end: detail.end, allDay: allDayEvent }
      : null;
    draft = null;
  }

  /**
   * @param {(typeof records)[number]} record
   * @param {"move" | "resize"} kind
   * @param {{ startMs: number; endMs: number }} next
   * @param {"pointer" | "keyboard"} trigger
   */
  function commitChange(record, kind, next, trigger) {
    preview = null;
    if (next.startMs === record.startMs && next.endMs === record.endMs) {
      return false;
    }
    const detail = {
      event: record.event,
      start: new Date(next.startMs),
      end: new Date(next.endMs),
      allDay: record.allDay,
      kind,
      trigger,
    };
    if (dispatch("change", detail, { cancelable: true })) {
      events = events.map((event) =>
        event === record.event
          ? { ...event, start: detail.start, end: detail.end }
          : event,
      );
    }
    return true;
  }

  /**
   * What a gesture needs to turn a pointer position into a day and minute,
   * read once when it starts.
   * @param {"grid" | "allday" | "month"} area
   * @param {HTMLElement} root
   */
  function readSurface(area, root) {
    return {
      area,
      rect: root.getBoundingClientRect(),
      rtl: resolveLayoutDirection($layoutDirection, root) === "rtl",
      scrollTop: scrollerRef ? scrollerRef.scrollTop : 0,
    };
  }

  /**
   * @param {ReturnType<typeof readSurface>} surface
   * @param {number} clientX
   * @param {number} clientY
   */
  function locate(surface, clientX, clientY) {
    const { rect, rtl } = surface;
    const across =
      rect.width > 0
        ? (rtl ? rect.right - clientX : clientX - rect.left) / rect.width
        : 0;
    if (surface.area === "month") {
      const down = rect.height > 0 ? (clientY - rect.top) / rect.height : 0;
      const row = clamp(Math.floor(down * weekCount), 0, weekCount - 1);
      const column = clamp(Math.floor(across * 7), 0, 6);
      return { day: range.first + row * 7 + column, minute: 0 };
    }
    const column = clamp(Math.floor(across * days.length), 0, days.length - 1);
    if (surface.area === "allday" || !(rect.height > 0)) {
      return { day: days[column], minute: 0 };
    }
    const scrolled = scrollerRef
      ? scrollerRef.scrollTop - surface.scrollTop
      : 0;
    const minute =
      ((clientY - rect.top + scrolled) / rect.height) * MINUTES_PER_DAY;
    return {
      day: days[column],
      minute: clamp(minute, 0, MINUTES_PER_DAY - 0.001),
    };
  }

  /**
   * Plain object, not reactive: it lives for one gesture.
   * @type {null | {
   *   surface: ReturnType<typeof readSurface>;
   *   mode: "create" | "move" | "resize";
   *   record?: (typeof records)[number];
   *   origin: { day: number; minute: number };
   *   anchor: { day: number; minute: number };
   *   startX: number;
   *   startY: number;
   *   moved: boolean;
   *   editable: boolean;
   * }}
   */
  let gesture = null;

  /** @param {Element | null} target @param {Element | null} root */
  function eventAt(target, root) {
    const element = target?.closest("[data-event-id]");
    return element && root?.contains(element)
      ? /** @type {HTMLElement} */ (element)
      : null;
  }

  /**
   * @param {"grid" | "allday" | "month"} area
   * @param {PointerEvent} event
   */
  function startGesture(area, event) {
    const root =
      area === "grid" ? planeRef : area === "allday" ? allDayRef : monthRef;
    if (!root || !(event.target instanceof Element)) return false;
    // A press on a button inside the grid must stay a click on that button;
    // pointer capture would retarget the click to the grid.
    if (event.target.closest("button")) return false;
    const surface = readSurface(area, root);
    const point = locate(surface, event.clientX, event.clientY);
    const element = eventAt(event.target, root);

    if (element) {
      const record = recordsById.get(element.dataset.eventId ?? "");
      if (!record) return false;
      gesture = {
        surface,
        mode: event.target.closest("[data-resize]") ? "resize" : "move",
        record,
        origin: point,
        anchor: point,
        startX: event.clientX,
        startY: event.clientY,
        moved: false,
        editable: !readonly && !record.event.readonly,
      };
      return true;
    }
    if (readonly) return false;

    const anchor = {
      day: point.day,
      minute: area === "grid" ? Math.floor(point.minute / snap) * snap : 0,
    };
    gesture = {
      surface,
      mode: "create",
      origin: point,
      anchor,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      editable: true,
    };
    cursor = {
      day: anchor.day,
      minute: Math.floor(anchor.minute / slot) * slot,
    };
    draft = draftFor(gesture, point);
    return true;
  }

  /**
   * The range a create gesture covers. A plain press picks one whole slot;
   * a drag covers every snap step it touches.
   * @param {NonNullable<typeof gesture>} current
   * @param {{ day: number; minute: number }} point
   * @returns {SchedulerSelection}
   */
  function draftFor(current, point) {
    const { area } = current.surface;
    if (area !== "grid") {
      const from = Math.min(current.anchor.day, point.day);
      const to = Math.max(current.anchor.day, point.day);
      return {
        start: new Date(zone.instant(from, 0)),
        end: new Date(zone.instant(to + 1, 0)),
        allDay: true,
      };
    }
    const here = Math.floor(point.minute / snap) * snap;
    let from = Math.min(current.anchor.minute, here);
    let to = Math.max(current.anchor.minute, here) + snap;
    if (to - from < slot) {
      from = Math.floor(from / slot) * slot;
      to = from + slot;
    }
    const day = current.anchor.day;
    return {
      start: new Date(zone.instant(day, from)),
      end: new Date(zone.instant(day, to)),
      allDay: false,
    };
  }

  /** @param {PointerEvent} event */
  function moveGesture(event) {
    const current = gesture;
    if (!current) return;
    const point = locate(current.surface, event.clientX, event.clientY);
    if (current.mode === "create") {
      current.moved = true;
      draft = draftFor(current, point);
      return;
    }
    if (!current.moved) {
      current.moved =
        Math.abs(event.clientX - current.startX) > DRAG_THRESHOLD ||
        Math.abs(event.clientY - current.startY) > DRAG_THRESHOLD;
    }
    if (!current.moved || !current.editable || !current.record) return;
    const { record } = current;
    let next;
    if (current.mode === "move") {
      const dayDelta = point.day - current.origin.day;
      const minuteDelta =
        current.surface.area === "grid"
          ? snapMinute(point.minute - current.origin.minute, snap)
          : 0;
      next = moveRecord(record, zone, dayDelta, minuteDelta);
    } else {
      const day = record.lastDay;
      next = resizeRecord(
        record,
        zone,
        day,
        snapMinute(point.minute, snap),
        snap,
      );
    }
    if (
      !preview ||
      preview.startMs !== next.startMs ||
      preview.endMs !== next.endMs
    ) {
      preview = { id: record.id, ...next };
    }
  }

  /** @param {PointerEvent} event */
  function endGesture(event) {
    const current = gesture;
    gesture = null;
    if (!current) return;
    const cancelled = event.type === "pointercancel";
    if (current.mode === "create") {
      const picked = draft;
      draft = null;
      if (!cancelled && picked) {
        commitCreate(
          picked.start.getTime(),
          picked.end.getTime(),
          picked.allDay,
          "pointer",
        );
      }
      return;
    }
    const { record } = current;
    const next = preview;
    preview = null;
    if (cancelled || !record) return;
    if (!current.moved) {
      dispatch("click:event", { event: record.event, trigger: "pointer" });
    } else if (next) {
      commitChange(record, current.mode, next, "pointer");
    }
  }

  const gridGesture = {
    onStart: (/** @type {PointerEvent} */ e) => startGesture("grid", e),
    onMove: moveGesture,
    onEnd: endGesture,
  };
  const allDayGesture = {
    onStart: (/** @type {PointerEvent} */ e) => startGesture("allday", e),
    onMove: moveGesture,
    onEnd: endGesture,
  };
  const monthGesture = {
    onStart: (/** @type {PointerEvent} */ e) => startGesture("month", e),
    onMove: moveGesture,
    onEnd: endGesture,
  };

  /** @param {KeyboardEvent} event */
  function handleWindowKeydown(event) {
    if (event.key === "Escape" && gesture) {
      gesture = null;
      draft = null;
      preview = null;
    }
  }

  // Activation without a pointer press (a screen reader's click) arrives as
  // a click with no pointer position; a real press ends in `endGesture`.
  /** @param {MouseEvent} event */
  function handleClick(event) {
    if (event.detail !== 0 || !(event.target instanceof Element)) return;
    const element = event.target.closest("[data-event-id]");
    const record =
      element &&
      recordsById.get(
        /** @type {HTMLElement} */ (element).dataset.eventId ?? "",
      );
    if (record) {
      dispatch("click:event", { event: record.event, trigger: "keyboard" });
    }
  }

  /**
   * Moves the cursor, scrolling the range when it leaves it.
   * @param {number} day
   * @param {number} minute
   * @param {boolean} extend
   */
  function moveCursor(day, minute, extend) {
    const monthView = activeView === "month";
    const nextMinute = monthView ? 0 : clamp(minute, 0, MINUTES_PER_DAY - slot);
    const from = { day: cursorDay, minute: cursorMinute };
    if (extend) {
      if (!keyAnchor) keyAnchor = from;
    } else {
      keyAnchor = null;
    }
    cursor = { day, minute: nextMinute };
    if (day < range.first || day > range.last) showDay(day);
    if (extend && keyAnchor) {
      selection = rangeBetween(keyAnchor, cursor);
    }
    announce(describeSlot(day, nextMinute, monthView));
    focusCell(day);
  }

  /** @type {null | { day: number; minute: number }} */
  let keyAnchor = null;

  /**
   * @param {{ day: number; minute: number }} from
   * @param {{ day: number; minute: number }} to
   * @returns {SchedulerSelection}
   */
  function rangeBetween(from, to) {
    if (activeView === "month") {
      return {
        start: new Date(zone.instant(Math.min(from.day, to.day), 0)),
        end: new Date(zone.instant(Math.max(from.day, to.day) + 1, 0)),
        allDay: true,
      };
    }
    // A timed range stays on the day it began.
    const first = Math.min(from.minute, to.minute);
    const last = Math.max(from.minute, to.minute) + slot;
    return {
      start: new Date(zone.instant(from.day, first)),
      end: new Date(zone.instant(from.day, last)),
      allDay: false,
    };
  }

  /** @param {number} direction */
  function jumpPeriod(direction) {
    const target = shiftBy(cursorDay, direction);
    cursor = { day: target, minute: cursorMinute };
    keyAnchor = null;
    showDay(target);
    focusCell(target);
  }

  /**
   * @param {KeyboardEvent} event
   * @param {string} key
   */
  function handleCellKey(event, key) {
    const monthView = activeView === "month";
    let day = cursorDay;
    let minute = cursorMinute;
    switch (key) {
      case "ArrowRight":
        day += 1;
        break;
      case "ArrowLeft":
        day -= 1;
        break;
      case "ArrowDown":
        if (monthView) day += 7;
        else minute += slot;
        break;
      case "ArrowUp":
        if (monthView) day -= 7;
        else minute -= slot;
        break;
      case "Home":
        day = startOfWeek(day, firstDayOfWeek);
        break;
      case "End":
        day = startOfWeek(day, firstDayOfWeek) + 6;
        break;
      case "PageDown":
      case "PageUp":
        event.preventDefault();
        jumpPeriod(key === "PageDown" ? 1 : -1);
        return;
      case "Enter":
      case " ": {
        event.preventDefault();
        if (readonly) return;
        const picked =
          selection && keyAnchor
            ? selection
            : rangeBetween({ day, minute }, { day, minute });
        commitCreate(
          picked.start.getTime(),
          picked.end.getTime(),
          picked.allDay,
          "keyboard",
        );
        return;
      }
      case "Escape":
        selection = null;
        keyAnchor = null;
        return;
      default:
        return;
    }
    event.preventDefault();
    moveCursor(day, minute, event.shiftKey && !readonly);
  }

  /**
   * The slices of a day in reading order, to move between with the arrows.
   * @param {number} day
   */
  function sliceKeys(day) {
    return (segmentsByDay[day - range.first] ?? []).map(
      (segment) => segment.key,
    );
  }

  /**
   * @param {KeyboardEvent} event
   * @param {string} key
   * @param {HTMLElement} element
   */
  function handleEventKey(event, key, element) {
    const record = recordsById.get(element.dataset.eventId ?? "");
    if (!record) return;
    const sliceKey = element.dataset.sliceKey ?? "";
    const editable = !readonly && !record.event.readonly;
    const column = element.closest("[data-day]");
    const day = column
      ? Number(column.getAttribute("data-day"))
      : record.startDay;

    if (key === "Enter" || key === " ") {
      event.preventDefault();
      dispatch("click:event", { event: record.event, trigger: "keyboard" });
      return;
    }
    if (key === "Escape") {
      focusCell(clamp(day, range.first, range.last));
      return;
    }
    const inGrid = timeGrid && !record.banner;
    if ((event.altKey || event.shiftKey) && editable) {
      /** @type {{ startMs: number; endMs: number } | null} */
      let next = null;
      let kind = /** @type {"move" | "resize"} */ ("move");
      const vertical = key === "ArrowUp" || key === "ArrowDown";
      const horizontal = key === "ArrowLeft" || key === "ArrowRight";
      const sign = key === "ArrowDown" || key === "ArrowRight" ? 1 : -1;
      if (event.altKey && vertical && inGrid) {
        next = moveRecord(record, zone, 0, sign * snap);
      } else if (event.altKey && horizontal) {
        next = moveRecord(record, zone, sign, 0);
      } else if (event.shiftKey && vertical && inGrid) {
        kind = "resize";
        next = resizeRecord(
          record,
          zone,
          record.lastDay,
          record.endMinute + sign * snap,
          snap,
        );
      } else if (event.shiftKey && horizontal && record.allDay) {
        kind = "resize";
        const lastDay = Math.max(record.startDay, record.lastDay + sign);
        next = { startMs: record.startMs, endMs: zone.instant(lastDay + 1, 0) };
      }
      if (next) {
        event.preventDefault();
        if (commitChange(record, kind, next, "keyboard")) {
          announce(describeMove(record, next));
        }
        focusSlice(sliceKey.replace(SLICE_INDEX, ":0"));
        return;
      }
    }
    if (event.altKey || event.shiftKey || event.ctrlKey || event.metaKey)
      return;

    if (inGrid) {
      const keys = sliceKeys(day);
      const index = keys.indexOf(sliceKey);
      if (key === "ArrowDown" && index < keys.length - 1) {
        event.preventDefault();
        focusSlice(keys[index + 1]);
      } else if (key === "ArrowUp") {
        event.preventDefault();
        if (index > 0) focusSlice(keys[index - 1]);
        else focusCell(day);
      } else if (key === "ArrowLeft" || key === "ArrowRight") {
        event.preventDefault();
        const target = clamp(
          day + (key === "ArrowRight" ? 1 : -1),
          range.first,
          range.last,
        );
        const near = nearestSlice(target, record.startMinute);
        if (near) focusSlice(near);
        else focusCell(target);
      }
      return;
    }
    if (
      key === "ArrowDown" ||
      key === "ArrowUp" ||
      key === "ArrowLeft" ||
      key === "ArrowRight"
    ) {
      event.preventDefault();
      cursor = {
        day: clamp(day, range.first, range.last),
        minute: cursorMinute,
      };
      handleCellKey(event, key);
    }
  }

  /**
   * @param {number} day
   * @param {number} minute
   */
  function nearestSlice(day, minute) {
    let best = null;
    let bestGap = Number.POSITIVE_INFINITY;
    for (const segment of segmentsByDay[day - range.first] ?? []) {
      const gap = Math.abs(segment.startMin - minute);
      if (gap < bestGap) {
        best = segment.key;
        bestGap = gap;
      }
    }
    return best;
  }

  /**
   * @param {(typeof records)[number]} record
   * @param {{ startMs: number; endMs: number }} next
   */
  function describeMove(record, next) {
    const day = zone.parts(next.startMs);
    return `${record.event.title}, ${formats.time(next.startMs)} to ${formats.time(next.endMs)}, ${formats.full(day.day)}`;
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (event.defaultPrevented || event.isComposing) return;
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const key = inlineKey(event.key, $layoutDirection, target);
    const eventElement = target.closest("[data-event-id]");
    if (eventElement) {
      handleEventKey(event, key, /** @type {HTMLElement} */ (eventElement));
    } else if (target.hasAttribute("data-cell")) {
      handleCellKey(event, key);
    }
  }

  // The inputs are arguments, so Svelte 3 and 4 re-run the label when the
  // current day or the zone's shape changes.
  /**
   * @param {number} day
   * @param {number | null} today
   * @param {typeof dayInfos} infos
   * @param {typeof formats} formats
   * @param {typeof dayText} text
   * @param {number} first
   */
  function dayLabel(day, today, infos, formats, text, first) {
    const info = infos[day - first];
    return text({
      date: formats.full(day),
      today: day === today,
      hours: info ? info.length / 60 : 24,
    });
  }

  $: viewIndex = VIEWS.indexOf(activeView);
</script>

<svelte:window on:keydown={handleWindowKeydown} />

<div
  bind:this={ref}
  {id}
  role="group"
  aria-label={rootLabel}
  {...$$restProps}
  class:bx--scheduler={true}
  class:bx--scheduler--month={activeView === "month"}
  class:bx--scheduler--readonly={readonly}
  style:--ccs-scheduler-days={days.length}
  style:--ccs-scheduler-slots={slotCount}
  style:--ccs-scheduler-height={height}
>
  {#if toolbar}
    <div class="bx--scheduler__toolbar">
      <div class="bx--scheduler__nav">
        <Button kind="tertiary" size="sm" on:click={goToday}>{todayText}</Button
        >
        <Button
          kind="ghost"
          size="sm"
          icon={ChevronLeft}
          iconDescription={previousText}
          tooltipPosition="bottom"
          on:click={() => step(-1)}
        />
        <Button
          kind="ghost"
          size="sm"
          icon={ChevronRight}
          iconDescription={nextText}
          tooltipPosition="bottom"
          on:click={() => step(1)}
        />
      </div>
      <div class="bx--scheduler__title" aria-live="polite">{title}</div>
      <div class="bx--scheduler__views">
        <ContentSwitcher
          size="sm"
          selectedIndex={viewIndex}
          on:change={handleViewChange}
        >
          {#each VIEWS as name (name)}
            <Switch id="{id}-view-{name}" text={viewText(name)} />
          {/each}
        </ContentSwitcher>
      </div>
    </div>
  {/if}

  {#if timeGrid}
    <div
      class="bx--scheduler__scroller"
      bind:this={scrollerRef}
      use:scrollToHour
    >
      <div class="bx--scheduler__grid">
        <div class="bx--scheduler__head">
          <div class="bx--scheduler__gutter"></div>
          <div class="bx--scheduler__headings">
            {#each days as day (day)}
              <div
                class="bx--scheduler__heading"
                class:bx--scheduler__heading--today={day === todayDay}
              >
                {#if activeView === "week"}
                  <button
                    type="button"
                    class="bx--scheduler__heading-button"
                    aria-label={formats.full(day)}
                    on:click={() => openDay(day)}
                  >
                    <span class="bx--scheduler__weekday"
                      >{formats.weekday(day)}</span
                    >
                    <span class="bx--scheduler__day-number"
                      >{formats.dayNumber(day)}</span
                    >
                  </button>
                {:else}
                  <span class="bx--scheduler__weekday"
                    >{formats.weekday(day)}</span
                  >
                  <span class="bx--scheduler__day-number"
                    >{formats.dayNumber(day)}</span
                  >
                {/if}
              </div>
            {/each}
          </div>
          <div class="bx--scheduler__gutter bx--scheduler__gutter--label">
            {allDayText}
          </div>
          <!-- svelte-ignore a11y-no-static-element-interactions a11y-click-events-have-key-events -->
          <div
            class="bx--scheduler__allday"
            bind:this={allDayRef}
            use:pointerDrag={allDayGesture}
            on:keydown={handleKeydown}
            on:click={handleClick}
          >
            {#if shownBars.length > 0}
              {#each shownBars as bar (bar.key)}
                <div
                  class="bx--scheduler__selection"
                  style:grid-column="{bar.start + 1} / span {bar.span}"
                  style:grid-row="1"
                ></div>
              {/each}
            {/if}
            <!-- biome-ignore lint/a11y/noRedundantRoles: Safari drops list semantics from a list with no markers -->
            <ul class="bx--scheduler__allday-list" role="list">
              {#each allDay.bars as bar (bar.key)}
                {@const described = describeEvent(bar.record)}
                <li
                  class="bx--scheduler__item"
                  style:grid-column="{bar.start + 1} / span {bar.span}"
                  style:grid-row={bar.lane + 1}
                >
                  <SchedulerEventBlock
                    variant="bar"
                    eventId={bar.record.id}
                    sliceKey="{bar.record.id}:0"
                    title={bar.record.event.title}
                    timeText={bar.record.allDay ? "" : described.timeText}
                    timeDir={localeDir}
                    label={described.label}
                    color={bar.record.event.color}
                    continuesBefore={bar.continuesBefore}
                    continuesAfter={bar.continuesAfter}
                    dragging={preview !== null && preview.id === bar.record.id}
                    tabindex={bar.record.startDay <= cursorDay &&
                    bar.record.lastDay >= cursorDay
                      ? 0
                      : -1}
                  />
                </li>
              {/each}
            </ul>
          </div>
        </div>

        <div class="bx--scheduler__body">
          <div class="bx--scheduler__axis" aria-hidden="true">
            {#each HOURS as hour (hour)}
              {#if hour > 0}
                <span
                  class="bx--scheduler__hour"
                  style:top="{(hour * 60 * 100) / MINUTES_PER_DAY}%"
                >
                  <bdi dir={localeDir}>{formats.axis(hour * 60)}</bdi>
                </span>
              {/if}
            {/each}
          </div>
          <!-- svelte-ignore a11y-no-static-element-interactions a11y-click-events-have-key-events -->
          <div
            class="bx--scheduler__plane"
            bind:this={planeRef}
            use:pointerDrag={gridGesture}
            on:keydown={handleKeydown}
            on:click={handleClick}
          >
            <div class="bx--scheduler__lines" aria-hidden="true">
              {#each { length: slotCount } as _, index (index)}
                <div
                  class="bx--scheduler__line"
                  class:bx--scheduler__line--hour={(index * slot) % 60 === 0}
                ></div>
              {/each}
            </div>
            {#each days as day, index (day)}
              {@const info = dayInfos[index]}
              <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
              <div
                class="bx--scheduler__column"
                class:bx--scheduler__column--today={day === todayDay}
                role="group"
                aria-label={dayLabel(
                  day,
                  todayDay,
                  dayInfos,
                  formats,
                  dayText,
                  range.first,
                )}
                data-cell
                data-day={day}
                tabindex={day === cursorDay ? 0 : -1}
              >
                {#if info}
                  {#each info.skipped as [from, to] (from)}
                    <div
                      class="bx--scheduler__skipped"
                      aria-hidden="true"
                      style:top="{(from * 100) / MINUTES_PER_DAY}%"
                      style:height="{((to - from) * 100) / MINUTES_PER_DAY}%"
                    ></div>
                  {/each}
                {/if}
                {#each shownSegments[index] ?? [] as segment (segment.key)}
                  <div
                    class="bx--scheduler__selection"
                    style:top="{(segment.startMin * 100) / MINUTES_PER_DAY}%"
                    style:height="{((segment.visualEnd - segment.startMin) *
                      100) /
                      MINUTES_PER_DAY}%"
                  ></div>
                {/each}
                <!-- biome-ignore lint/a11y/noRedundantRoles: Safari drops list semantics from a list with no markers -->
                <ul class="bx--scheduler__events" role="list">
                  {#each segmentsByDay[index] as segment (segment.key)}
                    {@const described = describeEvent(segment.record)}
                    <li
                      class="bx--scheduler__item"
                      style:top="{(segment.startMin * 100) / MINUTES_PER_DAY}%"
                      style:height="{((segment.visualEnd - segment.startMin) *
                        100) /
                        MINUTES_PER_DAY}%"
                      style:--ccs-scheduler-column={segment.column}
                      style:--ccs-scheduler-columns={segment.columns}
                      style:--ccs-scheduler-span={segment.span}
                    >
                      <SchedulerEventBlock
                        variant="block"
                        eventId={segment.record.id}
                        sliceKey={segment.key}
                        title={segment.record.event.title}
                        timeText={segment.continuesBefore
                          ? ""
                          : described.timeText}
                        endText={segment.continuesBefore
                          ? ""
                          : described.endText}
                        timeDir={localeDir}
                        label={described.label}
                        color={segment.record.event.color}
                        continuesBefore={segment.continuesBefore}
                        continuesAfter={segment.continuesAfter}
                        compact={segment.visualEnd - segment.startMin <
                          slot * 1.5}
                        resizable={!readonly &&
                          !segment.record.event.readonly &&
                          !segment.continuesAfter}
                        dragging={preview !== null &&
                          preview.id === segment.record.id}
                        tabindex={day === cursorDay ? 0 : -1}
                      />
                    </li>
                  {/each}
                </ul>
                {#if day === cursorDay}
                  <div
                    class="bx--scheduler__cursor"
                    aria-hidden="true"
                    style:top="{(cursorMinute * 100) / MINUTES_PER_DAY}%"
                    style:height="{(slot * 100) / MINUTES_PER_DAY}%"
                  ></div>
                {/if}
                {#if nowIndicator && nowParts && day === nowParts.day}
                  <div
                    class="bx--scheduler__now"
                    aria-hidden="true"
                    style:top="{(nowParts.minute * 100) / MINUTES_PER_DAY}%"
                  ></div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  {:else}
    <div class="bx--scheduler__month-grid" role="grid" aria-label={rootLabel}>
      <div class="bx--scheduler__month-head" role="row">
        {#each monthHeadings as day (day)}
          <div
            class="bx--scheduler__month-heading"
            role="columnheader"
            aria-label={formats.weekdayLong(day)}
          >
            {formats.weekday(day)}
          </div>
        {/each}
      </div>
      <!-- svelte-ignore a11y-no-static-element-interactions a11y-click-events-have-key-events -->
      <div
        class="bx--scheduler__month-body"
        bind:this={monthRef}
        use:pointerDrag={monthGesture}
        on:keydown={handleKeydown}
        on:click={handleClick}
        style:--ccs-scheduler-weeks={weeks.length}
      >
        {#each weeks as week, weekIndex (week.first)}
          <div class="bx--scheduler__week" role="row">
            {#each week.days as day, index (day)}
              <div
                class="bx--scheduler__cell"
                class:bx--scheduler__cell--today={day === todayDay}
                class:bx--scheduler__cell--outside={dayFields(day).month !==
                  monthOf}
                role="gridcell"
                aria-label={dayLabel(
                  day,
                  todayDay,
                  dayInfos,
                  formats,
                  dayText,
                  range.first,
                )}
                aria-selected={shownWeekDays[weekIndex]?.[index]
                  ? "true"
                  : undefined}
                data-cell
                data-day={day}
                tabindex={day === cursorDay ? 0 : -1}
              >
                <button
                  type="button"
                  class="bx--scheduler__date"
                  tabindex={day === cursorDay ? 0 : -1}
                  aria-label={formats.full(day)}
                  on:click={() => openDay(day)}
                >
                  {formats.dayNumber(day)}
                </button>
                {#each week.bars as bar (bar.key)}
                  {#if bar.start === index}
                    {@const described = describeEvent(bar.record)}
                    <div
                      class="bx--scheduler__item bx--scheduler__item--month"
                      style:--ccs-scheduler-start={bar.start}
                      style:--ccs-scheduler-span={bar.span}
                      style:--ccs-scheduler-lane={bar.lane}
                    >
                      <SchedulerEventBlock
                        variant={bar.record.banner ? "bar" : "chip"}
                        eventId={bar.record.id}
                        sliceKey="{bar.record.id}:{week.first}"
                        title={bar.record.event.title}
                        timeText={bar.record.banner || bar.continuesBefore
                          ? ""
                          : described.timeText}
                        timeDir={localeDir}
                        label={described.label}
                        color={bar.record.event.color}
                        continuesBefore={bar.continuesBefore}
                        continuesAfter={bar.continuesAfter}
                        dragging={preview !== null &&
                          preview.id === bar.record.id}
                        tabindex={week.first + bar.start <= cursorDay &&
                        week.first + bar.start + bar.span > cursorDay
                          ? 0
                          : -1}
                      />
                    </div>
                  {/if}
                {/each}
                {#if week.hidden[index] > 0}
                  <button
                    type="button"
                    class="bx--scheduler__more"
                    style:--ccs-scheduler-start={index}
                    style:--ccs-scheduler-lane={lineLimit}
                    on:click={() => openDay(day)}
                  >
                    <bdi dir={localeDir}>{moreText(week.hidden[index])}</bdi>
                  </button>
                {/if}
              </div>
            {/each}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <div class="bx--visually-hidden" role="status" aria-live="polite">
    {announcement}
  </div>
</div>
