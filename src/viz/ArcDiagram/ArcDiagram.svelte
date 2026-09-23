<svelte:options immutable />

<script>
  /**
   * @template [N=any]
   * @template [L=any]
   */

  /**
   * @event {{ id: string; label: string; group: string | undefined; degree: number; datum: N } | null} hover Fires when the pointer or keyboard focus moves to another node, and with `null` when it leaves.
   * @event {{ node: { id: string; label: string; group: string | undefined; degree: number; datum: N }; links: Array<{ source: string; target: string; value: number; datum: L }>; originalEvent: Event }} select Fires when the focused node is activated by click, Enter, or Space.
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
   * Specify how to read a node's group, which colors it and the links
   * leaving it. Groups take the categorical colors in first-seen order.
   * @type {import("../utils/accessor.js").Accessor<N, string | number>}
   */
  export let group = undefined;

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
   * Specify how to read a link's value, which sets its stroke width.
   * @type {import("../utils/accessor.js").Accessor<L, number | null | undefined>}
   */
  export let value = undefined;

  /**
   * Specify the node order: as given, by group, or by how many links
   * touch each node.
   * @type {"none" | "group" | "degree"}
   */
  export let sort = "none";

  /** Set to `true` to arc a link that runs backward under the line */
  export let directed = false;

  /** Specify the title, shown as the caption and used as the accessible name */
  export let title = "";

  /** Specify the width, in pixels. It scales down with its container. */
  export let width = 640;

  /** Specify the room under the line for labels, in pixels */
  export let labelSpace = 72;

  /**
   * Specify a fixed color per group.
   * @type {Record<string, import("../utils/tokens.js").VizColor>}
   */
  export let colors = {};

  /**
   * Specify which of Carbon's prescribed color groups to use (1-based).
   */
  export let palette = 1;

  /** Set to `false` to hide the legend, which names the groups */
  export let legend = true;

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
  import { buildArcDiagram } from "./arc-geometry.js";

  const dispatch = createEventDispatcher();
  const PAD = 12;

  let active = -1;

  $: idOf = toAccessor(id);
  $: labelOf = label === undefined ? undefined : toAccessor(label);
  $: groupOf = group === undefined ? undefined : toAccessor(group);
  $: sourceOf = toAccessor(source);
  $: targetOf = toAccessor(target);
  $: valueOf = value === undefined ? undefined : toAccessor(value);
  // Depends on the data and the options only, so hover never lays out again.
  $: arc = buildArcDiagram(nodes, links, {
    id: idOf,
    label: labelOf,
    group: groupOf,
    source: sourceOf,
    target: targetOf,
    value: valueOf,
    sort,
    directed,
    width: width - PAD * 2,
    palette,
    colors,
  });
  $: top = arc.above + PAD;
  $: total = top + Math.max(arc.below, 0) + labelSpace;
  $: text = { node: "Node", link: "Link", to: "to", links: "links", ...words };
  $: current = active >= 0 ? arc.nodes[active] : undefined;
  // Read in the markup as a plain value, so every framework version
  // re-evaluates the link classes when the focus moves.
  $: activeKey = current ? current.key : null;
  $: announcement = current ? describe(current) : "";
  $: labelFor = new Map(arc.nodes.map((node) => [node.key, node.label]));

  /** @param {import("./arc-geometry.js").ArcNode<N>} node */
  function describe(node) {
    return [node.label, node.group ?? "", `${node.degree} ${text.links}`]
      .filter(Boolean)
      .join(", ");
  }

  /** @param {import("./arc-geometry.js").ArcNode<N>} node */
  function detail(node) {
    return {
      id: node.key,
      label: node.label,
      group: node.group,
      degree: node.degree,
      datum: node.datum,
    };
  }

  /** @param {number} index */
  function setActive(index) {
    if (index === active) return;
    active = index;
    dispatch("hover", index >= 0 ? detail(arc.nodes[index]) : null);
  }

  /**
   * @param {number} index
   * @param {Event} originalEvent
   */
  function select(index, originalEvent) {
    setActive(index);
    const node = arc.nodes[index];
    selected = selected === node.key ? null : node.key;
    dispatch("select", {
      node: detail(node),
      links: arc.links
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

  /** @param {KeyboardEvent} event */
  function onKeydown(event) {
    const last = arc.nodes.length - 1;
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
</script>

<figure
  bind:this={ref}
  class:bx--viz-arc={true}
  class:bx--viz-arc--emphasis={active >= 0}
  {...$$restProps}
>
  {#if title}
    <figcaption class:bx--viz-chart__title={true}>{title}</figcaption>
  {/if}
  <!-- A chart is one tab stop. Arrow keys walk the nodes along the line. -->
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <svg
    class:bx--viz-arc__svg={true}
    viewBox="0 0 {width} {total}"
    style:max-width="{width}px"
    role="application"
    aria-roledescription="chart"
    aria-label={title || undefined}
    tabindex="0"
    on:keydown={onKeydown}
    on:blur={() => setActive(-1)}
  >
    <g aria-hidden="true" transform="translate({PAD} {top})">
      <line
        class:bx--viz-arc__line={true}
        x1="0"
        x2={width - PAD * 2}
        y1="0"
        y2="0"
      />
      {#each arc.links as link (link.id)}
        <path
          class:bx--viz-arc__link={true}
          class:bx--viz-arc__link--active={activeKey !== null &&
            (link.source === activeKey || link.target === activeKey)}
          d={link.d}
          stroke-width={link.stroke}
          style:--bx-viz-color={link.color}
        >
          <title>
            {labelFor.get(link.source)} {text.to} {labelFor.get(link.target)}:
            {link.value}
          </title>
        </path>
      {/each}
      {#each arc.nodes as node, i (node.key)}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-mouse-events-have-key-events -->
        <g
          class:bx--viz-arc__node={true}
          class:bx--viz-arc__node--active={i === active}
          class:bx--viz-arc__node--selected={node.key === selected}
          class:bx--viz-arc__node--grouped={node.color !== undefined}
          style:--bx-viz-color={node.color}
          transform="translate({node.x} 0)"
          on:click={(event) => select(i, event)}
          on:mouseenter={() => setActive(i)}
          on:mouseleave={() => setActive(-1)}
        >
          <circle class:bx--viz-arc__dot={true} r="5" />
          <text
            class:bx--viz-arc__label={true}
            transform="translate(0 {(arc.below || 0) + 12}) rotate(45)"
            dy="0.32em"
          >
            {node.label}
          </text>
          <title>{describe(node)}</title>
        </g>
      {/each}
    </g>
  </svg>
  {#if legend && arc.groups.length > 0}
    <ul class:bx--viz-treemap__legend={true} aria-hidden="true">
      {#each arc.groups as entry (entry.key)}
        <li
          class:bx--viz-treemap__legend-item={true}
          style:--bx-viz-color={entry.color}
        >
          <span class:bx--viz-treemap__swatch={true}></span>
          {entry.key}
        </li>
      {/each}
    </ul>
  {/if}
  <!-- Every node along the line and every link, for assistive technology. -->
  <ul class:bx--visually-hidden={true}>
    {#each arc.nodes as node (node.key)}
      <li>{text.node}: {describe(node)}</li>
    {/each}
    {#each arc.links as link (link.id)}
      <li>
        {text.link}: {labelFor.get(link.source)}
        {text.to}
        {labelFor.get(link.target)}, {link.value}
      </li>
    {/each}
  </ul>
  <div class:bx--visually-hidden={true} aria-live="polite">{announcement}</div>
</figure>
