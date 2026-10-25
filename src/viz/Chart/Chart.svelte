<svelte:options immutable />

<script>
  /**
   * @template [T=any]
   */

  /**
   * Row and event types are written inline: a typedef cannot carry the
   * generic into the generated declarations.
   * @restProps {figure}
   * @event {{ datum: T; series: string | number; index: number; key: string | number | undefined; originalEvent: Event; selection: Array<{ series: string | number; index: number; key?: string | number }> }} select Fires when the focused datum is activated by click, Enter, or Space.
   * @event {{ range: [number, number] | null }} brush Fires when a `ChartBrush` drag ends or the brush clears.
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

  /**
   * Specify what identifies a row within its series, as a property name or
   * a function, so selection and motion follow a datum when rows are added
   * or trimmed. Defaults to the x value.
   * @type {(keyof T & string) | ((row: T, index: number) => string | number) | undefined}
   */
  export let key = undefined;

  /**
   * Specify an id, set on the figure and used as the prefix of every id the
   * chart writes into its SVG, such as a clip path or a pattern, so a server
   * render and the client agree. Read once, when the chart is created.
   * @type {string | undefined}
   */
  export let id = undefined;

  /** Specify the title. It names the chart for assistive technology. */
  export let title = "";

  /**
   * Specify where the legend goes: under the plot, or in a column to its
   * right.
   * @type {"bottom" | "right" | "top" | "left"}
   */
  export let legendPosition = "bottom";

  /**
   * Set to `true` to animate bars and points to their new place when the
   * data changes. Off where the user prefers reduced motion.
   */
  export let transition = false;

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
   * Specify the selected datum. `key` is what identifies it within its
   * series (see the `key` prop); given, the datum is found again by it when
   * the data changes.
   * @type {{ series: string | number; index: number; key?: string | number } | null}
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
   * everything. On a category axis the range is category indexes, and may
   * be fractional. Marks are clipped to the
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
   * Set to `true` to give every distinct x its own slot, as bars do. The
   * marks that need one ask for it themselves; a preset sets it so the first
   * pass over the rows already has it.
   */
  export let band = false;

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

  /** Set to `true` to show the error state instead of the data */
  export let error = false;

  /** Specify the text shown in the error state */
  export let errorText = "Could not load this chart";

  /**
   * Specify when the data was last fetched, written in the header as
   * "As of …", so stale data says so.
   * @type {Date | number | string | undefined}
   */
  export let asOf = undefined;

  /** Specify the label before the time in the header */
  export let asOfLabel = "As of";

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
   * Overlay the previous period: every row shifted forward by `period`,
   * milliseconds on a time axis or units on a linear one, becomes a ghost
   * of its series, dashed in the same color, left out of the legend, and
   * written under its series in the tooltip with the change. `label` is
   * the suffix on the ghost's name.
   * @type {{ period: number; label?: string } | null}
   */
  export let compare = null;

  /**
   * Share hover with every other chart that has the same id, so a dashboard
   * shows one crosshair across all of them. The charts should share an x axis.
   * @type {string}
   */
  export let syncId = undefined;

  /**
   * Specify what the channel shares: hover alone by default, or also the
   * zoom range, the brush, and the selection, so a click in one chart
   * reaches the others.
   * @type {ReadonlyArray<"hover" | "zoom" | "brush" | "selection">}
   */
  export let sync = ["hover"];

  /**
   * Specify the brushed x range, as `ChartBrush` sets it. `null` for none.
   * @type {[number | Date, number | Date] | null}
   */
  export let brush = null;

  /**
   * Specify every selected datum, for multi-select: Shift-click adds to
   * it, a plain click replaces it. `selected` is the last one.
   * @type {ReadonlyArray<{ series: string | number; index: number; key?: string | number }>}
   */
  export let selection = [];

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
  import { afterFirstPaint } from "../utils/after-first-paint.js";
  import {
    backgroundBehind,
    rasterizeSvg,
    serializeSvg,
  } from "../utils/export-svg.js";
  import { bisectNearest, createGridIndex } from "../utils/nearest-point.js";
  import { nextId } from "../utils/next-id.js";
  import { observeResize } from "../utils/resize-pool.js";
  import { createTooltipTiming } from "../utils/tooltip-timing.js";
  import ChartDataTable from "./ChartDataTable.svelte";
  import { createCanvasLayer } from "./canvas-layer.js";
  import { CHART_CONTEXT } from "./context.js";
  import {
    buildScales,
    decorateGroups,
    groupRows,
    resolveDomain,
    sameDomain,
    yScaleOf,
  } from "./model.js";
  import { joinSync } from "./sync.js";

  const dispatch = createEventDispatcher();

  /** Width used until the container is measured, and on the server. */
  const NOMINAL_WIDTH = 640;

  const groups = writable(
    /** @type {import("./model.js").ChartGroup<T>[]} */ ([]),
  );
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
  const hover = writable(
    /** @type {import("./context.js").ChartHover<T> | null} */ (null),
  );
  // What last moved the hover: the tooltip waits for a pointer to settle,
  // but a key press shows it at once.
  const hoverOrigin = writable(
    /** @type {"pointer" | "keyboard" | "touch" | "sync"} */ ("pointer"),
  );
  // A click holds the tooltip on its point until Escape, another click, or
  // a press outside the chart.
  const pinned = writable(false);
  // The tooltip's show and hide timing; `ChartTooltip` reads it. Leaving
  // the plot clears the hover only once the tooltip has hidden.
  /** @type {import("../utils/tooltip-timing.js").TooltipTiming} */
  const tooltipTiming = createTooltipTiming(150, {
    onHide: () => clearHover(),
  });
  // Followers on the sync channel hear when the tooltip shows, so theirs
  // show then too rather than before.
  let tooltipShown = false;
  tooltipTiming.shown.subscribe((value) => {
    tooltipShown = value;
    const current = get(hover);
    if (value && current && get(hoverOrigin) !== "sync") {
      channel?.publish({ kind: "hover", x: current.x, shown: true });
    }
  });
  const hiddenStore = writable(hidden);
  /** @type {import("svelte/store").Writable<"ready" | "loading" | "empty" | "error">} */
  const stateStore = writable("ready");
  const viewStore = writable(view);
  const titleStore = writable(title);
  const xHeaderStore = writable("");
  const included = writable(/** @type {number[]} */ ([]));
  // How many mounted marks need one slot per x, as bars do.
  const bandRequests = writable(0);
  // Whether a mark fills from the baseline, as bars do: a tooltip must not
  // sit over the bodies, not only the tops.
  const banded = derived(bandRequests, ($count) => $count > 0);
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
  let channel = null;

  /** @param {boolean} [fromSync] A synced chart must not echo back. */
  function clearHover(fromSync = false) {
    if (get(hover) === null) return;
    hover.set(null);
    dispatch("hover", null);
    if (!fromSync) channel?.publish({ kind: "hover", x: null, shown: false });
  }

  // Marks that paint pixels share one canvas behind the SVG.
  const canvasLayer = createCanvasLayer();
  const { count: painterCount, dimming: canvasDims } = canvasLayer;
  $: canvasLayer.resize($size.width, $size.height);
  // Anything a painter draws from: the data, the scales, the hidden series.
  $: canvasLayer.invalidate($groups, $scales);

  // Every id the chart writes, under one prefix: the `id` prop when given,
  // else a document-unique one.
  const idPrefix = id ?? nextId("bx-viz");
  let issued = 0;
  const ids = {
    /** @param {string} kind */
    next(kind) {
      issued += 1;
      return `${idPrefix}-${kind}-${issued}`;
    },
  };
  const clipId = `${idPrefix}-clip`;
  const zoomStore = writable(/** @type {[number, number] | null} */ (null));
  // The brushed range in data space, and the keys of the selected data.
  const brushStore = writable(/** @type {[number, number] | null} */ (null));
  const selectedKeys = writable(/** @type {ReadonlySet<string>} */ (new Set()));
  // The series the legend is pointing at: the others dim while it is.
  const emphasis = writable(/** @type {string | number | null} */ (null));
  // The symbol or pattern each series draws with, so the legend can match.
  const shapes = writable(
    /** @type {ReadonlyMap<string | number, { symbol?: import("./shapes.js").Symbol; pattern?: import("./shapes.js").Pattern }>} */ (
      new Map()
    ),
  );
  /**
   * @param {ReadonlyMap<string | number, import("./shapes.js").Symbol | import("./shapes.js").Pattern>} assigned
   * @param {"symbol" | "pattern"} kind
   */
  function setShapes(assigned, kind) {
    shapes.update((current) => {
      const next = new Map(current);
      for (const [key, value] of next) {
        if (value[kind] !== undefined && !assigned.has(key)) {
          const { [kind]: _, ...rest } = value;
          next.set(key, rest);
        }
      }
      for (const [key, value] of assigned) {
        next.set(key, { ...(next.get(key) ?? {}), [kind]: value });
      }
      return next;
    });
  }
  /** @param {number | Date} value */
  const asNumber = (value) => (value instanceof Date ? value.getTime() : value);
  $: asOfText =
    asOf === undefined || asOf === null || asOf === ""
      ? ""
      : typeof asOf === "string"
        ? asOf
        : new Intl.DateTimeFormat(locale, {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(asOf instanceof Date ? asOf : new Date(asOf));
  /**
   * `"series:key"` of a selected datum. An item from before the data
   * changed, or from outside, may carry no key; its index names it then.
   * @param {{ series: string | number; index: number; key?: string | number }} item
   * @param {ReadonlyArray<import("./model.js").ChartGroup<T>>} current
   */
  function identityOf(item, current) {
    const k =
      item.key ??
      current.find((group) => group.key === item.series)?.keys[item.index] ??
      item.index;
    return `${item.series}:${k}`;
  }
  $: selectedKeys.set(
    new Set(
      [...selection, ...(selected ? [selected] : [])].map((item) =>
        identityOf(item, $groups),
      ),
    ),
  );

  /**
   * Selected data follow their rows when the data changes: an item is found
   * again by its key, at its new index, or dropped when the row is gone.
   * @param {ReadonlyArray<import("./model.js").ChartGroup<T>>} current
   */
  function followData(current) {
    if (selection.length === 0 && !selected) return;
    const byKey = new Map(current.map((group) => [group.key, group]));
    /** @param {{ series: string | number; index: number; key?: string | number }} item */
    const resolve = (item) => {
      const group = byKey.get(item.series);
      if (!group) return null;
      const k = item.key ?? group.keys[item.index];
      const index = group.keys.indexOf(k);
      if (index === -1) return null;
      return index === item.index && item.key === k
        ? item
        : { series: item.series, index, key: k };
    };
    const next = selection.map(resolve).filter((item) => item !== null);
    const nextSelected = selected ? resolve(selected) : null;
    const same =
      next.length === selection.length &&
      next.every((item, i) => item === selection[i]) &&
      nextSelected === selected;
    if (same) return;
    selection = /** @type {typeof selection} */ (next);
    selected = nextSelected;
  }

  /**
   * Set the brush. A live update, while a drag is in progress, moves the
   * range without telling anyone; the final one fires `brush` and reaches
   * the synced charts.
   * @param {[number, number] | null} range
   * @param {boolean} [live]
   */
  function setBrush(range, live = false) {
    brush = range;
    if (live) return;
    dispatch("brush", { range });
    publishSync({ kind: "brush", range });
  }

  /**
   * Publish on the channel, when the message's kind is one this chart shares.
   * @param {import("./sync.js").SyncMessage} message
   */
  function publishSync(message) {
    if (!sync.includes(message.kind)) return;
    channel?.publish(message);
  }

  /**
   * Select what another chart selected: the same x in the same series, or
   * in the first visible one when this chart lacks that series.
   * @param {Extract<import("./sync.js").SyncMessage, { kind: "selection" }>} message
   */
  function followSelection(message) {
    const current = get(scales);
    const visible = get(groups).filter((group) => !group.hidden);
    /** @type {Array<{ series: string | number; index: number; key?: string | number }>} */
    const keys = [];
    for (const item of message.selection) {
      const x =
        current.kind === "category" && item.category !== undefined
          ? current.categories.indexOf(item.category)
          : item.x;
      const group =
        visible.find((candidate) => candidate.key === item.series) ??
        visible[0];
      if (!group) continue;
      const index = group.xs.indexOf(x);
      if (index !== -1) {
        keys.push({ series: group.key, index, key: group.keys[index] });
      }
    }
    selection = keys;
    selected = keys.at(-1) ?? null;
  }
  // The x range with no zoom applied, which the zoom bar spans.
  /** Whether `fullX` has been set from data, so a brush may be judged by it. */
  let measuredOnce = false;
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

  // The brush keeps to the data: clamped when the range moves, dropped when
  // nothing is left under it.
  $: brushed = brush
    ? clampToData([asNumber(brush[0]), asNumber(brush[1])], $fullX.domain)
    : null;
  $: brushStore.set(brushed);
  $: if (brush && brushed === null && measuredOnce) setBrush(null);

  /**
   * @param {[number, number]} range
   * @param {[number, number]} full
   * @returns {[number, number] | null}
   */
  function clampToData(range, full) {
    const lo = Math.max(range[0], full[0]);
    const hi = Math.min(range[1], full[1]);
    return lo < hi ? [lo, hi] : null;
  }

  /** @param {[number, number] | null} range */
  function setZoom(range) {
    const full = get(fullX).domain;
    // The whole range is no zoom at all.
    zoom =
      range && (range[0] > full[0] || range[1] < full[1])
        ? [range[0], range[1]]
        : null;
    publishSync({ kind: "zoom", range: zoom });
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
    fitFullscreen(on);
  }

  /**
   * The chrome is the figure's children other than the plot and the table,
   * so the measure holds in table view too, where the plot is hidden.
   * @param {boolean} on
   */
  function fitFullscreen(on) {
    if (!on || !ref || !plot) {
      fullscreenHeight = 0;
      return;
    }
    let chrome = 0;
    for (const child of ref.children) {
      if (child === plot || child.classList.contains("bx--viz-chart__table"))
        continue;
      chrome += /** @type {HTMLElement} */ (child).offsetHeight;
    }
    fullscreenHeight = Math.max(200, window.innerHeight - chrome);
  }
  $: if ($fullscreenStore && view) fitFullscreen(true);

  /**
   * The plot as an image, with the title above and the series below.
   * @param {"svg" | "png"} format
   * @returns {Promise<string | Blob>}
   */
  function exportImage(format) {
    if (!svg || !ref) {
      return Promise.reject(new Error("The chart is not mounted"));
    }
    const snapshot = canvasLayer.snapshot();
    const {
      markup,
      width: w,
      height: h,
    } = serializeSvg(svg, {
      title,
      underlay: snapshot ?? undefined,
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

  // Typed as the published context, so marks and the generated types agree.
  /** @type {import("./context.js").ChartContext<T>} */
  const context = {
    groups,
    scales,
    size,
    hover,
    hoverOrigin,
    pinned,
    tooltipTiming,
    banded,
    state: stateStore,
    hidden: hiddenStore,
    view: viewStore,
    title: titleStore,
    xHeader: xHeaderStore,
    fullscreen: fullscreenStore,
    zoom: zoomStore,
    fullX,
    clip,
    /** @type {import("./canvas-layer.d.ts").CanvasLayer} */
    canvas: canvasLayer,
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
    clearSelection() {
      selection = [];
      selected = null;
    },
    brush: brushStore,
    setBrush,
    selectedKeys,
    ids,
    emphasis,
    shapes,
    setShapes,
  };
  setContext(CHART_CONTEXT, context);

  const defaultSeries = () => title || "value";

  $: xAccessor = toAccessor(x);
  $: yAccessor = toAccessor(y);
  $: seriesAccessor = series ? toAccessor(series) : defaultSeries;
  $: keyAccessor = key === undefined ? undefined : toAccessor(key);
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
  $: compared = withPrior(
    data,
    xAccessor,
    yAccessor,
    seriesAccessor,
    keyAccessor,
    compare,
  );
  // Three stages, each costing what its inputs deserve: the rows are read
  // once per data change; colors, hidden flags, and axes cost the series
  // count; the domain costs the series count again. A zoom or a legend
  // toggle never comes back to the rows.
  // A boolean in between, so a mark's band request re-runs nothing when the
  // preset already asked for one.
  $: wantsBand = band || $bandRequests > 0;
  $: grouped = groupRows(compared.rows, {
    x: compared.x,
    y: compared.y,
    series: compared.series,
    key: compared.key,
    ghosts: compared.ghosts,
    band: wantsBand,
    locale,
  });
  $: built = decorateGroups(grouped, { hidden, secondary, colors, palette });
  $: settle(built, xDomain, yDomain, zero, $included, y2Domain, yScale, zoom);

  /**
   * The rows plus, under `compare`, a prior row per row: the same values
   * one period later, under a ghost series name.
   * @param {ReadonlyArray<T>} rows
   * @param {(row: T, index: number) => number | Date | string} xA
   * @param {(row: T, index: number) => number | null | undefined} yA
   * @param {(row: T, index: number) => string | number} sA
   * @param {((row: T, index: number) => string | number) | undefined} kA
   * @param {{ period: number; label?: string } | null} options
   */
  function withPrior(rows, xA, yA, sA, kA, options) {
    if (!options) {
      return { rows, x: xA, y: yA, series: sA, key: kA, ghosts: {} };
    }
    const suffix = options.label ?? " (prior)";
    /** @param {unknown} value */
    const toNumber = (value) =>
      value instanceof Date
        ? value.getTime()
        : typeof value === "number"
          ? value
          : Number.NaN;
    let max = Number.NEGATIVE_INFINITY;
    let dates = false;
    rows.forEach((row, i) => {
      const raw = xA(row, i);
      if (raw instanceof Date) dates = true;
      const value = toNumber(raw);
      if (value > max) max = value;
    });
    /** @type {Record<string, string | number>} */
    const ghosts = {};
    /** @type {Array<{ prior: true; source: T; index: number; x: number; key: string }>} */
    const prior = [];
    rows.forEach((row, i) => {
      const value = toNumber(xA(row, i));
      if (!Number.isFinite(value)) return;
      const shifted = value + options.period;
      if (shifted > max) return;
      const base = sA(row, i);
      const key = `${base}${suffix}`;
      ghosts[key] = base;
      prior.push({ prior: true, source: row, index: i, x: shifted, key });
    });
    /** @param {any} row */
    const isPrior = (row) =>
      row !== null && typeof row === "object" && row.prior === true;
    return {
      rows: /** @type {ReadonlyArray<T>} */ ([...rows, ...prior]),
      /** @type {(row: any, index: number) => number | Date | string} */
      x: (row, i) =>
        isPrior(row) ? (dates ? new Date(row.x) : row.x) : xA(row, i),
      /** @type {(row: any, index: number) => number | null | undefined} */
      y: (row, i) => (isPrior(row) ? yA(row.source, row.index) : yA(row, i)),
      /** @type {(row: any, index: number) => string | number} */
      series: (row, i) => (isPrior(row) ? row.key : sA(row, i)),
      // A ghost row is its source row, one period on.
      /** @type {((row: any, index: number) => string | number) | undefined} */
      key: kA
        ? (row, i) => (isPrior(row) ? kA(row.source, row.index) : kA(row, i))
        : undefined,
      ghosts,
    };
  }

  /**
   * The domain stage: the zoom bar's full range, the zoom clamped to the
   * data, the resolved domain, and what follows a change of either.
   * @param {import("./model.js").BuiltGroups<T>} built
   * @param {any} xD
   * @param {any} yD
   * @param {boolean} includeZero
   * @param {number[]} include
   * @param {any} y2D
   * @param {"linear" | "log"} scaleKind
   * @param {[number | Date, number | Date] | null} zoomRange
   */
  function settle(
    built,
    xD,
    yD,
    includeZero,
    include,
    y2D,
    scaleKind,
    zoomRange,
  ) {
    const rows = compared.rows;
    // The zoom bar spans the range with no zoom applied. A category axis
    // has no domain of its own to fix: its bounds are only ever a zoom.
    const category = built.kind === "category";
    const unzoomed = resolveDomain(built, {
      xDomain: category ? undefined : xD,
    }).x;
    const before = get(fullX);
    if (
      before.kind !== built.kind ||
      before.domain[0] !== unzoomed[0] ||
      before.domain[1] !== unzoomed[1]
    ) {
      fullX.set({ domain: unzoomed, kind: built.kind });
    }
    if (rows.length > 0) measuredOnce = true;
    let zoomed = zoomRange
      ? /** @type {[number, number]} */ ([
          Number(zoomRange[0]),
          Number(zoomRange[1]),
        ])
      : null;
    // Data that moved from under a zoom, as a sliding window does, leaves it
    // clamped to what is there, or gone when nothing is left under it. The
    // prop follows, so `bind:zoom` agrees with the plot.
    if (zoomed && zoomRange && rows.length > 0) {
      const lo = Math.max(zoomed[0], unzoomed[0]);
      const hi = Math.min(zoomed[1], unzoomed[1]);
      const clamped =
        lo < hi && (lo > unzoomed[0] || hi < unzoomed[1])
          ? /** @type {[number, number]} */ ([lo, hi])
          : null;
      if (
        clamped === null ||
        clamped[0] !== zoomed[0] ||
        clamped[1] !== zoomed[1]
      ) {
        zoomed = clamped;
        zoom =
          clamped && zoomRange[0] instanceof Date
            ? [new Date(clamped[0]), new Date(clamped[1])]
            : clamped;
      }
    }
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
      xDomain: zoomed ?? (category ? undefined : xD),
      yDomain: yD,
      y2Domain: y2D,
      yScale: scaleKind,
      zero: includeZero,
      include,
    });
    groups.set(built.groups);
    followData(built.groups);
    // Publish a new domain only when it plots differently, so an in-range
    // append leaves the scales, axes, and grid alone.
    if (!sameDomain(get(domain), next)) domain.set(next);
    // A hovered x that is still drawn stays hovered, with its new points; one
    // the data no longer holds goes, so a streaming chart does not flicker.
    const hovered = get(hover);
    if (hovered) {
      const still = built.groups.some(
        (group) =>
          !group.hidden &&
          group.xs[bisectNearest(group.xs, hovered.x)] === hovered.x,
      );
      if (still) {
        hover.set(null);
        hoverAt(hovered.x, true);
      } else {
        clearHover(true);
      }
    }

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

  /** @param {HTMLCanvasElement} node */
  function attachCanvas(node) {
    const detach = canvasLayer.attach(node, /** @type {HTMLElement} */ (ref));
    return { destroy: detach };
  }

  onMount(() => () => tooltipTiming.destroy());
  onMount(() => {
    /** @param {Event} event */
    const release = (event) => {
      if (!get(pinned) || ref?.contains(/** @type {Node} */ (event.target)))
        return;
      pinned.set(false);
      clearHover();
    };
    document.addEventListener("pointerdown", release, true);
    return () => document.removeEventListener("pointerdown", release, true);
  });

  // Marks may move once the chart has painted in place, which is after its
  // first measurement when the container sizes it; never on the way in.
  let settled = false;
  /** @type {(() => void) | null} */
  let cancelSettle = null;
  function settleAfterPaint() {
    cancelSettle?.();
    cancelSettle = afterFirstPaint(() => {
      settled = true;
    });
  }
  onMount(() => () => cancelSettle?.());

  onMount(() => {
    if (width !== "auto" || !ref || typeof ResizeObserver === "undefined") {
      settleAfterPaint();
      return;
    }
    // Measure now, so the first paint is at the container's width and not
    // the nominal one, which showed for a frame while the observer's first
    // delivery was on its way. The observer takes over for every change
    // after; in a container with no width yet it also brings the first.
    const initial = Math.round(ref.clientWidth);
    let awaited = initial <= 0;
    if (!awaited) {
      resize(initial, effectiveHeight, true);
      settleAfterPaint();
    }
    return observeResize(ref, (measured) => {
      const rounded = Math.round(measured);
      if (rounded > 0) resize(rounded, effectiveHeight, true);
      if (awaited) {
        awaited = false;
        settleAfterPaint();
      }
    });
  });

  /** @param {string | undefined} id */
  function joinChannel(id) {
    channel?.leave();
    channel = id
      ? joinSync(id, (message) => {
          if (message.kind === "hover") {
            if (get(pinned)) return;
            // The ruler follows at once; the tooltip waits as the source's
            // does, and shows when the source's has.
            hoverOrigin.set(message.shown ? "sync" : "pointer");
            if (message.x === null) clearHover(true);
            else hoverAt(message.x, true);
          } else if (message.kind === "zoom" && sync.includes("zoom")) {
            zoom = message.range;
          } else if (message.kind === "brush" && sync.includes("brush")) {
            brush = message.range;
          } else if (
            message.kind === "selection" &&
            sync.includes("selection")
          ) {
            followSelection(message);
          }
        })
      : null;
  }

  // Joining subscribes to other charts, which only makes sense in a browser.
  let mounted = false;
  onMount(() => {
    mounted = true;
    return () => channel?.leave();
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
    if (!fromSync)
      channel?.publish({ kind: "hover", x: nearest, shown: tooltipShown });
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
    if (!svg || get(pinned)) return;
    // Back over the plot: a pending hide from leaving is off.
    tooltipTiming.enter();
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0) return;
    hoverOrigin.set(
      event.pointerType === "touch" || event.pointerType === "pen"
        ? "touch"
        : "pointer",
    );
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
  function onPointerLeave() {
    if (get(pinned)) return;
    tooltipTiming.leave();
  }

  /**
   * A tap has no hover before it, so it reads the point under the finger.
   * @param {PointerEvent} event
   */
  function onPointerDown(event) {
    if (event.pointerType !== "mouse") onPointerMove(event);
  }

  /** @param {MouseEvent} event */
  function onClick(event) {
    selectCurrent(event);
    if (get(pinned)) pinned.set(false);
    else if (get(hover)) pinned.set(true);
  }

  /** @param {Event} event */
  function selectCurrent(event) {
    const current = get(hover);
    if (!current || current.points.length === 0) return;
    const point =
      current.points[Math.min(focusSeries, current.points.length - 1)];
    const all = get(groups);
    const key = {
      series: point.series,
      index: point.index,
      key: all.find((group) => group.key === point.series)?.keys[point.index],
    };
    const sameAs = (/** @type {typeof key} */ item) =>
      identityOf(item, all) === identityOf(key, all);
    // Shift adds to or removes from the selection; a plain press replaces it.
    const additive = "shiftKey" in event && Boolean(event.shiftKey);
    const already = selection.some(sameAs);
    if (additive && already) {
      selection = selection.filter((item) => !sameAs(item));
      selected = selection.at(-1) ?? null;
    } else {
      selection = additive ? [...selection, key] : [key];
      selected = key;
    }
    dispatch("select", {
      datum: point.datum,
      series: point.series,
      index: point.index,
      key: key.key,
      originalEvent: event,
      selection,
    });
    const scale = get(scales);
    const byKey = new Map(get(groups).map((group) => [group.key, group]));
    publishSync({
      kind: "selection",
      x: current.x,
      series: point.series,
      selection: selection.flatMap((item) => {
        const group = byKey.get(item.series);
        const x = group?.xs[item.index];
        if (x === undefined) return [];
        return [
          {
            x,
            series: item.series,
            category:
              scale.kind === "category" ? scale.categories[x] : undefined,
          },
        ];
      }),
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
    hoverOrigin.set("keyboard");
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
        pinned.set(false);
        clearHover();
        if (brush) setBrush(null);
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
    hoverOrigin.set("keyboard");
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
        pinned.set(false);
        clearHover();
        if (brush) setBrush(null);
        return;
      default:
        return;
    }
    event.preventDefault();
    if (focusIndex < 0) focusIndex = 0;
    const target = visible[Math.min(focusSeries, visible.length - 1)];
    hoverAt(target.xs[Math.min(focusIndex, target.xs.length - 1)]);
  }

  $: empty =
    !loading && !error && $groups.every((group) => group.xs.length === 0);
  $: stateStore.set(
    loading ? "loading" : error ? "error" : empty ? "empty" : "ready",
  );

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
  class:bx--viz-chart--legend-right={legendPosition === "right"}
  class:bx--viz-chart--legend-left={legendPosition === "left"}
  class:bx--viz-chart--legend-top={legendPosition === "top"}
  class:bx--viz-chart--transition={transition && settled}
  {id}
  on:fullscreenchange={onFullscreenChange}
  aria-busy={loading ? "true" : undefined}
  aria-label={title || undefined}
  {...$$restProps}
>
  <!-- The title shares a row with the toolbar, so it names the figure
       through `aria-label` rather than as a `figcaption`, which must be
       the figure's own child. -->
  <div class:bx--viz-chart__header={true}>
    {#if title}
      <div class:bx--viz-chart__title={true}>{title}</div>
    {/if}
    {#if asOfText}
      <div class:bx--viz-chart__as-of={true}>{asOfLabel} {asOfText}</div>
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
    {#if $painterCount > 0}
      <!-- Bulk marks paint here; the SVG above stays transparent. -->
      <canvas
        class:bx--viz-chart__canvas={true}
        class:bx--viz-chart__canvas--dimmed={$canvasDims && $hover !== null}
        style:height="{$size.height}px"
        aria-hidden="true"
        use:attachCanvas
      ></canvas>
    {/if}
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
      on:pointerdown={onPointerDown}
      on:pointerleave={onPointerLeave}
      on:click={onClick}
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
        style:inset="{$scales.plot.y0}px {$size.width -
          $scales.plot.x1}px {$size.height - $scales.plot.y1}px {$scales.plot
          .x0}px"
      ></div>
    {:else if error}
      <div class:bx--viz-chart__error={true}>
        <slot name="error">{errorText}</slot>
      </div>
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
