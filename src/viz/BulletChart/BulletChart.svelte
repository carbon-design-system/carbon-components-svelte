<svelte:options immutable />

<script>
  /**
   * @event {{ threshold: number; kind: "target" | "band"; direction: "above" | "below"; value: number }} threshold Fires when an update moves the value across the target or a band boundary. Never fires on mount.
   */

  /** @restProps {div} */

  /** Specify the measured value */
  export let value = 0;

  /**
   * Specify the target, drawn as a tick across the bar.
   * @type {number | null}
   */
  export let target = undefined;

  /** Specify the start of the scale */
  export let min = 0;

  /**
   * Specify the end of the scale.
   * Defaults to the largest of the value, the target, and the last band.
   * @type {number}
   */
  export let max = undefined;

  /**
   * Specify the upper bounds of the qualitative bands, ascending.
   * The last band runs to the end of the scale.
   * @type {ReadonlyArray<number>}
   */
  export let bands = [];

  /**
   * Specify the accessible name. The value and the target are appended to it.
   * Leave empty to mark the graphic as decorative.
   */
  export let label = "";

  /** Specify the word written before the target in the accessible name */
  export let targetLabel = "target";

  /**
   * Specify the color of the measure. Defaults to a high contrast neutral.
   * @type {import("../utils/tokens.js").VizColor}
   */
  export let color = undefined;

  /**
   * Specify the size.
   * @type {"sm" | "md" | "lg"}
   */
  export let size = "md";

  /** Set to `true` to write the value next to the bar */
  export let showValue = false;

  /**
   * Specify how values are written: `Intl.NumberFormat` options or a function.
   * @type {import("../utils/format-compact.js").NumberFormat}
   */
  export let format = undefined;

  /**
   * Specify the locale.
   * @type {string}
   */
  export let locale = undefined;

  /**
   * Obtain a reference to the HTML element.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  import { createEventDispatcher, tick } from "svelte";
  import { getBulletGeometry } from "../utils/bullet.js";
  import { resolveFormat } from "../utils/format-compact.js";
  import { VIZ_SEMANTIC_COLORS, vizColor } from "../utils/tokens.js";

  const dispatch = createEventDispatcher();

  /** @type {number | undefined} */
  let previous;

  $: geometry = getBulletGeometry({ value, target, min, max, bands });
  $: formatValue = resolveFormat(format, locale);
  $: text = Number.isFinite(value) ? formatValue(value) : "";
  $: name = [
    label,
    [
      text,
      geometry.targetPct === null
        ? ""
        : `${targetLabel} ${formatValue(Number(target))}`,
    ]
      .filter(Boolean)
      .join(", "),
  ]
    .filter(Boolean)
    .join(": ");
  $: inlineColor =
    color === undefined || color === null
      ? undefined
      : VIZ_SEMANTIC_COLORS.includes(color)
        ? `var(--cds-viz-${color})`
        : vizColor(color);
  $: announce(value, target, bands);

  /**
   * @param {number} next
   * @param {number | null | undefined} goal
   * @param {ReadonlyArray<number>} bounds
   */
  function announce(next, goal, bounds) {
    const prev = previous;
    previous = next;
    if (prev === undefined || prev === next) return;
    if (!Number.isFinite(prev) || !Number.isFinite(next)) return;

    /** @type {Array<{ threshold: number; kind: "target" | "band" }>} */
    const marks = bounds.map((threshold) => ({ threshold, kind: "band" }));
    if (goal !== undefined && goal !== null) {
      marks.push({ threshold: goal, kind: "target" });
    }

    const rising = next > prev;
    const crossed = marks
      .filter(({ threshold }) =>
        rising
          ? prev < threshold && threshold <= next
          : next < threshold && threshold <= prev,
      )
      .sort((a, b) =>
        rising ? a.threshold - b.threshold : b.threshold - a.threshold,
      );
    if (crossed.length === 0) return;

    tick().then(() => {
      for (const mark of crossed) {
        dispatch("threshold", {
          ...mark,
          direction: rising ? "above" : "below",
          value: next,
        });
      }
    });
  }
</script>

<div
  bind:this={ref}
  class:bx--viz-bullet={true}
  class:bx--viz-bullet--sm={size === "sm"}
  class:bx--viz-bullet--lg={size === "lg"}
  role={label ? "img" : undefined}
  aria-label={label ? name : undefined}
  aria-hidden={label ? undefined : "true"}
  style:--bx-viz-color={inlineColor}
  {...$$restProps}
>
  <span class:bx--viz-bullet__track={true}>
    <span class:bx--viz-bullet__bands={true}>
      {#each geometry.bands as band (band.index)}
        <span
          class:bx--viz-bullet__band={true}
          style:--bx-viz-pct={band.pct}
          style:--bx-viz-step={geometry.bands.length - band.index}
        ></span>
      {/each}
    </span>
    <span
      class:bx--viz-bullet__measure={true}
      style:--bx-viz-pct={geometry.valuePct}
    ></span>
    {#if geometry.targetPct !== null}
      <span
        class:bx--viz-bullet__target={true}
        style:--bx-viz-pct={geometry.targetPct}
      ></span>
    {/if}
  </span>
  {#if showValue && text}
    <span class:bx--viz-bullet__value={true}>{text}</span>
  {/if}
</div>
