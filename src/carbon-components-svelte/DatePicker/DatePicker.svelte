<script>
  /**
   * @event {string | { selectedDates: [dateFrom: Date, dateTo?: Date]; dateStr: string | { from: string; to: string; } }} change
   */

  /**
   * Specify the date picker type
   * @type {"simple" | "single" | "range"}
   */
  export let datePickerType = "simple";

  /**
   * Specify the date picker input value
   * @type {number | string}
   */
  export let value = "";

  /**
   * Specify the date picker start date value (from)
   * Only works with the "range" date picker type
   * @type {string}
   */
  export let valueFrom = "";

  /**
   * Specify the date picker end date value (to)
   * Only works with the "range" date picker type
   * @type {string}
   */
  export let valueTo = "";

  /** Specify the date format */
  export let dateFormat = "m/d/Y";

  /**
   * Specify the maximum date
   * @type {null | string | Date}
   */
  export let maxDate = null;

  /**
   * Specify the minimum date
   * @type {null | string | Date}
   */
  export let minDate = null;

  /**
   * Specify the locale
   * @type {import("flatpickr/dist/types/locale").CustomLocale | import("flatpickr/dist/types/locale").key}
   */
  export let locale = "en";

  /** Set to `true` to use the short variant */
  export let short = false;

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Set an id for the date picker element */
  export let id = "ccs-" + Math.random().toString(36);

  /**
   * Override the options passed to the Flatpickr instance.
   * @see https://flatpickr.js.org/options
   * @type {import("flatpickr/dist/types/options").Options}
   */
  export let flatpickrProps = { static: true };

  import {
    createEventDispatcher,
    setContext,
    afterUpdate,
    onMount,
  } from "svelte";
  import { writable, derived } from "svelte/store";
  import { createCalendar } from "./createCalendar";

  const dispatch = createEventDispatcher();
  const inputs = writable([]);
  const inputIds = derived(inputs, (_) => _.map(({ id }) => id));
  const labelTextEmpty = derived(
    inputs,
    (_) => _.filter(({ labelText }) => !!labelText).length === 0
  );
  const inputValue = writable(value);
  const inputValueFrom = writable(valueFrom);
  const inputValueTo = writable(valueTo);
  const mode = writable(datePickerType);
  const range = derived(mode, (_) => _ === "range");
  const hasCalendar = derived(mode, (_) => _ === "single" || _ === "range");

  let calendar = null;
  let datePickerRef = null;
  let inputRef = null;
  let inputRefTo = null;

  setContext("DatePicker", {
    range,
    inputValue,
    inputValueFrom,
    inputValueTo,
    inputIds,
    hasCalendar,
    add: (data) => {
      inputs.update((_) => [..._, data]);
    },
    declareRef: ({ id, ref }) => {
      if ($inputIds.indexOf(id) === 0) {
        inputRef = ref;
      } else {
        inputRefTo = ref;
      }
    },
    updateValue: ({ type, value }) => {
      if ((!calendar && type === "input") || type === "change") {
        inputValue.set(value);
      }

      if (!calendar && type === "change") {
        dispatch("change", value);
      }
    },
    blurInput: (relatedTarget) => {
      if (calendar && !calendar.calendarContainer.contains(relatedTarget)) {
        calendar.close();
      }
    },
    openCalendar: () => {
      calendar.open();
    },
    focusCalendar: () => {
      (
        calendar.selectedDateElem ||
        calendar.todayDateElem ||
        calendar.calendarContainer.querySelector(".flatpickr-day[tabindex]") ||
        calendar.calendarContainer
      ).focus();
    },
  });

  async function initCalendar(options) {
    if (calendar) {
      calendar.set("minDate", minDate);
      calendar.set("maxDate", maxDate);
      calendar.set("locale", locale);
      calendar.set("dateFormat", dateFormat);
      Object.entries(flatpickrProps).forEach(([option, value]) => {
        calendar.set(options, value);
      });
      return;
    }

    calendar = await createCalendar({
      options: {
        ...options,
        appendTo: datePickerRef,
        defaultDate: $inputValue,
        mode: $mode,
      },
      base: inputRef,
      input: inputRefTo,
      dispatch: (event) => {
        const detail = { selectedDates: calendar.selectedDates };

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
      "calendar-container"
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
        inputRef.value = $inputValueFrom;
      } else {
        calendar.setDate($inputValue);
      }
    }
  });

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
    });
  }
</script>

<svelte:window
  on:click="{({ target }) => {
    if (!calendar || !calendar.isOpen) return;
    if (datePickerRef && datePickerRef.contains(target)) return;
    if (!calendar.calendarContainer.contains(target)) calendar.close();
  }}"
/>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div
  class:bx--form-item="{true}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <div
    bind:this="{datePickerRef}"
    id="{id}"
    class:bx--date-picker="{true}"
    class:bx--date-picker--short="{short}"
    class:bx--date-picker--light="{light}"
    class:bx--date-picker--simple="{datePickerType === 'simple'}"
    class:bx--date-picker--single="{datePickerType === 'single'}"
    class:bx--date-picker--range="{datePickerType === 'range'}"
    class:bx--date-picker--nolabel="{datePickerType === 'range' &&
      $labelTextEmpty}"
    on:keydown="{(e) => {
      if (calendar?.isOpen && e.key === 'Escape') {
        e.stopPropagation();
        calendar.close();
      }
    }}"
  >
    <slot />
  </div>
</div>
