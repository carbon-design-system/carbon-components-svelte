<svelte:options immutable />

<script>
  /**
   * @template [N=any]
   * @template [L=any]
   */

  /**
   * @event {{ id: string; label: string; axis: string; degree: number; position: number; datum: N } | null} hover Fires when the pointer or keyboard focus moves to another node, and with `null` when it leaves.
   * @event {{ node: { id: string; label: string; axis: string; degree: number; position: number; datum: N }; links: Array<{ source: string; target: string; value: number; datum: L }>; originalEvent: Event }} select Fires when the focused node is activated by click, Enter, or Space.
   */

  /** @restProps {figure} */

  /**
   * Specify the nodes, one row each.
   * @type {ReadonlyArray<N>}
   */
  export let nodes = [];

  /**
   * Specify the links, one row each, read with `source` and `target`.
   * @type {ReadonlyArray<L>}
   */
  export let links = [];

  /**
   * Specify how to read a node's id: a key or a function.
   * @type {import("../utils/accessor.js").Accessor<N, string | number>}
   */
  export let id;

  /**
   * Specify how to read a node's label. Defaults to its id.
   * @type {import("../utils/accessor.js").Accessor<N, string | number>}
   */
  export let label = undefined;

  /**
   * Specify how to read a node's kind, which puts it on an axis. Keep to
   * a handful of kinds.
   * @type {import("../utils/accessor.js").Accessor<N, string | number>}
   */
  export let axis;

  /**
   * Specify how to read a node's position along its axis, larger farther
   * out. Defaults to how many links touch it.
   * @type {import("../utils/accessor.js").Accessor<N, number | null | undefined>}
   */
  export let position = undefined;

  /**
   * Specify how to read a link's source id.
   * @type {import("../utils/accessor.js").Accessor<L, string | number>}
   */
  export let source = "source";

  /**
   * Specify how to read a link's target id.
   * @type {import("../utils/accessor.js").Accessor<L, string | number>}
   */
  export let target = "target";

  /**
   * Specify how to read a link's value, shown on hover.
   * @type {import("../utils/accessor.js").Accessor<L, number | null | undefined>}
   */
  export let value = undefined;

  /**
   * Specify the axis order, clockwise from the top. Defaults to first seen.
   * @type {ReadonlyArray<string | number>}
   */
  export let axes = undefined;

  /** Specify the title, shown as the caption and used as the accessible name */
  export let title = "";

  /** Specify the diameter, in pixels. It scales down with its container. */
  export let diameter = 400;

  /** Specify the empty radius at the center, in pixels */
  export let innerRadius = 32;

  /** Specify the room around the plot for axis labels, in pixels */
  export let labelSpace = 64;

  /**
   * Specify a fixed color per axis.
   * @type {Record<string, import("../utils/tokens.js").VizColor>}
   */
  export let colors = {};

  /**
   * Specify which of Carbon's prescribed color groups to use (1-based).
   */
  export let palette = 1;

  /**
   * Specify the selected node, as its id.
   * @type {string | null}
   */
  export let selected = null;

  /**
   * Override the words used for assistive technology.
   * @type {{ node?: string; link?: string; to?: string; links?: string }}
   */
  export let words = {};

  /**
   * Obtain a reference to the HTML element.
   * @bindable readonly
   * @type {null | HTMLElement}
   */
  export let ref = null;

  import { createEventDispatcher } from "svelte";
  import { toAccessor } from "../utils/accessor.js";
  import { buildHive } from "./hive-geometry.js";

  const dispatch = createEventDispatcher();

  let active = -1;

  $: idOf = toAccessor(id);
  $: labelOf = label === undefined ? undefined : toAccessor(label);
  $: axisOf = toAccessor(axis);
  $: positionOf = position === undefined ? undefined : toAccessor(position);
  $: sourceOf = toAccessor(source);
  $: targetOf = toAccessor(target);
  $: valueOf = value === undefined ? undefined : toAccessor(value);
  $: radius = diameter / 2;
  // Depends on the data and the options only, so hover never lays out again.
  $: hive = buildHive(nodes, links, {
    id: idOf,
    label: labelOf,
    axis: axisOf,
    position: positionOf,
    source: sourceOf,
    target: targetOf,
    value: valueOf,
    axes,
    radius,
    innerRadius,
    palette,
    colors,
  });
  // The drawing box hugs the axes, so three axes do not leave an empty
  // quarter under them.
  $: box = extents(hive.axes, radius + labelSpace);
  $: text = { node: "Node", link: "Link", to: "to", links: "links", ...words };
  $: current = active >= 0 ? hive.nodes[active] : undefined;
  // Read in the markup as a plain value, so every framework version
  // re-evaluates the link classes when the focus moves.
  $: activeKey = current ? current.key : null;
  $: announcement = current ? describe(current) : "";
  $: labelFor = new Map(hive.nodes.map((node) => [node.key, node.label]));
  // Built in script: whitespace in a multi-line template would end up in
  // the tooltip.
  $: describeLink = (
    /** @type {import("./hive-geometry.js").HiveLink<L>} */ link,
  ) =>
    `${labelFor.get(link.source)} ${text.to} ${labelFor.get(link.target)}${
      valueOf ? `: ${link.value}` : ""
    }`;

  /** @param {import("./hive-geometry.js").HiveNode<N>} node */
  function describe(node) {
    return `${node.label}, ${node.axis}, ${node.degree} ${text.links}`;
  }

  /** @param {import("./hive-geometry.js").HiveNode<N>} node */
  function detail(node) {
    return {
      id: node.key,
      label: node.label,
      axis: node.axis,
      degree: node.degree,
      position: node.position,
      datum: node.datum,
    };
  }

  /** @param {number} index */
  function setActive(index) {
    if (index === active) return;
    active = index;
    dispatch("hover", index >= 0 ? detail(hive.nodes[index]) : null);
  }

  /**
   * @param {number} index
   * @param {Event} originalEvent
   */
  function select(index, originalEvent) {
    setActive(index);
    const node = hive.nodes[index];
    selected = selected === node.key ? null : node.key;
    dispatch("select", {
      node: detail(node),
      links: hive.links
        .filter((link) => link.source === node.key || link.target === node.key)
        .map((link) => ({
          source: link.source,
          target: link.target,
          value: link.value,
          datum: link.datum,
        })),
      originalEvent,
    });
  }

  /**
   * Down and Up walk the nodes axis by axis from the center out, Right
   * and Left jump to the next axis. Enter selects.
   * @param {KeyboardEvent} event
   */
  function onKeydown(event) {
    const all = hive.nodes;
    const last = all.length - 1;
    if (last < 0) return;
    let next = active;
    switch (event.key) {
      case "ArrowDown":
        next = Math.min(last, active + 1);
        break;
      case "ArrowUp":
        next = Math.max(0, active - 1);
        break;
      case "ArrowRight":
      case "ArrowLeft": {
        if (active < 0) {
          next = 0;
          break;
        }
        const step = event.key === "ArrowRight" ? 1 : -1;
        const keys = hive.axes.map((entry) => entry.key);
        const at = keys.indexOf(all[active].axis);
        const to = keys[(at + step + keys.length) % keys.length];
        const first = all.findIndex((node) => node.axis === to);
        if (first >= 0) next = first;
        break;
      }
      case "Home":
        next = 0;
        break;
      case "End":
        next = last;
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (active >= 0) select(active, event);
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

  /**
   * The smallest box around every axis tip plus its label room, never
   * narrower than the center circle.
   * @param {ReadonlyArray<import("./hive-geometry.js").HiveAxis>} list
   * @param {number} reach
   */
  function extents(list, reach) {
    let x0 = -reach * 0.25;
    let x1 = reach * 0.25;
    let y0 = -reach * 0.25;
    let y1 = reach * 0.25;
    for (const entry of list) {
      const x = reach * Math.sin(entry.angle);
      const y = -reach * Math.cos(entry.angle);
      x0 = Math.min(x0, x - reach * 0.35);
      x1 = Math.max(x1, x + reach * 0.35);
      y0 = Math.min(y0, y - 16);
      y1 = Math.max(y1, y + 16);
    }
    return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
  }

  /** @param {import("./hive-geometry.js").HiveAxis} entry */
  function anchorOf(entry) {
    const x = Math.sin(entry.angle);
    return x > 0.1 ? "start" : x < -0.1 ? "end" : "middle";
  }
</script>

<figure
  bind:this={ref}
  class:bx--viz-hive={true}
  class:bx--viz-hive--emphasis={active >= 0}
  {...$$restProps}
>
  {#if title}
    <figcaption class:bx--viz-chart__title={true}>{title}</figcaption>
  {/if}
  <!-- A chart is one tab stop. Arrow keys walk the nodes axis by axis. -->
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <svg
    class:bx--viz-hive__svg={true}
    viewBox="{box.x} {box.y} {box.width} {box.height}"
    style:max-width="{box.width}px"
    role="application"
    aria-roledescription="chart"
    aria-label={title || undefined}
    tabindex="0"
    on:keydown={onKeydown}
    on:blur={() => setActive(-1)}
  >
    <g aria-hidden="true">
      {#each hive.axes as entry (entry.key)}
        <line
          class:bx--viz-hive__axis={true}
          style:--bx-viz-color={entry.color}
          x1={entry.x1}
          y1={entry.y1}
          x2={entry.x2}
          y2={entry.y2}
        />
        <text
          class:bx--viz-hive__axis-label={true}
          x={entry.labelX}
          y={entry.labelY}
          dy="0.32em"
          text-anchor={anchorOf(entry)}
        >
          {entry.key}
        </text>
      {/each}
      {#each hive.links as link (link.id)}
        <path
          class:bx--viz-hive__link={true}
          class:bx--viz-hive__link--active={activeKey !== null &&
            (link.source === activeKey || link.target === activeKey)}
          style:--bx-viz-color={link.color}
          d={link.d}
        >
          <title>{describeLink(link)}</title>
        </path>
      {/each}
      {#each hive.nodes as node, i (node.key)}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-mouse-events-have-key-events -->
        <g
          class:bx--viz-hive__node={true}
          class:bx--viz-hive__node--active={i === active}
          class:bx--viz-hive__node--selected={node.key === selected}
          style:--bx-viz-color={node.color}
          transform="translate({node.x} {node.y})"
          on:click={(event) => select(i, event)}
          on:mouseenter={() => setActive(i)}
          on:mouseleave={() => setActive(-1)}
        >
          <circle class:bx--viz-hive__dot={true} r="5" />
          <title>{describe(node)}</title>
        </g>
      {/each}
    </g>
  </svg>
  <ul class:bx--viz-treemap__legend={true} aria-hidden="true">
    {#each hive.axes as entry (entry.key)}
      <li
        class:bx--viz-treemap__legend-item={true}
        style:--bx-viz-color={entry.color}
      >
        <span class:bx--viz-treemap__swatch={true}></span>
        {entry.key}
        ({entry.count})
      </li>
    {/each}
  </ul>
  <!-- Every node by axis and every link, for assistive technology. -->
  <ul class:bx--visually-hidden={true}>
    {#each hive.nodes as node (node.key)}
      <li>{text.node}: {describe(node)}</li>
    {/each}
    {#each hive.links as link (link.id)}
      <li>{text.link}: {describeLink(link)}</li>
    {/each}
  </ul>
  <div class:bx--visually-hidden={true} aria-live="polite">{announcement}</div>
</figure>
