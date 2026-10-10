<svelte:options immutable />

<script>
  /**
   * @event {{ range: [number, number] | null }} zoom Fires when the person changes the range, with `null` when it is reset to everything.
   */

  /** @restProps {div} */

  /** Specify the height of the bar, in pixels */
  export let height = 32;

  /** Specify the narrowest range allowed, as a share of the whole */
  export let minSpan = 0.02;

  /** Specify how far an arrow key moves a handle, as a share of the whole */
  export let step = 0.02;

  /** Specify the label of the start handle */
  export let startLabel = "Range start";

  /** Specify the label of the end handle */
  export let endLabel = "Range end";

  /** Specify the label of the button that shows everything again */
  export let resetLabel = "Reset zoom";

  import { createEventDispatcher, getContext } from "svelte";
  import { CHART_CONTEXT } from "./context.js";
  import { clampWindow, overviewPath } from "./zoom-geometry.js";

  /** @type {import("./context.js").ChartContext} */
  const { groups, scales, size, zoom, fullX, setZoom } =
    getContext(CHART_CONTEXT);
  const dispatch = createEventDispatcher();

  /** @type {HTMLDivElement | null} */
  let track = null;
  /** @type {{ kind: "start" | "end" | "both"; grab: number; window: [number, number] } | null} */
  let drag = null;

  $: full = $fullX.domain;
  $: span = full[1] - full[0];
  $: usable = span > 0;
  $: current = $zoom ?? full;
  // The bar lines up with the plot above it.
  $: x0 = $scales.plot.x0;
  $: x1 = $scales.plot.x1;
  // Depends on the data and the width only, so dragging never rebuilds it.
  $: path = usable ? overviewPath($groups, full, { x0, x1, height }) : "";
  $: startPct = usable ? ((current[0] - full[0]) / span) * 100 : 0;
  $: endPct = usable ? ((current[1] - full[0]) / span) * 100 : 100;

  /** @param {[number, number]} range */
  function apply(range) {
    const whole = range[0] <= full[0] && range[1] >= full[1];
    setZoom(whole ? null : range);
    dispatch("zoom", { range: whole ? null : range });
  }

  /** @param {number} clientX */
  function valueAt(clientX) {
    if (!track) return full[0];
    const rect = track.getBoundingClientRect();
    const t = rect.width > 0 ? (clientX - rect.left) / rect.width : 0;
    return full[0] + Math.min(Math.max(t, 0), 1) * span;
  }

  /**
   * @param {PointerEvent} event
   * @param {"start" | "end" | "both"} kind
   */
  function onPointerDown(event, kind) {
    if (event.button !== 0) return;
    const target = /** @type {HTMLElement} */ (event.currentTarget);
    target.setPointerCapture?.(event.pointerId);
    drag = {
      kind,
      grab: valueAt(event.clientX),
      window: [current[0], current[1]],
    };
  }

  /** @param {PointerEvent} event */
  function onPointerMove(event) {
    if (!drag) return;
    const at = valueAt(event.clientX);
    const [a, b] = drag.window;
    const delta = at - drag.grab;
    apply(
      drag.kind === "both"
        ? clampWindow(a + delta, b + delta, full, minSpan * span, "both")
        : drag.kind === "start"
          ? clampWindow(at, b, full, minSpan * span, "start")
          : clampWindow(a, at, full, minSpan * span, "end"),
    );
  }

  function onPointerUp() {
    drag = null;
  }

  /**
   * @param {KeyboardEvent} event
   * @param {"start" | "end"} kind
   */
  function onKeydown(event, kind) {
    const by = {
      ArrowLeft: -step,
      ArrowDown: -step,
      ArrowRight: step,
      ArrowUp: step,
    }[event.key];
    let [a, b] = current;
    if (by !== undefined) {
      if (kind === "start") a += by * span;
      else b += by * span;
    } else if (event.key === "Home") {
      if (kind === "start") a = full[0];
      else b = a + minSpan * span;
    } else if (event.key === "End") {
      if (kind === "start") a = b - minSpan * span;
      else b = full[1];
    } else {
      return;
    }
    event.preventDefault();
    apply(clampWindow(a, b, full, minSpan * span, kind));
  }
</script>

{#if usable}
  <div
    class:bx--viz-zoom={true}
    class:bx--viz-zoom--dragging={drag !== null}
    style:--bx-viz-start={startPct}
    style:--bx-viz-end={endPct}
    {...$$restProps}
  >
    <div
      bind:this={track}
      class:bx--viz-zoom__track={true}
      style:margin-left="{(x0 / $size.width) * 100}%"
      style:margin-right="{(1 - x1 / $size.width) * 100}%"
      style:height="{height}px"
    >
      <svg
        class:bx--viz-zoom__overview={true}
        viewBox="{x0} 0 {Math.max(1, x1 - x0)} {height}"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <path d={path} />
      </svg>
      <!-- Dragging the window pans. The handles are the keyboard's way in. -->
      <div
        class:bx--viz-zoom__window={true}
        on:pointerdown={(event) => onPointerDown(event, "both")}
        on:pointermove={onPointerMove}
        on:pointerup={onPointerUp}
        on:pointercancel={onPointerUp}
        on:dblclick={() => apply([full[0], full[1]])}
      ></div>
      {#each [
        { kind: "start", label: startLabel, value: current[0] },
        { kind: "end", label: endLabel, value: current[1] },
      ] as handle (handle.kind)}
        <button
          type="button"
          class="bx--viz-zoom__handle bx--viz-zoom__handle--{handle.kind}"
          role="slider"
          aria-label={handle.label}
          aria-orientation="horizontal"
          aria-valuemin={full[0]}
          aria-valuemax={full[1]}
          aria-valuenow={handle.value}
          aria-valuetext={$scales.xLabel(handle.value)}
          on:pointerdown={(event) =>
            onPointerDown(event, handle.kind === "start" ? "start" : "end")}
          on:pointermove={onPointerMove}
          on:pointerup={onPointerUp}
          on:pointercancel={onPointerUp}
          on:keydown={(event) =>
            onKeydown(event, handle.kind === "start" ? "start" : "end")}
        ></button>
      {/each}
    </div>
    {#if $zoom}
      <button
        type="button"
        class:bx--viz-zoom__reset={true}
        on:click={() => apply([full[0], full[1]])}
      >
        {resetLabel}
      </button>
    {/if}
  </div>
{/if}
