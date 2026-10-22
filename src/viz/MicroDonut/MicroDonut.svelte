<svelte:options immutable />

<script>
  /**
   * @template {string | number} [Id=string]
   */

  /**
   * @slot {{ total: number; segments: import("../utils/shares.js").ShareSegment<Id>[] }}
   */

  /** @restProps {span} */

  /**
   * Specify the parts, in drawing order, clockwise from 12 o'clock.
   * @type {ReadonlyArray<import("../utils/shares.js").ShareItem<Id>>}
   */
  export let data = [];

  /**
   * Specify the accessible name. Each part and its share is appended to it.
   * Leave empty to mark the graphic as decorative.
   */
  export let label = "";

  /**
   * Specify the most slices to draw. Parts past the limit fold into one
   * trailing slice. More than five slices stop being readable at this size.
   */
  export let maxSegments = 5;

  /** Specify the label of the folded slice */
  export let otherLabel = "Other";

  /**
   * Specify which of Carbon's prescribed color groups to use (1-based).
   */
  export let palette = 1;

  /**
   * Specify the size: 16, 24, or 32 pixels. Set `diameter` for anything else.
   * @type {"sm" | "md" | "lg"}
   */
  export let size = "md";

  /**
   * Specify the diameter, in pixels. Overrides `size`.
   * @type {number}
   */
  export let diameter = undefined;

  /**
   * Specify the thickness of the ring, in pixels.
   * Defaults to a quarter of the diameter.
   * @type {number}
   */
  export let thickness = undefined;

  /**
   * Specify the locale.
   * @type {string}
   */
  export let locale = undefined;

  /**
   * Obtain a reference to the HTML element.
   * @bindable readonly
   * @type {null | HTMLSpanElement}
   */
  export let ref = null;

  import { formatPercent } from "../utils/format-compact.js";
  import { pathArc, pieAngles } from "../utils/path-arc.js";
  import { getShares } from "../utils/shares.js";
  import { categoricalColors, vizColor } from "../utils/tokens.js";

  const SIZES = { sm: 16, md: 24, lg: 32 };

  $: d = diameter ?? SIZES[size] ?? SIZES.md;
  $: shares = getShares(data, { maxSegments, otherLabel });
  $: slices = build(shares.segments, d, thickness, palette);
  $: name = [
    label,
    ...shares.segments.map(
      (segment) =>
        `${segment.item.label} ${formatPercent(segment.share, { locale, digits: 0 })}`,
    ),
  ]
    .filter(Boolean)
    .join(", ");

  /**
   * @param {typeof shares.segments} segments
   * @param {number} width
   * @param {number | undefined} stroke
   * @param {number} option
   */
  function build(segments, width, stroke, option) {
    const outerRadius = width / 2;
    const innerRadius = Math.max(outerRadius - (stroke ?? width / 4), 0);
    const drawn = segments.filter((segment) => segment.value > 0);
    const colors = categoricalColors(
      segments.filter((segment) => segment.items === null).length,
      option,
    );
    // A gap of about one pixel along the outer edge keeps neighbors distinct.
    const padAngle = drawn.length > 1 ? 1 / outerRadius : 0;
    const angles = pieAngles(
      segments.map((segment) => segment.value),
      { padAngle },
    );

    return segments
      .map((segment, i) => ({
        id: segment.item.id,
        color:
          segment.items === null
            ? segment.item.color === undefined
              ? colors[i]
              : vizColor(segment.item.color)
            : "var(--cds-viz-neutral)",
        d:
          segment.value > 0
            ? pathArc({
                cx: outerRadius,
                cy: outerRadius,
                innerRadius,
                outerRadius,
                startAngle: angles[i].startAngle,
                endAngle: angles[i].endAngle,
                padAngle,
              })
            : "",
      }))
      .filter((slice) => slice.d);
  }
</script>

<span
  bind:this={ref}
  class:bx--viz-micro-donut={true}
  role={label ? "img" : undefined}
  aria-label={label ? name : undefined}
  aria-hidden={label ? undefined : "true"}
  style:--bx-viz-diameter="{d}px"
  {...$$restProps}
>
  <svg
    class:bx--viz-micro-donut__svg={true}
    viewBox="0 0 {d} {d}"
    width={d}
    height={d}
    aria-hidden="true"
    focusable="false"
  >
    <circle
      class:bx--viz-micro-donut__track={true}
      cx={d / 2}
      cy={d / 2}
      r={d / 2 - (thickness ?? d / 4) / 2}
      stroke-width={thickness ?? d / 4}
    />
    {#each slices as slice (slice.id)}
      <path
        class:bx--viz-micro-donut__slice={true}
        d={slice.d}
        style:--bx-viz-color={slice.color}
      />
    {/each}
  </svg>
  {#if $$slots.default}
    <span class:bx--viz-micro-donut__center={true}>
      <slot total={shares.total} segments={shares.segments} />
    </span>
  {/if}
</span>
