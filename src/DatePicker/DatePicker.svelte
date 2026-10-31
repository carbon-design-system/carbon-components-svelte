<script context="module">
  /** @param {any} value */
  function isRangeRule(value) {
    return value?.constructor === Object && "from" in value && "to" in value;
  }

  /** @param {any} a @param {any} b */
  function sameItem(a, b) {
    if (a === b) return true;
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime();
    }
    return (
      isRangeRule(a) &&
      isRangeRule(b) &&
      sameItem(a.from, b.from) &&
      sameItem(a.to, b.to)
    );
  }

  /**
   * Option props are primitives, functions, elements, `Date`s, or flat
   * arrays and objects of those. One rebuilt each render
   * (`minDate={new Date(...)}`, `disabledDates={[isWeekend]}`) arrives new
   * but equal, so compare one level deep: `Date`s by time, `{ from, to }`
   * rules by their ends, other items by identity.
   *
   * @param {any} a
   * @param {any} b
   */
  function sameValue(a, b) {
    if (sameItem(a, b)) return true;
    if (Array.isArray(a) && Array.isArray(b)) {
      return (
        a.length === b.length && a.every((item, i) => sameItem(item, b[i]))
      );
    }
    if (
      a?.constructor === Object &&
      b?.constructor === Object &&
      Object.keys(a).length === Object.keys(b).length
    ) {
      return Object.keys(a).every((key) => sameItem(a[key], b[key]));
    }
    return false;
  }

  /**
   * @param {string | { from: string; to: string }} atOpen
   * @param {string | { from: string; to: string }} atClose
   */
  function dateStrChanged(atOpen, atClose) {
    if (typeof atClose === "object") {
      const open = /** @type {{ from: string; to: string }} */ (atOpen);
      return open.from !== atClose.from || open.to !== atClose.to;
    }
    return atOpen !== atClose;
  }

  /**
   * @param {number[]} atOpen
   * @param {Date[]} dates
   */
  function selectedDatesChanged(atOpen, dates) {
    const atClose = (dates || []).map((date) => date.getTime());
    return (
      atClose.length !== atOpen.length ||
      atClose.some((time, index) => time !== atOpen[index])
    );
  }

  /**
   * @param {number} year
   * @param {number} month
   */
  function monthValue(year, month) {
    return year * 12 + month;
  }
</script>

<script>
  /**
   * @event {string | { selectedDates: [dateFrom: Date, dateTo?: Date]; dateStr: string | { from: string; to: string; } }} change
   */

  /**
   * @event {{ selectedDates: Date[]; dateStr: string | { from: string; to: string; } }} open
   */

  /**
   * @event close
   * @type {object}
   * @property {"escape-key" | "outside-click" | "select" | "programmatic"} trigger
   */

  /**
   * @event {null} clear
   */

  /**
   * Fires when the calendar is created and whenever it moves to another
   * month, year, or decade, with the first and last dates on show. Use it
   * to load data for the visible dates, such as `disabledDates`.
   * @event view
   * @type {object}
   * @property {Date} start
   * @property {Date} end
   */

  /**
   * @event error
   * @type {object}
   * @property {Error} error
   * @property {string} value
   */

  /**
   * Specify the date picker type.
   * Changing it after mount rebuilds the calendar.
   * `"week"` selects a whole week: a picked day becomes the first day of its
   * week, so `value` is that date in `dateFormat`. A `value` set from outside
   * is kept as given.
   * @type {"simple" | "single" | "range" | "month" | "quarter" | "year" | "week" | "multiple"}
   */
  export let datePickerType = "simple";

  /**
   * Specify the date picker input value.
   * Follows the inputs when the owning form resets.
   * @type {number | string}
   * @bindable writable
   */
  export let value = "";

  /**
   * Specify the date picker start date value (from).
   * Only works with the "range" date picker type.
   * Follows the inputs when the owning form resets.
   * @type {string}
   * @bindable writable
   */
  export let valueFrom = "";

  /**
   * Specify the date picker end date value (to).
   * Only works with the "range" date picker type.
   * Follows the inputs when the owning form resets.
   * @type {string}
   * @bindable writable
   */
  export let valueTo = "";

  /**
   * Specify the date format.
   * Use `"F Y"` or `"m/Y"` with `datePickerType="month"`, and `"Y"` with
   * `datePickerType="year"`.
   */
  export let dateFormat = "m/d/Y";

  /**
   * Specify a separate format for the text shown in the input, using the
   * same tokens as `dateFormat`. `value` and the submitted form field keep
   * using `dateFormat`.
   * Not supported with the "simple" and "range" date picker types.
   * @type {string | undefined}
   */
  export let displayFormat = undefined;

  /**
   * Specify the maximum date.
   * Changing it drops selected dates that fall outside, updating `value`
   * (or `valueFrom`/`valueTo`) and `selectedDates` without a `change` event.
   * @type {null | string | Date}
   */
  export let maxDate = null;

  /**
   * Specify the minimum date.
   * Changing it drops selected dates that fall outside, updating `value`
   * (or `valueFrom`/`valueTo`) and `selectedDates` without a `change` event.
   * @type {null | string | Date}
   */
  export let minDate = null;

  /**
   * @typedef {string | Date | { from: string | Date; to: string | Date } | ((date: Date) => boolean)} DatePickerDateRule
   */

  /**
   * Specify dates to disable in the calendar. A date matches a rule when it
   * equals a string or `Date`, falls within a `{ from, to }` range, or a
   * predicate function returns `true`. Strings follow `dateFormat`.
   * When `enabledDates` is also non-empty, `enabledDates` takes priority and
   * `disabledDates` is ignored, matching flatpickr.
   * Reassign the array to update an open calendar; mutating it in place
   * (`push`) is not reactive. If the currently selected date becomes
   * disabled by a rule change, it stays selected.
   * Only works with the "single", "range", and "multiple" date picker types.
   * @type {ReadonlyArray<DatePickerDateRule>}
   */
  export let disabledDates = [];

  /**
   * Specify the only dates to enable in the calendar; every other date is
   * disabled. Takes the same rule shapes as `disabledDates`. When both are
   * non-empty, `enabledDates` takes priority and `disabledDates` is ignored,
   * matching flatpickr.
   * Reassign the array to update an open calendar; mutating it in place
   * (`push`) is not reactive. If the currently selected date becomes
   * disabled by a rule change, it stays selected.
   * Only works with the "single", "range", and "multiple" date picker types.
   * @type {ReadonlyArray<DatePickerDateRule>}
   */
  export let enabledDates = [];

  /**
   * Specify the fewest days a range may span, counting both ends.
   * While the start is picked, days that would make a shorter range are
   * disabled. Typed and programmatic values are not checked.
   * Only works with the "range" date picker type.
   * @type {number | undefined}
   */
  export let minRangeDays = undefined;

  /**
   * Specify the most days a range may span, counting both ends.
   * While the start is picked, days that would make a longer range are
   * disabled. Typed and programmatic values are not checked.
   * Only works with the "range" date picker type.
   * @type {number | undefined}
   */
  export let maxRangeDays = undefined;

  /**
   * Specify the month to show when the calendar opens with no date
   * selected. Only the month and year are used; the day is ignored.
   * Values may be a Date, or a string in the same format as `dateFormat`.
   * Clamped into `minDate` / `maxDate` when it falls outside them.
   * Ignored once a date is selected, until the selection is cleared.
   * Only works with the "single", "range", and "multiple" date picker
   * types.
   * @type {null | string | Date}
   */
  export let initialMonth = null;

  /**
   * Specify the locale.
   * @type {string | Partial<import("./calendar-dates.js").CalendarLocale>}
   */
  export let locale = "en";

  /**
   * Specify the first day of the week, from 0 (Sunday) to 6 (Saturday).
   * Overrides the locale's own first day, which is used when unset.
   * @type {undefined | 0 | 1 | 2 | 3 | 4 | 5 | 6}
   */
  export let firstDayOfWeek = undefined;

  /**
   * Set to `true` to show each week's number beside it in the calendar.
   * Weeks are numbered per ISO 8601. The column is only shown with a
   * single month.
   */
  export let weekNumbers = false;

  /**
   * Set to `false` to allow picking from the calendar only: the field
   * stays focusable but can't be typed into.
   */
  export let allowInput = true;

  /** Set to `false` to keep the calendar open after a date is picked. */
  export let closeOnSelect = true;

  /**
   * Shortcut buttons beside the calendar, such as "Last 7 days". Each
   * `value` is called when the shortcut is shown or picked, so build it
   * from `today` rather than a fixed date; the `datePresets` helpers do.
   * Picking one sets the date (or range) and closes the calendar like a
   * picked day. Only for the "single" and "range" types.
   * @type {ReadonlyArray<import("./date-presets.js").DatePickerPreset>}
   */
  export let presets = [];

  /** Accessible name of the shortcut group. */
  export let presetsLabelText = "Shortcuts";

  /**
   * Parse typed text into a date. Receives the text and `dateFormat`;
   * return `undefined` for text that isn't a date.
   * @type {undefined | ((text: string, format: string) => Date | undefined)}
   */
  export let parseDate = undefined;

  /**
   * Format a date for the field. Receives the date and the format in use.
   * @type {undefined | ((date: Date, format: string) => string)}
   */
  export let formatDate = undefined;

  /**
   * Number of months the calendar shows side by side.
   * Not supported with the "week", "month", "quarter", and "year" types.
   * @type {1 | 2}
   */
  export let months = 1;

  /** Separator between dates in the field, with `datePickerType="multiple"`. */
  export let conjunction = ", ";

  /**
   * Show the month in the calendar header in full ("September") or short
   * ("Sep"), from the active `locale`.
   * @type {"long" | "short"}
   */
  export let monthLabel = "long";

  /**
   * Where a portalled calendar opens relative to its field: below, above,
   * or whichever fits.
   * @type {"auto" | "bottom" | "top"}
   */
  export let direction = "auto";

  /**
   * How a portalled calendar lines up with its field. `"start"` and `"end"`
   * follow the writing direction: in RTL, `"start"` is the right edge.
   * @type {"start" | "center" | "end"}
   */
  export let align = "start";

  /**
   * Position a portalled calendar against this element instead of the field.
   * @type {undefined | HTMLElement}
   */
  export let anchor = undefined;

  /**
   * Set to `true` to keep an initial value outside `minDate`/`maxDate` or
   * the enabled dates, instead of clearing it.
   */
  export let keepOutOfRangeValue = false;

  /**
   * Describe a day for screen readers, such as "2 events". The text is added
   * to the day's label, and the day gets a marker.
   * @type {undefined | ((date: Date) => string | undefined)}
   */
  export let dayDescription = undefined;

  /**
   * Add a class to a day, such as for holidays.
   * @type {undefined | ((date: Date) => string | undefined)}
   */
  export let dayClass = undefined;

  /** Set to `true` to animate the calendar as it opens. */
  export let animate = false;

  /**
   * Elements that count as part of the calendar: focusing or clicking them
   * doesn't close it, such as a "Today" button beside the field.
   * @type {ReadonlyArray<HTMLElement>}
   */
  export let keepOpenFor = [];

  /**
   * Accessible name of the calendar. Defaults to "Choose a date" (or a
   * month, quarter, or year, by `datePickerType`).
   * @type {string | undefined}
   */
  export let calendarLabelText = undefined;

  /**
   * Label of the button that shows the previous month. Defaults to
   * "Previous month" (or year, or decade, by `datePickerType`).
   * @type {string | undefined}
   */
  export let previousLabelText = undefined;

  /**
   * Label of the button that shows the next month. Defaults to "Next month"
   * (or year, or decade, by `datePickerType`).
   * @type {string | undefined}
   */
  export let nextLabelText = undefined;

  /**
   * Set to `true` to render the calendar permanently below the input
   * instead of in a popup. `open` and `close` events are not dispatched,
   * `portalMenu` is ignored, and the calendar stops accepting input while
   * the input is read-only or disabled.
   * Not supported with the "simple" date picker type.
   */
  export let inline = false;

  /**
   * Set to `true` to show a button that clears the date. It appears while
   * there is a value, and not while the input is read-only or disabled.
   * In range mode it sits on the end input and clears both dates.
   */
  export let clearable = false;

  /** Specify the ARIA label for the clear button. */
  export let clearButtonLabelText = "Clear date";

  /**
   * Set to `true` for a narrower field, sized for a short format such as
   * `dateFormat="m/y"`; a full date like `mm/dd/yyyy` is cut off. Only
   * applies to the `"simple"` type; on other types it logs a warning.
   */
  export let short = false;

  /**
   * Set to `true` to fill the parent's width instead of the fixed input width.
   * A range splits the width between its two inputs.
   */
  export let fullWidth = false;

  /**
   * Set to `true` to use the fluid variant.
   * Inherited from the parent `FluidForm` context,
   * so it does not need to be set when used inside `FluidForm`.
   */
  export let fluid = false;

  /**
   * Set to `true` to always render the calendar in a portal, or `false` to
   * keep it in place. Left unset, the calendar opens in a portal inside a
   * `Modal`, or when a box around it (`overflow` other than `visible`, such
   * as a `DataTable`) would cut it off.
   *
   * When the date picker is inside a native `<dialog>` (opened with
   * `showModal()`) or an open `[popover]` element, the calendar auto-mounts
   * into that top-layer ancestor and uses `position: fixed` so it renders
   * above the backdrop instead of behind it.
   * @type {boolean | undefined}
   */
  export let portalMenu = undefined;

  /** Set an id for the date picker element */
  export let id = uniqueId();

  /**
   * Bind to the calendar for programmatic control: `open()`, `close()`,
   * `showMonth(date)`, `focusDate(date)`, `isOpen`, and `selectedDates`.
   * Available for every `datePickerType` except `"simple"`, where it stays
   * `null`.
   * @type {import("./calendar-api.js").DatePickerCalendar | null}
   * @bindable readonly
   */
  export let calendar = null;

  /**
   * Bind to the selected dates as `Date` objects, in the same order as
   * `calendar.selectedDates` (range: start, then end). Setting it selects
   * those dates and updates `value` (or `valueFrom`/`valueTo`). At mount, a
   * non-empty `value` takes precedence. Reassign the array to update; do not
   * mutate it.
   * Not supported with the "simple" date picker type.
   * @type {ReadonlyArray<Date>}
   * @bindable writable
   */
  export let selectedDates = [];

  /**
   * Set to `true` to open the calendar. Updates when the user opens or
   * closes it. Setting it to `false` closes the calendar and dispatches
   * `close` with the `"programmatic"` trigger, as Modal does.
   * Ignored by the "simple" type and inline calendars.
   * @bindable writable
   */
  export let open = false;

  import {
    afterUpdate,
    createEventDispatcher,
    getContext,
    onMount,
    setContext,
    tick,
  } from "svelte";
  import { derived, writable } from "svelte/store";
  import {
    getThemeZoneClass,
    themeZoneClasses,
  } from "../ThemeZone/theme-zone.js";
  import {
    FORM_CONTEXT_KEY,
    MODAL_CONTEXT_KEY,
  } from "../constants/context-keys.js";
  import { dismiss } from "../utils/dismiss.js";
  import { clippedBy } from "../utils/fit-align.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import {
    declaredDirection,
    getLayoutDirection,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";
  import { rafThrottle } from "../utils/raf-throttle.js";
  import { uniqueId } from "../utils/unique-id.js";
  import { addPooledListener } from "../utils/window-listener-pool.js";
  import { createCalendarApi } from "./calendar-api.js";
  import { createCalendar } from "./create-calendar.js";
  import {
    getTopLayerAncestor,
    isEventTargetInsidePortaledCalendar,
    positionFlatpickrCalendarFixed,
  } from "./date-picker-top-layer.js";
  import {
    getPresetsWarning,
    getPropWarnings,
    getShortWarning,
  } from "./unsupported-options.js";

  const dispatch = createEventDispatcher();
  const insideModal = getContext(MODAL_CONTEXT_KEY);
  const formContext = getContext(FORM_CONTEXT_KEY);

  $: usesInline = inline;
  $: usesWeekNumbers = weekNumbers;
  // An inline calendar lives in the layout, so there is nothing to portal.
  $: effectivePortalMenu =
    !usesInline && (portalMenu === undefined ? !!insideModal : portalMenu);
  // Set for one open when the in-place calendar turns out to be cut off by
  // a box around it (a scrolling panel, a DataTable): it moves to a portal
  // instead. Only when `portalMenu` is left unset.
  let portalWhenClipped = false;
  $: calendarPortalled = effectivePortalMenu || portalWhenClipped;
  $: isFluid = fluid || !!formContext?.isFluid;

  const inputs = writable([]);
  /**
   * @type {import("svelte/store").Readable<ReadonlyArray<string>>}
   */
  const inputIds = derived(inputs, (_) => _.map(({ id }) => id));
  const readonlyAny = derived(inputs, (_) =>
    _.some(({ readonly }) => readonly),
  );
  const disabledAny = derived(inputs, (_) =>
    _.some(({ disabled }) => disabled),
  );
  const invalidAny = derived(inputs, (_) => _.some(({ invalid }) => invalid));
  const warnAny = derived(inputs, (_) => _.some(({ warn }) => warn));
  const sharedFluid = writable(false);
  $: sharedFluid.set(isFluid);
  // Neutral = neither invalid nor warn overrides the default border (readonly may still apply).
  $: fluidNeutral = isFluid && !$invalidAny && !$warnAny;
  /**
   * @type {import("svelte/store").Writable<number | string>}
   */
  const inputValue = writable(value);
  /**
   * @type {import("svelte/store").Writable<string>}
   */
  const inputValueFrom = writable(valueFrom);
  /**
   * @type {import("svelte/store").Writable<string>}
   */
  const inputValueTo = writable(valueTo);
  const mode = writable(datePickerType);
  const sharedDateFormat = writable(dateFormat);
  const sharedLocale = writable(locale);
  const sharedClearable = writable(clearable);
  const sharedClearButtonLabelText = writable(clearButtonLabelText);
  /**
   * @type {import("svelte/store").Readable<boolean>}
   */
  const range = derived(mode, (_) => _ === "range");
  /**
   * @type {import("svelte/store").Readable<boolean>}
   */
  const multiple = derived(mode, (_) => _ === "multiple");
  /**
   * @type {import("svelte/store").Readable<boolean>}
   */
  const hasCalendar = derived(
    mode,
    (_) =>
      _ === "single" ||
      _ === "range" ||
      _ === "month" ||
      _ === "quarter" ||
      _ === "year" ||
      _ === "week" ||
      _ === "multiple",
  );

  /** @type {null | HTMLDivElement} */
  let datePickerRef = null;
  let inputRef = null;
  let inputRefTo = null;
  let prevValue = value;
  let prevValueFrom = valueFrom;
  let prevValueTo = valueTo;
  let prevDisabledDates = disabledDates;
  let prevEnabledDates = enabledDates;
  let prevInitialMonth = initialMonth;
  let prevAppliedOptions = {};
  let changeDispatchedByCalendar = false;
  let creating = false;
  let creationFailed = false;
  // Bumped by `recreateCalendar()`. Named in the init block so it re-runs.
  let calendarEpoch = 0;
  let pendingOptions = null;
  /** @type {import("./calendar.js").CalendarInstance | null} */
  let engine = null;
  $: calendar = engine ? createCalendarApi(engine) : null;

  // A portalled calendar leaves a ThemeZone and a LayoutDirection in the
  // DOM, so it takes the zone's theme class and the direction, as Portal
  // content does.
  const zoneClass = getThemeZoneClass();
  const layoutDirection = getLayoutDirection();

  $: if (engine?.calendarContainer) {
    for (const name of Object.values(themeZoneClasses)) {
      engine.calendarContainer.classList.toggle(
        name,
        calendarPortalled && name === $zoneClass,
      );
    }
  }

  // The calendar swaps ArrowLeft and ArrowRight, and opens at the field's
  // right edge, in RTL. Read when needed: nothing reports a `dir` change.
  const isRtl = () =>
    resolveLayoutDirection(
      $layoutDirection,
      engine?.calendarContainer?.isConnected
        ? engine.calendarContainer
        : datePickerRef,
    ) === "rtl";

  $: if (engine?.calendarContainer) {
    setCalendarDirection(
      engine.calendarContainer,
      calendarPortalled,
      $layoutDirection,
    );
    // A `dir` around the picker can change in the same update, after this
    // runs, so read again once the update is done.
    tick().then(() => {
      if (!engine?.calendarContainer) return;
      setCalendarDirection(
        engine.calendarContainer,
        calendarPortalled,
        $layoutDirection,
      );
    });
  }

  /**
   * A portalled calendar takes the nearest `dir` around the picker, else
   * the LayoutDirection's.
   * @param {HTMLElement} container
   * @param {boolean} portalled
   * @param {"ltr" | "rtl" | undefined} contextDirection
   */
  function setCalendarDirection(container, portalled, contextDirection) {
    const dir = portalled
      ? declaredDirection(contextDirection, datePickerRef)
      : undefined;
    if (dir) {
      container.setAttribute("dir", dir);
    } else {
      container.removeAttribute("dir");
    }
  }
  // The engine reports `open` once the calendar shows under the field, so
  // it can be measured there before it paints. A clipped one moves out to
  // the page, or into the dialog or popover it opened in (as a portalled
  // calendar would), and comes back on close for the next open to measure.
  function portalIfClipped() {
    if (portalMenu !== undefined || effectivePortalMenu || !engine) return;
    if (!clippedBy(engine.calendarContainer)) return;
    portalWhenClipped = true;
    topLayerAncestor = getTopLayerAncestor(datePickerRef);
    calendarUsesFixedPositioning = !!topLayerAncestor;
    engine.set({
      appendTo: topLayerAncestor ?? undefined,
      position: topLayerAncestor
        ? positionFlatpickrCalendarFixed
        : propOptions.position,
      static: false,
    });
  }

  function unportal() {
    portalWhenClipped = false;
    calendarUsesFixedPositioning = false;
    engine?.set({
      appendTo: datePickerRef,
      position: propOptions.position,
      static: true,
    });
  }

  /** @type {Set<string>} */
  const reportedWarnings = new Set();
  /** @param {string} message */
  function reportOnce(message) {
    if (reportedWarnings.has(message)) return;
    reportedWarnings.add(message);
    console.warn(message);
  }
  let prevDatePickerType = datePickerType;
  let prevUsesInline = inline;
  let prevUsesWeekNumbers = weekNumbers;
  let prevDisplayFormat = displayFormat;
  let prevUsesDisplayFormat = !!displayFormat && datePickerType !== "range";
  let calendarUsesFixedPositioning = false;
  /** @type {(ReturnType<typeof rafThrottle> & { cancel: () => void }) | null} */
  let onCalendarReposition = null;
  /** @type {(() => void) | null} */
  let unlistenReposition = null;
  /** @type {(() => void) | null} */
  let unlistenRepositionResize = null;
  const SCROLL_LISTENER_OPTIONS = { capture: true, passive: true };
  // datePickerType="multiple": anchor for shift-click range selection. Only
  // moves on a plain click, so consecutive shift-clicks all extend from the
  // same anchor (matches file-explorer-style multi-select).
  /** @type {Date | null} */
  let multipleSelectAnchor = null;
  /** @type {HTMLElement | null} */
  let topLayerAncestor = null;
  // Set from onOpen/onClose. Outside-click listener attaches only while open.
  let calendarOpen = false;
  let prevOpen = open;
  // The `selectedDates` array this component last wrote or applied, so a
  // consumer write can be told apart from its own echo.
  let prevSelectedDates = selectedDates;
  let prevMinRangeDays = minRangeDays;
  let prevMaxRangeDays = maxRangeDays;
  // flatpickr onClose has no reason; explicit handlers set closeTrigger, else
  // infer from session baseline. Close dispatch is deferred for range sync.
  /** @type {"escape-key" | "outside-click" | "programmatic" | undefined} */
  let closeTrigger;
  /** @type {string | { from: string; to: string }} */
  let dateStrAtOpen;
  /** @type {number[]} */
  let selectedDatesAtOpen = [];

  /** The string flatpickr writes to the input for its current selection. */
  function formatSelectedDates() {
    const { dateFormat, conjunction } = engine.config;
    return engine.selectedDates
      .map((date) => engine.formatDate(date, dateFormat))
      .join(conjunction);
  }

  /**
   * Whether the calendar already holds exactly this range, as it does right
   * after the user picks one.
   * @param {string} from
   * @param {string} to
   */
  function isRangePicked(from, to) {
    const [start = "", end = ""] = engine.selectedDates.map((date) =>
      engine.formatDate(date, engine.config.dateFormat),
    );
    return from === start && to === end;
  }

  function currentDateStr() {
    return $range
      ? { from: inputRef.value, to: inputRefTo.value }
      : inputRef.value;
  }

  /** Mirror the inputs into `valueFrom`/`valueTo` in range mode. */
  function syncRangeValues() {
    if ($range) {
      valueFrom = inputRef.value;
      valueTo = inputRefTo.value;
    }
  }

  function snapshotCloseBaseline() {
    dateStrAtOpen = currentDateStr();
    selectedDatesAtOpen = (engine?.selectedDates || []).map((date) =>
      date.getTime(),
    );
  }

  function refreshCloseBaselineOnOpen() {
    if (
      selectedDatesChanged(selectedDatesAtOpen, engine?.selectedDates || [])
    ) {
      dateStrAtOpen = currentDateStr();
    } else {
      snapshotCloseBaseline();
    }
  }

  /**
   * @param {{ copySelectedDates?: boolean }} [options]
   */
  function buildCalendarDetail({ copySelectedDates = false } = {}) {
    const dates = engine?.selectedDates || [];
    return {
      selectedDates: copySelectedDates ? [...dates] : dates,
      dateStr: currentDateStr(),
    };
  }

  function dispatchDeferredClose() {
    if (!engine) return;

    const detail = buildCalendarDetail({ copySelectedDates: true });
    syncRangeValues();

    const selectionChanged =
      selectedDatesChanged(selectedDatesAtOpen, detail.selectedDates) ||
      dateStrChanged(dateStrAtOpen, detail.dateStr);
    const trigger =
      closeTrigger ?? (selectionChanged ? "select" : "outside-click");
    closeTrigger = undefined;
    dispatch("close", { ...detail, trigger });
  }

  function attachFixedRepositionListeners() {
    if (!engine || onCalendarReposition) return;
    // Repositioning reads the calendar's children and the input's rect, so
    // coalesce to one pass per frame. Capture catches scroll on any ancestor;
    // passive tells the browser the handler never blocks scrolling.
    const reposition = rafThrottle(() => {
      if (engine) positionFlatpickrCalendarFixed(engine);
    });
    onCalendarReposition = reposition;
    unlistenReposition = addPooledListener(
      "scroll",
      reposition,
      SCROLL_LISTENER_OPTIONS,
    );
    unlistenRepositionResize = addPooledListener("resize", reposition, {
      passive: true,
    });
  }

  function detachFixedRepositionListeners() {
    if (!onCalendarReposition) return;
    unlistenReposition?.();
    unlistenReposition = null;
    unlistenRepositionResize?.();
    unlistenRepositionResize = null;
    onCalendarReposition.cancel();
    onCalendarReposition = null;
  }

  /**
   * @type {(data: { id: string; labelText: string }) => void}
   */
  function add(data) {
    inputs.update((_) => [
      ..._,
      {
        readonly: false,
        disabled: false,
        invalid: false,
        warn: false,
        ...data,
      },
    ]);
  }

  /**
   * @param {string} id
   * @param {Record<string, unknown>} patch
   */
  function updateInput(id, patch) {
    inputs.update((_) =>
      _.map((input) => (input.id === id ? { ...input, ...patch } : input)),
    );
  }

  /**
   * @type {(id: string, readonly: boolean) => void}
   */
  function setReadonly(id, readonly) {
    updateInput(id, { readonly });
  }

  /**
   * @type {(id: string, disabled: boolean) => void}
   */
  function setDisabled(id, disabled) {
    updateInput(id, { disabled });
  }

  /**
   * @type {(id: string, invalid: boolean, warn: boolean) => void}
   */
  function setValidation(id, invalid, warn) {
    updateInput(id, { invalid, warn });
  }

  /**
   * @type {(data: { id: string; ref: HTMLInputElement }) => void}
   */
  function declareRef({ id, ref }) {
    if ($inputIds.indexOf(id) === 0) {
      inputRef = ref;
    } else {
      inputRefTo = ref;
    }
  }

  /**
   * @type {(data: { type: "input" | "change"; value: string }) => void}
   */
  function updateValue({ type, value }) {
    if ((!engine && type === "input") || type === "change") {
      inputValue.set(value);
    }

    // flatpickr runs its `onChange` hooks, which already dispatched, and
    // then synchronously fires this native `change` on the input.
    if (type === "change" && changeDispatchedByCalendar) {
      changeDispatchedByCalendar = false;
      return;
    }

    if (type === "change") {
      if (engine) {
        dispatch("change", buildCalendarDetail());
      } else {
        dispatch("change", value);
      }
    }
  }

  /**
   * Whether a range start is pending with `minRangeDays` or `maxRangeDays`
   * set, so some days are blocked.
   *
   * @param {{ selectedDates: Date[] }} instance
   */
  function hasPendingRangeWindow(instance) {
    return (
      $range &&
      instance.selectedDates.length === 1 &&
      (minRangeDays != null || maxRangeDays != null)
    );
  }

  /**
   * While a range start is pending, whether `date` would make the range
   * shorter than `minRangeDays` or longer than `maxRangeDays`. Reads the
   * current props on every call; flatpickr asks as it rebuilds the grid
   * right after the start is picked.
   *
   * @param {Date} date
   * @param {{ selectedDates: Date[] }} instance
   */
  function isOutsideRangeWindow(date, instance) {
    if (!hasPendingRangeWindow(instance)) return false;
    const [start] = instance.selectedDates;
    // Both are local midnight; rounding absorbs a daylight-saving hour.
    const span =
      Math.abs(Math.round((date.getTime() - start.getTime()) / 86_400_000)) + 1;
    return (
      (maxRangeDays != null && span > maxRangeDays) ||
      (minRangeDays != null && span < minRangeDays)
    );
  }

  /**
   * Mirror the calendar's selection into `selectedDates`. The `Date`s are
   * copies: flatpickr keeps its own, and a consumer mutating one in place
   * would change the selection without a redraw.
   */
  function syncSelectedDatesFromCalendar() {
    if (!engine) return;
    const next = engine.selectedDates.map((date) => new Date(date));
    if (!sameValue(next, selectedDates)) selectedDates = next;
    prevSelectedDates = selectedDates;
  }

  /**
   * Select `selectedDates` in the calendar and write the matching strings.
   * A prop write is not a user change, so nothing is dispatched.
   */
  function applySelectedDates() {
    prevSelectedDates = selectedDates;
    engine.setDate([...selectedDates], false);
    writeSelectionToValue();
  }

  /**
   * Write the calendar's selection into `value` (or `valueFrom`/`valueTo`),
   * recorded as already applied so `afterUpdate` does not parse it back.
   * The props are assigned as well as the stores: Svelte 3/4 drop a store
   * write made by a `$:` block that runs after `$: value = $inputValue`,
   * like the one that calls `initCalendar`.
   */
  function writeSelectionToValue() {
    if ($range) {
      const [from = "", to = ""] = engine.selectedDates.map((date) =>
        engine.formatDate(date, engine.config.dateFormat),
      );
      prevValueFrom = from;
      prevValueTo = to;
      inputValueFrom.set(from);
      inputValueTo.set(to);
      valueFrom = from;
      valueTo = to;
    } else {
      prevValue = formatSelectedDates();
      inputValue.set(prevValue);
      value = prevValue;
    }
  }

  /**
   * Opens or closes the calendar to match the `open` prop. A close through
   * the prop reports the `"programmatic"` trigger, like Modal's.
   */
  function applyOpenProp() {
    if (!engine || usesInline || open === calendarOpen) return;
    if (open) {
      if ($readonlyAny || $disabledAny) return;
      engine.open();
    } else {
      closeTrigger = "programmatic";
      engine.close();
    }
  }

  /**
   * Empties the selection (both ends in range mode), then returns focus to
   * the input, which opens the calendar the same way a click would.
   */
  function clear() {
    if ($readonlyAny || $disabledAny) return;
    if (engine) {
      // The range plugin empties the end input on a timer, after `onChange`,
      // so the `change` detail would still carry the old end date.
      if ($range && inputRefTo) inputRefTo.value = "";
      // Fires `onChange`, which dispatches `change` like clearing by hand.
      engine.clear();
      if ($range) {
        inputValueFrom.set("");
        inputValueTo.set("");
      } else {
        inputValue.set("");
      }
    } else {
      inputValue.set("");
      dispatch("change", "");
    }
    dispatch("clear");
    (engine?.altInput ?? inputRef)?.focus();
  }

  // A form reset restores each input's DOM value without firing any event,
  // and flatpickr's own `selectedDates` (and any `altInput` text) are
  // untouched by the browser entirely — neither the input DOM value change
  // nor the calendar-internal state gets pushed anywhere on its own. Read
  // what the browser just put in the DOM (not a value captured at creation,
  // so a value a parent sets after mount is never discarded), and push it
  // through `calendar.setDate(...)`, the same call `afterUpdate` already
  // uses for every other externally-set value change.
  function handleFormReset() {
    if ($range) {
      const nextFrom = inputRef?.value ?? "";
      const nextTo = inputRefTo?.value ?? "";
      inputValueFrom.set(nextFrom);
      inputValueTo.set(nextTo);
      // Pre-set so afterUpdate's own diff doesn't fire a second, redundant
      // calendar.setDate right after this one.
      prevValueFrom = nextFrom;
      prevValueTo = nextTo;
      if (engine) engine.setDate([nextFrom, nextTo]);
      // calendar.setDate(["", ""]) only clears the FIRST input (a range
      // plugin quirk) — write both back explicitly and unconditionally,
      // even when the target is "".
      if (inputRef) inputRef.value = nextFrom;
      if (inputRefTo) inputRefTo.value = nextTo;
      syncSelectedDatesFromCalendar();
      return;
    }

    // usesDisplayFormat's altInput is the only element a native reset
    // actually restores in that mode: a plain flatpickr-generated text
    // input that never gets a `value` attribute or `defaultValue`, so it
    // always resets to "". The underlying NAMED input, which flatpickr
    // turns `type="hidden"`, is never touched by a native reset at all —
    // browsers skip hidden inputs entirely — so reading `inputRef.value`
    // here would read the stale, pre-reset text back in instead.
    const next = engine?.altInput
      ? engine.altInput.value
      : (inputRef?.value ?? "");
    inputValue.set(next);
    prevValue = next;
    // calendar.setDate's own updateValue() writes both self.input.value
    // (== inputRef, including the hidden named input in displayFormat mode)
    // and self.altInput.value, so — unlike the range branch above — no
    // extra manual DOM write is needed here.
    if (engine) engine.setDate(next);
    syncSelectedDatesFromCalendar();
  }

  /**
   * Mirrors flatpickr's own `ignoredFocusElements` check so Carbon's
   * outside-click and blur dismissal honor the option too.
   *
   * @param {EventTarget | null} target
   */
  function isIgnoredFocusElement(target) {
    return (engine?.config.ignoredFocusElements ?? []).some((element) =>
      element.contains(/** @type {Node} */ (target)),
    );
  }

  function dismissCalendar(trigger) {
    if (!calendarOpen) return;
    closeTrigger = trigger;
    if (engine?.isOpen) engine.close();
  }

  /**
   * @type {(relatedTarget: EventTarget | null) => void}
   */
  function blurInput(relatedTarget) {
    if (!engine) return;
    // No relatedTarget means focus left the document (e.g. switching browser
    // tabs); refocusing would replay the open animation.
    if (relatedTarget == null) return;
    // In range mode, focus moves between the two inputs while the calendar
    // stays open; closing here would replay the open animation on every switch.
    if (datePickerRef?.contains(/** @type {Node} */ (relatedTarget))) return;
    if (engine.calendarContainer.contains(/** @type {Node} */ (relatedTarget)))
      return;
    if (isIgnoredFocusElement(relatedTarget)) return;
    dismissCalendar("outside-click");
  }

  /**
   * Tabbing past the last control of the popup moves focus out of the
   * calendar without a click, so close it as an outside dismissal. Focus
   * moving to an input, within the calendar or to a `keepOpenFor` element
   * keeps it open, as with an input blur.
   *
   * @param {FocusEvent} event
   */
  function handleCalendarFocusOut(event) {
    blurInput(event.relatedTarget);
  }

  /**
   * @type {() => void}
   */
  function openCalendar() {
    engine.open();
  }

  /**
   * flatpickr keeps `selectedDateElem` and `todayDateElem` after a redraw
   * replaces them (a month change), and sets `todayDateElem` even when
   * today is disabled, which is not focusable. Same test as flatpickr's own
   * `isInView`, against the whole container so month and year cells count.
   *
   * @param {HTMLElement | undefined} elem
   */
  function isFocusableDay(elem) {
    return (
      !!elem &&
      engine.calendarContainer.contains(elem) &&
      !elem.classList.contains("bx--date-picker__day--hidden") &&
      !elem.classList.contains("bx--date-picker__day--disabled") &&
      !elem.classList.contains("bx--date-picker__grid-cell--disabled")
    );
  }

  /**
   * Returns `false` when there is no calendar to focus (simple mode, or a
   * failed or pending flatpickr init).
   * @type {() => boolean}
   */
  function focusCalendar() {
    if (!engine) return false;
    // Escape (or programmatic close) leaves the calendar in the DOM but
    // hidden via CSS, so focusing its elements is a no-op unless it's
    // reopened first.
    if (!engine.isOpen) {
      engine.open();
    }
    (
      [engine.selectedDateElem, engine.todayDateElem].find(isFocusableDay) ||
      engine.calendarContainer.querySelector(
        ".bx--date-picker__day[tabindex], .bx--date-picker__grid-cell[tabindex]",
      ) ||
      engine.calendarContainer
    ).focus();
    return true;
  }

  /**
   * Extends a "multiple" mode selection to a contiguous range on shift-click.
   * Flatpickr's own day-click handler only toggles the single clicked day, so
   * a shift-click is intercepted here (capture phase, ahead of flatpickr's
   * own listener) and handled entirely ourselves. Disabled dates within the
   * range are skipped silently; the range is added to, not swapped with, the
   * existing selection.
   * @type {(event: MouseEvent) => void}
   */
  function handleMultipleDayClick(event) {
    const dayElem = /** @type {HTMLElement} */ (event.target).closest(
      ".bx--date-picker__day",
    );
    if (
      !dayElem ||
      dayElem.classList.contains("bx--date-picker__day--disabled")
    )
      return;

    const clickedDate = /** @type {any} */ (dayElem).dateObj;
    if (!clickedDate) return;

    if (!event.shiftKey || !multipleSelectAnchor) {
      multipleSelectAnchor = clickedDate;
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const [start, end] =
      multipleSelectAnchor <= clickedDate
        ? [multipleSelectAnchor, clickedDate]
        : [clickedDate, multipleSelectAnchor];

    const rangeDates = [];
    const cursor = new Date(start);
    while (cursor.getTime() <= end.getTime()) {
      if (engine.isEnabled(cursor)) rangeDates.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    const existingTimes = new Set(
      engine.selectedDates.map((date) => date.getTime()),
    );
    const merged = [
      ...engine.selectedDates,
      ...rangeDates.filter((date) => !existingTimes.has(date.getTime())),
    ];
    engine.setDate(merged, true);
  }

  /** @type {HTMLElement[]} */
  let previewedDayElems = [];

  function clearRangePreview() {
    for (const el of previewedDayElems) {
      el.classList.remove("bx--date-picker__day--in-range");
    }
    previewedDayElems = [];
  }

  /**
   * Previews a pending shift-click range by marking the days between the
   * anchor and the hovered day with the `--in-range` modifier, the same one
   * "range" mode already uses, so no new CSS is needed.
   * @type {(event: MouseEvent) => void}
   */
  function updateRangePreview(event) {
    if (!event.shiftKey || !multipleSelectAnchor || !engine) {
      clearRangePreview();
      return;
    }

    const dayElem = /** @type {HTMLElement} */ (event.target).closest(
      ".bx--date-picker__day",
    );
    if (!dayElem) return;

    const hoveredDate = /** @type {any} */ (dayElem).dateObj;
    if (!hoveredDate) return;

    clearRangePreview();

    const [start, end] =
      multipleSelectAnchor <= hoveredDate
        ? [multipleSelectAnchor, hoveredDate]
        : [hoveredDate, multipleSelectAnchor];

    for (const el of engine.calendarContainer.querySelectorAll(
      ".bx--date-picker__day",
    )) {
      const date = /** @type {any} */ (el).dateObj;
      if (
        date &&
        date.getTime() >= start.getTime() &&
        date.getTime() <= end.getTime()
      ) {
        el.classList.add("bx--date-picker__day--in-range");
        previewedDayElems.push(/** @type {HTMLElement} */ (el));
      }
    }
  }

  /**
   * @param {KeyboardEvent} event
   */
  function handleShiftKeyUp(event) {
    if (event.key === "Shift") clearRangePreview();
  }

  setContext("carbon:DatePicker", {
    range,
    multiple,
    inputValue,
    inputValueFrom,
    inputValueTo,
    inputIds,
    hasCalendar,
    dateFormat: sharedDateFormat,
    locale: sharedLocale,
    clearable: sharedClearable,
    clearButtonLabelText: sharedClearButtonLabelText,
    clear,
    isFluid: sharedFluid,
    add,
    setReadonly,
    setDisabled,
    setValidation,
    declareRef,
    updateValue,
    handleFormReset,
    blurInput,
    openCalendar,
    focusCalendar,
  });

  function applyOptionIfChanged(optionKey, value, appliedValue = value) {
    if (!sameValue(prevAppliedOptions[optionKey], value)) {
      engine.set(optionKey, appliedValue);
      prevAppliedOptions[optionKey] = value;
    }
  }

  /**
   * flatpickr treats an empty `enable` array as "nothing is enabled", since
   * merely having an `enable` array (even an empty one) switches it into
   * allow-list mode, unlike `disable`, where empty is the natural "no rule"
   * state. Resetting `enable` back to "no rule" needs `undefined`, but
   * flatpickr's own `calendar.set("enable", undefined)` throws (its setter
   * always calls `.slice()` on the value), so write the private backing
   * field directly and redraw.
   */
  function clearCalendarEnable() {
    engine.config._enable = undefined;
    engine.redraw();
  }

  /** Track each prop with its own `prev*` reference, so clearing one back
   * to `[]` restores the "no rule" state exactly once. */
  function applyDisabledDates() {
    if (sameValue(disabledDates, prevDisabledDates)) return;
    const hadOverride = prevDisabledDates.length > 0;
    prevDisabledDates = disabledDates;
    if (disabledDates.length > 0) {
      engine.set("disable", disabledDates);
    } else if (hadOverride) {
      engine.set("disable", []);
    }
  }

  function applyEnabledDates() {
    if (sameValue(enabledDates, prevEnabledDates)) return;
    const hadOverride = prevEnabledDates.length > 0;
    prevEnabledDates = enabledDates;
    if (enabledDates.length > 0) {
      engine.set("enable", enabledDates);
    } else if (hadOverride) {
      clearCalendarEnable();
    }
  }

  /**
   * Parses `initialMonth` with the active `dateFormat`, the same parsing
   * `minDate` / `maxDate` use, and clamps it into the calendar's resolved
   * bounds so the view never lands on a fully disabled month.
   * @returns {Date | null}
   */
  function resolveInitialMonth() {
    if (initialMonth == null) return null;
    const parsed = engine.parseDate(initialMonth, dateFormat);
    if (!parsed) return null;

    let year = parsed.getFullYear();
    let month = parsed.getMonth();
    const { minDate: resolvedMinDate, maxDate: resolvedMaxDate } =
      engine.config;
    if (
      resolvedMaxDate &&
      monthValue(year, month) >
        monthValue(resolvedMaxDate.getFullYear(), resolvedMaxDate.getMonth())
    ) {
      year = resolvedMaxDate.getFullYear();
      month = resolvedMaxDate.getMonth();
    }
    if (
      resolvedMinDate &&
      monthValue(year, month) <
        monthValue(resolvedMinDate.getFullYear(), resolvedMinDate.getMonth())
    ) {
      year = resolvedMinDate.getFullYear();
      month = resolvedMinDate.getMonth();
    }
    return new Date(year, month, 1);
  }

  /**
   * Moves the calendar's visible month to `initialMonth` while there is no
   * selection.
   */
  function applyInitialMonth() {
    if (!engine || engine.selectedDates.length > 0) return;
    if ($mode === "month" || $mode === "quarter" || $mode === "year") return;
    const target = resolveInitialMonth();
    if (!target) return;
    engine.jumpToDate(target, false);
  }

  async function initCalendar(options) {
    if (engine) {
      const selectionCount = engine.selectedDates.length;
      applyOptionIfChanged("minDate", minDate);
      applyOptionIfChanged("maxDate", maxDate);
      // New bounds make flatpickr drop the selected dates they exclude and
      // rewrite the input, without an event. A prop write is not a user
      // change, so mirror the result without dispatching `change`.
      if (engine.selectedDates.length !== selectionCount) {
        writeSelectionToValue();
        syncSelectedDatesFromCalendar();
      }
      applyOptionIfChanged("locale", locale);
      applyOptionIfChanged("firstDayOfWeek", firstDayOfWeek);
      applyOptionIfChanged("dateFormat", dateFormat);
      applyDisabledDates();
      applyEnabledDates();
      return;
    }

    // Creation is async. A second reactive run before it resolves would build
    // another instance on the same input, and flatpickr destroys the first,
    // leaving `calendar` pointing at a dead one. A failed init is not retried
    // either, since every retry logs the same flatpickr error again.
    if (creating) {
      pendingOptions = options;
      return;
    }
    if (creationFailed) return;
    creating = true;
    const epoch = calendarEpoch;

    // Auto-detect a top-layer ancestor (native dialog or open popover) so the
    // calendar can participate in its top layer instead of being clipped behind
    // the backdrop. Computed at creation time — appendTo cannot change after.
    topLayerAncestor = getTopLayerAncestor(datePickerRef);
    calendarUsesFixedPositioning = effectivePortalMenu && !!topLayerAncestor;

    let created = null;
    try {
      created = await createCalendar({
        options: {
          ...options,
          ...(effectivePortalMenu
            ? {
                static: false,
                ...(topLayerAncestor && {
                  appendTo: topLayerAncestor,
                  position: positionFlatpickrCalendarFixed,
                }),
              }
            : { appendTo: datePickerRef }),
          // An empty `value` leaves the calendar without a selection.
          ...($inputValue !== "" && { defaultDate: $inputValue }),
          mode: $mode,
          rtl: isRtl,
        },
        base: inputRef,
        input: inputRefTo,
        isDayBlocked: isOutsideRangeWindow,
        dispatch: (event, eventDetail) => {
          if (event === "error" || event === "view") {
            return dispatch(event, eventDetail);
          }
          // An inline calendar is always visible. flatpickr still reports a
          // `close` after each selection, which would be misleading.
          if (usesInline && (event === "open" || event === "close")) return;
          if (event === "open") {
            calendarOpen = true;
            open = true;
            closeTrigger = undefined;
            refreshCloseBaselineOnOpen();
            applyInitialMonth();
            portalIfClipped();
          } else if (event === "close") {
            calendarOpen = false;
            open = false;
            if (calendarUsesFixedPositioning) {
              detachFixedRepositionListeners();
            }
            if (portalWhenClipped) unportal();
            clearRangePreview();
            queueMicrotask(dispatchDeferredClose);
            return;
          }
          if (calendarUsesFixedPositioning && event === "open")
            attachFixedRepositionListeners();
          const detail = buildCalendarDetail();
          syncRangeValues();
          if (event === "change") {
            syncSelectedDatesFromCalendar();
            changeDispatchedByCalendar = true;
            // Cleared here in case flatpickr's native `change` never arrives.
            queueMicrotask(() => {
              changeDispatchedByCalendar = false;
            });
          }
          return dispatch(event, detail);
        },
      });
    } finally {
      creating = false;
    }
    // `recreateCalendar()` ran while this instance was being built, so it
    // belongs to the previous `datePickerType`. Discard it and start over.
    if (epoch !== calendarEpoch) {
      created?.destroy();
      const latestOptions = pendingOptions;
      pendingOptions = null;
      if (latestOptions) initCalendar(latestOptions);
      return;
    }
    pendingOptions = null;
    engine = created;
    creationFailed = !engine;
    if (!engine) return;
    // Record what the calendar was created with, then apply only what
    // changed in the meantime. Seeding this (rather than leaving it empty)
    // also keeps the first post-creation reactive run from treating
    // unchanged `minDate` / `maxDate` as newly changed; re-setting either
    // triggers flatpickr's own internal `jumpToDate()` fallback (no
    // selection means "jump to today"), which would otherwise silently
    // yank the view away from `initialMonth`.
    prevAppliedOptions = {
      minDate: options.minDate,
      maxDate: options.maxDate,
      locale: options.locale,
      firstDayOfWeek: options.firstDayOfWeek,
      dateFormat: options.dateFormat,
      clickOpens: options.clickOpens,
      allowInput: options.allowInput,
    };
    appliedPropOptions = Object.fromEntries(
      Object.keys(propOptions).map((option) => [option, options[option]]),
    );
    initCalendar(options);

    const stringValueEmpty = $range
      ? $inputValueFrom === "" && $inputValueTo === ""
      : $inputValue === "";
    if (stringValueEmpty && selectedDates.length > 0) {
      applySelectedDates();
    } else {
      syncSelectedDatesFromCalendar();
    }
    snapshotCloseBaseline();
    applyInitialMonth();
    if (open) applyOpenProp();
    engine?.calendarContainer?.setAttribute(
      "role",
      usesInline ? "group" : "dialog",
    );
    engine.calendarContainer?.addEventListener(
      "keydown",
      handleCalendarKeydown,
      { capture: true },
    );
    engine.calendarContainer?.addEventListener(
      "focusout",
      handleCalendarFocusOut,
    );
    if (engine.config.inline) {
      for (const type of BLOCKED_EVENTS) {
        engine.calendarContainer?.addEventListener(
          type,
          handleBlockedInteraction,
          { capture: true },
        );
      }
    }
    if ($mode === "multiple") {
      engine?.calendarContainer?.addEventListener(
        "click",
        handleMultipleDayClick,
        { capture: true },
      );
      engine?.calendarContainer?.addEventListener(
        "mouseover",
        updateRangePreview,
      );
      engine?.calendarContainer?.addEventListener(
        "mouseleave",
        clearRangePreview,
      );
      window.addEventListener("keyup", handleShiftKeyUp);
    }
  }

  /**
   * An inline calendar stays on screen while its input is read-only or
   * disabled, unlike the popup, which simply never opens. Stop flatpickr's
   * own listeners from seeing the interaction.
   *
   * @param {Event} event
   */
  function handleBlockedInteraction(event) {
    if (!interactionBlocked) return;
    event.stopImmediatePropagation();
    if (
      event.type !== "keydown" ||
      /** @type {KeyboardEvent} */ (event).key !== "Tab"
    ) {
      event.preventDefault();
    }
  }

  const BLOCKED_EVENTS = ["click", "mousedown", "keydown"];

  /**
   * @param {KeyboardEvent} event
   */
  function handleCalendarKeydown(event) {
    if (event.key === "Escape") handleCalendarEscape(event);
    // Space selects a day too, so it needs the same focus restore.
    else if (event.key === "Enter" || event.key === " ") {
      keepFocusAfterEnter(event);
    }
  }

  /**
   * Selecting a day redraws the grid (flatpickr's own redraw in "multiple"
   * mode, then Carbon's `setDate` sync in "range" mode), which drops focus
   * on the page while the calendar stays open. Put it back on the same date
   * once the updates settle. This runs in the capture phase, before
   * flatpickr's handler, and browsers run microtasks between listeners, so
   * wait a task rather than a `tick()`.
   *
   * @param {KeyboardEvent} event
   */
  function keepFocusAfterEnter(event) {
    if (!engine?.isOpen) return;
    const time = /** @type {any} */ (event.target)?.dateObj?.getTime();
    if (time === undefined) return;
    setTimeout(() => {
      if (!engine?.isOpen) return;
      if (engine.calendarContainer.contains(document.activeElement)) return;
      const day = [
        ...engine.calendarContainer.querySelectorAll(
          ".bx--date-picker__day, .bx--date-picker__grid-cell",
        ),
      ].find(
        (el) =>
          /** @type {any} */ (el).dateObj?.getTime() === time &&
          isFocusableDay(/** @type {HTMLElement} */ (el)),
      );
      /** @type {HTMLElement | undefined} */ (day)?.focus();
    });
  }

  /**
   * flatpickr closes on Escape from inside the calendar before the wrapper's
   * handler runs, and a portalled calendar never reaches the wrapper, so the
   * close would be reported as an outside click.
   *
   * @param {KeyboardEvent} event
   */
  function handleCalendarEscape(event) {
    // Escape that cancels an IME composition (the year input) is not a close.
    if (!engine?.isOpen || isImeComposition(event)) return;
    // Also keeps flatpickr's own handler from closing (and firing `onClose`)
    // a second time, and keeps the key from reaching an enclosing Modal.
    event.stopImmediatePropagation();
    event.preventDefault();
    // Focus first, as flatpickr does: focusing the input after closing would
    // reopen it through `clickOpens`.
    engine._input.focus();
    dismissCalendar("escape-key");
  }

  function destroyCalendar() {
    detachFixedRepositionListeners();
    if (!engine) return;
    engine.calendarContainer?.removeEventListener(
      "click",
      handleMultipleDayClick,
      { capture: true },
    );
    engine.calendarContainer?.removeEventListener(
      "mouseover",
      updateRangePreview,
    );
    engine.calendarContainer?.removeEventListener(
      "mouseleave",
      clearRangePreview,
    );
    window.removeEventListener("keyup", handleShiftKeyUp);
    engine.calendarContainer?.removeEventListener(
      "keydown",
      handleCalendarKeydown,
      { capture: true },
    );
    engine.calendarContainer?.removeEventListener(
      "focusout",
      handleCalendarFocusOut,
    );
    for (const type of BLOCKED_EVENTS) {
      engine.calendarContainer?.removeEventListener(
        type,
        handleBlockedInteraction,
        { capture: true },
      );
    }
    engine.destroy();
    engine = null;
    calendarOpen = false;
  }

  /**
   * flatpickr reads `mode` and its plugins once, at creation, so options
   * like these need a new instance. The init block below builds it.
   */
  function recreateCalendar() {
    destroyCalendar();
    creationFailed = false;
    prevAppliedOptions = {};
    calendarEpoch += 1;
  }

  onMount(() => destroyCalendar);

  afterUpdate(() => {
    if (engine) {
      if ($range) {
        if (
          ($inputValueFrom !== prevValueFrom ||
            $inputValueTo !== prevValueTo) &&
          isRangePicked($inputValueFrom, $inputValueTo)
        ) {
          // The calendar just picked these ends itself; re-applying them
          // would redraw both months twice for nothing.
          prevValueFrom = $inputValueFrom;
          prevValueTo = $inputValueTo;
        } else if (
          $inputValueFrom !== prevValueFrom ||
          $inputValueTo !== prevValueTo
        ) {
          engine.setDate([$inputValueFrom, $inputValueTo]);
          prevValueFrom = $inputValueFrom;
          prevValueTo = $inputValueTo;

          // workaround to remove the default range plugin separator "to"
          if ($inputValueFrom !== "") {
            inputRef.value = $inputValueFrom;
          }
          if ($inputValueTo !== "") {
            inputRefTo.value = $inputValueTo;
          }
          syncSelectedDatesFromCalendar();
        }
      } else if ($inputValue !== prevValue) {
        // A value the calendar itself just wrote is already in sync.
        // Re-parsing it would wipe the selection when a custom
        // `formatDate` emits text that `dateFormat` cannot parse.
        if ($inputValue !== formatSelectedDates()) {
          engine.setDate($inputValue);
          syncSelectedDatesFromCalendar();
        }
        prevValue = $inputValue;
      }
    }
  });

  $: sharedDateFormat.set(dateFormat);
  $: sharedLocale.set(locale);
  // Repaint a pending range's window when the limits change.
  $: if (
    minRangeDays !== prevMinRangeDays ||
    maxRangeDays !== prevMaxRangeDays
  ) {
    prevMinRangeDays = minRangeDays;
    prevMaxRangeDays = maxRangeDays;
    if (engine?.selectedDates.length === 1) engine.redraw();
  }
  $: if (engine && selectedDates !== prevSelectedDates) {
    if (sameValue(selectedDates, engine.selectedDates)) {
      prevSelectedDates = selectedDates;
    } else {
      applySelectedDates();
    }
  }
  // Runs only when `open` itself changes; the calendar's own open and close
  // write it too, and then already match.
  $: if (open !== prevOpen) {
    prevOpen = open;
    applyOpenProp();
  }
  $: sharedClearable.set(clearable);
  $: sharedClearButtonLabelText.set(clearButtonLabelText);
  $: inputValue.set(value);
  $: value = $inputValue;
  $: inputValueFrom.set(valueFrom);
  $: valueFrom = $inputValueFrom;
  $: inputValueTo.set(valueTo);
  $: valueTo = $inputValueTo;
  $: if (engine && !sameValue(initialMonth, prevInitialMonth)) {
    prevInitialMonth = initialMonth;
    applyInitialMonth();
  }
  $: interactionBlocked = $readonlyAny || $disabledAny;
  $: if (engine?.config.inline) {
    if (interactionBlocked) {
      engine.calendarContainer.setAttribute("aria-disabled", "true");
    } else {
      engine.calendarContainer.removeAttribute("aria-disabled");
    }
    engine.setBlocked?.(
      $disabledAny ? "disabled" : $readonlyAny ? "readonly" : undefined,
    );
  }
  // The range plugin writes to two inputs and has no alt input for the second.
  $: usesDisplayFormat = !!displayFormat && datePickerType !== "range";
  // flatpickr only creates its `altInput` at init, so turning the feature on
  // or off needs a new instance. A format change just repaints.
  $: if (usesDisplayFormat !== prevUsesDisplayFormat) {
    prevUsesDisplayFormat = usesDisplayFormat;
    prevDisplayFormat = displayFormat;
    recreateCalendar();
  } else if (usesDisplayFormat && displayFormat !== prevDisplayFormat) {
    prevDisplayFormat = displayFormat;
    if (engine) {
      engine.set("altFormat", displayFormat);
      engine.setDate(engine.selectedDates, false);
    }
  }
  $: if ($hasCalendar) {
    for (const message of getPropWarnings({
      datePickerType,
      months,
      anchor,
      portalled: effectivePortalMenu,
    })) {
      reportOnce(message);
    }
  }
  $: if (presets.length > 0) {
    const message = getPresetsWarning(datePickerType);
    if (message) reportOnce(message);
  }
  $: if (short) {
    const message = getShortWarning(datePickerType);
    if (message && !reportedWarnings.has(message)) {
      reportedWarnings.add(message);
      console.warn(message);
    }
  }
  // An inline calendar and the week number column are built at creation only.
  $: if (usesInline !== prevUsesInline) {
    prevUsesInline = usesInline;
    recreateCalendar();
  }
  $: if (usesWeekNumbers !== prevUsesWeekNumbers) {
    prevUsesWeekNumbers = usesWeekNumbers;
    recreateCalendar();
  }
  $: if (datePickerType !== prevDatePickerType) {
    prevDatePickerType = datePickerType;
    mode.set(datePickerType);
    recreateCalendar();
  }
  $: if ($hasCalendar && inputRef && calendarEpoch >= 0) {
    initCalendar({
      dateFormat,
      locale,
      maxDate,
      minDate,
      // default to static: true so the
      // date picker works inside a modal
      static: true,
      ...propOptions,
      // The range calendar strips the `readonly` attribute when
      // `allowInput` is true, so read-only wins over `allowInput`.
      ...interactive,
      ...(disabledDates.length > 0 && { disable: disabledDates }),
      ...(enabledDates.length > 0 && { enable: enabledDates }),
      ...(usesDisplayFormat && { altInput: true, altFormat: displayFormat }),
      ...(usesInline && { inline: true }),
      ...(weekNumbers && { weekNumbers: true }),
      ...(firstDayOfWeek !== undefined && { firstDayOfWeek }),
    })
      .then(() => {})
      .catch((error) => {
        console.error(error);
      });
  }
  const POSITION_DIRECTION = { auto: "auto", bottom: "below", top: "above" };

  // Engine options that come from props: primitives, functions, elements,
  // and one flat array (`keepOpenFor`), so `sameValue` never recurses.
  $: propOptions = {
    closeOnSelect,
    parseDate,
    formatDate,
    showMonths: months,
    conjunction,
    shorthandCurrentMonth: monthLabel === "short",
    position:
      direction === "auto" && align === "start"
        ? "auto"
        : `${POSITION_DIRECTION[direction]} ${align}`,
    positionElement: anchor,
    allowInvalidPreload: keepOutOfRangeValue,
    animate,
    ignoredFocusElements: keepOpenFor.length ? keepOpenFor : undefined,
    dayDescription,
    dayClass,
    prevLabel: previousLabelText,
    nextLabel: nextLabelText,
    presets,
    presetsLabelText,
  };
  const CALENDAR_NOUN = {
    month: "month",
    quarter: "quarter",
    year: "year",
  };
  $: calendarLabel =
    calendarLabelText ?? `Choose a ${CALENDAR_NOUN[datePickerType] ?? "date"}`;
  $: engine?.calendarContainer.setAttribute("aria-label", calendarLabel);

  /** @type {Record<string, unknown>} */
  let appliedPropOptions = {};
  $: if (engine) {
    for (const [option, value] of Object.entries(propOptions)) {
      if (sameValue(appliedPropOptions[option], value)) continue;
      appliedPropOptions[option] = value;
      engine.set(option, value);
    }
  }

  // Read-only turns both off. Otherwise `allowInput` decides, so
  // calendar-only selection survives.
  $: interactive = {
    clickOpens: !$readonlyAny,
    allowInput: !$readonlyAny && allowInput,
  };
  // Each `calendar.set` rebuilds the day grid, so only apply a real change.
  // The calendar is created with these values already.
  $: if (engine) {
    applyOptionIfChanged("clickOpens", interactive.clickOpens);
    applyOptionIfChanged("allowInput", interactive.allowInput);
    if ($readonlyAny && engine.isOpen) engine.close();
  }

  /**
   * Returns true when `event.target` is outside both the date-picker element
   * and the (possibly portalled) calendar container.
   *
   * @param {Event} event
   */
  function isOutsideCalendarTarget(event) {
    if (!calendarOpen || !engine) return false;
    if (isIgnoredFocusElement(event.target)) return false;
    return !isEventTargetInsidePortaledCalendar(
      datePickerRef,
      engine.calendarContainer,
      event.target,
      topLayerAncestor,
    );
  }

  /**
   * flatpickr closes on document `mousedown` before our `click` handler runs.
   * Set `closeTrigger` in capture phase so single-mode outside dismiss is not
   * inferred as select when selectedDates differ from the session baseline.
   *
   * @type {(event: Event) => void}
   */
  function handleOutsidePointerDown(event) {
    if (isOutsideCalendarTarget(event)) closeTrigger = "outside-click";
  }

  /**
   * @type {(event: Event) => void}
   */
  function handleOutsideClick(event) {
    if (isOutsideCalendarTarget(event)) dismissCalendar("outside-click");
  }
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:bx--form-item={true}
  class:bx--form-item--fit={!fullWidth && !isFluid}
  class:bx--date-picker--fluid={isFluid}
  class:bx--date-picker--fluid--neutral={fluidNeutral}
  class:bx--date-picker--fluid--invalid={isFluid && $invalidAny}
  class:bx--date-picker--fluid--warn={isFluid && $warnAny}
  class:bx--date-picker--fluid--readonly={isFluid && $readonlyAny}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    bind:this={datePickerRef}
    use:dismiss={{
      enabled: calendarOpen,
      listeners: [
        {
          type: "pointerdown",
          handler: handleOutsidePointerDown,
          options: { capture: true },
        },
        { type: "click", handler: handleOutsideClick },
      ],
    }}
    {id}
    class:bx--date-picker={true}
    class:bx--date-picker--short={short}
    class:bx--date-picker--full-width={fullWidth}
    class:bx--date-picker--simple={datePickerType === "simple"}
    class:bx--date-picker--single={datePickerType === "single" ||
      datePickerType === "month" ||
      datePickerType === "quarter" ||
      datePickerType === "year" ||
      datePickerType === "week" ||
      datePickerType === "multiple"}
    class:bx--date-picker--range={datePickerType === "range"}
    class:bx--date-picker--inline={usesInline && $hasCalendar}
    on:keydown={(event) => {
      if (engine?.isOpen && event.key === "Escape") {
        // Escape that cancels an IME composition is not a close.
        if (isImeComposition(event)) return;
        event.stopPropagation();
        dismissCalendar("escape-key");
      }
    }}
  >
    <slot />
  </div>
</div>
