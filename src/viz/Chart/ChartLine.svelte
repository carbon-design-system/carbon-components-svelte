<svelte:options immutable />

<script>
  /** @restProps {g} */

  /**
   * Specify the curve. `"monotone"` is smooth and never overshoots the data.
   * @type {"linear" | "step" | "step-before" | "step-after" | "monotone"}
   */
  export let curve = "linear";

  /** Specify the stroke width in pixels */
  export let strokeWidth = 1.5;

  /**
   * Set to `true` to dash every line, or pass the series keys to dash.
   * Use it for projected or secondary series.
   * @type {boolean | ReadonlyArray<string | number>}
   */
  export let dashed = false;

  /**
   * Specify the x from which the line is projected. From there on it is
   * dashed, whatever `dashed` says, so a forecast reads as one.
   * @type {number | Date}
   */
  export let forecastFrom = undefined;

  /**
   * Specify when to draw a point on each datum: `"auto"` draws them while
   * the data is sparse enough that each has room, about 24 px, and shows
   * only the hovered one otherwise, so a line between samples never passes
   * for one. `"all"` falls back to `"hover"` for a series of more than 500
   * points.
   * @type {"none" | "hover" | "all" | "auto"}
   */
  export let points = "auto";

  /**
   * Set to `false` to draw every point of a long series.
   * By default a series is downsampled to about two points per pixel,
   * which keeps its shape and bounds the cost by the screen, not the data.
   */
  export let downsample = true;

  /**
   * Restrict the mark to these series keys.
   * @type {ReadonlyArray<string | number>}
   */
  export let series = undefined;

  /**
   * Specify labels along the line: the series name at its end, or every
   * value, each kept only where it does not collide.
   * @type {"none" | "end" | "all"}
   */
  export let labels = "none";

  import { getContext } from "svelte";
  import { CHART_CONTEXT } from "./context.js";
  import { labelWidth, placeLabels } from "./label-layout.js";
  import { buildLinePath, splitAt } from "./line-geometry.js";
  import { yScaleOf } from "./model.js";

  const LABEL_HEIGHT = 14;
  const LABEL_GAP = 4;

  const MAX_POINTS = 500;

  /** @type {import("./context.js").ChartContext} */
  const { groups, scales, hover, clip, emphasis } = getContext(CHART_CONTEXT);

  $: drawn = $groups.filter(
    (group) => !group.hidden && (!series || series.includes(group.key)),
  );
  $: budget = downsample
    ? Math.max(3, Math.round(($scales.plot.x1 - $scales.plot.x0) * 2))
    : undefined;
  $: cut =
    forecastFrom === undefined
      ? undefined
      : forecastFrom instanceof Date
        ? forecastFrom.getTime()
        : forecastFrom;
  // Depends on groups and scales only, so hover never rebuilds a path.
  $: paths = drawn.flatMap((group) => {
    const wantsDash =
      dashed === true ||
      (Array.isArray(dashed) && dashed.includes(group.key)) ||
      group.ghost !== undefined;
    if (cut === undefined) {
      return [
        {
          key: group.key,
          color: group.color,
          dashed: wantsDash,
          ghost: group.ghost !== undefined,
          d: buildLinePath(group, $scales, { curve, budget }),
        },
      ];
    }
    const { before, after } = splitAt(group, cut);
    const out = [];
    if (before) {
      out.push({
        key: group.key,
        color: group.color,
        dashed: wantsDash,
        d: buildLinePath(before, $scales, { curve, budget }),
      });
    }
    if (after) {
      out.push({
        key: JSON.stringify([group.key, "forecast"]),
        color: group.color,
        dashed: true,
        d: buildLinePath(after, $scales, { curve, budget }),
      });
    }
    return out;
  });
  /** Pixels per datum under which `"auto"` stops drawing every point. */
  const ROOM_PER_POINT = 24;
  $: longest = drawn.reduce(
    (most, group) => Math.max(most, group.xs.length),
    0,
  );
  $: everyPoint =
    points === "all" ||
    (points === "auto" &&
      longest > 0 &&
      ($scales.plot.x1 - $scales.plot.x0) / longest >= ROOM_PER_POINT);
  $: dots = everyPoint
    ? drawn
        .filter((group) => group.xs.length <= MAX_POINTS)
        .map((group) => ({
          key: group.key,
          color: group.color,
          at: group.xs
            .map((value, index) => {
              const along = $scales.x.map(value);
              const across = yScaleOf($scales, group).map(group.ys[index]);
              return {
                x: $scales.horizontal ? across : along,
                y: $scales.horizontal ? along : across,
                ok: Number.isFinite(group.ys[index]),
              };
            })
            .filter((point) => point.ok),
        }))
    : [];
  // End labels name the series where it stops; value labels sit over each
  // point. Either kind yields to a neighbor rather than overlapping it.
  $: labelBoxes =
    labels === "none"
      ? []
      : (() => {
          const boxes = [];
          for (const group of drawn) {
            const y = yScaleOf($scales, group);
            if (labels === "end") {
              let last = -1;
              for (let i = group.xs.length - 1; i >= 0; i--) {
                if (Number.isFinite(group.ys[i])) {
                  last = i;
                  break;
                }
              }
              if (last === -1) continue;
              const text = String(group.key);
              const width = labelWidth(text);
              const px = $scales.x.map(group.xs[last]);
              const py = y.map(group.ys[last]);
              boxes.push({
                key: `end:${group.key}`,
                text,
                color: group.color,
                x: px + LABEL_GAP,
                y: py - LABEL_HEIGHT / 2,
                width,
                height: LABEL_HEIGHT,
                alternatives: [
                  { x: px + LABEL_GAP, y: py - LABEL_HEIGHT - LABEL_GAP },
                  { x: px + LABEL_GAP, y: py + LABEL_GAP },
                ],
              });
            } else if (group.xs.length <= MAX_POINTS) {
              for (let i = 0; i < group.xs.length; i++) {
                if (!Number.isFinite(group.ys[i])) continue;
                const text = $scales.yFormat(group.ys[i]);
                const width = labelWidth(text);
                const px = $scales.x.map(group.xs[i]);
                const py = y.map(group.ys[i]);
                boxes.push({
                  key: `${group.key}:${i}`,
                  text,
                  color: group.color,
                  x: px - width / 2,
                  y: py - LABEL_GAP - LABEL_HEIGHT - 2,
                  width,
                  height: LABEL_HEIGHT,
                  alternatives: [{ x: px - width / 2, y: py + LABEL_GAP + 2 }],
                });
              }
            }
          }
          const byKey = new Map(boxes.map((box) => [box.key, box]));
          const bounds = labels === "end" ? undefined : $scales.plot;
          return placeLabels(boxes, { bounds }).map((box) => ({
            ...box,
            text: byKey.get(box.key)?.text ?? "",
            color: byKey.get(box.key)?.color,
          }));
        })();
  $: hovered =
    points !== "none" && $hover
      ? $hover.points.filter(
          (point) => !series || series.includes(point.series),
        )
      : [];
</script>

<g clip-path={$clip} class:bx--viz-line={true} {...$$restProps}>
  {#each paths as path (path.key)}
    <path
      class:bx--viz-line__path={true}
      class:bx--viz-line__path--dashed={path.dashed}
      class:bx--viz-line__path--ghost={path.ghost}
      class:bx--viz-line__path--dimmed={$emphasis !== null &&
        $emphasis !== path.key &&
        !(path.ghost && String(path.key).startsWith(String($emphasis)))}
      d={path.d}
      stroke-width={strokeWidth}
      style:--bx-viz-color={path.color}
    />
  {/each}
  {#each dots as group (group.key)}
    {#each group.at as point, i (i)}
      <circle
        class:bx--viz-line__point={true}
        cx={point.x}
        cy={point.y}
        r="2.5"
        style:--bx-viz-color={group.color}
      />
    {/each}
  {/each}
  {#each hovered as point (point.series)}
    <circle
      class:bx--viz-line__point={true}
      class:bx--viz-line__point--hover={true}
      cx={$scales.horizontal ? point.py : $hover?.px}
      cy={$scales.horizontal ? $hover?.px : point.py}
      r="4"
      style:--bx-viz-color={point.color}
    />
  {/each}
  {#each labelBoxes as box (box.key)}
    <text
      class:bx--viz-labels__label={true}
      class:bx--viz-labels__label--series={labels === "end"}
      x={box.x}
      y={box.y + box.height - 3}
      style:--bx-viz-color={box.color}
    >
      {box.text}
    </text>
  {/each}
</g>
