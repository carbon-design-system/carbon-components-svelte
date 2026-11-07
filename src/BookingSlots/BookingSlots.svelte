<script>
  /**
   * @restProps {div}
   * @event {{ value: string; end: string; date: string; timeZone: string }} change Dispatched when a time is chosen. `value` and `end` are ISO 8601 strings in UTC.
   * @event {{ timeZone: string }} zonechange Dispatched when the time zone is changed with the selector.
   * @event {{ error: unknown; month: string }} error Dispatched when `loadSlots` fails for the month on show.
   */

  /**
   * @typedef {{ start: Date | string | number; end?: Date | string | number }} BookingSlot
   * @typedef {{ from: Date; to: Date; month: string; timeZone: string; signal: AbortSignal }} BookingSlotsRequest
   */

  /**
   * The chosen time: the start of the slot as an ISO 8601 string in UTC,
   * or `null`. The time zone it is shown in is `timeZone`.
   * @type {string | null}
   * @bindable writable
   */
  export let value = null;

  /**
   * The IANA time zone that days and times are shown in, such as
   * `"America/Toronto"`. Left empty, it becomes the viewer's zone once the
   * page loads, and `"UTC"` until then. Set it to render the same text on
   * the server and in the browser.
   * @bindable writable
   */
  export let timeZone = "";

  /**
   * The day on show, as `YYYY-MM-DD` in `timeZone`, or `null`.
   * @type {string | null}
   * @bindable writable
   */
  export let date = null;

  /**
   * The times that can be booked, as UTC instants. Use it when you have
   * them all; use `loadSlots` to fetch them by month.
   * @type {ReadonlyArray<BookingSlot>}
   */
  export let slots = [];

  /**
   * Fetch the times of one month. It is called with the month in
   * `timeZone`: `from` is its first instant and `to` the first instant of
   * the next month. Return the slots that start in that window. Months are
   * fetched as they come into view, the next one is fetched ahead, and a
   * month is kept once it has loaded. Pass a function that does not change
   * between renders: a new one clears what has loaded.
   * @type {((request: BookingSlotsRequest) => Promise<ReadonlyArray<BookingSlot>>) | undefined}
   */
  export let loadSlots = undefined;

  /**
   * The length of a slot, in minutes. A slot that has no `end` ends this
   * long after its `start`.
   */
  export let duration = 30;

  /**
   * The time the calendar treats as now, as a `Date`, a timestamp or an
   * ISO string. Times before it are not offered. Set it when rendering on
   * the server, so the server and the browser agree.
   * @type {Date | string | number | undefined}
   */
  export let now = undefined;

  /**
   * The least time ahead, in minutes, that a slot is offered, such as
   * `60` to stop bookings in the next hour.
   */
  export let minNotice = 0;

  /**
   * A language tag such as `"de"`. It sets the day and time text, the
   * calendar, and the first day of the week.
   */
  export let locale = "en";

  /**
   * First day of the week, 0 (Sunday) to 6 (Saturday). Defaults to the
   * locale's.
   * @type {number | undefined}
   */
  export let firstDayOfWeek = undefined;

  /**
   * Specify the clock: `"h12"` or `"h23"`. Defaults to the locale's.
   * @type {"h11" | "h12" | "h23" | "h24" | undefined}
   */
  export let hourCycle = undefined;

  /**
   * Time zones to offer in a selector. The current zone is added if it is
   * missing. With fewer than two, there is no selector, and the zone is
   * only named.
   * @type {ReadonlyArray<string> | undefined}
   */
  export let timeZones = undefined;

  /**
   * Specify the layout. `"week"` shows the seven days of the week of the
   * chosen day side by side when there is room, and one day otherwise.
   * @type {"day" | "week"}
   */
  export let view = "day";

  /** Set to `false` to stop fetching the next month ahead of time. */
  export let prefetch = true;

  /**
   * How many months past the one on show to search when the day has no
   * times and `loadSlots` is used.
   */
  export let lookahead = 3;

  /** Set to `true` to disable the calendar, the selector and the times */
  export let disabled = false;

  /** Specify the accessible name of the calendar */
  export let calendarLabelText = "Choose a date";

  /** Specify the accessible name of the time zone selector */
  export let timeZoneLabelText = "Time zone";

  /**
   * Write the line that names the time zone.
   * @type {(timeZone: string) => string}
   */
  export let timeZoneText = (timeZone) => `Times shown in ${timeZone}`;

  /**
   * Write the length of a slot.
   * @type {(minutes: number) => string}
   */
  export let durationText = (minutes) => `${minutes} min`;

  /**
   * Write the name of the group of times of a day, such as "Available
   * times on Wednesday, Nov 11".
   * @type {(day: string) => string}
   */
  export let timesLabelText = (day) => `Available times on ${day}`;

  /**
   * Write the message screen readers hear when a day is chosen.
   * @type {(count: number, day: string) => string}
   */
  export let availableText = (count, day) =>
    `${count} ${count === 1 ? "time" : "times"} available on ${day}`;

  /** Specify the message for a day with no times */
  export let emptyText = "No times available";

  /** Specify the message shown before a day is chosen */
  export let noDateText = "Select a date to see available times";

  /**
   * Write the label of the button that jumps to the next day with times.
   * @type {(day: string) => string}
   */
  export let nextAvailableText = (day) => `Next available: ${day}`;

  /** Specify the message shown while availability loads */
  export let loadingText = "Loading availability";

  /** Specify the message shown when availability could not be loaded */
  export let errorText = "Availability could not be loaded";

  /** Specify the label of the button that loads availability again */
  export let retryText = "Try again";

  /**
   * Obtain a reference to the HTML element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher, onMount, tick } from "svelte";
  import Button from "../Button/Button.svelte";
  import DateCalendar from "../DatePicker/DateCalendar.svelte";
  import { getCalendarLocale } from "../DatePicker/calendar-dates.js";
  import InlineLoading from "../InlineLoading/InlineLoading.svelte";
  import Select from "../Select/Select.svelte";
  import SelectItem from "../Select/SelectItem.svelte";
  import { hasModifierKey } from "../utils/has-modifier-key.js";
  import {
    getLayoutDirection,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";
  import {
    addDays,
    addMonths,
    dayKey,
    formatDay,
    formatSlotTimes,
    groupSlotsByDay,
    isValidTimeZone,
    monthWindow,
    nextAvailableDay,
    normalizeSlots,
    parseDay,
    toMs,
    weekday,
  } from "./booking-slots.js";

  const dispatch = createEventDispatcher();
  const layoutDirection = getLayoutDirection();

  /** @param {number} n */
  const pad = (n) => String(n).padStart(2, "0");

  /**
   * A calendar day as the local `Date` that `DateCalendar` draws. Only its
   * year, month and day are read, so the viewer's own zone never matters.
   * @param {string} key
   */
  function dateOfDay(key) {
    const { year, month, day } = parseDay(key);
    return new Date(year, month - 1, day);
  }

  /** @param {Date} d */
  function dayOfDate(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  /** @param {Date} d */
  function monthOfDate(d) {
    return dayOfDate(d).slice(0, 7);
  }

  /**
   * @param {string} zone
   * @param {string} detected
   */
  function resolveZone(zone, detected) {
    if (isValidTimeZone(zone)) return zone;
    return isValidTimeZone(detected) ? detected : "UTC";
  }

  let mounted = false;
  let detectedZone = "";
  let clock = Date.now();

  /**
   * One entry per month window that was asked for, so a zone change asks
   * again only for windows it has not seen.
   * @type {Record<string, { status: "loading" | "loaded" | "error"; slots: ReadonlyArray<BookingSlot> }>}
   */
  let entries = {};
  /** @type {Map<string, Promise<void>>} */
  const inflight = new Map();
  let generation = 0;
  let controller = new AbortController();
  let lastSource = loadSlots;

  const startNow = now == null || Number.isNaN(toMs(now)) ? clock : toMs(now);
  const startZone = resolveZone(timeZone, "");
  const startValue = toMs(value);
  const startDay =
    date ??
    (Number.isNaN(startValue)
      ? dayKey(startNow, startZone)
      : dayKey(startValue, startZone));

  // A time that was set starts on its day.
  if (date == null && !Number.isNaN(startValue)) date = startDay;

  let calendarMonth = dateOfDay(startDay);
  let lastDate = date;
  let lastValue = value;
  /** @type {string | null} */
  let lastZone = null;
  /** @type {string | null} */
  let rovingId = null;
  let seeking = false;
  let seekedFor = "";

  $: zone = resolveZone(timeZone, detectedZone);
  $: nowMs = now == null || Number.isNaN(toMs(now)) ? clock : toMs(now);
  $: todayKey = dayKey(nowMs, zone);
  $: shownMonth = monthOfDate(calendarMonth);
  $: firstDow = firstDayOfWeek ?? getCalendarLocale(locale).firstDayOfWeek;
  $: valueMs = toMs(value);
  $: checkedId = Number.isNaN(valueMs) ? null : new Date(valueMs).toISOString();

  // Months are keyed by their window, which depends on the zone.
  /**
   * @param {typeof entries} all
   * @param {string} month
   * @param {string} tz
   * @param {unknown} source
   */
  function statusOf(all, month, tz, source) {
    if (!source) return "loaded";
    const { from, to } = monthWindow(month, tz);
    return all[`${from}:${to}`]?.status ?? "idle";
  }

  /** @param {typeof entries} all */
  function collect(all) {
    /** @type {BookingSlot[]} */
    const found = [];
    for (const entry of Object.values(all)) {
      if (entry.status === "loaded") found.push(...entry.slots);
    }
    return found;
  }

  $: if (loadSlots !== lastSource) {
    lastSource = loadSlots;
    generation += 1;
    controller.abort();
    controller = new AbortController();
    inflight.clear();
    entries = {};
    seekedFor = "";
  }

  $: openSlots = normalizeSlots(
    loadSlots ? collect(entries) : slots,
    duration,
  ).filter((slot) => slot.start >= nowMs + minNotice * 60_000);
  $: byDay = groupSlotsByDay(openSlots, zone);

  $: calendarToday = dateOfDay(todayKey);
  $: calendarValue = date ? dateOfDay(date) : null;
  $: isDayDisabled = makeDayDisabled(byDay, todayKey, disabled);
  $: weekStart =
    date ?? nextAvailableDay(byDay, addDays(todayKey, -1)) ?? todayKey;
  $: dayHasSlots = date ? (byDay[date]?.length ?? 0) > 0 : false;
  $: nextDay = nextAvailableDay(byDay, date ?? addDays(todayKey, -1));

  /**
   * A day can be picked once its month has loaded and it has a time.
   * @param {Record<string, unknown[]>} days
   * @param {string} today
   * @param {boolean} off
   */
  function makeDayDisabled(days, today, off) {
    // Not an inline `return (/** @type */ d) => …`: Svelte 4 prints a line
    // break after `return` there, and the function comes back `undefined`.
    /** @param {Date} d */
    const isDisabled = (d) => {
      const key = dayOfDate(d);
      return off || key < today || !days[key];
    };
    return isDisabled;
  }

  /**
   * The seven days of the week that holds `key`.
   * @param {string} key
   * @param {number} first
   */
  function weekOf(key, first) {
    const start = addDays(key, -((weekday(key) - first + 7) % 7));
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }

  $: days = view === "week" ? weekOf(weekStart, firstDow) : date ? [date] : [];
  $: columns = days.map((key) => {
    const daySlots = byDay[key] ?? [];
    const times = formatSlotTimes(daySlots, {
      locale,
      timeZone: zone,
      hourCycle,
    });
    return {
      key,
      current: key === date,
      title: formatDay(key, locale, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
      weekday: formatDay(key, locale, { weekday: "short" }),
      dayOfMonth: formatDay(key, locale, { day: "numeric" }),
      groupDay: formatDay(key, locale, {
        weekday: "long",
        month: "short",
        day: "numeric",
      }),
      slots: daySlots.map((slot, i) => ({ id: slot.id, text: times[i] })),
    };
  });
  $: tabId = pickTabId(columns, rovingId, checkedId, date);

  /**
   * Only the current day's times are candidates when a day is chosen, so
   * the tab stop is never in a column that is hidden on a narrow page.
   * @param {typeof columns} all
   * @param {string | null} roving
   * @param {string | null} checked
   * @param {string | null} day
   */
  function pickTabId(all, roving, checked, day) {
    const current = all.find((column) => column.key === day);
    const pool = (current?.slots.length ? [current] : all).flatMap(
      (column) => column.slots,
    );
    const ids = pool.map((slot) => slot.id);
    if (roving && ids.includes(roving)) return roving;
    if (checked && ids.includes(checked)) return checked;
    return ids[0] ?? null;
  }

  // The months the times on show come from, and with the one on show in
  // the calendar, the months to fetch.
  $: viewMonths = [
    ...new Set(
      days.length > 0 ? days.map((key) => key.slice(0, 7)) : [shownMonth],
    ),
  ];
  $: needed = [...new Set([shownMonth, ...viewMonths])];
  $: statuses = viewMonths.map((month) =>
    statusOf(entries, month, zone, loadSlots),
  );
  $: loading = statuses.includes("loading");
  $: failed = statuses.includes("error");
  $: busy = loading || seeking;
  $: baseLoaded =
    statusOf(entries, (date ?? todayKey).slice(0, 7), zone, loadSlots) ===
    "loaded";

  $: if (mounted && loadSlots) {
    for (const month of needed) ensure(month, zone, false);
  }
  $: if (
    mounted &&
    loadSlots &&
    prefetch &&
    statusOf(entries, shownMonth, zone, loadSlots) === "loaded"
  ) {
    ensure(addMonths(shownMonth, 1), zone, true);
  }

  // Searches onward for the next day with a time, a month at a time.
  $: if (mounted && loadSlots && baseLoaded && !nextDay && !dayHasSlots) {
    seek(date ?? todayKey, zone);
  }

  /**
   * Fetch one month unless it is loaded or on its way.
   * @param {string} month
   * @param {string} tz
   * @param {boolean} quiet A prefetch reports nothing when it fails, and
   * does not try a month again that failed.
   * @returns {Promise<void>}
   */
  function ensure(month, tz, quiet) {
    if (!loadSlots) return Promise.resolve();
    const { from, to } = monthWindow(month, tz);
    const key = `${from}:${to}`;
    const pending = inflight.get(key);
    if (pending) return pending;
    const current = entries[key];
    if (current && (quiet || current.status !== "error")) {
      return Promise.resolve();
    }
    const run = generation;
    // State is written after the caller's update, not during it: Svelte 3
    // and 4 run a `$:` statement once per update, so a write made from one
    // would not reach the statements that read it.
    const request = Promise.resolve()
      .then(() => {
        if (run !== generation) return undefined;
        entries = { ...entries, [key]: { status: "loading", slots: [] } };
        return loadSlots?.({
          from: new Date(from),
          to: new Date(to),
          month,
          timeZone: tz,
          signal: controller.signal,
        });
      })
      .then(
        (result) => {
          if (run !== generation) return;
          entries = {
            ...entries,
            [key]: { status: "loaded", slots: result ?? [] },
          };
        },
        (error) => {
          if (run !== generation) return;
          entries = { ...entries, [key]: { status: "error", slots: [] } };
          if (!quiet) dispatch("error", { error, month });
        },
      )
      .then(() => {
        if (inflight.get(key) === request) inflight.delete(key);
      });
    inflight.set(key, request);
    return request;
  }

  /**
   * @param {string} from
   * @param {string} tz
   */
  async function seek(from, tz) {
    const token = `${tz}|${from}|${generation}`;
    if (seekedFor === token) return;
    seekedFor = token;
    // After the update, so what the caller read has settled.
    await tick();
    if (seekedFor !== token) return;
    if (nextDay || dayHasSlots) {
      seekedFor = "";
      return;
    }
    seeking = true;
    const start = from.slice(0, 7);
    for (let i = 1; i <= lookahead; i++) {
      // The months are searched in order, and each answer decides whether
      // the next is needed.
      // eslint-disable-next-line no-await-in-loop -- one month at a time
      await ensure(addMonths(start, i), tz, true);
      // eslint-disable-next-line no-await-in-loop -- let the answer settle
      await tick();
      if (seekedFor !== token || nextDay) break;
    }
    if (seekedFor === token) seeking = false;
  }

  function retry() {
    ensure(shownMonth, zone, false);
    if (date && date.slice(0, 7) !== shownMonth) {
      ensure(date.slice(0, 7), zone, false);
    }
  }

  /** @param {string} key */
  function selectDay(key) {
    if (key === date) return;
    date = lastDate = key;
    if (key.slice(0, 7) !== monthOfDate(calendarMonth)) {
      calendarMonth = dateOfDay(key);
    }
  }

  /** @param {CustomEvent<{ value: Date }>} event */
  function onDayChange(event) {
    selectDay(dayOfDate(event.detail.value));
  }

  async function jumpToNext() {
    if (!nextDay) return;
    selectDay(nextDay);
    await tick();
    /** @type {HTMLElement | null | undefined} */ (
      ref?.querySelector('[role="radio"][tabindex="0"]')
    )?.focus();
  }

  /**
   * @param {{ id: string }} slot
   * @param {string} key
   */
  function pick(slot, key) {
    if (disabled) return;
    const changed = checkedId !== slot.id;
    value = lastValue = slot.id;
    selectDay(key);
    if (!changed) return;
    const end = openSlots.find((s) => s.id === slot.id)?.end;
    dispatch("change", {
      value: slot.id,
      end: new Date(
        end ?? Date.parse(slot.id) + duration * 60_000,
      ).toISOString(),
      date: key,
      timeZone: zone,
    });
  }

  // The three statements below write `date` and `calendarMonth` directly,
  // not through a function, so Svelte 3 and 4 order them before the
  // statements that read those.
  //
  // A value set from outside moves the day on show to its day.
  $: if (value !== lastValue) {
    lastValue = value;
    if (!Number.isNaN(toMs(value))) date = dayKey(toMs(value), zone);
  }

  // A chosen time stays the same instant when the zone changes, so the
  // day follows it, and may be the next or the previous one.
  $: if (lastZone === null) {
    lastZone = zone;
  } else if (zone !== lastZone) {
    lastZone = zone;
    if (!Number.isNaN(valueMs)) date = dayKey(valueMs, zone);
  }

  // A day set from outside brings its month into view.
  $: if (date !== lastDate) {
    lastDate = date;
    if (date && date.slice(0, 7) !== monthOfDate(calendarMonth)) {
      calendarMonth = dateOfDay(date);
    }
  }

  /** @type {string[]} */
  $: zoneOptions = timeZones ? withZone(timeZones, zone) : [];

  /**
   * @param {ReadonlyArray<string>} list
   * @param {string} current
   */
  function withZone(list, current) {
    const valid = [...new Set(list.filter(isValidTimeZone))];
    return valid.includes(current) ? valid : [current, ...valid];
  }

  /** @param {CustomEvent<string | number>} event */
  function onZoneUpdate(event) {
    const next = String(event.detail);
    if (next === zone) return;
    timeZone = next;
    dispatch("zonechange", { timeZone: next });
  }

  $: announcement = busy
    ? loadingText
    : failed
      ? errorText
      : date
        ? dayHasSlots
          ? availableText(
              byDay[date].length,
              formatDay(date, locale, {
                weekday: "long",
                month: "short",
                day: "numeric",
              }),
            )
          : emptyText
        : "";

  $: nextDayText = nextDay ? nextAvailableText(formatDay(nextDay, locale)) : "";

  /** @param {FocusEvent} event */
  function onFocusIn(event) {
    const id = /** @type {HTMLElement} */ (event.target).dataset?.slot;
    if (id) rovingId = id;
  }

  /**
   * Arrow keys move through the times, and choose the one they land on,
   * as in a radio group. In a grid, Up and Down move a row. Where the
   * times are in columns, Left and Right move to the next day.
   * @param {KeyboardEvent} event
   */
  function onKeydown(event) {
    const target = /** @type {HTMLElement} */ (event.target);
    const current = target.closest?.('[role="radio"]');
    if (!current || hasModifierKey(event)) return;
    const rtl = resolveLayoutDirection($layoutDirection, ref) === "rtl";
    const group = /** @type {HTMLElement} */ (
      current.closest('[role="radiogroup"]')
    );
    // The week view hides the days other than the chosen one when it is narrow.
    const visible = (/** @type {Element} */ root) =>
      /** @type {HTMLElement[]} */ (
        Array.from(root.querySelectorAll('[role="radio"]'))
      ).filter((item) => {
        const column = item.closest(".bx--booking-slots__column");
        return !column || getComputedStyle(column).display !== "none";
      });
    const own = visible(group);
    const index = own.indexOf(/** @type {HTMLElement} */ (current));
    const top = own[0].offsetTop;
    const perRow = own.filter((item) => item.offsetTop === top).length;
    const rows = Math.floor((own.length - 1) / perRow);
    const row = Math.floor(index / perRow);
    const inline = rtl ? -1 : 1;
    /** @type {HTMLElement | undefined} */
    let next;
    switch (event.key) {
      case "ArrowDown":
        if (row < rows) next = own[Math.min(index + perRow, own.length - 1)];
        break;
      case "ArrowUp":
        if (row > 0) next = own[index - perRow];
        break;
      case "ArrowRight":
      case "ArrowLeft": {
        const step = (event.key === "ArrowRight" ? 1 : -1) * inline;
        if (perRow > 1) {
          next = own[index + step];
          break;
        }
        const groups = /** @type {HTMLElement[]} */ (
          Array.from(ref?.querySelectorAll('[role="radiogroup"]') ?? [])
        ).filter((item) => visible(item).length > 0);
        const sibling = groups[groups.indexOf(group) + step];
        if (sibling) {
          const items = visible(sibling);
          next = items[Math.min(index, items.length - 1)];
        }
        break;
      }
      case "Home":
        next = own[0];
        break;
      case "End":
        next = own[own.length - 1];
        break;
      default:
        return;
    }
    event.preventDefault();
    if (!next || next === current) return;
    next.focus();
    next.click();
  }

  onMount(() => {
    mounted = true;
    clock = Date.now();
    const detected = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (isValidTimeZone(detected)) {
      detectedZone = detected;
      if (!timeZone) timeZone = detected;
    }
    const timer = setInterval(() => {
      clock = Date.now();
    }, 60_000);
    return () => {
      clearInterval(timer);
      controller.abort();
    };
  });
</script>

<div
  bind:this={ref}
  role="group"
  class:bx--booking-slots={true}
  class:bx--booking-slots--week={view === "week"}
  class:bx--booking-slots--disabled={disabled}
  aria-busy={busy ? "true" : undefined}
  {...$$restProps}
>
  <div class:bx--booking-slots__layout={true}>
    <div class:bx--booking-slots__calendar={true}>
      <DateCalendar
        bind:month={calendarMonth}
        value={calendarValue}
        today={calendarToday}
        minDate={calendarToday}
        isDateDisabled={isDayDisabled}
        {locale}
        {firstDayOfWeek}
        labelText={calendarLabelText}
        on:change={onDayChange}
      />
    </div>
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class:bx--booking-slots__times={true}
      on:keydown={onKeydown}
      on:focusin={onFocusIn}
    >
      <div class:bx--booking-slots__meta={true}>
        <p class:bx--booking-slots__zone-text={true}>{timeZoneText(zone)}</p>
        <p class:bx--booking-slots__duration={true}>
          <bdi>{durationText(duration)}</bdi>
        </p>
      </div>
      {#if zoneOptions.length > 1}
        <div class:bx--booking-slots__zone={true}>
          <Select
            hideLabel
            size="sm"
            labelText={timeZoneLabelText}
            selected={zone}
            {disabled}
            on:update={onZoneUpdate}
          >
            {#each zoneOptions as option (option)}
              <SelectItem value={option} text={option} />
            {/each}
          </Select>
        </div>
      {/if}
      <div class:bx--visually-hidden={true} role="status">{announcement}</div>
      {#if loading}
        <InlineLoading description={loadingText} />
      {:else if failed}
        <div class:bx--booking-slots__message={true}>
          <p role="alert">{errorText}</p>
          <Button kind="tertiary" size="sm" on:click={retry}>
            {retryText}
          </Button>
        </div>
      {:else}
        {#if !date}
          <div
            class:bx--booking-slots__message={true}
            class:bx--booking-slots__message--week-hidden={view === "week"}
          >
            <p>{noDateText}</p>
            {#if seeking}
              <InlineLoading description={loadingText} />
            {:else if nextDay}
              <Button
                kind="tertiary"
                size="sm"
                {disabled}
                on:click={jumpToNext}
              >
                {nextDayText}
              </Button>
            {/if}
          </div>
        {/if}
        {#if columns.length > 0}
          <div class:bx--booking-slots__columns={true}>
            {#each columns as column (column.key)}
              <div
                class:bx--booking-slots__column={true}
                class:bx--booking-slots__column--current={column.current}
              >
                <p class:bx--booking-slots__heading={true}>
                  <span class:bx--booking-slots__title={true}>
                    {column.title}
                  </span>
                  <span
                    class:bx--booking-slots__short-title={true}
                    aria-hidden="true"
                  >
                    <span>{column.weekday}</span>
                    <span>{column.dayOfMonth}</span>
                  </span>
                </p>
                {#if column.slots.length > 0}
                  <div
                    class:bx--booking-slots__slots={true}
                    role="radiogroup"
                    aria-label={timesLabelText(column.groupDay)}
                  >
                    {#each column.slots as slot (slot.id)}
                      <button
                        type="button"
                        role="radio"
                        class:bx--booking-slots__slot={true}
                        class:bx--booking-slots__slot--selected={slot.id ===
                          checkedId}
                        aria-checked={slot.id === checkedId ? "true" : "false"}
                        tabindex={slot.id === tabId ? 0 : -1}
                        data-slot={slot.id}
                        {disabled}
                        on:click={() => pick(slot, column.key)}
                      >
                        <!-- Keeps "4:00 PM" in order on a right-to-left page. -->
                        <bdi>{slot.text}</bdi>
                      </button>
                    {/each}
                  </div>
                {:else if column.current}
                  <div class:bx--booking-slots__message={true}>
                    <p>{emptyText}</p>
                    {#if seeking}
                      <InlineLoading description={loadingText} />
                    {:else if nextDay}
                      <Button
                        kind="tertiary"
                        size="sm"
                        {disabled}
                        on:click={jumpToNext}
                      >
                        {nextDayText}
                      </Button>
                    {/if}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>
