<script>
  /**
   * @event {string | { selectedDates: [dateFrom: Date, dateTo?: Date]; dateStr: string | { from: string; to: string; } }} change
   */

  /**
   * Specify the date picker type.
   * @type {"simple" | "single" | "range"}
   */
  export let datePickerType = "simple";

  /**
   * Specify the date picker input value.
   * @type {number | string}
   */
  export let value = "";

  /**
   * Specify the date picker start date value (from).
   * Only works with the "range" date picker type.
   * @type {string}
   */
  export let valueFrom = "";

  /**
   * Specify the date picker end date value (to).
   * Only works with the "range" date picker type.
   * @type {string}
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
   * Set to `true` to render the calendar in a portal to prevent clipping.
   * When inside a Modal, defaults to `true` unless explicitly set to `false`.
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

  import {
    afterUpdate,
    createEventDispatcher,
    getContext,
    onMount,
    setContext,
  } from "svelte";
  import { derived, writable } from "svelte/store";
  import { createCalendar } from "./createCalendar";

  const dispatch = createEventDispatcher();
  const insideModal = getContext("carbon:Modal");

  $: effectivePortalMenu =
    portalMenu !== undefined ? portalMenu : !!insideModal;

  const inputs = writable([]);
  /**
   * @type {import("svelte/store").Readable<ReadonlyArray<string>>}
   */
  const inputIds = derived(inputs, (_) => _.map(({ id }) => id));
  const labelTextEmpty = derived(
    inputs,
    (_) => _.filter(({ labelText }) => !!labelText).length === 0,
  );
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
  const hasCalendar = derived(mode, (_) => _ === "single" || _ === "range");

  let calendar = null;
  let datePickerRef = null;
  let inputRef = null;
  let inputRefTo = null;

  /**
   * @type {(data: { id: string; labelText: string }) => void}
   */
  const add = (data) => {
    inputs.update((_) => [..._, data]);
  };

  /**
   * @type {(data: { id: string; ref: HTMLInputElement }) => void}
   */
  const declareRef = ({ id, ref }) => {
    if ($inputIds.indexOf(id) === 0) {
      inputRef = ref;
    } else {
      inputRefTo = ref;
    }
  };

  /**
   * @type {(data: { type: "input" | "change"; value: string }) => void}
   */
  const updateValue = ({ type, value }) => {
    if ((!calendar && type === "input") || type === "change") {
      inputValue.set(value);
    }

    if (type === "change") {
      if (calendar) {
        const detail = { selectedDates: calendar.selectedDates || [] };

        if ($range) {
          detail.dateStr = {
            from: inputRef?.value || "",
            to: inputRefTo?.value || "",
          };
        } else {
          detail.dateStr = inputRef?.value || "";
        }

        dispatch("change", detail);
      } else {
        dispatch("change", value);
      }
    }
  };

  /**
   * @type {(relatedTarget: EventTarget | null) => void}
   */
  const blurInput = (relatedTarget) => {
    if (calendar && !calendar.calendarContainer.contains(relatedTarget)) {
      calendar.close();
    }
  };

  /**
   * @type {() => void}
   */
  const openCalendar = () => {
    calendar.open();
  };

  /**
   * @type {() => void}
   */
  const focusCalendar = () => {
    (
      calendar.selectedDateElem ||
      calendar.todayDateElem ||
      calendar.calendarContainer.querySelector(".flatpickr-day[tabindex]") ||
      calendar.calendarContainer
    ).focus();
  };

  setContext("carbon:DatePicker", {
    range,
    inputValue,
    inputValueFrom,
    inputValueTo,
    inputIds,
    hasCalendar,
    dateFormat: dateFormatStore,
    add,
    declareRef,
    updateValue,
    blurInput,
    openCalendar,
    focusCalendar,
  });

  async function initCalendar(options) {
    if (calendar) {
      calendar.set("minDate", minDate);
      calendar.set("maxDate", maxDate);
      calendar.set("locale", locale);
      calendar.set("dateFormat", dateFormat);
      for (const [option, value] of Object.entries(flatpickrProps)) {
        calendar.set(option, value);
      }
      return;
    }

    calendar = await createCalendar({
      options: {
        ...options,
        ...(effectivePortalMenu ? { static: false } : { appendTo: datePickerRef }),
        defaultDate: $inputValue,
        mode: $mode,
      },
      base: inputRef,
      input: inputRefTo,
      dispatch: (event) => {
        const detail = { selectedDates: calendar?.selectedDates || [] };

        if ($range) {
          const from = inputRef.value;
          const to = inputRefTo.value;

          detail.dateStr = {
            from: inputRef.value,
            to: inputRefTo.value,
          };

          valueFrom = from;
          valueTo = to;
        } else {
          detail.dateStr = inputRef.value;
        }

        return dispatch(event, detail);
      },
    });
    calendar?.calendarContainer?.setAttribute("role", "application");
    calendar?.calendarContainer?.setAttribute(
      "aria-label",
      "calendar-container",
    );
  }

  onMount(() => {
    return () => {
      if (calendar) {
        calendar.destroy();
        calendar = null;
      }
    };
  });

  afterUpdate(() => {
    if (calendar) {
      if ($range) {
        calendar.setDate([$inputValueFrom, $inputValueTo]);

        // workaround to remove the default range plugin separator "to"
        if ($inputValueFrom !== "") {
          inputRef.value = $inputValueFrom;
        }
        if ($inputValueTo !== "") {
          inputRefTo.value = $inputValueTo;
        }
      } else {
        calendar.setDate($inputValue);
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
      ...flatpickrProps,
    })
      .then(() => {})
      .catch(() => {});
  }
</script>

<svelte:window
  on:click={({ target }) => {
    if (!calendar || !calendar.isOpen) return;
    if (datePickerRef && datePickerRef.contains(target)) return;
    if (!calendar.calendarContainer.contains(target)) calendar.close();
  }}
/>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:bx--form-item={true}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    bind:this={datePickerRef}
    {id}
    class:bx--date-picker={true}
    class:bx--date-picker--short={short}
    class:bx--date-picker--light={light}
    class:bx--date-picker--simple={datePickerType === "simple"}
    class:bx--date-picker--single={datePickerType === "single"}
    class:bx--date-picker--range={datePickerType === "range"}
    class:bx--date-picker--nolabel={datePickerType === "range" &&
      $labelTextEmpty}
    on:keydown={(e) => {
      if (calendar?.isOpen && e.key === "Escape") {
        e.stopPropagation();
        calendar.close();
      }
    }}
  >
    <slot />
  </div>
</div>
