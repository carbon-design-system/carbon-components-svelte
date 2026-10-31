<svelte:options immutable />

<script>
  /**
   * @event {{ from: Date; to: Date; preset: string | null }} change Fires when the range changes from the picker.
   */

  /** @restProps {div} */

  /**
   * Specify the time range store, from `createTimeRange`. The picker reads
   * its presets and writes to it. Without one it keeps a range of its own.
   * @type {import("../utils/time-range.js").TimeRange}
   */
  export let range = createTimeRange();

  /** Set to `false` to offer the presets only, with no custom dates */
  export let custom = true;

  /**
   * Specify the size of the switcher.
   * @type {"sm" | "md" | "lg"}
   */
  export let size = "sm";

  /** Specify the label of the custom dates switch */
  export let customLabel = "Custom";

  /** Specify the labels of the two date inputs */
  export let fromLabel = "From";

  export let toLabel = "To";

  /** Specify the input placeholder */
  export let placeholder = "mm/dd/yyyy";

  /**
   * Specify how presets are written. Defaults to "Last 7 days".
   * @type {(preset: string) => string}
   */
  export let presetLabel = (preset) => writePreset(preset, locale);

  /**
   * Specify the locale.
   * @type {string}
   */
  export let locale = undefined;

  import { createEventDispatcher } from "svelte";
  import ContentSwitcher from "../../ContentSwitcher/ContentSwitcher.svelte";
  import Switch from "../../ContentSwitcher/Switch.svelte";
  import DatePicker from "../../DatePicker/DatePicker.svelte";
  import DatePickerInput from "../../DatePicker/DatePickerInput.svelte";
  import {
    createTimeRange,
    presetLabel as writePreset,
  } from "../utils/time-range.js";

  const dispatch = createEventDispatcher();

  $: presets = range.presets;
  $: selectedIndex =
    $range.preset === null
      ? presets.length
      : Math.max(0, presets.indexOf($range.preset));
  $: showDates = custom && $range.preset === null;

  /** @param {number} index */
  function pick(index) {
    if (index < presets.length) {
      range.set(presets[index]);
    } else {
      // Custom keeps the current dates, now as dates rather than a preset.
      range.set([$range.from, $range.to]);
    }
    dispatch("change", $range);
  }

  /** @param {CustomEvent} event */
  function onDates(event) {
    const detail = event.detail;
    const dates = detail?.selectedDates;
    if (!Array.isArray(dates) || dates.length < 2) return;
    range.set([dates[0], dates[1]]);
    dispatch("change", $range);
  }

  /** @param {Date} date */
  const iso = (date) => date.toISOString().slice(0, 10);
</script>

<div class:bx--viz-time-range={true} {...$$restProps}>
  <ContentSwitcher
    {size}
    {selectedIndex}
    on:change={(event) => pick(event.detail)}
  >
    {#each presets as preset (preset)}
      <Switch text={presetLabel(preset)} />
    {/each}
    {#if custom}
      <Switch text={customLabel} />
    {/if}
  </ContentSwitcher>
  {#if showDates}
    <DatePicker
      datePickerType="range"
      dateFormat="Y-m-d"
      valueFrom={iso($range.from)}
      valueTo={iso($range.to)}
      on:change={onDates}
    >
      <DatePickerInput
        labelText={fromLabel}
        {placeholder}
        size="sm"
        hideLabel
      />
      <DatePickerInput labelText={toLabel} {placeholder} size="sm" hideLabel />
    </DatePicker>
  {/if}
</div>
