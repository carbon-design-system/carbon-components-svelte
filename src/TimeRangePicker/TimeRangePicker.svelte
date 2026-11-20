<script>
  /**
   * @typedef {import("../utils/time-range.js").TimeRangeValue} TimeRangeValue
   * @typedef {import("../utils/time-range.js").TimeRangePreset} TimeRangePreset
   * @typedef {import("../utils/time-range.js").TimeRangeProblem} TimeRangeProblem
   * @typedef {"quickRanges" | "customRange" | "absolute" | "relative" | "from" | "to" | "startDate" | "endDate" | "startTime" | "endTime" | "timeZone" | "refreshEvery" | "refreshOff" | "refresh" | "previous" | "next" | "zoomOut" | "apply" | "relativeHelp" | "timeHelp" | TimeRangeProblem} TimeRangePickerTranslationId
   * @typedef {object} TimeRangeRangeTextContext
   * @property {TimeRangePreset[]} ranges
   * @property {string} locale
   * @property {string} timeZone
   * @property {number | undefined} now
   * @property {number} weekStart
   * @property {"h12" | "h23"} hourCycle
   * @typedef {object} TimeRangeChangeDetail
   * @property {TimeRangeValue} value
   * @property {string} timeZone
   * @property {Date} start
   * @property {Date} end
   * @property {"preset" | "apply" | "step" | "zoom"} trigger
   * @typedef {object} TimeRangeRefreshDetail
   * @property {TimeRangeValue} value
   * @property {string} timeZone
   * @property {Date} start
   * @property {Date} end
   * @property {"interval" | "button" | "visible"} trigger
   */

  /**
   * @event {TimeRangeChangeDetail} change
   * @event {TimeRangeRefreshDetail} refresh
   * @event open
   * @event close
   */

  /**
   * @restProps {div}
   */

  /**
   * The range: `{ from, to }`, each an absolute instant
   * (`"2026-11-06T14:00:00.000Z"`) or a relative expression (`"now-15m"`,
   * `"now/d"`). A relative range stays relative, so it can be saved or
   * shared as "last 15 minutes". Use `resolveRange` for the instants.
   * @type {TimeRangeValue}
   * @bindable writable
   */
  export let value = { from: "now-15m", to: "now" };

  /**
   * The IANA time zone the range is read and shown in, such as
   * `"Europe/Berlin"`. Left unset, it is the browser's, found after mount;
   * the server and the first render use `"UTC"`. Set it on the server and
   * the browser alike when the range is absolute.
   * @type {string | undefined}
   * @bindable writable
   */
  export let timeZone = undefined;

  /**
   * Seconds between `refresh` events, or `0` for none. Events stop while the
   * tab is hidden. Needs `refresh="auto"` to be chosen in the panel.
   * @bindable writable
   */
  export let refreshInterval = 0;

  /**
   * What the refresh controls offer: `"none"`, a refresh button, or `"auto"`
   * for the button and a "Refresh every" choice in the panel.
   * @type {"none" | "button" | "auto"}
   */
  export let refresh = "none";

  /**
   * The intervals the "Refresh every" choice lists, in seconds.
   * @type {number[]}
   */
  export let refreshIntervals = [5, 10, 30, 60, 300, 900, 1800, 3600];

  /**
   * The quick ranges. Ranges with the same `group` sit under one heading.
   * @type {TimeRangePreset[]}
   */
  export let ranges = defaultTimeRanges;

  /**
   * The time zones the panel lists. Defaults to every zone the browser knows.
   * @type {string[] | undefined}
   */
  export let timeZones = undefined;

  /**
   * Set to `true` to show the back, forward and zoom-out buttons beside the
   * trigger.
   */
  export let stepping = false;

  /**
   * The earliest start and latest end that can be chosen: a `Date`, an
   * ISO string or a bound such as `"now-30d"` or `"now"`. `max` also stops
   * the forward button.
   * @type {Date | number | string | undefined}
   */
  export let min = undefined;

  /** @type {Date | number | string | undefined} */
  export let max = undefined;

  /**
   * The longest and shortest range allowed: `"7d"`, `"90m"`, `"3M"`.
   * @type {string | number | undefined}
   */
  export let maxRange = undefined;

  /** @type {string | number | undefined} */
  export let minRange = undefined;

  /**
   * The instant `now` stands for. Left unset it is the clock. Set it to
   * render the same range on the server and in tests.
   * @type {Date | number | string | undefined}
   */
  export let now = undefined;

  /**
   * A language tag. Sets the month names, the date format and the first
   * day of the week. Never read from the browser, so the server and the
   * browser agree.
   */
  export let locale = "en";

  /**
   * First day of the week, 0 (Sunday) to 6, for `now/w`. Defaults to the
   * locale's. Pin it when a shared link must mean the same week everywhere.
   * @type {number | undefined}
   */
  export let weekStart = undefined;

  /**
   * The clock of the times in the trigger.
   * @type {"h12" | "h23"}
   */
  export let hourCycle = "h23";

  /**
   * Set to `true` to open the panel.
   * @bindable writable
   */
  export let open = false;

  /**
   * Specify the size of the trigger and the buttons.
   * @type {"sm" | "md" | "lg"}
   */
  export let size = "md";

  /**
   * Where the panel opens, as `Popover`'s `align`.
   * @type {"bottom-start" | "bottom" | "bottom-end" | "top-start" | "top" | "top-end"}
   */
  export let align = "bottom-start";

  /** Set to `true` to disable the trigger and the buttons. */
  export let disabled = false;

  /**
   * Names the control. The trigger reads it before the range.
   */
  export let labelText = "Time range";

  /**
   * Override the text of the interface. Return `undefined` to keep the
   * English text for an id.
   * @type {((id: TimeRangePickerTranslationId) => string | undefined) | undefined}
   */
  export let translateWithId = undefined;

  /**
   * The trigger's text for a range. The default names a quick range, a
   * rolling or calendar range ("Last 15 minutes", "Yesterday") and writes
   * an absolute one as "Nov 6, 09:00 – 12:30 (UTC−5)".
   * @type {(value: TimeRangeValue, context: TimeRangeRangeTextContext) => string}
   */
  export let rangeText = function rangeText(value, context) {
    const preset = context.ranges.find((range) => sameTimeRange(range, value));
    return preset ? preset.text : formatTimeRange(value, context);
  };

  /**
   * The label of a refresh interval, from its seconds: "30s", "5m", "1h".
   * @type {(seconds: number) => string}
   */
  export let intervalText = function intervalText(seconds) {
    if (seconds % 3600 === 0) return `${seconds / 3600}h`;
    if (seconds % 60 === 0) return `${seconds / 60}m`;
    return `${seconds}s`;
  };

  /**
   * What a screen reader hears when a range is applied.
   * @type {(text: string) => string}
   */
  export let appliedText = function appliedText(text) {
    return `Time range set to ${text}`;
  };

  /**
   * Set an id; inner ids derive from it.
   */
  export let id = uniqueId();

  /**
   * Obtain a reference to the trigger button.
   * @bindable readonly
   * @type {null | HTMLButtonElement}
   */
  export let ref = null;

  import { createEventDispatcher, onMount, tick } from "svelte";
  import Button from "../Button/Button.svelte";
  import ContainedList from "../ContainedList/ContainedList.svelte";
  import ContainedListItem from "../ContainedList/ContainedListItem.svelte";
  import ContentSwitcher from "../ContentSwitcher/ContentSwitcher.svelte";
  import Switch from "../ContentSwitcher/Switch.svelte";
  import DatePicker from "../DatePicker/DatePicker.svelte";
  import DatePickerInput from "../DatePicker/DatePickerInput.svelte";
  import Layer from "../Layer/Layer.svelte";
  import ListBox from "../ListBox/ListBox.svelte";
  import ListBoxMenuIcon from "../ListBox/ListBoxMenuIcon.svelte";
  import Popover from "../Popover/Popover.svelte";
  import Select from "../Select/Select.svelte";
  import SelectItem from "../Select/SelectItem.svelte";
  import TextInput from "../TextInput/TextInput.svelte";
  import TimePicker from "../TimePicker/TimePicker.svelte";
  import ChevronLeft from "../icons/ChevronLeft.svelte";
  import ChevronRight from "../icons/ChevronRight.svelte";
  import Renew from "../icons/Renew.svelte";
  import Time from "../icons/Time.svelte";
  import ZoomOut from "../icons/ZoomOut.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { dismiss } from "../utils/dismiss.js";
  import { createOpenCloseDispatcher } from "../utils/dispatch-open-close.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import { isOutsideClick } from "../utils/is-outside-click.js";
  import { rovingFocus } from "../utils/roving-focus.js";
  import {
    defaultTimeRanges,
    formatTimeRange,
    formatUtcOffset,
    fromDateTimeFields,
    isTimeZone,
    listTimeZones,
    normalizeTimeBound,
    parseTimeBound,
    parseTimeRangeText,
    resolveRange,
    resolveWeekStart,
    sameTimeRange,
    stepRange,
    timeZoneOffset,
    toDateTimeFields,
    validateRange,
    zoomRange,
  } from "../utils/time-range.js";
  import { titleWhenTruncated } from "../utils/title-when-truncated.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();
  const notifyOpenChange = createOpenCloseDispatcher(dispatch);

  const translations = {
    quickRanges: "Quick ranges",
    customRange: "Custom range",
    absolute: "Absolute",
    relative: "Relative",
    from: "From",
    to: "To",
    startDate: "Start date",
    endDate: "End date",
    startTime: "Start time",
    endTime: "End time",
    timeZone: "Time zone",
    refreshEvery: "Refresh every",
    refreshOff: "Off",
    refresh: "Refresh",
    previous: "Previous time range",
    next: "Next time range",
    zoomOut: "Zoom out",
    apply: "Apply",
    relativeHelp: 'Such as now-2h, now/d or "last 90 minutes"',
    timeHelp: "24-hour time, such as 09:30",
    "invalid-from": "Enter a start such as now-2h, now/d or 2026-11-06 09:00.",
    "invalid-to": "Enter an end such as now, now/d or 2026-11-06 12:30.",
    order: "The end must be after the start.",
    "before-min": "The start is earlier than this range can go.",
    "after-max": "The end is later than this range can go.",
    "too-long": "The range is longer than it can be.",
    "too-short": "The range is shorter than it can be.",
  };

  /** @param {TimeRangePickerTranslationId} key */
  function t(key) {
    return translateWithId?.(key) || translations[key];
  }

  /** @type {null | HTMLSpanElement} */
  let rootRef = null;
  /** @type {null | HTMLDivElement} */
  let popoverRef = null;
  /** @type {null | HTMLDivElement} */
  let panelRef = null;
  /** @type {null | HTMLInputElement} */
  let fromRef = null;
  /** @type {null | HTMLInputElement} */
  let toRef = null;

  let mounted = false;
  /** @type {string | undefined} */
  let browserZone;
  // The panel's controls are built on the first open and kept.
  let built = false;

  // Naming and description belong on the trigger, which takes focus; the
  // rest go on the wrapper.
  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: wrapperProps,
  } = splitAriaNaming($$restProps));
  $: grouped = stepping || refresh !== "none";
  $: panelId = `${id}-panel`;
  $: zone = pickZone(timeZone, browserZone);
  $: effectiveWeekStart = weekStart ?? resolveWeekStart(locale);
  $: fixedNow = now === undefined ? undefined : +new Date(now);

  /**
   * @param {string | undefined} wanted
   * @param {string | undefined} detected
   */
  function pickZone(wanted, detected) {
    const zone = wanted || detected || "UTC";
    return isTimeZone(zone) ? zone : "UTC";
  }

  function nowMs() {
    return fixedNow ?? Date.now();
  }

  /** @param {string} zoneName */
  function engine(zoneName) {
    return {
      now: nowMs(),
      timeZone: zoneName,
      weekStart: effectiveWeekStart,
    };
  }

  /**
   * @param {TimeRangeValue} range
   * @param {string} zoneName
   */
  function textFor(range, zoneName) {
    return rangeText(range, {
      ranges,
      locale,
      timeZone: zoneName,
      now: fixedNow,
      weekStart: effectiveWeekStart,
      hourCycle,
    });
  }

  $: triggerText = rangeText(value, {
    ranges,
    locale,
    timeZone: zone,
    now: fixedNow,
    weekStart: effectiveWeekStart,
    hourCycle,
  });

  // Limits and the stepping buttons. The clock is read when this runs, so a
  // button can be stale between renders; a click reads it again.
  $: limits = { min, max, maxRange, minRange };
  $: backTarget = steppedTo(
    value,
    -1,
    zone,
    effectiveWeekStart,
    fixedNow,
    limits,
  );
  $: forwardTarget = steppedTo(
    value,
    1,
    zone,
    effectiveWeekStart,
    fixedNow,
    limits,
  );
  $: zoomTarget = zoomedTo(value, zone, effectiveWeekStart, fixedNow, limits);

  /**
   * @param {TimeRangeValue} range
   * @param {-1 | 1} direction
   * @param {string} zoneName
   * @param {number} week
   * @param {number | undefined} fixed
   * @param {typeof limits} bounds
   */
  function steppedTo(range, direction, zoneName, week, fixed, bounds) {
    const next = stepRange(range, direction, {
      now: fixed ?? Date.now(),
      timeZone: zoneName,
      weekStart: week,
      max: bounds.max,
    });
    return next && fits(next, zoneName, week, fixed, bounds) ? next : null;
  }

  /**
   * @param {TimeRangeValue} range
   * @param {string} zoneName
   * @param {number} week
   * @param {number | undefined} fixed
   * @param {typeof limits} bounds
   */
  function zoomedTo(range, zoneName, week, fixed, bounds) {
    const next = zoomRange(range, 2, {
      now: fixed ?? Date.now(),
      timeZone: zoneName,
      weekStart: week,
      max: bounds.max,
    });
    return next && fits(next, zoneName, week, fixed, bounds) ? next : null;
  }

  /**
   * @param {TimeRangeValue} range
   * @param {string} zoneName
   * @param {number} week
   * @param {number | undefined} fixed
   * @param {typeof limits} bounds
   */
  function fits(range, zoneName, week, fixed, bounds) {
    return validateRange(range, {
      now: fixed ?? Date.now(),
      timeZone: zoneName,
      weekStart: week,
      ...bounds,
    }).valid;
  }

  // ---------------------------------------------------------------------
  // Committing a range
  // ---------------------------------------------------------------------

  let status = "";

  /**
   * @param {TimeRangeValue} next
   * @param {string} nextZone
   * @param {"preset" | "apply" | "step" | "zoom"} trigger
   */
  function commit(next, nextZone, trigger) {
    value = next;
    if (nextZone !== zone) timeZone = nextZone;
    const resolved = resolveRange(next, engine(nextZone));
    status = appliedText(textFor(next, nextZone));
    dispatch("change", {
      value: next,
      timeZone: nextZone,
      start: resolved.start,
      end: resolved.end,
      trigger,
    });
  }

  function stepBack() {
    const next = steppedTo(
      value,
      -1,
      zone,
      effectiveWeekStart,
      fixedNow,
      limits,
    );
    if (next) commit(next, zone, "step");
  }

  function stepForward() {
    const next = steppedTo(
      value,
      1,
      zone,
      effectiveWeekStart,
      fixedNow,
      limits,
    );
    if (next) commit(next, zone, "step");
  }

  function zoomOut() {
    const next = zoomedTo(value, zone, effectiveWeekStart, fixedNow, limits);
    if (next) commit(next, zone, "zoom");
  }

  // ---------------------------------------------------------------------
  // Refresh
  // ---------------------------------------------------------------------

  /** @type {ReturnType<typeof setInterval> | undefined} */
  let timer;
  let lastRefresh = 0;

  $: restartTimer(mounted, refresh === "auto" ? refreshInterval : 0);

  /**
   * @param {boolean} isMounted
   * @param {number} seconds
   */
  function restartTimer(isMounted, seconds) {
    clearInterval(timer);
    timer = undefined;
    if (!isMounted || !(seconds > 0) || document.hidden) return;
    lastRefresh = Date.now();
    timer = setInterval(() => emitRefresh("interval"), seconds * 1000);
  }

  /** @param {"interval" | "button" | "visible"} trigger */
  function emitRefresh(trigger) {
    lastRefresh = Date.now();
    const resolved = resolveRange(value, engine(zone));
    dispatch("refresh", {
      value,
      timeZone: zone,
      start: resolved.start,
      end: resolved.end,
      trigger,
    });
  }

  function handleVisibility() {
    if (document.hidden) {
      clearInterval(timer);
      timer = undefined;
      return;
    }
    const seconds = refresh === "auto" ? refreshInterval : 0;
    if (!(seconds > 0)) return;
    // Ticks that came due while the tab was hidden collapse into one.
    const due = Date.now() - lastRefresh >= seconds * 1000;
    restartTimer(true, seconds);
    if (due) emitRefresh("visible");
  }

  onMount(() => {
    browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    mounted = true;
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
      cancelAnimationFrame(enableFrame);
    };
  });

  // ---------------------------------------------------------------------
  // The panel
  // ---------------------------------------------------------------------

  /** @type {"absolute" | "relative"} */
  let mode = "relative";
  let draftFrom = "";
  let draftTo = "";
  let startDate = "";
  let startTime = "";
  let endDate = "";
  let endTime = "";
  let draftZone = "UTC";
  let draftInterval = 0;
  let attempted = false;
  let fromVisited = false;
  let toVisited = false;
  let wasOpen = false;

  $: handleOpen(open);

  /** @param {boolean} isOpen */
  function handleOpen(isOpen) {
    if (isOpen === wasOpen) return;
    wasOpen = isOpen;
    if (!isOpen) return;
    built = true;
    startDraft();
  }

  function startDraft() {
    const bounds = [value.from, value.to].map(parseTimeBound);
    mode = bounds.every((bound) => bound && bound.kind !== "now")
      ? "absolute"
      : "relative";
    draftZone = zone;
    draftInterval = refreshInterval;
    draftFrom = value.from;
    draftTo = value.to;
    attempted = fromVisited = toVisited = false;
    fillAbsolute(value, zone);
  }

  /**
   * Show a range in the date and time fields.
   * @param {TimeRangeValue} range
   * @param {string} zoneName
   */
  function fillAbsolute(range, zoneName) {
    const { start, end } = resolveRange(range, engine(zoneName));
    if (Number.isNaN(+start) || Number.isNaN(+end)) return;
    ({ date: startDate, time: startTime } = toDateTimeFields(start, zoneName));
    ({ date: endDate, time: endTime } = toDateTimeFields(end, zoneName));
  }

  /**
   * The stored form of a typed bound: a relative expression without spaces,
   * or the ISO instant, so a saved value never depends on a time zone.
   * @param {string} text
   * @param {"from" | "to"} side
   * @param {string} zoneName
   */
  function toStored(text, side, zoneName) {
    const parsed = parseTimeBound(text);
    if (parsed?.kind === "now") return normalizeTimeBound(text);
    const { start, end } = resolveRange(
      { from: text, to: text },
      engine(zoneName),
    );
    return (side === "from" ? start : end).toISOString();
  }

  /** @type {Record<TimeRangeProblem, "from" | "to">} */
  const PROBLEM_FIELD = {
    "invalid-from": "from",
    "before-min": "from",
    "invalid-to": "to",
    order: "to",
    "after-max": "to",
    "too-long": "to",
    "too-short": "to",
  };

  /**
   * What the fields hold, as a range, or why they hold none.
   * @param {boolean} isBuilt
   * @param {"absolute" | "relative"} fieldMode
   * @param {string} fromText
   * @param {string} toText
   * @param {string} sDate
   * @param {string} sTime
   * @param {string} eDate
   * @param {string} eTime
   * @param {string} zoneName
   * @param {typeof limits} bounds
   * @returns {{ value?: TimeRangeValue, problem?: TimeRangePickerTranslationId, field?: "from" | "to" }}
   */
  function evaluateDraft(
    isBuilt,
    fieldMode,
    fromText,
    toText,
    sDate,
    sTime,
    eDate,
    eTime,
    zoneName,
    bounds,
  ) {
    if (!isBuilt) return {};
    /** @type {TimeRangeValue} */
    let candidate;
    if (fieldMode === "absolute") {
      const start = fromDateTimeFields({ date: sDate, time: sTime }, zoneName);
      const end = fromDateTimeFields({ date: eDate, time: eTime }, zoneName);
      if (Number.isNaN(start))
        return { problem: "invalid-from", field: "from" };
      if (Number.isNaN(end)) return { problem: "invalid-to", field: "to" };
      candidate = {
        from: new Date(start).toISOString(),
        to: new Date(end).toISOString(),
      };
    } else {
      if (!parseTimeBound(fromText)) {
        return { problem: "invalid-from", field: "from" };
      }
      if (!parseTimeBound(toText)) {
        return { problem: "invalid-to", field: "to" };
      }
      candidate = {
        from: toStored(fromText, "from", zoneName),
        to: toStored(toText, "to", zoneName),
      };
    }
    const result = validateRange(candidate, {
      ...engine(zoneName),
      ...bounds,
    });
    if (result.valid) return { value: candidate };
    return { problem: result.problem, field: PROBLEM_FIELD[result.problem] };
  }

  $: draft = evaluateDraft(
    built,
    mode,
    draftFrom,
    draftTo,
    startDate,
    startTime,
    endDate,
    endTime,
    draftZone,
    limits,
  );

  // A start or end that does not read waits for the person to leave the
  // field. A limit that is broken shows at once.
  /**
   * @param {"from" | "to"} field
   * @param {typeof draft} state
   * @param {boolean} seen
   * @param {boolean} tried
   */
  function problemFor(field, state, seen, tried) {
    const { problem } = state;
    if (!problem || state.field !== field) return "";
    const syntax = problem === "invalid-from" || problem === "invalid-to";
    return !syntax || seen || tried ? t(problem) : "";
  }

  $: fromProblem = problemFor("from", draft, fromVisited, attempted);
  $: toProblem = problemFor("to", draft, toVisited, attempted);

  function apply() {
    attempted = true;
    const { value: next } = draft;
    if (!next) {
      tick().then(() => {
        const target = draft.field === "to" ? toRef : fromRef;
        target?.focus();
      });
      return;
    }
    if (refresh === "auto") refreshInterval = draftInterval;
    commit(next, draftZone, "apply");
    closePanel();
  }

  /** @param {{ from: string, to: string }} preset */
  function pickPreset(preset) {
    if (refresh === "auto") refreshInterval = draftInterval;
    commit({ from: preset.from, to: preset.to }, draftZone, "preset");
    closePanel();
  }

  /** @param {CustomEvent<number>} event */
  function handleMode(event) {
    const next = event.detail === 0 ? "absolute" : "relative";
    if (next === mode) return;
    if (draft.value) {
      if (next === "absolute") fillAbsolute(draft.value, draftZone);
      else {
        draftFrom = draft.value.from;
        draftTo = draft.value.to;
      }
    }
    mode = next;
  }

  /** @param {CustomEvent<string | number>} event */
  function handleZone(event) {
    const next = String(event.detail);
    if (next === draftZone) return;
    // The instants stay, and the fields show them in the new zone.
    if (mode === "absolute" && draft.value) fillAbsolute(draft.value, next);
    draftZone = next;
  }

  // "last 90 minutes" in the first box fills both.
  function expandRangeText() {
    fromVisited = true;
    if (parseTimeBound(draftFrom)) return;
    const range = parseTimeRangeText(draftFrom);
    if (range) {
      draftFrom = range.from;
      draftTo = range.to;
    }
  }

  // ---------------------------------------------------------------------
  // The time zone list
  // ---------------------------------------------------------------------

  $: zoneItems = built ? buildZoneItems(timeZones, zone, nowMs()) : [];

  /**
   * @param {string[] | undefined} wanted
   * @param {string} current
   * @param {number} at
   */
  function buildZoneItems(wanted, current, at) {
    const names = wanted ?? listTimeZones([current]);
    const all = names.includes(current) ? names : [current, ...names];
    return all.filter(isTimeZone).map((name) => ({
      name,
      text: `${name} (${formatUtcOffset(timeZoneOffset(at, name))})`,
    }));
  }

  // ---------------------------------------------------------------------
  // Opening and closing
  // ---------------------------------------------------------------------

  $: notifyOpenChange(open);

  let listenersEnabled = false;
  /** @type {number} */
  let enableFrame;

  // The window listeners start a frame after opening, so the click that
  // opened the panel from outside does not close it again.
  $: if (typeof requestAnimationFrame !== "undefined") {
    cancelAnimationFrame(enableFrame);
    if (open) {
      enableFrame = requestAnimationFrame(() => {
        if (open) listenersEnabled = true;
      });
    } else {
      listenersEnabled = false;
    }
  }

  $: insideElements = [rootRef, popoverRef];

  function toggle() {
    if (disabled) return;
    if (open) closePanel();
    else openPanel();
  }

  function openPanel() {
    open = true;
    tick().then(focusPanel);
  }

  function closePanel() {
    const hadFocus = !!panelRef?.contains(document.activeElement);
    open = false;
    if (hadFocus) ref?.focus();
  }

  function focusPanel() {
    const current = panelRef?.querySelector(
      '.bx--contained-list-item__content[tabindex="0"]',
    );
    const first = panelRef?.querySelector("button, input, select");
    /** @type {HTMLElement | null | undefined} */ (current ?? first)?.focus();
  }

  /** @param {Event} event */
  function handleOutsideClick(event) {
    if (open && isOutsideClick(event, insideElements)) open = false;
  }

  /** @param {FocusEvent} event */
  function handleFocusout(event) {
    const next = /** @type {Node | null} */ (event.relatedTarget);
    // Clicking text, or a day the calendar redraws, leaves no target.
    if (!open || next === null) return;
    if (!insideElements.some((node) => node?.contains(next))) open = false;
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (!open || event.key !== "Escape" || isImeComposition(event)) return;
    event.stopPropagation();
    closePanel();
  }

  /** @param {KeyboardEvent} event */
  function handleTriggerKeydown(event) {
    if (event.key === "ArrowDown" && !open && !disabled) {
      event.preventDefault();
      openPanel();
    }
  }

  // ---------------------------------------------------------------------
  // Quick ranges
  // ---------------------------------------------------------------------

  $: groups = groupRanges(ranges);
  $: currentPresetId = ranges.find((range) => sameTimeRange(range, value))?.id;
  let quickStop = "";
  $: quickStopId =
    quickStop && ranges.some((range) => range.id === quickStop)
      ? quickStop
      : (currentPresetId ?? ranges[0]?.id);

  /** @param {TimeRangePreset[]} list */
  function groupRanges(list) {
    /** @type {{ name: string | undefined, items: TimeRangePreset[] }[]} */
    const result = [];
    for (const range of list) {
      const last = result[result.length - 1];
      if (last && last.name === range.group) last.items.push(range);
      else result.push({ name: range.group, items: [range] });
    }
    return result;
  }

  function quickItems() {
    return /** @type {HTMLElement[]} */ (
      Array.from(
        panelRef?.querySelectorAll(".bx--contained-list-item__content") ?? [],
      )
    );
  }

  /** @param {FocusEvent} event */
  function handleQuickFocus(event) {
    const item = /** @type {HTMLElement} */ (event.target).closest(
      "[data-range-id]",
    );
    if (item instanceof HTMLElement && item.dataset.rangeId) {
      quickStop = item.dataset.rangeId;
    }
  }

  /** @type {"small" | "field" | undefined} */
  let stepSize;
  $: stepSize = size === "lg" ? undefined : size === "sm" ? "small" : "field";
  /** @type {0 | 1 | 2 | 3 | 4 | 5 | 6} */
  let calendarWeekStart = 0;
  $: calendarWeekStart = /** @type {typeof calendarWeekStart} */ (
    effectiveWeekStart
  );
  $: listBoxSize = size;
  $: hasRefreshButton = refresh !== "none";
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  bind:this={rootRef}
  class:bx--time-range-picker={true}
  class:bx--time-range-picker--sm={size === "sm"}
  class:bx--time-range-picker--lg={size === "lg"}
  role={grouped ? "group" : undefined}
  aria-label={grouped ? labelText : undefined}
  use:dismiss={{
    enabled: listenersEnabled,
    listeners: [{ type: "click", handler: handleOutsideClick }],
  }}
  on:keydown={handleKeydown}
  on:focusout={handleFocusout}
  {...wrapperProps}
>
  {#if stepping}
    <Button
      kind="ghost"
      size={stepSize}
      icon={ChevronLeft}
      iconDescription={t("previous")}
      tooltipAlign="bottom"
      disabled={disabled || !backTarget}
      on:click={stepBack}
    />
  {/if}
  <span class:bx--time-range-picker__anchor={true}>
    <ListBox
      size={listBoxSize === "md" ? undefined : listBoxSize}
      {disabled}
      {open}
      type="default"
    >
      <button
        bind:this={ref}
        type="button"
        class:bx--list-box__field={true}
        aria-haspopup="dialog"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        aria-expanded={open}
        aria-controls={built ? panelId : undefined}
        {disabled}
        {id}
        on:click={toggle}
        on:keydown={handleTriggerKeydown}
      >
        <Time class="bx--time-range-picker__icon" />
        <span
          class:bx--list-box__label={true}
          class:bx--time-range-picker__text={true}
          use:titleWhenTruncated
        >
          <span class="bx--visually-hidden">{labelText}:{" "}</span
          >{triggerText}
        </span>
        <ListBoxMenuIcon {open} translateWithId={() => ""} />
      </button>
    </ListBox>
  </span>
  <!-- The group is the anchor, so a narrow page lines the panel up with the
  first button and not with the field. -->
  <Popover
    bind:ref={popoverRef}
    {open}
    {align}
    class="bx--time-range-picker__popover"
  >
    {#if built}
      <div
        bind:this={panelRef}
        id={panelId}
        class:bx--time-range-picker__panel={true}
        role="dialog"
        tabindex="-1"
        aria-label={labelText}
        on:keydown={handleKeydown}
        on:focusout={handleFocusout}
      >
        <form
          class:bx--time-range-picker__form={true}
          novalidate
          on:submit|preventDefault={apply}
        >
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div
            class:bx--time-range-picker__quick={true}
            use:rovingFocus={{
              selector: ".bx--contained-list-item__content",
              orientation: "vertical",
              wrap: false,
              focusOnMove: true,
              getActiveIndex: () =>
                quickItems().indexOf(
                  /** @type {HTMLElement} */ (document.activeElement),
                ),
            }}
            on:focusin={handleQuickFocus}
          >
            {#each groups as group, groupIndex (group.name ?? "")}
              <ContainedList
                id="{id}-quick-{groupIndex}"
                kind="disclosed"
                size="sm"
                labelText={group.name || t("quickRanges")}
              >
                {#each group.items as range (range.id)}
                  <ContainedListItem
                    interactive
                    selected={currentPresetId === range.id}
                    tabindex={quickStopId === range.id ? 0 : -1}
                    data-range-id={range.id}
                    on:click={() => pickPreset(range)}
                  >
                    {range.text}
                  </ContainedListItem>
                {/each}
              </ContainedList>
            {/each}
          </div>
          <Layer class="bx--time-range-picker__custom">
            <h2
              class:bx--time-range-picker__heading={true}
              id="{id}-custom-heading"
            >
              {t("customRange")}
            </h2>
            <ContentSwitcher
              size="sm"
              selectedIndex={mode === "absolute" ? 0 : 1}
              on:change={handleMode}
            >
              <Switch id="{id}-absolute" text={t("absolute")} />
              <Switch id="{id}-relative" text={t("relative")} />
            </ContentSwitcher>
            {#if mode === "absolute"}
              <div class:bx--time-range-picker__absolute={true}>
                <DatePicker
                  id="{id}-dates"
                  datePickerType="range"
                  dateFormat="Y-m-d"
                  inline
                  {locale}
                  firstDayOfWeek={calendarWeekStart}
                  bind:valueFrom={startDate}
                  bind:valueTo={endDate}
                >
                  <DatePickerInput
                    id="{id}-start-date"
                    labelText={t("startDate")}
                    placeholder="yyyy-mm-dd"
                  />
                  <DatePickerInput
                    id="{id}-end-date"
                    labelText={t("endDate")}
                    placeholder="yyyy-mm-dd"
                  />
                </DatePicker>
                <div class:bx--time-range-picker__times={true}>
                  <TimePicker
                    id="{id}-start-time"
                    bind:value={startTime}
                    bind:ref={fromRef}
                    labelText={t("startTime")}
                    placeholder="hh:mm"
                    pattern="([01]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?"
                    maxlength={8}
                    invalid={!!fromProblem}
                    invalidText={fromProblem}
                    on:blur={() => (fromVisited = true)}
                  />
                  <TimePicker
                    id="{id}-end-time"
                    bind:value={endTime}
                    bind:ref={toRef}
                    labelText={t("endTime")}
                    placeholder="hh:mm"
                    pattern="([01]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?"
                    maxlength={8}
                    invalid={!!toProblem}
                    invalidText={toProblem}
                    on:blur={() => (toVisited = true)}
                  />
                </div>
                <p class:bx--time-range-picker__help={true}>
                  {t("timeHelp")}
                </p>
              </div>
            {:else}
              <div class:bx--time-range-picker__relative={true}>
                <TextInput
                  id="{id}-from"
                  bind:value={draftFrom}
                  bind:ref={fromRef}
                  labelText={t("from")}
                  placeholder="now-2h"
                  helperText={t("relativeHelp")}
                  invalid={!!fromProblem}
                  invalidText={fromProblem}
                  on:blur={expandRangeText}
                />
                <TextInput
                  id="{id}-to"
                  bind:value={draftTo}
                  bind:ref={toRef}
                  labelText={t("to")}
                  placeholder="now"
                  invalid={!!toProblem}
                  invalidText={toProblem}
                  on:blur={() => (toVisited = true)}
                />
              </div>
            {/if}
          </Layer>
          <Layer class="bx--time-range-picker__footer">
            <Select
              id="{id}-zone"
              labelText={t("timeZone")}
              size="sm"
              selected={draftZone}
              on:update={handleZone}
            >
              {#each zoneItems as item (item.name)}
                <SelectItem value={item.name} text={item.text} />
              {/each}
            </Select>
            {#if refresh === "auto"}
              <Select
                id="{id}-refresh"
                labelText={t("refreshEvery")}
                size="sm"
                bind:selected={draftInterval}
              >
                <SelectItem value={0} text={t("refreshOff")} />
                {#each refreshIntervals as seconds (seconds)}
                  <SelectItem value={seconds} text={intervalText(seconds)} />
                {/each}
              </Select>
            {/if}
            <div class:bx--time-range-picker__actions={true}>
              <Button type="submit" size="field">{t("apply")}</Button>
            </div>
          </Layer>
        </form>
      </div>
    {/if}
  </Popover>
  {#if stepping}
    <Button
      kind="ghost"
      size={stepSize}
      icon={ChevronRight}
      iconDescription={t("next")}
      tooltipAlign="bottom"
      disabled={disabled || !forwardTarget}
      on:click={stepForward}
    />
    <Button
      kind="ghost"
      size={stepSize}
      icon={ZoomOut}
      iconDescription={t("zoomOut")}
      tooltipAlign="bottom"
      disabled={disabled || !zoomTarget}
      on:click={zoomOut}
    />
  {/if}
  {#if hasRefreshButton}
    <Button
      kind="ghost"
      size={stepSize}
      icon={Renew}
      iconDescription={t("refresh")}
      tooltipAlign="bottom-end"
      {disabled}
      on:click={() => emitRefresh("button")}
    />
  {/if}
  <span class:bx--visually-hidden={true} role="status" aria-live="polite">
    {status}
  </span>
</div>
