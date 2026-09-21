<svelte:options immutable />

<script>
  /**
   * @template T
   */

  /**
   * @event {{ node: import("./alluvial-geometry.js").AlluvialNode } | null} hover Fires when the pointer or keyboard focus moves to another node, and with `null` when it leaves.
   * @event {{ node: import("./alluvial-geometry.js").AlluvialNode; links: import("./alluvial-geometry.js").AlluvialLink<T>[]; originalEvent: Event }} select Fires when the focused node is activated by click, Enter, or Space.
   */

  /** @restProps {figure} */

  /**
   * Specify the rows: one for each flow. Rows that share a source and a
   * target are summed.
   * @type {ReadonlyArray<T>}
   */
  export let data = [];

  /**
   * Specify how to read where a flow starts: a key or a function.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let source;

  /**
   * Specify how to read where a flow ends: a key or a function.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let target;

  /**
   * Specify how to read the size of a flow: a key or a function.
   * @type {import("../utils/accessor.js").Accessor<T, number>}
   */
  export let value;

  /** Specify the title, shown as the caption and used as the accessible name */
  export let title = "";

  /** Specify the width the layout is drawn at. The chart scales to its container. */
  export let width = 720;

  /** Specify the height the layout is drawn at */
  export let height = 360;

  /** Specify the least gap between nodes of one column, in pixels */
  export let nodePadding = 16;

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
   * Specify a fixed color per node.
   * @type {Record<string, import("../utils/tokens.js").VizColor>}
   */
  export let colors = {};

  /**
   * Override the column headers of the table for assistive technology.
   * @type {{ source?: string; target?: string; value?: string }}
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
  import { toAccessor } from "../utils/accessor.js";
  import { resolveFormat } from "../utils/format-compact.js";
  import { buildAlluvial } from "./alluvial-geometry.js";

  const dispatch = createEventDispatcher();
  /** Gap between a node and its label. */
  const LABEL_GAP = 8;

  /** @type {string | null} */
  let activeId = null;
  let focusIndex = -1;

  $: sourceOf = toAccessor(source);
  $: targetOf = toAccessor(target);
  $: valueOf = toAccessor(value);
  // Depends on the data and the size only, so hover never rebuilds it.
  $: flow = buildAlluvial(data, {
    source: sourceOf,
    target: targetOf,
    value: valueOf,
    width,
    height,
    nodePadding,
    palette,
    colors,
  });
  $: formatValue = resolveFormat(format, locale);
  $: headers = {
    source: "From",
    target: "To",
    value: "Value",
    ...headerLabels,
  };
  // Reading order for the keyboard: column by column, top to bottom.
  $: order = [...flow.nodes].sort((a, b) => a.column - b.column || a.y - b.y);
  $: active = flow.nodes.find((node) => node.id === activeId) ?? null;
  $: announcement = active ? `${active.id}: ${formatValue(active.value)}` : "";

  // Built in script: whitespace in a multi-line template would end up in the
  // tooltip.
  $: describe = (
    /** @type {import("./alluvial-geometry.js").AlluvialLink<T>} */ link,
  ) => `${link.source} → ${link.target}: ${formatValue(link.value)}`;

  /** @param {import("./alluvial-geometry.js").AlluvialNode | null} node */
  function setActive(node) {
    const next = node ? node.id : null;
    if (next === activeId) return;
    activeId = next;
    dispatch("hover", node ? { node } : null);
  }

  /** @param {Event} originalEvent */
  function selectActive(originalEvent) {
    if (!active) return;
    const id = active.id;
    dispatch("select", {
      node: active,
      links: flow.links.filter(
        (link) => link.source === id || link.target === id,
      ),
      originalEvent,
    });
  }

  /** @param {KeyboardEvent} event */
  function onKeydown(event) {
    const last = order.length - 1;
    if (last < 0) return;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        focusIndex = Math.min(last, focusIndex + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        focusIndex = Math.max(0, focusIndex - 1);
        break;
      case "Home":
        focusIndex = 0;
        break;
      case "End":
        focusIndex = last;
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        selectActive(event);
        return;
      case "Escape":
        focusIndex = -1;
        setActive(null);
        return;
      default:
        return;
    }
    event.preventDefault();
    setActive(order[focusIndex]);
  }
</script>

<figure bind:this={ref} class:bx--viz-alluvial={true} {...$$restProps}>
  {#if title}
    <figcaption class:bx--viz-chart__title={true}>{title}</figcaption>
  {/if}
  <!-- A chart is one tab stop. Arrow keys move between nodes. -->
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-mouse-events-have-key-events -->
  <svg
    class:bx--viz-alluvial__svg={true}
    class:bx--viz-alluvial__svg--emphasis={activeId !== null}
    viewBox="0 0 {width} {height}"
    style:max-width="{width}px"
    role="application"
    aria-roledescription="chart"
    aria-label={title || undefined}
    tabindex="0"
    on:keydown={onKeydown}
    on:click={selectActive}
    on:mouseleave={() => setActive(null)}
    on:blur={() => setActive(null)}
  >
    <g aria-hidden="true">
      {#each flow.links as link (link.id)}
        <path
          class:bx--viz-alluvial__link={true}
          class:bx--viz-alluvial__link--active={link.source === activeId ||
            link.target === activeId}
          d={link.path}
          style:--bx-viz-color={link.color}
        >
          <title>{describe(link)}</title>
        </path>
      {/each}
      {#each flow.nodes as node (node.id)}
        <g
          class:bx--viz-alluvial__node={true}
          class:bx--viz-alluvial__node--active={node.id === activeId}
          on:mouseenter={() => setActive(node)}
        >
          <rect
            x={node.x}
            y={node.y}
            width={node.width}
            height={Math.max(node.height, 1)}
            style:--bx-viz-color={node.color}
          />
          <text
            class:bx--viz-alluvial__label={true}
            x={node.last ? node.x - LABEL_GAP : node.x + node.width + LABEL_GAP}
            y={node.y + node.height / 2}
            dy="0.32em"
            text-anchor={node.last ? "end" : "start"}
          >
            {node.id}
            <tspan class:bx--viz-alluvial__value={true} dx="4">
              {formatValue(node.value)}
            </tspan>
          </text>
        </g>
      {/each}
    </g>
  </svg>
  <!-- Every flow, for assistive technology: a ribbon says nothing to it. -->
  <table class:bx--visually-hidden={true}>
    {#if title}
      <caption>
        {title}
      </caption>
    {/if}
    <thead>
      <tr>
        <th scope="col">{headers.source}</th>
        <th scope="col">{headers.target}</th>
        <th scope="col">{headers.value}</th>
      </tr>
    </thead>
    <tbody>
      {#each flow.links as link (link.id)}
        <tr>
          <td>{link.source}</td>
          <td>{link.target}</td>
          <td>{formatValue(link.value)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
  <div class:bx--visually-hidden={true} aria-live="polite">{announcement}</div>
</figure>
