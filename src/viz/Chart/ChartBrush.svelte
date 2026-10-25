<svelte:options immutable />

<script>
  /**
   * @restProps {g}
   */

  import { getContext } from "svelte";
  import { CHART_CONTEXT } from "./context.js";

  /** @type {import("./context.js").ChartContext} */
  const { scales, brush, setBrush } = getContext(CHART_CONTEXT);

  /** @type {number | null} */
  let origin = null;
  let dragged = false;

  /** @param {PointerEvent} event */
  function along(event) {
    const target = /** @type {SVGGraphicsElement} */ (event.currentTarget);
    const svg = target.ownerSVGElement;
    if (!svg) return 0;
    const rect = svg.getBoundingClientRect();
    const box = svg.viewBox.baseVal;
    const { plot } = $scales;
    if ($scales.horizontal) {
      const py = ((event.clientY - rect.top) / rect.height) * box.height;
      return Math.min(plot.y1, Math.max(plot.y0, py));
    }
    const px = ((event.clientX - rect.left) / rect.width) * box.width;
    return Math.min(plot.x1, Math.max(plot.x0, px));
  }

  /** @param {PointerEvent} event */
  function onPointerDown(event) {
    if (event.button !== 0) return;
    origin = along(event);
    dragged = false;
    /** @type {Element} */ (event.currentTarget).setPointerCapture(
      event.pointerId,
    );
  }

  /** @param {PointerEvent} event */
  function onPointerMove(event) {
    if (origin === null) return;
    const now = along(event);
    if (Math.abs(now - origin) < 3 && !dragged) return;
    dragged = true;
    setBrush(toRange(origin, now), true);
  }

  /** @param {PointerEvent} event */
  function onPointerUp(event) {
    if (origin === null) return;
    const now = along(event);
    /** @type {Element} */ (event.currentTarget).releasePointerCapture(
      event.pointerId,
    );
    if (dragged) setBrush(toRange(origin, now));
    else if ($brush) setBrush(null);
    origin = null;
  }

  /** A click that ended a drag must not select the point under it. */
  function onClick(event) {
    if (dragged) {
      event.stopPropagation();
      dragged = false;
    }
  }

  /**
   * @param {number} a
   * @param {number} b
   * @returns {[number, number]}
   */
  function toRange(a, b) {
    const lo = $scales.x.invert(Math.min(a, b));
    const hi = $scales.x.invert(Math.max(a, b));
    return [Math.min(lo, hi), Math.max(lo, hi)];
  }

  $: box = $brush
    ? (() => {
        const from = $scales.x.map($brush[0]);
        const to = $scales.x.map($brush[1]);
        const { plot } = $scales;
        return $scales.horizontal
          ? {
              x: plot.x0,
              y: Math.min(from, to),
              width: plot.x1 - plot.x0,
              height: Math.abs(to - from),
            }
          : {
              x: Math.min(from, to),
              y: plot.y0,
              width: Math.abs(to - from),
              height: plot.y1 - plot.y0,
            };
      })()
    : null;
</script>

<!-- The chart's keyboard model brushes nothing; a click here only keeps a
     drag's end from selecting the point under it. -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<g class:bx--viz-brush={true} {...$$restProps}>
  <rect
    class:bx--viz-brush__hit={true}
    x={$scales.plot.x0}
    y={$scales.plot.y0}
    width={Math.max(0, $scales.plot.x1 - $scales.plot.x0)}
    height={Math.max(0, $scales.plot.y1 - $scales.plot.y0)}
    on:pointerdown={onPointerDown}
    on:pointermove={onPointerMove}
    on:pointerup={onPointerUp}
    on:click={onClick}
  />
  {#if box}
    <rect
      class:bx--viz-brush__area={true}
      aria-hidden="true"
      x={box.x}
      y={box.y}
      width={box.width}
      height={box.height}
    />
  {/if}
</g>
