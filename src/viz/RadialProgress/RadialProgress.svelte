<svelte:options immutable />

<script>
  /**
   * @event {{ threshold: import("../utils/thresholds.js").Threshold; direction: "above" | "below"; value: number }} threshold Fires when an update moves the value across a threshold. Never fires on mount.
   */

  /**
   * @slot {{ value: number; ratio: number; formattedValue: string; status: "success" | "warning" | "error" | "info" | "default" }}
   */

  /** @restProps {div} */

  /** Specify the value */
  export let value = 0;

  /** Specify the start of the scale */
  export let min = 0;

  /** Specify the end of the scale */
  export let max = 100;

  /**
   * Specify the shape of the arc.
   * @type {"full" | "three-quarter" | "half"}
   */
  export let arc = "full";

  /** Specify the diameter, in pixels */
  export let diameter = 96;

  /**
   * Specify the thickness of the arc, in pixels.
   * Defaults to an eighth of the diameter.
   * @type {number}
   */
  export let thickness = undefined;

  /**
   * Specify status thresholds. The arc takes the color of the highest one
   * the value has reached, and each is drawn as a tick on the track.
   * @type {import("../utils/thresholds.js").ThresholdInput}
   */
  export let thresholds = undefined;

  /**
   * Specify the accessible name. Leave empty to mark the graphic as decorative.
   */
  export let label = "";

  /** Set to `true` to hide the value in the center */
  export let hideValue = false;

  /**
   * Specify how the center value is written: `Intl.NumberFormat` options or
   * a function. Defaults to the share of the scale as a percentage.
   * @type {import("../utils/format-compact.js").NumberFormat}
   */
  export let format = undefined;

  /**
   * Specify the color of the arc when no threshold applies.
   * @type {import("../utils/tokens.js").VizColor}
   */
  export let color = "interactive";

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
  import { formatPercent, resolveFormat } from "../utils/format-compact.js";
  import { pathArc } from "../utils/path-arc.js";
  import {
    crossings,
    normalizeThresholds,
    statusAt,
  } from "../utils/thresholds.js";
  import { VIZ_SEMANTIC_COLORS, vizColor } from "../utils/tokens.js";

  const dispatch = createEventDispatcher();
  const SWEEPS = {
    full: [0, Math.PI * 2],
    "three-quarter": [-Math.PI * 0.75, Math.PI * 0.75],
    half: [-Math.PI / 2, Math.PI / 2],
  };

  /** @type {number | undefined} */
  let previous;

  $: marks = normalizeThresholds(thresholds);
  $: span = max - min;
  $: ratio =
    span > 0 && Number.isFinite(value)
      ? Math.min(Math.max((value - min) / span, 0), 1)
      : 0;
  $: status = Number.isFinite(value) ? statusAt(value, marks) : "default";
  $: formattedValue = format
    ? resolveFormat(format, locale)(value)
    : formatPercent(ratio, { locale, digits: 0 });
  $: geometry = build(arc, diameter, thickness, ratio, marks, min, span);
  $: inlineColor =
    status === "default"
      ? color === "interactive"
        ? undefined
        : VIZ_SEMANTIC_COLORS.includes(color)
          ? `var(--cds-viz-${color})`
          : vizColor(color)
      : `var(--cds-viz-${status})`;
  $: announce(value, marks);

  /**
   * @param {"full" | "three-quarter" | "half"} shape
   * @param {number} d
   * @param {number | undefined} stroke
   * @param {number} t
   * @param {ReadonlyArray<import("../utils/thresholds.js").Threshold>} ticks
   * @param {number} from
   * @param {number} range
   */
  function build(shape, d, stroke, t, ticks, from, range) {
    const [start, end] = SWEEPS[shape] ?? SWEEPS.full;
    const outerRadius = d / 2;
    const width = Math.min(stroke ?? d / 8, outerRadius);
    const innerRadius = outerRadius - width;
    const base = { cx: outerRadius, cy: outerRadius, innerRadius, outerRadius };
    // How far below the center the arc reaches, as a share of the radius.
    const drop = shape === "full" ? 1 : Math.max(-Math.cos(end), 0);

    return {
      height: outerRadius * (1 + drop),
      track: pathArc({ ...base, startAngle: start, endAngle: end }),
      fill:
        t > 0
          ? pathArc({
              ...base,
              startAngle: start,
              endAngle: start + (end - start) * t,
            })
          : "",
      ticks: ticks
        .filter(
          (mark) => range > 0 && mark.value > from && mark.value < from + range,
        )
        .map((mark) => {
          const angle = start + ((end - start) * (mark.value - from)) / range;
          const sin = Math.sin(angle);
          const cos = -Math.cos(angle);
          return {
            value: mark.value,
            x1: outerRadius + innerRadius * sin,
            y1: outerRadius + innerRadius * cos,
            x2: outerRadius + outerRadius * sin,
            y2: outerRadius + outerRadius * cos,
          };
        }),
    };
  }

  /**
   * @param {number} next
   * @param {ReadonlyArray<import("../utils/thresholds.js").Threshold>} list
   */
  function announce(next, list) {
    const prev = previous;
    previous = next;
    if (prev === undefined || prev === next) return;
    if (!Number.isFinite(prev) || !Number.isFinite(next)) return;
    const crossed = crossings(prev, next, list);
    if (crossed.length === 0) return;
    tick().then(() => {
      for (const crossing of crossed) {
        dispatch("threshold", { ...crossing, value: next });
      }
    });
  }
</script>

<div
  bind:this={ref}
  class:bx--viz-radial={true}
  class:bx--viz-radial--half={arc === "half"}
  role={label ? "meter" : undefined}
  aria-label={label || undefined}
  aria-valuemin={label ? min : undefined}
  aria-valuemax={label ? max : undefined}
  aria-valuenow={label && Number.isFinite(value) ? value : undefined}
  aria-valuetext={label ? formattedValue : undefined}
  aria-hidden={label ? undefined : "true"}
  style:--bx-viz-color={inlineColor}
  style:--bx-viz-diameter="{diameter}px"
  {...$$restProps}
>
  <svg
    class:bx--viz-radial__svg={true}
    viewBox="0 0 {diameter} {geometry.height}"
    width={diameter}
    height={geometry.height}
    aria-hidden="true"
    focusable="false"
  >
    <path class:bx--viz-radial__track={true} d={geometry.track} />
    {#if geometry.fill}
      <path class:bx--viz-radial__fill={true} d={geometry.fill} />
    {/if}
    {#each geometry.ticks as mark (mark.value)}
      <line
        class:bx--viz-radial__tick={true}
        x1={mark.x1}
        y1={mark.y1}
        x2={mark.x2}
        y2={mark.y2}
      />
    {/each}
  </svg>
  {#if !hideValue}
    <div class:bx--viz-radial__center={true}>
      <slot {value} {ratio} {formattedValue} {status}>
        <span class:bx--viz-radial__value={true}>{formattedValue}</span>
      </slot>
    </div>
  {/if}
</div>
