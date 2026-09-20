<svelte:options immutable />

<script>
  /**
   * @template [T=any]
   */

  /**
   * Row and event types are written inline: a typedef cannot carry the
   * generic into the generated declarations.
   * @restProps {figure}
   * @event {{ datum: T; series: string | number; index: number; originalEvent: Event }} select Fires when the focused datum is activated by click, Enter, or Space.
   * @event {{ x: number; points: Array<{ datum: T; series: string | number; index: number; y: number }> } | null} hover Fires when the pointer or keyboard focus moves to another x, and with `null` when it leaves.
   * @event {{ series: string | number; hidden: boolean }} legend:toggle Fires when a series is shown or hidden.
   * @event {{ xDomain: [number, number]; yDomain: [number, number]; count: number }} update Fires after the data or its domain changes. Requires `emitUpdate`.
   * @slot {{}} toolbar
   * @slot {{}} tooltip
   * @slot {{}} legend
   */

  /**
   * Specify the rows, in long format: one row per x and series.
   * Reassign the array to update.
   * @type {ReadonlyArray<T>}
   */
  export let data = [];

  /**
   * Specify the x accessor: a property name or a function.
   * Dates make a time axis and strings a categorical one.
   * @type {(keyof T & string) | ((row: T, index: number) => number | Date | string)}
   */
  export let x;

  /**
   * Specify the y accessor: a property name or a function.
   * @type {(keyof T & string) | ((row: T, index: number) => number | null | undefined)}
   */
  export let y;

  /**
   * Specify the accessor that splits rows into series.
   * @type {(keyof T & string) | ((row: T, index: number) => string | number)}
   */
  export let series = undefined;

  /** Specify the title. It names the chart for assistive technology. */
  export let title = "";

  /** Specify a longer description, announced after the title */
  export let description = "";

  /** Specify the height in pixels */
  export let height = 288;

  /**
   * Specify the width in pixels, or `"auto"` to fill the container.
   * @type {number | "auto"}
   */
  export let width = "auto";

  /**
   * Override any of the plot margins, in pixels.
   * The left margin otherwise follows the y tick labels.
   * @type {{ top?: number; right?: number; bottom?: number; left?: number }}
   */
  export let margin = undefined;

  /**
   * Override the x domain.
   * @type {[number | Date, number | Date]}
   */
  export let xDomain = undefined;

  /**
   * Specify the y domain: fixed bounds, `"auto"` for the data extent,
   * or `"nice"` to round it out to tick boundaries.
   * @type {[number, number] | "auto" | "nice"}
   */
  export let yDomain = "nice";

  /** Set to `false` to let the y domain exclude zero */
  export let zero = true;

  /**
   * Specify the hidden series keys.
   * @type {ReadonlyArray<string | number>}
   */
  export let hidden = [];

  /**
   * Specify the selected datum.
   * @type {{ series: string | number; index: number } | null}
   */
  export let selected = null;

  /**
   * Specify a fixed color per series key.
   * @type {Record<string, import("../utils/tokens.js").VizColor>}
   */
  export let colors = undefined;

  /** Specify which of Carbon's prescribed color groups to use for up to 5 series */
  export let palette = 1;

  /**
   * Specify how y values are written: `Intl.NumberFormat` options or a function.
   * @type {Intl.NumberFormatOptions | ((value: number) => string)}
   */
  export let yFormat = undefined;

  /**
   * Override the x tick label format.
   * @type {(value: number) => string}
   */
  export let xFormat = undefined;

  /**
   * Override the full-precision x label used by tooltips and announcements.
   * @type {(value: number) => string}
   */
  export let xLabelFormat = undefined;

  /**
   * Specify the locale.
   * @type {string}
   */
  export let locale = undefined;

  /** Set to `true` to dispatch `update` after the data or its domain changes */
  export let emitUpdate = false;

  /**
   * Obtain a reference to the figure element.
   * @bindable readonly
   * @type {null | HTMLElement}
   */
  export let ref = null;

  import { createEventDispatcher, onMount, setContext, tick } from "svelte";
  import { derived, get, writable } from "svelte/store";
  import { rafThrottle } from "../../utils/raf-throttle.js";
  import { toAccessor } from "../utils/accessor.js";
  import { bisectNearest } from "../utils/nearest-point.js";
  import { CHART_CONTEXT } from "./context.js";
  import {
    buildGroups,
    buildScales,
    resolveDomain,
    sameDomain,
  } from "./model.js";

  const dispatch = createEventDispatcher();

  /** Width used until the container is measured, and on the server. */
  const NOMINAL_WIDTH = 640;

  const groups = writable(/** @type {any[]} */ ([]));
  const domain = writable(
    /** @type {import("./model.js").ChartDomain} */ ({
      x: [0, 1],
      y: [0, 1],
      kind: "linear",
      categories: [],
    }),
  );
  const size = writable({
    width: typeof width === "number" ? width : NOMINAL_WIDTH,
    height,
  });
  const scaleOptions = writable({});
  const hover = writable(/** @type {any} */ (null));
  const hiddenStore = writable(hidden);
  const included = writable(/** @type {number[]} */ ([]));
  // How many mounted marks need one slot per x, as bars do.
  const bandRequests = writable(0);
  const reserved = writable(
    /** @type {Array<{ side: "top" | "right" | "bottom" | "left", px: number }>} */ ([]),
  );

  const scales = derived(
    [domain, size, scaleOptions],
    ([$domain, $size, $scaleOptions]) =>
      buildScales($domain, $size, $scaleOptions),
  );

  // A store treats every object as changed, so only write when a number moved.
  /**
   * @param {number | "auto"} nextWidth
   * @param {number} nextHeight
   */
  function resize(nextWidth, nextHeight) {
    const current = get(size);
    const resolved = typeof nextWidth === "number" ? nextWidth : current.width;
    if (current.width === resolved && current.height === nextHeight) return;
    size.set({ width: resolved, height: nextHeight });
  }

  function clearHover() {
    if (get(hover) === null) return;
    hover.set(null);
    dispatch("hover", null);
  }

  setContext(CHART_CONTEXT, {
    groups,
    scales,
    size,
    hover,
    hidden: hiddenStore,
    /** @param {number} value */
    includeY(value) {
      included.update((list) => [...list, value]);
      return () =>
        included.update((list) => {
          const index = list.indexOf(value);
          return index === -1
            ? list
            : [...list.slice(0, index), ...list.slice(index + 1)];
        });
    },
    /** @param {string | number} key */
    toggleSeries(key) {
      const isHidden = hidden.includes(key);
      const keys = get(groups).map((group) => group.key);
      // Hiding the last visible series would leave an empty chart.
      if (!isHidden && keys.filter((k) => !hidden.includes(k)).length <= 1) {
        return;
      }
      hidden = isHidden ? hidden.filter((k) => k !== key) : [...hidden, key];
      dispatch("legend:toggle", { series: key, hidden: !isHidden });
    },
    /** @param {string | number} key */
    isolateSeries(key) {
      const others = get(groups)
        .map((group) => group.key)
        .filter((k) => k !== key);
      const isolated =
        !hidden.includes(key) && others.every((k) => hidden.includes(k));
      // Isolating the isolated series again brings the others back.
      const next = isolated ? [] : others;
      const before = hidden;
      hidden = next;
      for (const k of [key, ...others]) {
        if (before.includes(k) !== next.includes(k)) {
          dispatch("legend:toggle", { series: k, hidden: next.includes(k) });
        }
      }
    },
    useBand() {
      bandRequests.update((count) => count + 1);
      return () => bandRequests.update((count) => count - 1);
    },
    /**
     * @param {"top" | "right" | "bottom" | "left"} side
     * @param {number} px
     */
    reserveMargin(side, px) {
      const entry = { side, px };
      reserved.update((list) => [...list, entry]);
      return () => reserved.update((list) => list.filter((e) => e !== entry));
    },
    clearHover,
  });

  const defaultSeries = () => title || "value";

  $: xAccessor = toAccessor(x);
  $: yAccessor = toAccessor(y);
  $: seriesAccessor = series ? toAccessor(series) : defaultSeries;
  $: hiddenStore.set(hidden);
  $: scaleOptions.set({
    locale,
    margin,
    reserved: $reserved,
    yFormat,
    xFormat,
    xLabelFormat,
  });
  $: resize(width, height);
  $: rebuild(
    data,
    xAccessor,
    yAccessor,
    seriesAccessor,
    hidden,
    colors,
    palette,
    xDomain,
    yDomain,
    zero,
    $included,
    $bandRequests > 0,
    locale,
  );

  function rebuild(
    /** @type {ReadonlyArray<T>} */ rows,
    /** @type {any} */ xA,
    /** @type {any} */ yA,
    /** @type {any} */ sA,
    /** @type {ReadonlyArray<string | number>} */ hiddenKeys,
    /** @type {any} */ colorMap,
    /** @type {number} */ paletteOption,
    /** @type {any} */ xD,
    /** @type {any} */ yD,
    /** @type {boolean} */ includeZero,
    /** @type {number[]} */ include,
    /** @type {boolean} */ band,
    /** @type {string | undefined} */ bandLocale,
  ) {
    const built = buildGroups(rows, {
      x: xA,
      y: yA,
      series: sA,
      hidden: hiddenKeys,
      colors: colorMap,
      palette: paletteOption,
      band,
      locale: bandLocale,
    });
    const next = resolveDomain(built, {
      xDomain: xD,
      yDomain: yD,
      zero: includeZero,
      include,
    });
    groups.set(built.groups);
    // Publish a new domain only when it plots differently, so an in-range
    // append leaves the scales, axes, and grid alone.
    if (!sameDomain(get(domain), next)) domain.set(next);
    hover.set(null);

    updateDetail = { xDomain: next.x, yDomain: next.y, count: rows.length };
  }

  /** @type {{ xDomain: [number, number]; yDomain: [number, number]; count: number } | null} */
  let updateDetail = null;

  // `emitUpdate` is named here so that turning it on dispatches too: Svelte 3
  // and 4 only track what a reactive statement references directly.
  $: if (emitUpdate && updateDetail) announceUpdate(updateDetail);

  /** @param {NonNullable<typeof updateDetail>} detail */
  function announceUpdate(detail) {
    tick().then(() => dispatch("update", detail));
  }

  /** @type {SVGSVGElement} */
  let svg;

  onMount(() => {
    if (width !== "auto" || !ref || typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(
      rafThrottle((/** @type {ResizeObserverEntry[]} */ entries) => {
        const measured = Math.round(entries[0].contentRect.width);
        if (measured > 0 && measured !== get(size).width) {
          size.update((current) => ({ ...current, width: measured }));
        }
      }),
    );
    observer.observe(ref);
    return () => observer.disconnect();
  });

  // Pointer and keyboard share one path, so both get the same ruler,
  // tooltip, and announcement.
  let focusIndex = -1;
  let focusSeries = 0;

  /** @param {number} xValue */
  function hoverAt(xValue) {
    const visible = get(groups).filter(
      (group) => !group.hidden && group.xs.length > 0,
    );
    /** @type {number | null} */
    let nearest = null;
    for (const group of visible) {
      const candidate = group.xs[bisectNearest(group.xs, xValue)];
      if (
        nearest === null ||
        Math.abs(candidate - xValue) < Math.abs(nearest - xValue)
      ) {
        nearest = candidate;
      }
    }
    if (nearest === null) return clearHover();
    const previous = get(hover);
    if (previous && previous.x === nearest) return;

    const current = get(scales);
    const points = [];
    for (const group of visible) {
      const index = bisectNearest(group.xs, nearest);
      if (group.xs[index] !== nearest || !Number.isFinite(group.ys[index])) {
        continue;
      }
      points.push({
        series: group.key,
        datum: group.rows[index],
        index,
        y: group.ys[index],
        py: current.y.map(group.ys[index]),
        color: group.color,
      });
    }
    hover.set({ x: nearest, px: current.x.map(nearest), points });
    dispatch("hover", {
      x: nearest,
      points: points.map(({ datum, series: key, index, y: value }) => ({
        datum,
        series: key,
        index,
        y: value,
      })),
    });
  }

  const onPointerMove = rafThrottle((/** @type {PointerEvent} */ event) => {
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0) return;
    const current = get(scales);
    const px = ((event.clientX - rect.left) / rect.width) * get(size).width;
    hoverAt(
      current.x.invert(
        Math.min(current.plot.x1, Math.max(current.plot.x0, px)),
      ),
    );
  });

  /**
   * Moving onto the tooltip keeps it open, so its content can be read and
   * selected (WCAG 1.4.13). The tooltip clears hover when the pointer leaves it.
   *
   * @param {PointerEvent} event
   */
  function onPointerLeave(event) {
    const to = event.relatedTarget;
    if (
      to instanceof Element &&
      ref?.contains(to) &&
      to.closest(".bx--viz-chart-tooltip")
    ) {
      return;
    }
    clearHover();
  }

  /** @param {Event} event */
  function selectCurrent(event) {
    const current = get(hover);
    if (!current || current.points.length === 0) return;
    const point =
      current.points[Math.min(focusSeries, current.points.length - 1)];
    selected = { series: point.series, index: point.index };
    dispatch("select", {
      datum: point.datum,
      series: point.series,
      index: point.index,
      originalEvent: event,
    });
  }

  /** @param {KeyboardEvent} event */
  function onKeydown(event) {
    const visible = get(groups).filter(
      (group) => !group.hidden && group.xs.length > 0,
    );
    if (visible.length === 0) return;
    const group = visible[Math.min(focusSeries, visible.length - 1)];
    const last = group.xs.length - 1;

    switch (event.key) {
      case "ArrowRight":
        focusIndex = Math.min(last, focusIndex + 1);
        break;
      case "ArrowLeft":
        focusIndex = Math.max(0, focusIndex - 1);
        break;
      case "Home":
        focusIndex = 0;
        break;
      case "End":
        focusIndex = last;
        break;
      case "ArrowDown":
        focusSeries = (focusSeries + 1) % visible.length;
        break;
      case "ArrowUp":
        focusSeries = (focusSeries - 1 + visible.length) % visible.length;
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        selectCurrent(event);
        return;
      case "Escape":
        focusIndex = -1;
        clearHover();
        return;
      default:
        return;
    }
    event.preventDefault();
    if (focusIndex < 0) focusIndex = 0;
    const target = visible[Math.min(focusSeries, visible.length - 1)];
    hoverAt(target.xs[Math.min(focusIndex, target.xs.length - 1)]);
  }

  $: announcement = $hover
    ? `${$scales.xLabel($hover.x)}: ${$hover.points
        .map(
          (/** @type {any} */ point) =>
            `${point.series} ${$scales.yFormat(point.y)}`,
        )
        .join(", ")}`
    : "";
</script>

<figure bind:this={ref} class:bx--viz-chart={true} {...$$restProps}>
  {#if title}
    <figcaption class:bx--viz-chart__title={true}>{title}</figcaption>
  {/if}
  <slot name="toolbar" />
  <div class:bx--viz-chart__plot={true} style:height="{$size.height}px">
    <!-- A chart is one tab stop. Arrow keys move between data points. -->
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <svg
      bind:this={svg}
      class:bx--viz-chart__svg={true}
      viewBox="0 0 {$size.width} {$size.height}"
      height={$size.height}
      role="application"
      aria-roledescription="chart"
      aria-label={[title, description].filter(Boolean).join(". ") || undefined}
      tabindex="0"
      on:pointermove={onPointerMove}
      on:pointerleave={onPointerLeave}
      on:click={selectCurrent}
      on:keydown={onKeydown}
      on:blur={clearHover}
    >
      <slot />
    </svg>
    <slot name="tooltip" />
  </div>
  <div class:bx--visually-hidden={true} aria-live="polite">{announcement}</div>
  <slot name="legend" />
</figure>
