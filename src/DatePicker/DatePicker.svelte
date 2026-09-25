<script context="module">
  import { deepEqual } from "../utils/deep-equal.js";

  /**
   * @param {string | { from: string; to: string }} atOpen
   * @param {string | { from: string; to: string }} atClose
   */
  function dateStrChanged(atOpen, atClose) {
    if (typeof atClose === "object") {
      return atOpen.from !== atClose.from || atOpen.to !== atClose.to;
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
   * A value rebuilt in a `$:` statement, forwarded through a wrapper,
   * or built from a reassigned object arrives new but equal. Comparing
   * contents avoids a `calendar.set` (a full day grid redraw) when
   * nothing changed.
   */
  function optionChanged(prev, next) {
    return !deepEqual(prev, next);
  }

  /**
   * @param {number} year
   * @param {number} month
   */
  function monthValue(year, month) {
    return year * 12 + month;
  }

  /**
   * @param {null | string | Date} a
   * @param {null | string | Date} b
   */
  function initialMonthChanged(a, b) {
    return !deepEqual(a, b);
  }
</script>

<script>
  /**
   * @event {string
   *   | {
   *       selectedDates: [dateFrom: Date, dateTo?: Date];
   *       dateStr: string | { from: string; to: string };
   *     }} change
   */

  /**
   * @event {{
   *   selectedDates: Date[];
   *   dateStr: string | { from: string; to: string };
   * }} open
   */

  /**
   * @event close
   * @type {object}
   * @property {"escape-key"
   *   | "outside-click"
   *   | "select"
   *   | "programmatic"} trigger
   */

  /**
   * @event {null} clear
   */

  /**
   * @event error
   * @type {object}
   * @property {Error} error
   * @property {string} value
   */

  /**
   * Specify the date picker type. Changing it after mount rebuilds the
   * calendar. `"week"` selects a whole week: a picked day becomes the
   * first day of its week, so `value` is that date in `dateFormat`. A
   * `value` set from outside is kept as given.
   * @type {"simple"
   *   | "single"
   *   | "range"
   *   | "month"
   *   | "year"
   *   | "week"
   *   | "multiple"}
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
   * Specify the date format. Use `"F Y"` or `"m/Y"` with
   * `datePickerType="month"`, and `"Y"` with `datePickerType="year"`.
   */
  export let dateFormat = "m/d/Y";

  /**
   * Specify a separate format for the text shown in the input, using
   * the same tokens as `dateFormat`. `value` and the submitted form
   * field keep using `dateFormat`. Not supported with the "simple" and
   * "range" date picker types.
   * @type {string | undefined}
   */
  export let displayFormat = undefined;

  /**
   * Specify the maximum date.
   * @type {null | string | Date}
   */
  export let maxDate = null;

  /**
   * Specify the minimum date.
   * @type {null | string | Date}
   */
  export let minDate = null;

  /**
   * @typedef {string
   *   | Date
   *   | { from: string | Date; to: string | Date }
   *   | ((date: Date) => boolean)} DatePickerDateRule
   */

  /**
   * Specify dates to disable in the calendar. A date matches a rule
   * when it equals a string or `Date`, falls within a `{ from, to }`
   * range, or a predicate function returns `true`. Strings follow
   * `dateFormat`. When `enabledDates` is also non-empty, `enabledDates`
   * takes priority and `disabledDates` is ignored, matching flatpickr.
   * Reassign the array to update an open calendar; mutating it in place
   * (`push`) is not reactive. If the currently selected date becomes
   * disabled by a rule change, it stays selected. Only works with the
   * "single", "range", and "multiple" date picker types.
   * @type {ReadonlyArray<DatePickerDateRule>}
   */
  export let disabledDates = [];

  /**
   * Specify the only dates to enable in the calendar; every other date
   * is disabled. Takes the same rule shapes as `disabledDates`. When
   * both are non-empty, `enabledDates` takes priority and
   * `disabledDates` is ignored, matching flatpickr. Reassign the array
   * to update an open calendar; mutating it in place (`push`) is not
   * reactive. If the currently selected date becomes disabled by a rule
   * change, it stays selected. Only works with the "single", "range",
   * and "multiple" date picker types.
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
   * Values may be a Date, or a string in the same format as
   * `dateFormat`. Clamped into `minDate` / `maxDate` when it falls
   * outside them. Ignored once a date is selected, until the selection
   * is cleared. Only works with the "single", "range", and "multiple"
   * date picker types.
   * @type {null | string | Date}
   */
  export let initialMonth = null;

  /**
   * Specify the locale.
   * @type {import("flatpickr/dist/types/locale").CustomLocale
   *   | import("flatpickr/dist/types/locale").key}
   */
  export let locale = "en";

  /**
   * Set to `true` to render the calendar permanently below the input
   * instead of in a popup. `open` and `close` events are not
   * dispatched, `portalMenu` is ignored, and the calendar stops
   * accepting input while the input is read-only or disabled. Not
   * supported with the "simple" date picker type.
   */
  export let inline = false;

  /**
   * Set to `true` to show a button that clears the date. It appears
   * while there is a value, and not while the input is read-only or
   * disabled. In range mode it sits on the end input and clears both
   * dates.
   */
  export let clearable = false;

  /** Specify the ARIA label for the clear button. */
  export let clearButtonLabelText = "Clear date";

  /** Set to `true` to use the short variant */
  export let short = false;

  /** Set to `true` to enable the light variant */
  export let light = false;

  /**
   * Set to `true` to use the fluid variant.
   * Inherited from the parent `FluidForm` context,
   * so it does not need to be set when used inside `FluidForm`.
   */
  export let fluid = false;

  /**
   * Set to `true` to render the calendar in a portal to prevent
   * clipping. When inside a Modal, defaults to `true` unless explicitly
   * set to `false`.
   *
   * When the date picker is inside a native `<dialog>` (opened with
   * `showModal()`) or an open `[popover]` element, the calendar
   * auto-mounts into that top-layer ancestor and uses `position: fixed`
   * so it renders above the backdrop instead of behind it.
   * @type {boolean | undefined}
   */
  export let portalMenu = undefined;

  /** Set an id for the date picker element */
  export let id = uniqueId();

  /**
   * Override the options passed to the Flatpickr instance.
   * `mode` is set by `datePickerType`, and `wrap` is not supported
   * because Flatpickr is given the input element itself.
   * @see https://flatpickr.js.org/options
   * @type {Omit<
   *   import("flatpickr/dist/types/options").Options,
   *   "mode" | "wrap"
   * >}
   */
  export let flatpickrProps = { static: true };

  /**
   * Bind to the Flatpickr calendar instance for programmatic control.
   * Available for every `datePickerType` except `"simple"`, where it
   * stays `null`.
   * @see https://flatpickr.js.org/instance-methods-properties-elements/
   * @type {import("flatpickr/dist/types/instance").Instance | null}
   * @bindable readonly
   */
  export let calendar = null;

  /**
   * Bind to the selected dates as `Date` objects, in the same order as
   * `calendar.selectedDates` (range: start, then end). Setting it
   * selects those dates and updates `value` (or `valueFrom`/`valueTo`).
   * At mount, a non-empty `value` takes precedence. Reassign the array
   * to update; do not mutate it. Not supported with the "simple" date
   * picker type.
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
  } from "svelte";
  import { derived, writable } from "svelte/store";
  import {
    FORM_CONTEXT_KEY,
    MODAL_CONTEXT_KEY,
  } from "../constants/context-keys.js";
  import { dismiss } from "../utils/dismiss.js";
  import { rafThrottle } from "../utils/raf-throttle.js";
  import { uniqueId } from "../utils/unique-id.js";
  import { addPooledListener } from "../utils/window-listener-pool.js";
  import {
    createCalendar,
    resolveLocale,
    resolveOptionValue,
    setErrorHandler,
    updateMonthNode,
  } from "./create-calendar.js";
  import {
    getTopLayerAncestor,
    isEventTargetInsidePortaledCalendar,
    positionFlatpickrCalendarFixed,
  } from "./date-picker-top-layer.js";
  import { getUnsupportedOptionWarnings } from "./unsupported-options.js";

  const dispatch = createEventDispatcher();
  const insideModal = getContext(MODAL_CONTEXT_KEY);
  const formContext = getContext(FORM_CONTEXT_KEY);

  $: usesInline = inline || !!flatpickrProps.inline;
  // An inline calendar lives in the layout, so there is nothing to portal.
  $: effectivePortalMenu =
    !usesInline && (portalMenu === undefined ? !!insideModal : portalMenu);
  $: isFluid = fluid || !!formContext?.isFluid;

  const inputs = writable([]);
  /**
   * @type {import("svelte/store").Readable<ReadonlyArray<string>>}
   */
  const inputIds = derived(inputs, (_) => _.map(({ id }) => id));
  const labelTextEmpty = derived(
    inputs,
    (_) => _.filter(({ labelText }) => !!labelText).length === 0,
  );
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
  // Readonly styling only applies while invalid/warn don't already override it.
  $: fluidReadonlyOnly = isFluid && $readonlyAny && !$invalidAny && !$warnAny;
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
      _ === "year" ||
      _ === "week" ||
      _ === "multiple",
  );

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
  /** @type {Set<string>} */
  const reportedWarnings = new Set();
  let prevDatePickerType = datePickerType;
  let prevUsesInline = inline || !!flatpickrProps.inline;
  let prevDisplayFormat = displayFormat;
  let prevUsesDisplayFormat = !!displayFormat && datePickerType !== "range";
  let calendarUsesFixedPositioning = false;
  /**
   * @type {(ReturnType<typeof rafThrottle> & {
   *   cancel: () => void;
   * }) | null}
   */
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
  /**
   * @type {"escape-key"
   *   | "outside-click"
   *   | "programmatic"
   *   | undefined}
   */
  let closeTrigger;
  /** @type {string | { from: string; to: string }} */
  let dateStrAtOpen;
  /** @type {number[]} */
  let selectedDatesAtOpen = [];

  /**
   * The string flatpickr writes to the input for its current selection.
   */
  function formatSelectedDates() {
    const { dateFormat, conjunction } = calendar.config;
    return calendar.selectedDates
      .map((date) => calendar.formatDate(date, dateFormat))
      .join(conjunction);
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
    selectedDatesAtOpen = (calendar?.selectedDates || []).map((date) =>
      date.getTime(),
    );
  }

  function refreshCloseBaselineOnOpen() {
    if (
      selectedDatesChanged(selectedDatesAtOpen, calendar?.selectedDates || [])
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
    const dates = calendar?.selectedDates || [];
    return {
      selectedDates: copySelectedDates ? [...dates] : dates,
      dateStr: currentDateStr(),
    };
  }

  function dispatchDeferredClose() {
    if (!calendar) return;

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
    if (!calendar || onCalendarReposition) return;
    // Repositioning reads the calendar's children and the input's rect, so
    // coalesce to one pass per frame. Capture catches scroll on any ancestor;
    // passive tells the browser the handler never blocks scrolling.
    const reposition = rafThrottle(() => {
      if (calendar) positionFlatpickrCalendarFixed(calendar);
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
    if ((!calendar && type === "input") || type === "change") {
      inputValue.set(value);
    }

    // flatpickr runs its `onChange` hooks, which already dispatched, and
    // then synchronously fires this native `change` on the input.
    if (type === "change" && changeDispatchedByCalendar) {
      changeDispatchedByCalendar = false;
      return;
    }

    if (type === "change") {
      if (calendar) {
        dispatch("change", buildCalendarDetail());
      } else {
        dispatch("change", value);
      }
    }
  }

  /**
   * While a range start is pending, whether `date` would make the range
   * shorter than `minRangeDays` or longer than `maxRangeDays`. Reads
   * the current props on every call; flatpickr asks as it rebuilds the
   * grid right after the start is picked.
   *
   * @param {Date} date
   * @param {{ selectedDates: Date[] }} instance
   */
  function isOutsideRangeWindow(date, instance) {
    if (!$range || instance.selectedDates.length !== 1) return false;
    if (minRangeDays == null && maxRangeDays == null) return false;
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
   * Mirror the calendar's selection into `selectedDates`. The `Date`s
   * are copies: flatpickr keeps its own, and a consumer mutating one in
   * place would change the selection without a redraw.
   */
  function syncSelectedDatesFromCalendar() {
    if (!calendar) return;
    const next = calendar.selectedDates.map((date) => new Date(date));
    if (!deepEqual(next, selectedDates)) selectedDates = next;
    prevSelectedDates = selectedDates;
  }

  /**
   * Select `selectedDates` in the calendar and write the matching
   * strings, recorded as already applied so `afterUpdate` does not
   * parse them back. A prop write is not a user change, so nothing is
   * dispatched.
   */
  function applySelectedDates() {
    prevSelectedDates = selectedDates;
    calendar.setDate([...selectedDates], false);
    if ($range) {
      const [from = "", to = ""] = calendar.selectedDates.map((date) =>
        calendar.formatDate(date, calendar.config.dateFormat),
      );
      prevValueFrom = from;
      prevValueTo = to;
      inputValueFrom.set(from);
      inputValueTo.set(to);
    } else {
      prevValue = formatSelectedDates();
      inputValue.set(prevValue);
    }
  }

  /**
   * Opens or closes the calendar to match the `open` prop. A close
   * through the prop reports the `"programmatic"` trigger, like
   * Modal's.
   */
  function applyOpenProp() {
    if (!calendar || usesInline || open === calendarOpen) return;
    if (open) {
      if ($readonlyAny || $disabledAny) return;
      calendar.open();
    } else {
      closeTrigger = "programmatic";
      calendar.close();
    }
  }

  /**
   * Empties the selection (both ends in range mode), then returns focus
   * to the input, which opens the calendar the same way a click would.
   */
  function clear() {
    if ($readonlyAny || $disabledAny) return;
    if (calendar) {
      // The range plugin empties the end input on a timer, after `onChange`,
      // so the `change` detail would still carry the old end date.
      if ($range && inputRefTo) inputRefTo.value = "";
      // Fires `onChange`, which dispatches `change` like clearing by hand.
      calendar.clear();
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
    (calendar?.altInput ?? inputRef)?.focus();
  }

  /**
   * A form reset restores each input's DOM value without firing any
   * event, and flatpickr's own `selectedDates` (and any `altInput`
   * text) are untouched by the browser entirely — neither the input DOM
   * value change nor the calendar-internal state gets pushed anywhere
   * on its own. Read what the browser just put in the DOM (not a value
   * captured at creation, so a value a parent sets after mount is never
   * discarded), and push it through `calendar.setDate(...)`, the same
   * call `afterUpdate` already uses for every other externally-set
   * value change.
   */
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
      if (calendar) calendar.setDate([nextFrom, nextTo]);
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
    const next = calendar?.altInput
      ? calendar.altInput.value
      : (inputRef?.value ?? "");
    inputValue.set(next);
    prevValue = next;
    // calendar.setDate's own updateValue() writes both self.input.value
    // (== inputRef, including the hidden named input in displayFormat mode)
    // and self.altInput.value, so — unlike the range branch above — no
    // extra manual DOM write is needed here.
    if (calendar) calendar.setDate(next);
    syncSelectedDatesFromCalendar();
  }

  /**
   * Mirrors flatpickr's own `ignoredFocusElements` check so Carbon's
   * outside-click and blur dismissal honor the option too.
   *
   * @param {EventTarget | null} target
   */
  function isIgnoredFocusElement(target) {
    return (calendar?.config.ignoredFocusElements ?? []).some((element) =>
      element.contains(/** @type {Node} */ (target)),
    );
  }

  function dismissCalendar(trigger) {
    if (!calendarOpen) return;
    closeTrigger = trigger;
    if (calendar?.isOpen) calendar.close();
  }

  /**
   * @type {(relatedTarget: EventTarget | null) => void}
   */
  function blurInput(relatedTarget) {
    if (!calendar) return;
    // No relatedTarget means focus left the document (e.g. switching browser
    // tabs); refocusing would replay the open animation.
    if (relatedTarget == null) return;
    // In range mode, focus moves between the two inputs while the calendar
    // stays open; closing here would replay the open animation on every switch.
    if (datePickerRef?.contains(/** @type {Node} */ (relatedTarget))) return;
    if (
      calendar.calendarContainer.contains(/** @type {Node} */ (relatedTarget))
    )
      return;
    if (isIgnoredFocusElement(relatedTarget)) return;
    dismissCalendar("outside-click");
  }

  /**
   * @type {() => void}
   */
  function openCalendar() {
    calendar.open();
  }

  /**
   * flatpickr keeps `selectedDateElem` and `todayDateElem` after a
   * redraw replaces them (a month change), and sets `todayDateElem`
   * even when today is disabled, which is not focusable. Same test as
   * flatpickr's own `isInView`, against the whole container so month
   * and year cells count.
   *
   * @param {HTMLElement | undefined} elem
   */
  function isFocusableDay(elem) {
    return (
      !!elem &&
      calendar.calendarContainer.contains(elem) &&
      !elem.classList.contains("hidden") &&
      !elem.classList.contains("flatpickr-disabled")
    );
  }

  /**
   * Returns `false` when there is no calendar to focus (simple mode, or
   * a failed or pending flatpickr init).
   * @type {() => boolean}
   */
  function focusCalendar() {
    if (!calendar) return false;
    // Escape (or programmatic close) leaves the calendar in the DOM but
    // hidden via CSS, so focusing its elements is a no-op unless it's
    // reopened first.
    if (!calendar.isOpen) {
      calendar.open();
    }
    (
      [calendar.selectedDateElem, calendar.todayDateElem].find(
        isFocusableDay,
      ) ||
      calendar.calendarContainer.querySelector(".flatpickr-day[tabindex]") ||
      calendar.calendarContainer
    ).focus();
    return true;
  }

  /**
   * Extends a "multiple" mode selection to a contiguous range on
   * shift-click. Flatpickr's own day-click handler only toggles the
   * single clicked day, so a shift-click is intercepted here (capture
   * phase, ahead of flatpickr's own listener) and handled entirely
   * ourselves. Disabled dates within the range are skipped silently;
   * the range is added to, not swapped with, the existing selection.
   * @type {(event: MouseEvent) => void}
   */
  function handleMultipleDayClick(event) {
    const dayElem = /** @type {HTMLElement} */ (event.target).closest(
      ".flatpickr-day",
    );
    if (!dayElem || dayElem.classList.contains("flatpickr-disabled")) return;

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
      if (calendar.isEnabled(cursor)) rangeDates.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    const existingTimes = new Set(
      calendar.selectedDates.map((date) => date.getTime()),
    );
    const merged = [
      ...calendar.selectedDates,
      ...rangeDates.filter((date) => !existingTimes.has(date.getTime())),
    ];
    calendar.setDate(merged, true);
  }

  /** @type {HTMLElement[]} */
  let previewedDayElems = [];

  function clearRangePreview() {
    for (const el of previewedDayElems) {
      el.classList.remove("inRange");
    }
    previewedDayElems = [];
  }

  /**
   * Previews a pending shift-click range by marking the days between
   * the anchor and the hovered day with flatpickr's own `inRange` class
   * — the same one "range" mode already uses, so no new CSS is needed.
   * @type {(event: MouseEvent) => void}
   */
  function updateRangePreview(event) {
    if (!event.shiftKey || !multipleSelectAnchor || !calendar) {
      clearRangePreview();
      return;
    }

    const dayElem = /** @type {HTMLElement} */ (event.target).closest(
      ".flatpickr-day",
    );
    if (!dayElem) return;

    const hoveredDate = /** @type {any} */ (dayElem).dateObj;
    if (!hoveredDate) return;

    clearRangePreview();

    const [start, end] =
      multipleSelectAnchor <= hoveredDate
        ? [multipleSelectAnchor, hoveredDate]
        : [hoveredDate, multipleSelectAnchor];

    for (const el of calendar.calendarContainer.querySelectorAll(
      ".flatpickr-day",
    )) {
      const date = /** @type {any} */ (el).dateObj;
      if (
        date &&
        date.getTime() >= start.getTime() &&
        date.getTime() <= end.getTime()
      ) {
        el.classList.add("inRange");
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
    if (optionChanged(prevAppliedOptions[optionKey], value)) {
      calendar.set(optionKey, appliedValue);
      prevAppliedOptions[optionKey] = value;
    }
  }

  /**
   * flatpickr treats an empty `enable` array as "nothing is enabled",
   * since merely having an `enable` array (even an empty one) switches
   * it into allow-list mode, unlike `disable`, where empty is the
   * natural "no rule" state. Resetting `enable` back to "no rule" needs
   * `undefined`, but flatpickr's own
   * `calendar.set("enable", undefined)` throws (its setter always calls
   * `.slice()` on the value), so write the private backing field
   * directly and redraw.
   */
  function clearCalendarEnable() {
    calendar.config._enable = undefined;
    calendar.redraw();
  }

  /**
   * `disabledDates`/`enabledDates` win over the same key in
   * `flatpickrProps` while non-empty; the `flatpickrProps` loop in
   * `initCalendar` skips those keys in that case. Track each prop with
   * its own `prev*` reference so clearing one back to `[]` restores
   * `flatpickrProps` (or the natural "no rule" state) exactly once,
   * instead of fighting the loop's own tracking of the same option key.
   */
  function applyDisabledDates() {
    if (disabledDates === prevDisabledDates) return;
    const hadOverride = prevDisabledDates.length > 0;
    prevDisabledDates = disabledDates;
    if (disabledDates.length > 0) {
      calendar.set("disable", disabledDates);
    } else if (hadOverride) {
      calendar.set("disable", flatpickrProps.disable ?? []);
    }
  }

  function applyEnabledDates() {
    if (enabledDates === prevEnabledDates) return;
    const hadOverride = prevEnabledDates.length > 0;
    prevEnabledDates = enabledDates;
    if (enabledDates.length > 0) {
      calendar.set("enable", enabledDates);
    } else if (hadOverride) {
      if (flatpickrProps.enable) {
        calendar.set("enable", flatpickrProps.enable);
      } else {
        clearCalendarEnable();
      }
    }
  }

  /**
   * Parses `initialMonth` with the active `dateFormat`, the same
   * parsing `minDate` / `maxDate` use, and clamps it into the
   * calendar's resolved bounds so the view never lands on a fully
   * disabled month.
   * @returns {Date | null}
   */
  function resolveInitialMonth() {
    if (initialMonth == null) return null;
    const parsed = calendar.parseDate(initialMonth, dateFormat);
    if (!parsed) return null;

    let year = parsed.getFullYear();
    let month = parsed.getMonth();
    const { minDate: resolvedMinDate, maxDate: resolvedMaxDate } =
      calendar.config;
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
   * Moves the calendar's visible month to `initialMonth` while there is
   * no selection. `jumpToDate`'s second argument suppresses flatpickr's
   * own `onMonthChange` hook, so the Carbon header label is resynced by
   * hand.
   */
  function applyInitialMonth() {
    if (!calendar || calendar.selectedDates.length > 0) return;
    if ($mode === "month" || $mode === "year") return;
    const target = resolveInitialMonth();
    if (!target) return;
    calendar.jumpToDate(target, false);
    updateMonthNode(calendar, locale);
  }

  async function initCalendar(options) {
    if (calendar) {
      applyOptionIfChanged("minDate", minDate);
      applyOptionIfChanged("maxDate", maxDate);
      applyOptionIfChanged("locale", locale, resolveLocale(locale));
      applyOptionIfChanged("dateFormat", dateFormat);
      applyDisabledDates();
      applyEnabledDates();
      // `calendar.set("errorHandler", fn)` would replace Carbon's own
      // wrapper (see create-calendar.js), so the live handler is threaded
      // through separately instead of going through the generic loop below.
      setErrorHandler(calendar, flatpickrProps.errorHandler);
      for (const [option, value] of Object.entries(flatpickrProps)) {
        // `static` is decided by `effectivePortalMenu` at creation time
        // (see below); re-applying the default `flatpickrProps.static`
        // here would clobber that on every reactive re-run.
        if (option === "static" && effectivePortalMenu) continue;
        // Unsupported: see `wrap` in create-calendar.js.
        if (option === "wrap") continue;
        // Owned by the read-only block below, which combines them with
        // `$readonlyAny`.
        if (option === "clickOpens" || option === "allowInput") continue;
        // `disabledDates`/`enabledDates` already applied above and won.
        if (option === "disable" && disabledDates.length > 0) continue;
        if (option === "enable" && enabledDates.length > 0) continue;
        if (option === "errorHandler") continue;
        // Creation-only, handled by `recreateCalendar()`.
        if (option === "inline") continue;
        // `displayFormat` owns these two.
        if (
          usesDisplayFormat &&
          (option === "altInput" || option === "altFormat")
        )
          continue;
        applyOptionIfChanged(
          option,
          value,
          resolveOptionValue(calendar, option, value),
        );
      }
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
    const flatpickrPropsAtCreation = flatpickrProps;

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
          // An empty `value` must not clobber `flatpickrProps.defaultDate`.
          ...($inputValue !== "" && { defaultDate: $inputValue }),
          mode: $mode,
        },
        base: inputRef,
        input: inputRefTo,
        isDayBlocked: isOutsideRangeWindow,
        dispatch: (event, eventDetail) => {
          if (event === "error") {
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
          } else if (event === "close") {
            calendarOpen = false;
            open = false;
            if (calendarUsesFixedPositioning) {
              detachFixedRepositionListeners();
            }
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
    calendar = created;
    creationFailed = !calendar;
    if (!calendar) return;
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
      dateFormat: options.dateFormat,
      ...flatpickrPropsAtCreation,
      clickOpens: options.clickOpens,
      allowInput: options.allowInput,
    };
    initCalendar(options);

    // flatpickr fills the input from `flatpickrProps.defaultDate` without
    // firing events, so mirror it into `value` here.
    if (calendar && !$range && $inputValue === "" && inputRef.value !== "") {
      prevValue = inputRef.value;
      inputValue.set(inputRef.value);
    }
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
    calendar?.calendarContainer?.setAttribute("role", "application");
    calendar?.calendarContainer?.setAttribute(
      "aria-label",
      "calendar-container",
    );
    calendar.calendarContainer?.addEventListener(
      "keydown",
      handleCalendarKeydown,
      { capture: true },
    );
    if (calendar.config.inline) {
      for (const type of BLOCKED_EVENTS) {
        calendar.calendarContainer?.addEventListener(
          type,
          handleBlockedInteraction,
          { capture: true },
        );
      }
    }
    if ($mode === "multiple") {
      calendar?.calendarContainer?.addEventListener(
        "click",
        handleMultipleDayClick,
        { capture: true },
      );
      calendar?.calendarContainer?.addEventListener(
        "mouseover",
        updateRangePreview,
      );
      calendar?.calendarContainer?.addEventListener(
        "mouseleave",
        clearRangePreview,
      );
      window.addEventListener("keyup", handleShiftKeyUp);
    }
  }

  /**
   * An inline calendar stays on screen while its input is read-only or
   * disabled, unlike the popup, which simply never opens. Stop
   * flatpickr's own listeners from seeing the interaction.
   *
   * @param {Event} event
   */
  function handleBlockedInteraction(event) {
    if (!interactionBlocked) return;
    event.stopImmediatePropagation();
    if (event.type !== "keydown" || event.key !== "Tab") {
      event.preventDefault();
    }
  }

  const BLOCKED_EVENTS = ["click", "mousedown", "keydown"];

  /**
   * @param {KeyboardEvent} event
   */
  function handleCalendarKeydown(event) {
    if (event.key === "Escape") handleCalendarEscape(event);
    else if (event.key === "Enter") keepFocusAfterEnter(event);
  }

  /**
   * Selecting a day redraws the grid (flatpickr's own redraw in
   * "multiple" mode, then Carbon's `setDate` sync in "range" mode),
   * which drops focus on the page while the calendar stays open. Put it
   * back on the same date once the updates settle. This runs in the
   * capture phase, before flatpickr's handler, and browsers run
   * microtasks between listeners, so wait a task rather than a
   * `tick()`.
   *
   * @param {KeyboardEvent} event
   */
  function keepFocusAfterEnter(event) {
    if (!calendar?.isOpen) return;
    const time = /** @type {any} */ (event.target)?.dateObj?.getTime();
    if (time === undefined) return;
    setTimeout(() => {
      if (!calendar?.isOpen) return;
      if (calendar.calendarContainer.contains(document.activeElement)) return;
      const day = [
        ...calendar.calendarContainer.querySelectorAll(".flatpickr-day"),
      ].find(
        (el) =>
          /** @type {any} */ (el).dateObj?.getTime() === time &&
          isFocusableDay(/** @type {HTMLElement} */ (el)),
      );
      /** @type {HTMLElement | undefined} */ (day)?.focus();
    });
  }

  /**
   * flatpickr closes on Escape from inside the calendar before the
   * wrapper's handler runs, and a portalled calendar never reaches the
   * wrapper, so the close would be reported as an outside click.
   *
   * @param {KeyboardEvent} event
   */
  function handleCalendarEscape(event) {
    if (!calendar?.isOpen) return;
    // Also keeps flatpickr's own handler from closing (and firing `onClose`)
    // a second time, and keeps the key from reaching an enclosing Modal.
    event.stopImmediatePropagation();
    event.preventDefault();
    // Focus first, as flatpickr does: focusing the input after closing would
    // reopen it through `clickOpens`.
    calendar._input.focus();
    dismissCalendar("escape-key");
  }

  function destroyCalendar() {
    detachFixedRepositionListeners();
    if (!calendar) return;
    calendar.calendarContainer?.removeEventListener(
      "click",
      handleMultipleDayClick,
      { capture: true },
    );
    calendar.calendarContainer?.removeEventListener(
      "mouseover",
      updateRangePreview,
    );
    calendar.calendarContainer?.removeEventListener(
      "mouseleave",
      clearRangePreview,
    );
    window.removeEventListener("keyup", handleShiftKeyUp);
    calendar.calendarContainer?.removeEventListener(
      "keydown",
      handleCalendarKeydown,
      { capture: true },
    );
    for (const type of BLOCKED_EVENTS) {
      calendar.calendarContainer?.removeEventListener(
        type,
        handleBlockedInteraction,
        { capture: true },
      );
    }
    calendar.destroy();
    calendar = null;
    calendarOpen = false;
  }

  /**
   * flatpickr reads `mode` and its plugins once, at creation, so
   * options like these need a new instance. The init block below builds
   * it.
   */
  function recreateCalendar() {
    destroyCalendar();
    creationFailed = false;
    prevAppliedOptions = {};
    calendarEpoch += 1;
  }

  onMount(() => destroyCalendar);

  afterUpdate(() => {
    if (calendar) {
      if ($range) {
        if (
          $inputValueFrom !== prevValueFrom ||
          $inputValueTo !== prevValueTo
        ) {
          calendar.setDate([$inputValueFrom, $inputValueTo]);
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
          calendar.setDate($inputValue);
          syncSelectedDatesFromCalendar();
        }
        prevValue = $inputValue;
      }
    }
  });

  $: sharedDateFormat.set(dateFormat);
  // Repaint a pending range's window when the limits change.
  $: if (
    minRangeDays !== prevMinRangeDays ||
    maxRangeDays !== prevMaxRangeDays
  ) {
    prevMinRangeDays = minRangeDays;
    prevMaxRangeDays = maxRangeDays;
    if (calendar?.selectedDates.length === 1) calendar.redraw();
  }
  $: if (calendar && selectedDates !== prevSelectedDates) {
    if (deepEqual(selectedDates, calendar.selectedDates)) {
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
  $: if (calendar && initialMonthChanged(initialMonth, prevInitialMonth)) {
    prevInitialMonth = initialMonth;
    applyInitialMonth();
  }
  $: interactionBlocked = $readonlyAny || $disabledAny;
  $: if (calendar?.config.inline) {
    if (interactionBlocked) {
      calendar.calendarContainer.setAttribute("aria-disabled", "true");
    } else {
      calendar.calendarContainer.removeAttribute("aria-disabled");
    }
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
    if (calendar) {
      calendar.set("altFormat", displayFormat);
      calendar.setDate(calendar.selectedDates, false);
    }
  }
  // This re-runs whenever `flatpickrProps` is handed over again, even with
  // equal contents, so each message is only reported once per instance.
  $: if ($hasCalendar) {
    for (const message of getUnsupportedOptionWarnings(flatpickrProps, {
      datePickerType,
      portalled: effectivePortalMenu,
      displayFormat,
      disabledDates,
      enabledDates,
    })) {
      if (!reportedWarnings.has(message)) {
        reportedWarnings.add(message);
        console.warn(message);
      }
    }
  }
  // flatpickr mounts an inline calendar differently, at creation only.
  $: if (usesInline !== prevUsesInline) {
    prevUsesInline = usesInline;
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
      ...flatpickrProps,
      // The flatpickr range plugin strips the `readonly` attribute when
      // `allowInput` is true, so read-only wins over `flatpickrProps`.
      ...interactive,
      ...(disabledDates.length > 0 && { disable: disabledDates }),
      ...(enabledDates.length > 0 && { enable: enabledDates }),
      ...(usesDisplayFormat && { altInput: true, altFormat: displayFormat }),
      ...(usesInline && { inline: true }),
    })
      .then(() => {})
      .catch((error) => {
        // Only a failed plugin import lands here. Surface it like flatpickr
        // surfaces its own init errors instead of failing silently.
        console.error(error);
      });
  }
  // Read-only turns both off. Otherwise the consumer's `flatpickrProps`
  // decide, so `allowInput: false` (calendar-only selection) survives.
  $: interactive = {
    clickOpens: !$readonlyAny && flatpickrProps.clickOpens !== false,
    allowInput: !$readonlyAny && flatpickrProps.allowInput !== false,
  };
  // Each `calendar.set` rebuilds the day grid, so only apply a real change.
  // The calendar is created with these values already.
  $: if (calendar) {
    applyOptionIfChanged("clickOpens", interactive.clickOpens);
    applyOptionIfChanged("allowInput", interactive.allowInput);
    if ($readonlyAny && calendar.isOpen) calendar.close();
  }

  /**
   * Returns true when `event.target` is outside both the date-picker
   * element and the (possibly portalled) calendar container.
   *
   * @param {Event} event
   */
  function isOutsideCalendarTarget(event) {
    if (!calendarOpen || !calendar) return false;
    if (isIgnoredFocusElement(event.target)) return false;
    return !isEventTargetInsidePortaledCalendar(
      datePickerRef,
      calendar.calendarContainer,
      event.target,
      topLayerAncestor,
    );
  }

  /**
   * flatpickr closes on document `mousedown` before our `click` handler
   * runs. Set `closeTrigger` in capture phase so single-mode outside
   * dismiss is not inferred as select when selectedDates differ from
   * the session baseline.
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
  class:bx--date-picker--fluid={isFluid}
  class:bx--date-picker--fluid--neutral={fluidNeutral}
  class:bx--date-picker--fluid--invalid={isFluid && $invalidAny}
  class:bx--date-picker--fluid--warn={isFluid && $warnAny}
  class:bx--date-picker--fluid--readonly={isFluid && $readonlyAny}
  class:bx--date-picker--fluid--readonly-only={fluidReadonlyOnly}
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
    class:bx--date-picker--light={light}
    class:bx--date-picker--simple={datePickerType === "simple"}
    class:bx--date-picker--single={datePickerType === "single" ||
      datePickerType === "month" ||
      datePickerType === "year" ||
      datePickerType === "week" ||
      datePickerType === "multiple"}
    class:bx--date-picker--range={datePickerType === "range"}
    class:bx--date-picker--inline={usesInline && $hasCalendar}
    class:bx--date-picker--nolabel={datePickerType === "range" &&
      $labelTextEmpty}
    on:keydown={(event) => {
      if (calendar?.isOpen && event.key === "Escape") {
        event.stopPropagation();
        dismissCalendar("escape-key");
      }
    }}
  >
    <slot />
  </div>
</div>
