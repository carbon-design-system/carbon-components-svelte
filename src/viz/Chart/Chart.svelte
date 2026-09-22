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
   * @slot {{}} table
   * @slot {{}} empty
   * @slot {{}} zoom
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
   * Override the x domain, or set to `"nice"` to round a numeric x out to
   * tick values, as a scatter plot wants.
   * @type {[number | Date, number | Date] | "nice"}
   */
  export let xDomain = undefined;

  /**
   * Specify the y domain: fixed bounds, `"auto"` for the data extent,
   * `"nice"` to round it out to tick boundaries, or `"marks"` to ignore the
   * data and measure only what marks register, as a waterfall's running total.
   * @type {[number, number] | "auto" | "nice" | "marks"}
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
   * Specify the visible x range, as a `ChartZoomBar` sets it. `null` shows
   * everything. Applies to a time or numeric x. Marks are clipped to the
   * plot, and the y axis keeps its full range so values stay comparable
   * while the range moves.
   * @type {[number | Date, number | Date] | null}
   */
  export let zoom = null;

  /**
   * Specify the y scale. `"log"` suits values that span orders of magnitude,
   * and needs strictly positive data: with a zero or a negative value the
   * axis falls back to linear. A log axis never includes zero.
   * @type {"linear" | "log"}
   */
  export let yScale = "linear";

  /**
   * Specify the series to plot on a secondary y axis, with its own domain.
   * A `ChartAxis` on the right, or on top of a horizontal chart, reads it.
   * Use it when two series have different units, and never for two series
   * that share one, since the eye compares their heights.
   * @type {ReadonlyArray<string | number>}
   */
  export let secondary = [];

  /**
   * Override the secondary y domain. `"nice"` rounds it out to tick values.
   * @type {[number, number] | "auto" | "nice"}
   */
  export let y2Domain = "nice";

  /**
   * Specify how secondary y values are written: `Intl.NumberFormat` options
   * or a function.
   * @type {Intl.NumberFormatOptions | ((value: number) => string)}
   */
  export let y2Format = undefined;

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
   * Specify the orientation. `"horizontal"` runs the x scale down the left
   * side and the y scale along the bottom, for horizontal bars.
   * @type {"vertical" | "horizontal"}
   */
  export let orientation = "vertical";

  /**
   * Specify the locale.
   * @type {string}
   */
  export let locale = undefined;

  /**
   * Set to `true` while the data loads. The plot is covered by a skeleton
   * and the chart is marked busy.
   */
  export let loading = false;

  /** Specify the text shown in place of the plot when there is no data */
  export let emptyText = "No data";

  /**
   * Specify whether to show the chart or its data as a table.
   * The table is the text alternative: every value, reachable without a pointer.
   * @type {"chart" | "table"}
   */
  export let view = "chart";

  /**
   * Specify the header of the x column in the data table.
   * Defaults to the name of the `x` field, or to a word for the kind of axis.
   * @type {string}
   */
  export let xHeader = undefined;

  /** Set to `true` to dispatch `update` after the data or its domain changes */
  export let emitUpdate = false;

  /**
   * Share hover with every other chart that has the same id, so a dashboard
   * shows one crosshair across all of them. The charts should share an x axis.
   * @type {string}
   */
  export let syncId = undefined;

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
  import {
    backgroundBehind,
    rasterizeSvg,
    serializeSvg,
  } from "../utils/export-svg.js";
  import { bisectNearest, createGridIndex } from "../utils/nearest-point.js";
  import { nextId } from "../utils/next-id.js";
  import { observeResize } from "../utils/resize-pool.js";
  import ChartDataTable from "./ChartDataTable.svelte";
  import { CHART_CONTEXT } from "./context.js";
  import {
    buildGroups,
    buildScales,
    resolveDomain,
    sameDomain,
    yScaleOf,
  } from "./model.js";
  import { joinSync } from "./sync.js";

  const dispatch = createEventDispatcher();

  /** Width used until the container is measured, and on the server. */
  const NOMINAL_WIDTH = 640;

  const groups = writable(/** @type {any[]} */ ([]));
  const domain = writable(
    /** @type {import("./model.js").ChartDomain} */ ({
      x: [0, 1],
      y: [0, 1],
      y2: null,
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
  const viewStore = writable(view);
  const titleStore = writable(title);
  const xHeaderStore = writable("");
  const included = writable(/** @type {number[]} */ ([]));
  // How many mounted marks need one slot per x, as bars do.
  const bandRequests = writable(0);
  // How many mounted marks want hover to follow the nearest point in both
  // directions, as points do, instead of the nearest x.
  let pointRequests = 0;
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
   * @param {boolean} [measured] The width came from the resize observer.
   */
  function resize(nextWidth, nextHeight, measured = false) {
    const current = get(size);
    // A measured width only applies while the chart is sized by its container.
    if (measured && width !== "auto") return;
    const resolved = typeof nextWidth === "number" ? nextWidth : current.width;
    if (current.width === resolved && current.height === nextHeight) return;
    size.set({ width: resolved, height: nextHeight });
  }

  /** @type {ReturnType<typeof joinSync> | null} */
  let sync = null;

  /** @param {boolean} [fromSync] A synced chart must not echo back. */
  function clearHover(fromSync = false) {
    if (get(hover) === null) return;
    hover.set(null);
    dispatch("hover", null);
    if (!fromSync) sync?.publish(null);
  }

  const clipId = nextId("bx-viz-clip");
  const zoomStore = writable(/** @type {[number, number] | null} */ (null));
  // The x range with no zoom applied, which the zoom bar spans.
  const fullX = writable(
    /** @type {{ domain: [number, number]; kind: "time" | "linear" | "category" }} */ ({
      domain: [0, 1],
      kind: "linear",
    }),
  );
  // Marks clip to the plot only while zoomed, when they can overflow it.
  const clip = derived(zoomStore, ($zoom) =>
    $zoom ? `url(#${clipId})` : undefined,
  );

  /** @param {[number, number] | null} range */
  function setZoom(range) {
    const full = get(fullX).domain;
    // The whole range is no zoom at all.
    zoom =
      range && (range[0] > full[0] || range[1] < full[1])
        ? [range[0], range[1]]
        : null;
  }

  const fullscreenStore = writable(false);
  /** Plot height while fullscreen, or 0 to use the `height` prop. */
  let fullscreenHeight = 0;
  /** @type {HTMLDivElement | null} */
  let plot = null;

  function toggleFullscreen() {
    if (!ref) return;
    if (document.fullscreenElement === ref) document.exitFullscreen();
    else ref.requestFullscreen?.();
  }

  // The plot takes whatever the title, toolbar, and legend leave of the screen.
  function onFullscreenChange() {
    const on = ref !== null && document.fullscreenElement === ref;
    fullscreenStore.set(on);
    if (!on || !ref || !plot) {
      fullscreenHeight = 0;
      return;
    }
    const chrome = ref.scrollHeight - plot.clientHeight;
    fullscreenHeight = Math.max(200, window.innerHeight - chrome);
  }

  /**
   * The plot as an image, with the title above and the series below.
   * @param {"svg" | "png"} format
   * @returns {Promise<string | Blob>}
   */
  function exportImage(format) {
    if (!svg || !ref) {
      return Promise.reject(new Error("The chart is not mounted"));
    }
    const {
      markup,
      width: w,
      height: h,
    } = serializeSvg(svg, {
      title,
      legend: get(groups)
        .filter((group) => !group.hidden)
        .map((group) => ({
          label: String(group.key),
          color: resolveColor(group.color),
        })),
      background: backgroundBehind(ref),
      color: getComputedStyle(ref).color,
    });
    return format === "svg"
      ? Promise.resolve(markup)
      : rasterizeSvg(markup, w, h);
  }

  /**
   * A series color is a `var()` reference, which means nothing in a file.
   * @param {string} color
   */
  function resolveColor(color) {
    if (!ref) return color;
    const probe = document.createElement("span");
    probe.style.color = color;
    ref.appendChild(probe);
    const resolved = getComputedStyle(probe).color;
    probe.remove();
    return resolved || color;
  }

  setContext(CHART_CONTEXT, {
    groups,
    scales,
    size,
    hover,
    hidden: hiddenStore,
    view: viewStore,
    title: titleStore,
    xHeader: xHeaderStore,
    fullscreen: fullscreenStore,
    zoom: zoomStore,
    fullX,
    clip,
    setZoom,
    /** @param {"chart" | "table"} next */
    setView(next) {
      view = next;
    },
    toggleFullscreen,
    exportImage,
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
    usePointHover() {
      pointRequests += 1;
      return () => {
        pointRequests -= 1;
      };
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
    clearHover: () => clearHover(),
  });

  const defaultSeries = () => title || "value";

  $: xAccessor = toAccessor(x);
  $: yAccessor = toAccessor(y);
  $: seriesAccessor = series ? toAccessor(series) : defaultSeries;
  $: hiddenStore.set(hidden);
  $: viewStore.set(view);
  $: titleStore.set(title);
  // A column header may not be empty, so there is always a fallback.
  $: xHeaderStore.set(
    xHeader ??
      (typeof x === "string"
        ? x.charAt(0).toUpperCase() + x.slice(1)
        : { time: "Date", category: "Category", linear: "Value" }[
            $scales.kind
          ]),
  );
  $: scaleOptions.set({
    locale,
    margin,
    reserved: $reserved,
    yFormat,
    xFormat,
    xLabelFormat,
    y2Format,
    orientation,
  });
  $: effectiveHeight = fullscreenHeight || height;
  $: resize(width, effectiveHeight);
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
    secondary,
    y2Domain,
    yScale,
    zoom,
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
    /** @type {ReadonlyArray<string | number>} */ secondaryKeys,
    /** @type {any} */ y2D,
    /** @type {"linear" | "log"} */ scaleKind,
    /** @type {[number | Date, number | Date] | null} */ zoomRange,
  ) {
    const built = buildGroups(rows, {
      x: xA,
      y: yA,
      series: sA,
      hidden: hiddenKeys,
      secondary: secondaryKeys,
      colors: colorMap,
      palette: paletteOption,
      band,
      locale: bandLocale,
    });
    // The zoom bar spans the range with no zoom applied.
    const unzoomed = resolveDomain(built, { xDomain: xD }).x;
    const before = get(fullX);
    if (
      before.kind !== built.kind ||
      before.domain[0] !== unzoomed[0] ||
      before.domain[1] !== unzoomed[1]
    ) {
      fullX.set({ domain: unzoomed, kind: built.kind });
    }
    const zoomed =
      zoomRange && built.kind !== "category"
        ? /** @type {[number, number]} */ ([
            Number(zoomRange[0]),
            Number(zoomRange[1]),
          ])
        : null;
    const current = get(zoomStore);
    if (
      (zoomed === null) !== (current === null) ||
      (zoomed &&
        current &&
        (zoomed[0] !== current[0] || zoomed[1] !== current[1]))
    ) {
      zoomStore.set(zoomed);
    }
    const next = resolveDomain(built, {
      xDomain: zoomed ?? xD,
      yDomain: yD,
      y2Domain: y2D,
      yScale: scaleKind,
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
    if (width !== "auto" || !ref) return;
    return observeResize(ref, (measured) => {
      const rounded = Math.round(measured);
      if (rounded > 0) resize(rounded, effectiveHeight, true);
    });
  });

  /** @param {string | undefined} id */
  function joinChannel(id) {
    sync?.leave();
    sync = id
      ? joinSync(id, (x) => (x === null ? clearHover(true) : hoverAt(x, true)))
      : null;
  }

  // Joining subscribes to other charts, which only makes sense in a browser.
  let mounted = false;
  onMount(() => {
    mounted = true;
    return () => sync?.leave();
  });
  $: if (mounted) joinChannel(syncId);

  // Pointer and keyboard share one path, so both get the same ruler,
  // tooltip, and announcement.
  let focusIndex = -1;
  let focusSeries = 0;

  /** How far from the pointer a point may be and still be hovered. */
  const POINT_REACH = 32;

  /** @type {{ groups: unknown; scales: unknown; flat: Array<{ x: number; y: number; g: number; j: number }>; nearest: (x: number, y: number, max?: number) => number } | null} */
  let pointIndex = null;
  /** Position in `pointIndex.flat` of the keyboard focus. */
  let focusPoint = -1;

  // Built on first use and kept until the groups or the scales change, so a
  // pointer move costs one grid lookup.
  function getPointIndex() {
    const currentGroups = get(groups);
    const current = get(scales);
    if (
      pointIndex &&
      pointIndex.groups === currentGroups &&
      pointIndex.scales === current
    ) {
      return pointIndex;
    }
    /** @type {Array<{ x: number; y: number; g: number; j: number }>} */
    const flat = [];
    currentGroups.forEach((group, g) => {
      if (group.hidden) return;
      for (let j = 0; j < group.xs.length; j++) {
        const along = current.x.map(group.xs[j]);
        const across = yScaleOf(current, group).map(group.ys[j]);
        if (!Number.isFinite(along) || !Number.isFinite(across)) continue;
        flat.push(
          current.horizontal
            ? { x: across, y: along, g, j }
            : { x: along, y: across, g, j },
        );
      }
    });
    // Reading order, so the arrow keys sweep across the plot.
    flat.sort((a, b) => a.x - b.x || a.y - b.y);
    pointIndex = {
      groups: currentGroups,
      scales: current,
      flat,
      nearest: createGridIndex(flat, POINT_REACH).nearest,
    };
    return pointIndex;
  }

  /** @param {number} at Position in the point index, or -1 to clear. */
  function hoverPoint(at) {
    const index = getPointIndex();
    const entry = index.flat[at];
    if (!entry) return clearHover();
    const group = get(groups)[entry.g];
    const previous = get(hover);
    if (
      previous &&
      previous.points.length === 1 &&
      previous.points[0].series === group.key &&
      previous.points[0].index === entry.j
    ) {
      return;
    }
    const current = get(scales);
    const point = {
      series: group.key,
      datum: group.rows[entry.j],
      index: entry.j,
      y: group.ys[entry.j],
      py: yScaleOf(current, group).map(group.ys[entry.j]),
      axis: group.axis,
      color: group.color,
    };
    hover.set({
      x: group.xs[entry.j],
      px: current.x.map(group.xs[entry.j]),
      points: [point],
    });
    dispatch("hover", {
      x: group.xs[entry.j],
      points: [
        {
          datum: point.datum,
          series: point.series,
          index: point.index,
          y: point.y,
        },
      ],
    });
  }

  /**
   * @param {number} xValue
   * @param {boolean} [fromSync] A synced chart must not echo back.
   */
  function hoverAt(xValue, fromSync = false) {
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
    if (nearest === null) return clearHover(fromSync);
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
        py: yScaleOf(current, group).map(group.ys[index]),
        axis: group.axis,
        color: group.color,
      });
    }
    hover.set({ x: nearest, px: current.x.map(nearest), points });
    if (!fromSync) sync?.publish(nearest);
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
    if (pointRequests > 0) {
      const sx = ((event.clientX - rect.left) / rect.width) * get(size).width;
      const sy = ((event.clientY - rect.top) / rect.height) * get(size).height;
      const at = getPointIndex().nearest(sx, sy, POINT_REACH);
      focusPoint = at;
      return hoverPoint(at);
    }
    // The x scale runs down the plot when the chart is horizontal.
    const px = current.horizontal
      ? ((event.clientY - rect.top) / rect.height) * get(size).height
      : ((event.clientX - rect.left) / rect.width) * get(size).width;
    const [from, to] = current.horizontal
      ? [current.plot.y0, current.plot.y1]
      : [current.plot.x0, current.plot.x1];
    hoverAt(current.x.invert(Math.min(to, Math.max(from, px))));
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

  /**
   * Points have no shared x to step along, so the arrow keys sweep through
   * them in reading order.
   * @param {KeyboardEvent} event
   */
  function onPointKeydown(event) {
    const last = getPointIndex().flat.length - 1;
    if (last < 0) return;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        focusPoint = Math.min(last, focusPoint + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        focusPoint = Math.max(0, focusPoint - 1);
        break;
      case "Home":
        focusPoint = 0;
        break;
      case "End":
        focusPoint = last;
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        selectCurrent(event);
        return;
      case "Escape":
        focusPoint = -1;
        clearHover();
        return;
      default:
        return;
    }
    event.preventDefault();
    hoverPoint(Math.max(0, focusPoint));
  }

  /** @param {KeyboardEvent} event */
  function onKeydown(event) {
    if (pointRequests > 0) return onPointKeydown(event);
    const visible = get(groups).filter(
      (group) => !group.hidden && group.xs.length > 0,
    );
    if (visible.length === 0) return;
    const group = visible[Math.min(focusSeries, visible.length - 1)];
    const last = group.xs.length - 1;

    // Arrow keys follow the screen: along the x scale moves between points,
    // across it between series.
    const flipped = get(scales).horizontal;
    const [next, previous, seriesNext, seriesPrevious] = flipped
      ? ["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft"]
      : ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"];

    switch (event.key) {
      case next:
        focusIndex = Math.min(last, focusIndex + 1);
        break;
      case previous:
        focusIndex = Math.max(0, focusIndex - 1);
        break;
      case "Home":
        focusIndex = 0;
        break;
      case "End":
        focusIndex = last;
        break;
      case seriesNext:
        focusSeries = (focusSeries + 1) % visible.length;
        break;
      case seriesPrevious:
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

  $: empty = !loading && $groups.every((group) => group.xs.length === 0);

  $: announcement = $hover
    ? `${$scales.xLabel($hover.x)}: ${$hover.points
        .map(
          (/** @type {any} */ point) =>
            `${point.series} ${(point.axis === "y2"
              ? $scales.y2Format
              : $scales.yFormat)(point.y)}`,
        )
        .join(", ")}`
    : "";
</script>

<figure
  bind:this={ref}
  class:bx--viz-chart={true}
  class:bx--viz-chart--fullscreen={$fullscreenStore}
  on:fullscreenchange={onFullscreenChange}
  aria-busy={loading ? "true" : undefined}
  {...$$restProps}
>
  <div class:bx--viz-chart__header={true}>
    {#if title}
      <figcaption class:bx--viz-chart__title={true}>{title}</figcaption>
    {/if}
    <slot name="toolbar" />
  </div>
  <!-- The plot stays mounted behind the table, so switching back is instant. -->
  <div
    bind:this={plot}
    class:bx--viz-chart__plot={true}
    style:height="{$size.height}px"
    hidden={view === "table"}
  >
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
      on:blur={() => clearHover()}
    >
      <defs>
        <clipPath id={clipId}>
          <rect
            x={$scales.plot.x0}
            y={$scales.plot.y0}
            width={Math.max(0, $scales.plot.x1 - $scales.plot.x0)}
            height={Math.max(0, $scales.plot.y1 - $scales.plot.y0)}
          />
        </clipPath>
      </defs>
      <slot />
    </svg>
    <slot name="tooltip" />
    {#if loading}
      <div
        class:bx--viz-chart__skeleton={true}
        class:bx--skeleton__placeholder={true}
        style:inset="{$scales.plot.y0}px {$size.width - $scales.plot.x1}px {$size.height -
          $scales.plot.y1}px {$scales.plot.x0}px"
      ></div>
    {:else if empty}
      <div class:bx--viz-chart__empty={true}>
        <slot name="empty">{emptyText}</slot>
      </div>
    {/if}
  </div>
  {#if view === "chart"}
    <slot name="zoom" />
  {/if}
  {#if view === "table"}
    <div class:bx--viz-chart__table={true} style:max-height="{$size.height}px">
      <slot name="table"><ChartDataTable /></slot>
    </div>
  {/if}
  <div class:bx--visually-hidden={true} aria-live="polite">{announcement}</div>
  <slot name="legend" />
</figure>
