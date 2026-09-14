<script>
  /**
   * @typedef {object} MeterThresholds
   * @property {number} [warning]
   * @property {number} [error]
   * @restProps {div}
   * @slot {{}}
   */

  /** Specify the current amount, in the same units as `max`. */
  export let value = 0;

  /** Specify the capacity. */
  export let max = 100;

  /** Specify the label text. */
  export let labelText = "";

  /** Set to `true` to visually hide the label text. The label remains available to screen readers. */
  export let hideLabel = false;

  /** Specify the helper text, rendered below the track. */
  export let helperText = "";

  /**
   * Specify the value text, right-aligned in the label row and used for `aria-valuetext`.
   * Format it yourself, e.g. "812 GB of 1 TB".
   */
  export let valueText = "";

  /**
   * Specify the warning and error thresholds, in the same units as `value`.
   * @type {MeterThresholds}
   */
  export let thresholds = undefined;

  /**
   * Override the derived status. When unset, the status is derived from `thresholds`.
   * @type {"default" | "success" | "warning" | "error"}
   */
  export let status = undefined;

  /** Set to `true` to draw a tick at each defined threshold. */
  export let showThresholds = false;

  /**
   * Specify the size of the meter.
   * @type {"sm" | "md"}
   */
  export let size = "md";

  /** Set an id for the meter element. */
  export let id = uniqueId();

  import { uniqueId } from "../utils/unique-id.js";

  let helperId = uniqueId();

  function deriveStatus(value, thresholds, overCapacity) {
    if (overCapacity) return "error";
    if (thresholds?.error !== undefined && value >= thresholds.error) {
      return "error";
    }
    if (thresholds?.warning !== undefined && value >= thresholds.warning) {
      return "warning";
    }
    return "default";
  }

  function getMarkers(thresholds, max) {
    return Object.entries(thresholds)
      .filter(([, threshold]) => threshold !== undefined)
      .map(([kind, threshold]) => ({
        kind,
        pct: max > 0 ? Math.min(Math.max(threshold / max, 0), 1) * 100 : 0,
      }));
  }

  $: overCapacity = value > max;
  $: ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  $: resolvedStatus = status ?? deriveStatus(value, thresholds, overCapacity);
  $: markers = showThresholds && thresholds ? getMarkers(thresholds, max) : [];
  $: cappedValue = max > 0 ? Math.min(value, max) : 0;
</script>

<div
  class:bx--meter={true}
  class:bx--meter--sm={size === "sm"}
  class:bx--meter--success={resolvedStatus === "success"}
  class:bx--meter--warning={resolvedStatus === "warning"}
  class:bx--meter--error={resolvedStatus === "error"}
  class:bx--meter--over={overCapacity}
  {...$$restProps}
>
  <div class:bx--meter__label={true}>
    <span
      id="{id}-label"
      class:bx--meter__label-text={true}
      class:bx--visually-hidden={hideLabel}
    >
      <slot name="labelChildren">{labelText}</slot>
    </span>
    {#if valueText || $$slots.valueChildren}
      <span class:bx--meter__value-text={true}>
        <slot name="valueChildren">{valueText}</slot>
      </span>
    {/if}
  </div>
  <div
    role="meter"
    {id}
    class:bx--meter__track={true}
    aria-labelledby="{id}-label"
    aria-valuemin={0}
    aria-valuemax={max}
    aria-valuenow={cappedValue}
    aria-valuetext={valueText || undefined}
    aria-describedby={helperText ? helperId : undefined}
  >
    <div class:bx--meter__bar={true} style:transform="scaleX({ratio})"></div>
    {#each markers as marker (marker.kind)}
      <span
        class:bx--meter__threshold={true}
        class:bx--meter__threshold--warning={marker.kind === "warning"}
        class:bx--meter__threshold--error={marker.kind === "error"}
        style:left="{marker.pct}%"
        aria-hidden="true"
      ></span>
    {/each}
  </div>
  {#if helperText}
    <div id={helperId} class:bx--meter__helper-text={true}>{helperText}</div>
  {/if}
</div>
