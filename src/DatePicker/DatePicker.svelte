<script>
  /**
   * @event {string | { selectedDates: [dateFrom: Date, dateTo?: Date]; dateStr: string | { from: string; to: string; } }} change
   */

  /**
   * @event close
   * @type {object}
   * @property {"escape-key" | "outside-click" | "select"} trigger
   */

  /**
   * Specify the date picker type.
   * @type {"simple" | "single" | "range" | "month"}
   */
  export let datePickerType = "simple";

  /**
   * Specify the date picker input value.
   * @type {number | string}
   * @bindable writable
   */
  export let value = "";

  /**
   * Specify the date picker start date value (from).
   * Only works with the "range" date picker type.
   * @type {string}
   * @bindable writable
   */
  export let valueFrom = "";

  /**
   * Specify the date picker end date value (to).
   * Only works with the "range" date picker type.
   * @type {string}
   * @bindable writable
   */
  export let valueTo = "";

  /** Specify the date format */
  export let dateFormat = "m/d/Y";

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
   * Specify the locale.
   * @type {import("flatpickr/dist/types/locale").CustomLocale | import("flatpickr/dist/types/locale").key}
   */
  export let locale = "en";

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
   * Set to `true` to render the calendar in a portal to prevent clipping.
   * When inside a Modal, defaults to `true` unless explicitly set to `false`.
   *
   * When the date picker is inside a native `<dialog>` (opened with
   * `showModal()`) or an open `[popover]` element, the calendar auto-mounts
   * into that top-layer ancestor and uses `position: fixed` so it renders
   * above the backdrop instead of behind it.
   * @type {boolean | undefined}
   */
  export let portalMenu = undefined;

  /** Set an id for the date picker element */
  export let id = `ccs-${Math.random().toString(36)}`;

  /**
   * Override the options passed to the Flatpickr instance.
   * @see https://flatpickr.js.org/options
   * @type {import("flatpickr/dist/types/options").Options}
   */
  export let flatpickrProps = { static: true };

  /**
   * Bind to the Flatpickr calendar instance for programmatic control.
   * Only available when `datePickerType` is `"single"` or `"range"`.
   * @see https://flatpickr.js.org/instance-methods-properties-elements/
   * @type {import("flatpickr/dist/types/instance").Instance | null}
   * @bindable readonly
   */
  export let calendar = null;

  import {
    afterUpdate,
    createEventDispatcher,
    getContext,
    onMount,
    setContext,
  } from "svelte";
  import { derived, writable } from "svelte/store";
  import { dismiss } from "../utils/dismiss.js";
  import { createCalendar, resolveLocale } from "./createCalendar";
  import {
    getTopLayerAncestor,
    isEventTargetInsidePortaledCalendar,
    positionFlatpickrCalendarFixed,
  } from "./datePickerTopLayer";

  const dispatch = createEventDispatcher();
  const insideModal = getContext("carbon:Modal");
  const formContext = getContext("carbon:Form");

  $: effectivePortalMenu =
    portalMenu === undefined ? !!insideModal : portalMenu;
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
  const invalidAny = derived(inputs, (_) => _.some(({ invalid }) => invalid));
  const warnAny = derived(inputs, (_) => _.some(({ warn }) => warn));
  const isFluidStore = writable(false);
  $: isFluidStore.set(isFluid);
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
  const dateFormatStore = writable(dateFormat);
  /**
   * @type {import("svelte/store").Readable<boolean>}
   */
  const range = derived(mode, (_) => _ === "range");
  /**
   * @type {import("svelte/store").Readable<boolean>}
   */
  const hasCalendar = derived(
    mode,
    (_) => _ === "single" || _ === "range" || _ === "month",
  );

  let datePickerRef = null;
  let inputRef = null;
  let inputRefTo = null;
  let prevValue = value;
  let prevValueFrom = valueFrom;
  let prevValueTo = valueTo;
  let lastAppliedOptions = {};
  let calendarUsesFixedPositioning = false;
  let onCalendarReposition = null;
  /** @type {HTMLElement | null} */
  let topLayerAncestor = null;
  // Set from onOpen/onClose. Outside-click listener attaches only while open.
  let calendarOpen = false;
  // flatpickr onClose has no reason; explicit handlers set closeTrigger, else
  // infer from session baseline. Close dispatch is deferred for range sync.
  /** @type {"escape-key" | "outside-click" | undefined} */
  let closeTrigger;
  /** @type {string | { from: string; to: string }} */
  let dateStrAtOpen;
  /** @type {number[]} */
  let selectedDatesAtOpen = [];

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
   * @param {Date[]} selectedDates
   */
  function selectedDatesChanged(atOpen, selectedDates) {
    const atClose = (selectedDates || []).map((date) => date.getTime());
    return (
      atClose.length !== atOpen.length ||
      atClose.some((time, index) => time !== atOpen[index])
    );
  }

  function snapshotCloseBaseline() {
    dateStrAtOpen = $range
      ? { from: inputRef.value, to: inputRefTo.value }
      : inputRef.value;
    selectedDatesAtOpen = (calendar?.selectedDates || []).map((date) =>
      date.getTime(),
    );
  }

  function refreshCloseBaselineOnOpen() {
    if (
      selectedDatesChanged(selectedDatesAtOpen, calendar?.selectedDates || [])
    ) {
      dateStrAtOpen = $range
        ? { from: inputRef.value, to: inputRefTo.value }
        : inputRef.value;
    } else {
      snapshotCloseBaseline();
    }
  }

  /**
   * @param {{ copySelectedDates?: boolean }} [options]
   */
  function buildCalendarDetail({ copySelectedDates = false } = {}) {
    const dates = calendar?.selectedDates || [];
    const detail = {
      selectedDates: copySelectedDates ? [...dates] : dates,
    };

    if ($range) {
      const from = inputRef.value;
      const to = inputRefTo.value;
      detail.dateStr = { from, to };
    } else {
      detail.dateStr = inputRef.value;
    }

    return detail;
  }

  function dispatchDeferredClose() {
    if (!calendar) return;

    const detail = buildCalendarDetail({ copySelectedDates: true });

    if ($range) {
      valueFrom = inputRef.value;
      valueTo = inputRefTo.value;
    }

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
    onCalendarReposition = () => positionFlatpickrCalendarFixed(calendar);
    window.addEventListener("scroll", onCalendarReposition, true);
    window.addEventListener("resize", onCalendarReposition);
  }

  function detachFixedRepositionListeners() {
    if (!onCalendarReposition) return;
    window.removeEventListener("scroll", onCalendarReposition, true);
    window.removeEventListener("resize", onCalendarReposition);
    onCalendarReposition = null;
  }

  /**
   * @type {(data: { id: string; labelText: string }) => void}
   */
  function add(data) {
    inputs.update((_) => [
      ..._,
      { readonly: false, invalid: false, warn: false, ...data },
    ]);
  }

  /**
   * @type {(id: string, readonly: boolean) => void}
   */
  function setReadonly(id, readonly) {
    inputs.update((_) =>
      _.map((input) => (input.id === id ? { ...input, readonly } : input)),
    );
  }

  /**
   * @type {(id: string, invalid: boolean, warn: boolean) => void}
   */
  function setValidation(id, invalid, warn) {
    inputs.update((_) =>
      _.map((input) => (input.id === id ? { ...input, invalid, warn } : input)),
    );
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

    if (type === "change") {
      if (calendar) {
        dispatch("change", buildCalendarDetail());
      } else {
        dispatch("change", value);
      }
    }
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
    dismissCalendar("outside-click");
  }

  /**
   * @type {() => void}
   */
  function openCalendar() {
    calendar.open();
  }

  /**
   * @type {() => void}
   */
  function focusCalendar() {
    (
      calendar.selectedDateElem ||
      calendar.todayDateElem ||
      calendar.calendarContainer.querySelector(".flatpickr-day[tabindex]") ||
      calendar.calendarContainer
    ).focus();
  }

  setContext("carbon:DatePicker", {
    range,
    inputValue,
    inputValueFrom,
    inputValueTo,
    inputIds,
    hasCalendar,
    dateFormat: dateFormatStore,
    isFluid: isFluidStore,
    add,
    setReadonly,
    setValidation,
    declareRef,
    updateValue,
    blurInput,
    openCalendar,
    focusCalendar,
  });

  function applyOptionIfChanged(optionKey, value, appliedValue = value) {
    if (lastAppliedOptions[optionKey] !== value) {
      calendar.set(optionKey, appliedValue);
      lastAppliedOptions[optionKey] = value;
    }
  }

  async function initCalendar(options) {
    if (calendar) {
      applyOptionIfChanged("minDate", minDate);
      applyOptionIfChanged("maxDate", maxDate);
      applyOptionIfChanged("locale", locale, resolveLocale(locale));
      applyOptionIfChanged("dateFormat", dateFormat);
      for (const [option, value] of Object.entries(flatpickrProps)) {
        applyOptionIfChanged(option, value);
      }
      return;
    }

    // Auto-detect a top-layer ancestor (native dialog or open popover) so the
    // calendar can participate in its top layer instead of being clipped behind
    // the backdrop. Computed at creation time — appendTo cannot change after.
    topLayerAncestor = getTopLayerAncestor(datePickerRef);
    calendarUsesFixedPositioning = effectivePortalMenu && !!topLayerAncestor;

    calendar = await createCalendar({
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
        defaultDate: $inputValue,
        mode: $mode,
      },
      base: inputRef,
      input: inputRefTo,
      dispatch: (event) => {
        if (event === "open") {
          calendarOpen = true;
          closeTrigger = undefined;
          refreshCloseBaselineOnOpen();
        } else if (event === "close") {
          calendarOpen = false;
          if (calendarUsesFixedPositioning) {
            detachFixedRepositionListeners();
          }
          queueMicrotask(dispatchDeferredClose);
          return;
        }
        if (calendarUsesFixedPositioning && event === "open")
          attachFixedRepositionListeners();
        const detail = buildCalendarDetail();

        if ($range) {
          valueFrom = inputRef.value;
          valueTo = inputRefTo.value;
        }

        return dispatch(event, detail);
      },
    });
    snapshotCloseBaseline();
    calendar?.calendarContainer?.setAttribute("role", "application");
    calendar?.calendarContainer?.setAttribute(
      "aria-label",
      "calendar-container",
    );
  }

  onMount(() => {
    return () => {
      detachFixedRepositionListeners();
      if (calendar) {
        calendar.destroy();
        calendar = null;
      }
    };
  });

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
        }
      } else if ($inputValue !== prevValue) {
        calendar.setDate($inputValue);
        prevValue = $inputValue;
      }
    }
  });

  $: dateFormatStore.set(dateFormat);
  $: inputValue.set(value);
  $: value = $inputValue;
  $: inputValueFrom.set(valueFrom);
  $: valueFrom = $inputValueFrom;
  $: inputValueTo.set(valueTo);
  $: valueTo = $inputValueTo;
  $: if ($hasCalendar && inputRef) {
    initCalendar({
      dateFormat,
      locale,
      maxDate,
      minDate,
      // default to static: true so the
      // date picker works inside a modal
      static: true,
      clickOpens: !$readonlyAny,
      // The flatpickr range plugin strips the `readonly` attribute when
      // `allowInput` is true, so disable it to preserve the readonly state.
      allowInput: !$readonlyAny,
      ...flatpickrProps,
    })
      .then(() => {})
      .catch(() => {});
  }
  $: if (calendar) {
    calendar.set("clickOpens", !$readonlyAny);
    if ($readonlyAny && calendar.isOpen) calendar.close();
  }

  /**
   * Returns true when `event.target` is outside both the date-picker element
   * and the (possibly portalled) calendar container.
   *
   * @param {Event} event
   */
  function isOutsideCalendarTarget(event) {
    if (!calendarOpen || !calendar) return false;
    return !isEventTargetInsidePortaledCalendar(
      datePickerRef,
      calendar.calendarContainer,
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
  class:bx--date-picker--fluid={isFluid}
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
    class:bx--date-picker--light={light}
    class:bx--date-picker--simple={datePickerType === "simple"}
    class:bx--date-picker--single={datePickerType === "single" ||
      datePickerType === "month"}
    class:bx--date-picker--range={datePickerType === "range"}
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
