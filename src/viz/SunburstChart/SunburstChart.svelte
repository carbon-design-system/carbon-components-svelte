<svelte:options immutable />

<script>
  /**
   * @template T
   */

  /**
   * The node type is written inline: a typedef cannot carry the generic
   * into the generated declarations.
   * @event {{ id: string; parent: string | null; label: string; depth: number; value: number; own: number; share: number; leaf: boolean; datum: T; index: number } | null} hover Fires when the pointer or keyboard focus moves to another arc, and with `null` when it leaves.
   * @event {{ node: { id: string; parent: string | null; label: string; depth: number; value: number; own: number; share: number; leaf: boolean; datum: T; index: number }; originalEvent: Event }} select Fires when the focused arc is activated by click, Enter, or Space.
   * @slot {{ center: { id: string; label: string; value: number } | null; total: number; formattedTotal: string }}
   */

  /** @restProps {figure} */

  /**
   * Specify the nodes, one row each.
   * @type {ReadonlyArray<T>}
   */
  export let data = [];

  /**
   * Specify how to read a node's id: a key or a function.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let id;

  /**
   * Specify how to read a node's parent id. A node with none is a root.
   * @type {import("../utils/accessor.js").Accessor<T, string | number | null | undefined>}
   */
  export let parent;

  /**
   * Specify how to read a node's value. A parent without one is worth its
   * children, and never less than they add up to.
   * @type {import("../utils/accessor.js").Accessor<T, number | null | undefined>}
   */
  export let value;

  /**
   * Specify how to read a node's label. Defaults to its id.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let label = undefined;

  /**
   * Specify how to read what colors a node. By default a node takes the
   * color of its ancestor just under the center, so each branch has a hue.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let group = undefined;

  /** Specify the title, shown as the caption and used as the accessible name */
  export let title = "";

  /**
   * Specify the node at the center. Its ancestors are not drawn; the
   * center is the way back up. Bind it to drill in from `select`.
   * @type {string | number | null}
   */
  export let root = null;

  /**
   * Specify how many rings to draw around the center.
   * @type {number}
   */
  export let maxDepth = undefined;

  /**
   * Specify the order of siblings: as given, or largest first.
   * @type {"none" | "value"}
   */
  export let sort = "none";

  /** Specify the diameter, in pixels. It scales down with its container. */
  export let diameter = 320;

  /** Specify the hole in the middle as a share of the radius */
  export let innerRadius = 0.25;

  /**
   * Specify how values are written: `Intl.NumberFormat` options or a function.
   * @type {import("../utils/format-compact.js").NumberFormat}
   */
  export let format = undefined;

  /**
   * Specify which of Carbon's prescribed color groups to use (1-based).
   */
  export let palette = 1;

  /**
   * Specify a fixed color per group.
   * @type {Record<string, import("../utils/tokens.js").VizColor>}
   */
  export let colors = {};

  /** Set to `false` to hide the legend, which lists the branches */
  export let legend = true;

  /** Specify the label of the button in the center that steps back up */
  export let upLabel = "Up";

  /**
   * Override the column headers of the table for assistive technology.
   * @type {{ node?: string; level?: string; value?: string; share?: string }}
   */
  export let headerLabels = {};

  /**
   * Specify the locale.
   * @type {string}
   */
  export let locale = undefined;

  /**
   * Obtain a reference to the HTML element.
   * @bindable readonly
   * @type {null | HTMLElement}
   */
  export let ref = null;

  import { createEventDispatcher } from "svelte";
  import ChartTooltipRow from "../Chart/ChartTooltipRow.svelte";
  import { toAccessor } from "../utils/accessor.js";
  import { formatPercent, resolveFormat } from "../utils/format-compact.js";
  import { buildSunburst } from "./sunburst-geometry.js";

  const dispatch = createEventDispatcher();

  let active = -1;

  $: idOf = toAccessor(id);
  $: parentOf = toAccessor(parent);
  $: valueOf = toAccessor(value);
  $: labelOf = label === undefined ? undefined : toAccessor(label);
  $: groupOf = group === undefined ? undefined : toAccessor(group);
  // Depends on the data and the options only, so hover never lays out again.
  $: sun = buildSunburst(data, {
    id: idOf,
    parent: parentOf,
    value: valueOf,
    label: labelOf,
    group: groupOf,
    sort,
    root: root ?? undefined,
    maxDepth,
    radius: diameter / 2,
    innerRadius,
    palette,
    colors,
  });
  $: formatValue = resolveFormat(format, locale);
  $: headers = {
    node: "Node",
    level: "Level",
    value: "Value",
    share: "Share",
    ...headerLabels,
  };
  $: current = active >= 0 ? sun.arcs[active] : undefined;
  $: announcement = current
    ? `${current.label}: ${formatValue(current.value)}, ${formatPercent(current.share, { locale, digits: 0 })}`
    : "";

  /** @param {import("./sunburst-geometry.js").SunburstArc<T>} arc */
  function detail(arc) {
    return {
      id: arc.id,
      parent: arc.parent,
      label: arc.label,
      depth: arc.depth,
      value: arc.value,
      own: arc.own,
      share: arc.share,
      leaf: arc.leaf,
      datum: arc.datum,
      index: arc.index,
    };
  }

  /** @param {number} index */
  function setActive(index) {
    if (index === active) return;
    active = index;
    dispatch("hover", index >= 0 ? detail(sun.arcs[index]) : null);
  }

  /** @param {Event} originalEvent */
  function selectActive(originalEvent) {
    if (current) dispatch("select", { node: detail(current), originalEvent });
  }

  function up() {
    if (sun.center?.parent === null) root = null;
    else if (sun.center) root = sun.center.parent;
  }

  /** @param {KeyboardEvent} event */
  function onKeydown(event) {
    const last = sun.arcs.length - 1;
    if (last < 0) return;
    let next = active;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = Math.min(last, active + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        next = Math.max(0, active - 1);
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = last;
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        selectActive(event);
        return;
      case "Backspace":
        event.preventDefault();
        up();
        return;
      case "Escape":
        setActive(-1);
        return;
      default:
        return;
    }
    event.preventDefault();
    setActive(next);
  }
</script>

<figure
  bind:this={ref}
  class:bx--viz-sunburst={true}
  class:bx--viz-sunburst--emphasis={active >= 0}
  {...$$restProps}
>
  {#if title}
    <figcaption class:bx--viz-chart__title={true}>{title}</figcaption>
  {/if}
  <div class:bx--viz-sunburst__plot={true} style:max-width="{diameter}px">
    <!-- A chart is one tab stop. Arrow keys move arc by arc, Backspace steps up. -->
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <svg
      class:bx--viz-sunburst__svg={true}
      viewBox="0 0 {diameter} {diameter}"
      role="application"
      aria-roledescription="chart"
      aria-label={title || undefined}
      tabindex="0"
      on:keydown={onKeydown}
      on:click={selectActive}
      on:pointerleave={() => setActive(-1)}
      on:blur={() => setActive(-1)}
    >
      <g aria-hidden="true">
        {#each sun.arcs as arc, i (arc.id)}
          <!-- svelte-ignore a11y-mouse-events-have-key-events -->
          <path
            class:bx--viz-sunburst__arc={true}
            class:bx--viz-sunburst__arc--active={i === active}
            d={arc.d}
            style:--bx-viz-color={arc.color}
            style:--bx-viz-ring={arc.ring}
            on:mouseenter={() => setActive(i)}
          />
        {/each}
      </g>
    </svg>
    <div
      class:bx--viz-sunburst__center={true}
      style:--bx-viz-hole="{sun.hole * 2}px"
    >
      <slot
        center={sun.center
          ? { id: sun.center.id, label: sun.center.label, value: sun.center.value }
          : null}
        total={sun.total}
        formattedTotal={formatValue(sun.total)}
      >
        {#if sun.center && sun.center.parent !== null}
          <button
            type="button"
            class:bx--viz-sunburst__up={true}
            aria-label="{upLabel}: {sun.center.label}"
            on:click={up}
          >
            <span class:bx--viz-sunburst__center-label={true}
              >{sun.center.label}</span
            >
            <span class:bx--viz-sunburst__center-value={true}
              >{formatValue(sun.center.value)}</span
            >
          </button>
        {:else}
          <span class:bx--viz-sunburst__center-label={true}
            >{sun.center?.label ?? ""}</span
          >
          <span class:bx--viz-sunburst__center-value={true}
            >{formatValue(sun.total)}</span
          >
        {/if}
      </slot>
    </div>
    {#if current}
      <div
        class:bx--viz-chart-tooltip={true}
        class:bx--viz-chart-tooltip--flipped={current.cx > diameter / 2}
        aria-hidden="true"
        style:left="{(current.cx / diameter) * 100}%"
        style:top="{(current.cy / diameter) * 100}%"
      >
        <ChartTooltipRow
          color={current.color}
          label={current.label}
          value="{formatValue(current.value)} ({formatPercent(current.share, { locale, digits: 0 })})"
        />
      </div>
    {/if}
  </div>
  <!-- Every arc, for assistive technology: a ring says nothing to it. -->
  <table class:bx--visually-hidden={true}>
    {#if title}
      <caption>
        {title}
      </caption>
    {/if}
    <thead>
      <tr>
        <th scope="col">{headers.node}</th>
        <th scope="col">{headers.level}</th>
        <th scope="col">{headers.value}</th>
        <th scope="col">{headers.share}</th>
      </tr>
    </thead>
    <tbody>
      {#each sun.arcs as arc (arc.id)}
        <tr>
          <th scope="row">{arc.label}</th>
          <td>{arc.ring + 1}</td>
          <td>{formatValue(arc.value)}</td>
          <td>{formatPercent(arc.share, { locale, digits: 0 })}</td>
        </tr>
      {/each}
    </tbody>
  </table>
  <div class:bx--visually-hidden={true} aria-live="polite">{announcement}</div>
  {#if legend && sun.groups.length > 1}
    <ul class:bx--viz-treemap__legend={true} aria-hidden="true">
      {#each sun.groups as entry (entry.key)}
        <li
          class:bx--viz-treemap__legend-item={true}
          style:--bx-viz-color={entry.color}
        >
          <span class:bx--viz-treemap__swatch={true}></span>
          {entry.label}
        </li>
      {/each}
    </ul>
  {/if}
</figure>
