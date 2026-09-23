<svelte:options immutable />

<script>
  /**
   * @template [T=any]
   */

  /**
   * @event {{ path: string[]; step: string; depth: number; value: number; share: number; stopped: number; rows: T[] } | null} hover Fires when the pointer or keyboard focus moves to another step, and with `null` when it leaves.
   * @event {{ path: string[]; step: string; depth: number; value: number; share: number; stopped: number; rows: T[]; originalEvent: Event }} select Fires when the focused step is activated by click, Enter, or Space.
   */

  /** @restProps {figure} */

  /**
   * Specify the rows, one per sequence or per group of identical sequences.
   * @type {ReadonlyArray<T>}
   */
  export let data = [];

  /**
   * Specify how to read a row's steps: a key or a function returning an
   * array of steps, or a string split by `separator`.
   * @type {import("../utils/accessor.js").Accessor<T, ReadonlyArray<string | number> | string>}
   */
  export let steps;

  /**
   * Specify how to read how many sequences a row stands for. Defaults to
   * one per row.
   * @type {import("../utils/accessor.js").Accessor<T, number | null | undefined>}
   */
  export let value = undefined;

  /** Specify what splits a string of steps */
  export let separator = "/";

  /** Specify the title, shown as the caption and used as the accessible name */
  export let title = "";

  /** Specify the label of the center, which stands for every sequence */
  export let rootLabel = "All";

  /**
   * Specify how many steps to draw as rings.
   * @type {number}
   */
  export let maxDepth = undefined;

  /** Specify the diameter, in pixels. It scales down with its container. */
  export let diameter = 320;

  /** Specify the hole in the middle as a share of the radius */
  export let innerRadius = 0.25;

  /**
   * Specify how counts are written: `Intl.NumberFormat` options or a function.
   * @type {import("../utils/format-compact.js").NumberFormat}
   */
  export let format = undefined;

  /**
   * Specify which of Carbon's prescribed color groups to use (1-based).
   */
  export let palette = 1;

  /**
   * Specify a fixed color per step name.
   * @type {Record<string, import("../utils/tokens.js").VizColor>}
   */
  export let colors = {};

  /** Set to `false` to hide the legend, which lists the step names */
  export let legend = true;

  /** Set to `false` to hide the path of the hovered step above the chart */
  export let trail = true;

  /**
   * Override the words used for the trail and for assistive technology.
   * @type {{ of?: string; sequences?: string; stopped?: string }}
   */
  export let words = {};

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
  import SunburstChart from "../SunburstChart/SunburstChart.svelte";
  import { toAccessor } from "../utils/accessor.js";
  import { formatPercent, resolveFormat } from "../utils/format-compact.js";
  import { sequenceTree } from "./sequence-tree.js";

  const dispatch = createEventDispatcher();

  /** @type {import("./sequence-tree.js").SequenceNode<T> | null} */
  let current = null;
  /** @type {string | null} */
  let currentColor = null;

  $: stepsOf = toAccessor(steps);
  $: valueOf = value === undefined ? undefined : toAccessor(value);
  $: tree = sequenceTree(data, {
    steps: stepsOf,
    value: valueOf,
    separator,
    rootLabel,
  });
  $: byId = new Map(tree.nodes.map((node) => [node.id, node]));
  $: childSum = sumChildren(tree.nodes);
  $: formatValue = resolveFormat(format, locale);
  $: text = {
    of: "of",
    sequences: "sequences",
    stopped: "stopped here",
    ...words,
  };

  /** @param {ReadonlyArray<import("./sequence-tree.js").SequenceNode<T>>} nodes */
  function sumChildren(nodes) {
    /** @type {Map<string, number>} */
    const out = new Map();
    for (const node of nodes) {
      if (node.parent === null) continue;
      out.set(node.parent, (out.get(node.parent) ?? 0) + node.value);
    }
    return out;
  }

  /** @param {import("./sequence-tree.js").SequenceNode<T>} node */
  function detail(node) {
    return {
      path: node.path,
      step: node.step,
      depth: node.depth,
      value: node.value,
      share: tree.total > 0 ? node.value / tree.total : 0,
      stopped: node.value - (childSum.get(node.id) ?? 0),
      rows: node.rows,
    };
  }

  /** @param {CustomEvent} event */
  function onHover(event) {
    const hit = event.detail;
    current = hit ? (byId.get(hit.id) ?? null) : null;
    currentColor = hit ? hit.color : null;
    dispatch("hover", current ? detail(current) : null);
  }

  /** @param {CustomEvent} event */
  function onSelect(event) {
    const node = byId.get(event.detail.node.id);
    if (!node) return;
    dispatch("select", {
      ...detail(node),
      originalEvent: event.detail.originalEvent,
    });
  }
</script>

<figure bind:this={ref} class:bx--viz-sequence-sunburst={true} {...$$restProps}>
  {#if title}
    <figcaption class:bx--viz-chart__title={true}>{title}</figcaption>
  {/if}
  {#if trail}
    <!-- The path to the hovered step, so a ring reads as a sequence. -->
    <div class:bx--viz-sequence-sunburst__trail={true} aria-hidden="true">
      {#if current && current.depth > 0}
        <ol class:bx--viz-sequence-sunburst__path={true}>
          {#each current.path as step, i (i)}
            <li
              class:bx--viz-sequence-sunburst__step={true}
              class:bx--viz-sequence-sunburst__step--current={i ===
                current.path.length - 1}
              style:--bx-viz-color={i === current.path.length - 1
                ? currentColor
                : undefined}
            >
              {step}
            </li>
          {/each}
        </ol>
        <span class:bx--viz-sequence-sunburst__share={true}>
          {formatPercent(detail(current).share, { locale, digits: 0 })}
          {text.of}
          {formatValue(tree.total)}
          {text.sequences}
        </span>
      {:else}
        <span class:bx--viz-sequence-sunburst__share={true}>
          {formatValue(tree.total)}
          {text.sequences}
        </span>
      {/if}
    </div>
  {/if}
  <SunburstChart
    data={tree.nodes}
    id="id"
    parent="parent"
    value="value"
    label="step"
    group={(node) => (node.depth === 0 ? "" : node.step)}
    {title}
    {maxDepth}
    {diameter}
    {innerRadius}
    {format}
    {palette}
    {colors}
    {legend}
    {locale}
    on:hover={onHover}
    on:select={onSelect}
  />
</figure>
