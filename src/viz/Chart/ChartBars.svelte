<svelte:options immutable />

<script>
  /** @restProps {g} */

  /**
   * Specify how series share a slot.
   * `"normalized"` expects the chart's `yDomain` to be `[0, 1]`.
   * @type {"grouped" | "stacked" | "normalized"}
   */
  export let mode = "grouped";

  /** Specify the gap between slots, as a fraction of the slot */
  export let padding = 0.2;

  /** Specify the widest a bar may grow, in pixels */
  export let maxBarWidth = 48;

  /**
   * Specify the series to draw. Defaults to every series, so set it when
   * marks share a chart, as bars and a line do in a combo.
   * @type {ReadonlyArray<string | number>}
   */
  export let series = undefined;

  /**
   * Specify a color per bar from its row, for bars that read by sign or
   * state. A bar without one keeps its series color.
   * @type {((datum: any, index: number, series: string | number) => import("../utils/tokens.js").VizColor | undefined) | undefined}
   */
  export let colorOf = undefined;

  /**
   * Specify where a value label sits: outside the bar's end, inside it, or
   * `"auto"`, outside where the bar is wide enough and hidden where not.
   * On a stacked chart, outside labels are the stack totals.
   * @type {"none" | "auto" | "outside" | "inside"}
   */
  export let labels = "none";

  /**
   * Specify the label format. Defaults to the axis format.
   * @type {import("../utils/format-compact.js").NumberFormat}
   */
  export let labelFormat = undefined;

  /**
   * Specify a fill pattern per series, so series tell apart in print and
   * under forced colors: `"auto"` cycles solid, diagonal, dots, crosshatch,
   * horizontal, vertical in series order, or a map names one per series.
   * @type {"auto" | Partial<Record<string, import("./shapes.js").Pattern>> | undefined}
   */
  export let pattern = undefined;

  import { getContext, onMount } from "svelte";
  import { resolveFormat } from "../utils/format-compact.js";
  import { vizColor } from "../utils/tokens.js";
  import { buildBars, stackedExtent } from "./bar-geometry.js";
  import { CHART_CONTEXT } from "./context.js";
  import { labelWidth, placeLabels } from "./label-layout.js";
  import { pickGroups } from "./model.js";
  import { assignShapes, PATTERNS, patternTile } from "./shapes.js";

  const LABEL_HEIGHT = 14;
  const LABEL_GAP = 4;

  /** @type {import("./context.js").ChartContext} */
  const {
    groups,
    scales,
    hover,
    useBand,
    includeY,
    clip,
    selectedKeys,
    emphasis,
    setShapes,
  } = getContext(CHART_CONTEXT);

  // Bars need one slot per x, asked for up front so the server render has it.
  const releaseBand = useBand();

  /** @type {Array<() => void>} */
  let releases = [];
  /** @type {[number, number] | null} */
  let registered = null;

  // A stack is taller than any one value, so the domain has to know about it.
  // Registering changes the domain, which rebuilds the groups, which runs
  // this again: only write when the extent itself moved, or it never settles.
  /**
   * @param {typeof $groups} current
   * @param {typeof mode} currentMode
   */
  function include(current, currentMode) {
    const next = currentMode === "stacked" ? stackedExtent(current) : null;
    if (
      next === registered ||
      (next &&
        registered &&
        next[0] === registered[0] &&
        next[1] === registered[1])
    ) {
      return;
    }
    for (const release of releases) release();
    releases = next ? [includeY(next[0]), includeY(next[1])] : [];
    registered = next;
  }

  $: mine = pickGroups($groups, series);
  const patternId = `bx-viz-pattern-${Math.random().toString(36).slice(2, 8)}`;
  $: patterns = assignShapes(
    mine.map((group) => group.key),
    pattern,
    PATTERNS,
  );
  $: setShapes(patterns, "pattern");
  $: tiles = mine
    .filter((group) => (patterns.get(group.key) ?? "solid") !== "solid")
    .map((group) => ({
      key: group.key,
      id: `${patternId}-${String(group.key).replace(/[^\w-]/g, "_")}`,
      color: group.color,
      ...patternTile(
        /** @type {import("./shapes.js").Pattern} */ (patterns.get(group.key)),
      ),
    }));
  $: tileOf = new Map(tiles.map((tile) => [tile.key, tile]));
  $: include(mine, mode);
  // Depends on groups and scales only, so hover never rebuilds a bar.
  $: bars = buildBars(mine, $scales, { mode, padding, maxBarWidth });
  // A tile anchored at each bar's base, sized to divide its width, so the
  // pattern starts at one edge and ends at the other instead of wherever
  // the plot's origin happens to cut it.
  $: anchored = bars.flatMap((bar) => {
    const tile = tileOf.get(bar.series);
    if (!tile) return [];
    const across = $scales.horizontal ? bar.height : bar.width;
    const size =
      across > 0
        ? across / Math.max(1, Math.round(across / tile.size))
        : tile.size;
    return [
      {
        key: bar.key,
        id: `${tile.id}-${String(bar.key).replace(/[^\w-]/g, "_")}`,
        base: tile.id,
        color: tile.color,
        x: bar.x,
        y: $scales.horizontal ? bar.y : bar.y + bar.height,
        size,
      },
    ];
  });
  $: fillOf = new Map(anchored.map((tile) => [tile.key, `url(#${tile.id})`]));
  $: format =
    labelFormat === undefined ? undefined : resolveFormat(labelFormat);
  $: axisOf = new Map(mine.map((group) => [group.key, group.axis]));
  /** @param {number} value @param {string | number} key */
  function write(value, key) {
    if (format) return format(value);
    return axisOf.get(key) === "y2"
      ? $scales.y2Format(value)
      : $scales.yFormat(value);
  }
  // Labels want room: a bar's own width outside, its width and height
  // inside. Stack totals sit over the top of each slot. Collisions drop
  // the later label, so a dense chart keeps the ones that read.
  $: labelBoxes = labels === "none" ? [] : layoutLabels(bars, mode, labels);
  /**
   * @param {typeof bars} rects
   * @param {string} currentMode
   * @param {string} where
   */
  function layoutLabels(rects, currentMode, where) {
    const flip = $scales.horizontal;
    /** @type {Array<import("./label-layout.js").LabelBox & { text: string; anchor: "start" | "middle" | "end"; inside: boolean }>} */
    const boxes = [];
    const totals = currentMode === "stacked" && where !== "inside";
    if (totals) {
      /** @type {Map<number, { sum: number; end: number; along: number; size: number; key: string }>} */
      const bySlot = new Map();
      for (const bar of rects) {
        const current = bySlot.get(bar.slot);
        const end = flip ? bar.x + bar.width : bar.y;
        const along = flip ? bar.y + bar.height / 2 : bar.x + bar.width / 2;
        const size = flip ? bar.height : bar.width;
        if (current) {
          current.sum += bar.value;
          current.end = flip
            ? Math.max(current.end, end)
            : Math.min(current.end, end);
        } else {
          bySlot.set(bar.slot, {
            sum: bar.value,
            end,
            along,
            size,
            key: String(bar.series),
          });
        }
      }
      for (const [slot, total] of bySlot) {
        const text = write(total.sum, total.key);
        const width = labelWidth(text);
        if (where === "auto" && !flip && width > total.size + LABEL_GAP * 2)
          continue;
        boxes.push(
          flip
            ? {
                key: `total:${slot}`,
                text,
                anchor: "start",
                inside: false,
                x: total.end + LABEL_GAP,
                y: total.along - LABEL_HEIGHT / 2,
                width,
                height: LABEL_HEIGHT,
              }
            : {
                key: `total:${slot}`,
                text,
                anchor: "middle",
                inside: false,
                x: total.along - width / 2,
                y: total.end - LABEL_GAP - LABEL_HEIGHT,
                width,
                height: LABEL_HEIGHT,
              },
        );
      }
      return placeLabels(boxes, { gap: 1 }).map((box) => ({
        ...box,
        ...boxes.find((b) => b.key === box.key),
      }));
    }
    for (const bar of rects) {
      const text = write(bar.value, bar.series);
      const width = labelWidth(text);
      const negative = bar.value < 0;
      const inside = where === "inside";
      if (flip) {
        const fits =
          bar.height >= LABEL_HEIGHT && bar.width >= width + LABEL_GAP * 2;
        if (inside && !fits) continue;
        if (where === "auto" && bar.height < LABEL_HEIGHT) continue;
        const y = bar.y + bar.height / 2 - LABEL_HEIGHT / 2;
        const x = inside
          ? negative
            ? bar.x + LABEL_GAP
            : bar.x + bar.width - LABEL_GAP - width
          : negative
            ? bar.x - LABEL_GAP - width
            : bar.x + bar.width + LABEL_GAP;
        boxes.push({
          key: bar.key,
          text,
          anchor: "start",
          inside,
          x,
          y,
          width,
          height: LABEL_HEIGHT,
        });
      } else {
        const fits = bar.width >= width + LABEL_GAP * 2;
        if (inside && (!fits || bar.height < LABEL_HEIGHT + LABEL_GAP * 2))
          continue;
        if (where === "auto" && !fits) continue;
        const x = bar.x + bar.width / 2 - width / 2;
        const y = inside
          ? negative
            ? bar.y + bar.height - LABEL_GAP - LABEL_HEIGHT
            : bar.y + LABEL_GAP
          : negative
            ? bar.y + bar.height + LABEL_GAP
            : bar.y - LABEL_GAP - LABEL_HEIGHT;
        boxes.push({
          key: bar.key,
          text,
          anchor: "middle",
          inside,
          x,
          y,
          width,
          height: LABEL_HEIGHT,
        });
      }
    }
    return placeLabels(boxes, { gap: 1 }).map((box) => ({
      ...box,
      ...boxes.find((b) => b.key === box.key),
    }));
  }
  $: band =
    $hover && $scales.step
      ? {
          x: $scales.x.map($hover.x) - $scales.step / 2,
          width: $scales.step,
        }
      : null;

  onMount(() => () => {
    releaseBand();
    for (const release of releases) release();
  });
</script>

<g clip-path={$clip} class:bx--viz-bars={true} {...$$restProps}>
  {#if tiles.length > 0}
    <defs>
      {#each tiles as tile (tile.id)}
        <pattern
          id={tile.id}
          class:bx--viz-pattern={true}
          patternUnits="userSpaceOnUse"
          viewBox="0 0 {tile.size} {tile.size}"
          width={tile.size}
          height={tile.size}
          style:--bx-viz-color={tile.color}
        >
          <rect
            class:bx--viz-pattern__tint={true}
            width={tile.size}
            height={tile.size}
          />
          <path
            class:bx--viz-pattern__stroke={true}
            class:bx--viz-pattern__stroke--dots={tile.dots}
            d={tile.d}
          />
        </pattern>
      {/each}
      {#each anchored as tile (tile.key)}
        <pattern
          id={tile.id}
          href="#{tile.base}"
          x={tile.x}
          y={tile.y}
          width={tile.size}
          height={tile.size}
          style:--bx-viz-color={tile.color}
        />
      {/each}
    </defs>
  {/if}
  {#if band}
    <rect
      class:bx--viz-bars__band={true}
      x={$scales.horizontal ? $scales.plot.x0 : band.x}
      y={$scales.horizontal ? band.x : $scales.plot.y0}
      width={$scales.horizontal
        ? $scales.plot.x1 - $scales.plot.x0
        : band.width}
      height={$scales.horizontal
        ? band.width
        : $scales.plot.y1 - $scales.plot.y0}
      aria-hidden="true"
    />
  {/if}
  {#each bars as bar (bar.key)}
    <rect
      class:bx--viz-bars__bar={true}
      class:bx--viz-bars__bar--dimmed={($hover !== null &&
        $hover.x !== bar.slot) ||
        ($emphasis !== null && $emphasis !== bar.series)}
      class:bx--viz-bars__bar--selected={$selectedKeys.has(bar.key)}
      x={bar.x}
      y={bar.y}
      width={bar.width}
      height={bar.height}
      style:--bx-viz-color={colorOf
        ? (vizColor(colorOf(bar.datum, bar.index, bar.series)) ?? bar.color)
        : bar.color}
      style:fill={fillOf.get(bar.key)}
    />
  {/each}
  {#each labelBoxes as box (box.key)}
    <text
      class:bx--viz-labels__label={true}
      class:bx--viz-labels__label--inside={box.inside}
      x={box.anchor === "middle" ? box.x + box.width / 2 : box.x}
      y={box.y + box.height - 3}
      text-anchor={box.anchor}
    >
      {box.text}
    </text>
  {/each}
</g>
