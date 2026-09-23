<svelte:options immutable />

<script>
  /**
   * @template T
   */

  /**
   * The node type is written inline: a typedef cannot carry the generic
   * into the generated declarations.
   * @event {{ node: { id: string; label: string; lane: string | undefined; rank: number; children: number; parents: number; collapsed: boolean; hidden: number; datum: T }; originalEvent: Event }} select Fires when the focused node is activated by click, Enter, or Space.
   * @event {{ id: string; collapsed: boolean }} toggle Fires when a node's descendants are folded away or shown.
   * @event {{ id: string; label: string; lane: string | undefined; rank: number; children: number; parents: number; collapsed: boolean; hidden: number; datum: T } | null} hover Fires when the pointer or keyboard focus moves to another node, and with `null` when it leaves.
   */

  /** @restProps {figure} */

  /**
   * Specify the nodes, one row each.
   * @type {ReadonlyArray<T>}
   */
  export let data = [];

  /**
   * Specify the edges, one row each, read with `source` and `target`.
   * @type {ReadonlyArray<any>}
   */
  export let links = [];

  /**
   * Specify how to read a node's id: a key or a function.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let id;

  /**
   * Specify how to read a node's label. Defaults to its id.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let label = undefined;

  /**
   * Specify how to read a node's lane, which groups nodes into bands.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let lane = undefined;

  /**
   * Specify how to read an edge's source id.
   * @type {import("../utils/accessor.js").Accessor<any, string | number>}
   */
  export let source = "source";

  /**
   * Specify how to read an edge's target id.
   * @type {import("../utils/accessor.js").Accessor<any, string | number>}
   */
  export let target = "target";

  /** Specify the title, shown as the caption and used as the accessible name */
  export let title = "";

  /**
   * Specify the direction ranks run: down the page, or left to right.
   * @type {"TB" | "LR"}
   */
  export let rankDir = "TB";

  /**
   * Specify how edges are drawn: straight between ranks, or with right
   * angles.
   * @type {"straight" | "orthogonal"}
   */
  export let edge = "straight";

  /**
   * Specify the lane order. Defaults to first-seen order.
   * @type {ReadonlyArray<string | number>}
   */
  export let lanes = undefined;

  /**
   * Specify the ids whose descendants are folded away.
   * @type {ReadonlyArray<string | number>}
   */
  export let collapsed = [];

  /** Specify the width of a node, in pixels */
  export let nodeWidth = 132;

  /** Specify the height of a node, in pixels */
  export let nodeHeight = 36;

  /** Specify the space between ranks, in pixels */
  export let rankGap = 48;

  /** Specify the space between nodes in a rank, in pixels */
  export let nodeGap = 24;

  /**
   * Specify the selected node, as its id.
   * @type {string | null}
   */
  export let selected = null;

  /**
   * Override the words used for assistive technology.
   * @type {{ node?: string; rank?: string; lane?: string; expanded?: string; collapsed?: string; folded?: string; edge?: string; to?: string; back?: string }}
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
  import { layoutLayered } from "../utils/layout-layered.js";
  import { nextId } from "../utils/next-id.js";

  const dispatch = createEventDispatcher();
  const PAD = 8;
  const LANE_LABEL = 20;
  const markerId = nextId("bx-viz-arrow");

  /** @type {string | null} */
  let activeId = null;

  $: idOf = toAccessor(id);
  $: labelOf = label === undefined ? undefined : toAccessor(label);
  $: laneOf = lane === undefined ? undefined : toAccessor(lane);
  $: sourceOf = toAccessor(source);
  $: targetOf = toAccessor(target);
  $: vertices = data.map((row, i) => ({
    id: idOf(row, i),
    label: labelOf ? String(labelOf(row, i) ?? idOf(row, i)) : undefined,
    lane: laneOf ? laneOf(row, i) : undefined,
    datum: row,
  }));
  $: arcs = links.map((row, i) => ({
    source: sourceOf(row, i),
    target: targetOf(row, i),
  }));
  // Depends on the data and the options only, so hover never lays out again.
  $: layout = layoutLayered(vertices, arcs, {
    rankDir,
    nodeWidth,
    nodeHeight,
    rankGap,
    nodeGap,
    collapsed,
    lanes,
  });
  $: laned = layout.lanes.length > 0;
  $: top = laned && rankDir === "TB" ? LANE_LABEL : 0;
  $: left = laned && rankDir === "LR" ? LANE_LABEL : 0;
  $: width = layout.width + PAD * 2 + left;
  $: height = layout.height + PAD * 2 + top;
  $: text = {
    node: "Node",
    rank: "level",
    lane: "lane",
    expanded: "expanded",
    collapsed: "collapsed",
    folded: "folded away",
    edge: "Edge",
    to: "to",
    back: "back",
    ...words,
  };
  $: active = layout.nodes.find((node) => node.id === activeId) ?? null;
  $: describe = (
    /** @type {import("../utils/layout-layered.js").LayeredNode<T>} */ node,
  ) =>
    [
      node.label,
      `${text.rank} ${node.rank + 1}`,
      node.lane === undefined ? "" : `${text.lane} ${node.lane}`,
      node.children > 0
        ? node.collapsed
          ? `${text.collapsed}, ${node.hidden} ${text.folded}`
          : text.expanded
        : "",
    ]
      .filter(Boolean)
      .join(", ");
  $: announcement = active ? describe(active) : "";
  $: labelFor = new Map(layout.nodes.map((node) => [node.id, node.label]));

  /**
   * The path of an edge: through its points, or with right angles that
   * turn halfway between ranks.
   * @param {import("../utils/layout-layered.js").LayeredEdge} entry
   */
  function pathOf(entry) {
    const points = entry.points;
    if (edge !== "orthogonal" || points.length < 2) {
      return points
        .map((point, i) => `${i === 0 ? "M" : "L"}${point.x},${point.y}`)
        .join("");
    }
    let d = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      if (rankDir === "LR") {
        const mid = (a.x + b.x) / 2;
        d += `L${mid},${a.y}L${mid},${b.y}L${b.x},${b.y}`;
      } else {
        const mid = (a.y + b.y) / 2;
        d += `L${a.x},${mid}L${b.x},${mid}L${b.x},${b.y}`;
      }
    }
    return d;
  }

  /** @param {import("../utils/layout-layered.js").LayeredNode<T>} node */
  function detail(node) {
    return {
      id: node.id,
      label: node.label,
      lane: node.lane,
      rank: node.rank,
      children: node.children,
      parents: node.parents,
      collapsed: node.collapsed,
      hidden: node.hidden,
      datum: node.datum,
    };
  }

  /** @param {import("../utils/layout-layered.js").LayeredNode<T> | null} node */
  function setActive(node) {
    const next = node ? node.id : null;
    if (next === activeId) return;
    activeId = next;
    dispatch("hover", node ? detail(node) : null);
  }

  /** @param {import("../utils/layout-layered.js").LayeredNode<T>} node */
  function toggle(node) {
    if (node.children === 0) return;
    const closed = collapsed.map(String).includes(node.id);
    collapsed = closed
      ? collapsed.filter((entry) => String(entry) !== node.id)
      : [...collapsed, node.id];
    dispatch("toggle", { id: node.id, collapsed: !closed });
  }

  /**
   * @param {import("../utils/layout-layered.js").LayeredNode<T>} node
   * @param {Event} originalEvent
   */
  function select(node, originalEvent) {
    setActive(node);
    selected = selected === node.id ? null : node.id;
    dispatch("select", { node: detail(node), originalEvent });
  }

  /**
   * Up and Down walk the nodes in reading order, Right opens a folded node
   * and Left folds one, Enter selects.
   * @param {KeyboardEvent} event
   */
  function onKeydown(event) {
    const nodes = layout.nodes;
    if (nodes.length === 0) return;
    const at = active;
    const index = at ? nodes.indexOf(at) : -1;
    /** @type {typeof at} */
    let next = null;
    switch (event.key) {
      case "ArrowDown":
        next = nodes[Math.min(nodes.length - 1, index + 1)];
        break;
      case "ArrowUp":
        next = nodes[Math.max(0, index - 1)];
        break;
      case "ArrowRight":
        if (!at) next = nodes[0];
        else if (at.collapsed) toggle(at);
        break;
      case "ArrowLeft":
        if (!at) next = nodes[0];
        else if (at.children > 0 && !at.collapsed) toggle(at);
        break;
      case "Home":
        next = nodes[0];
        break;
      case "End":
        next = nodes[nodes.length - 1];
        break;
      case "Enter":
      case " ":
        if (at) select(at, event);
        break;
      case "Escape":
        setActive(null);
        return;
      default:
        return;
    }
    event.preventDefault();
    if (next) setActive(next);
  }

  /** @param {import("../utils/layout-layered.js").LayeredNode<T>} node */
  function fits(node) {
    // About seven pixels a character at the label size.
    const room = Math.floor((node.width - 16) / 7);
    return node.label.length <= room
      ? node.label
      : `${node.label.slice(0, Math.max(room - 1, 1))}…`;
  }
</script>

<figure
  bind:this={ref}
  class:bx--viz-graph={true}
  class:bx--viz-graph--emphasis={activeId !== null}
  {...$$restProps}
>
  {#if title}
    <figcaption class:bx--viz-chart__title={true}>{title}</figcaption>
  {/if}
  <!-- A chart is one tab stop. Arrow keys walk the nodes in reading order. -->
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <svg
    class:bx--viz-graph__svg={true}
    viewBox="0 0 {width} {height}"
    style:max-width="{width}px"
    role="application"
    aria-roledescription="chart"
    aria-label={title || undefined}
    tabindex="0"
    on:keydown={onKeydown}
    on:blur={() => setActive(null)}
  >
    <defs>
      <marker
        id={markerId}
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="8"
        markerHeight="8"
        orient="auto-start-reverse"
      >
        <path class:bx--viz-graph__arrow={true} d="M0,0L10,5L0,10Z" />
      </marker>
    </defs>
    <g aria-hidden="true" transform="translate({PAD + left} {PAD + top})">
      {#each layout.lanes as band (band.key)}
        <rect
          class:bx--viz-graph__lane={true}
          x={Math.min(band.x0, band.x1) - PAD / 2}
          y={Math.min(band.y0, band.y1) - PAD / 2}
          width={Math.abs(band.x1 - band.x0) + PAD}
          height={Math.abs(band.y1 - band.y0) + PAD}
        />
        <text
          class:bx--viz-graph__lane-label={true}
          x={rankDir === "LR" ? -PAD : Math.min(band.x0, band.x1)}
          y={rankDir === "LR" ? Math.min(band.y0, band.y1) : -PAD}
          dy={rankDir === "LR" ? "0.8em" : undefined}
          text-anchor={rankDir === "LR" ? "end" : "start"}
        >
          {band.key}
        </text>
      {/each}
      {#each layout.edges as entry (entry.id)}
        <path
          class:bx--viz-graph__edge={true}
          class:bx--viz-graph__edge--back={entry.reversed}
          class:bx--viz-graph__edge--active={activeId !== null &&
            (entry.source === activeId || entry.target === activeId)}
          d={pathOf(entry)}
          marker-end="url(#{markerId})"
        />
      {/each}
      {#each layout.nodes as node (node.id)}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-mouse-events-have-key-events -->
        <g
          class:bx--viz-graph__node={true}
          class:bx--viz-graph__node--branch={node.children > 0}
          class:bx--viz-graph__node--collapsed={node.collapsed}
          class:bx--viz-graph__node--active={node.id === activeId}
          class:bx--viz-graph__node--selected={node.id === selected}
          transform="translate({node.x} {node.y})"
          on:click={(event) => select(node, event)}
          on:dblclick={() => toggle(node)}
          on:mouseenter={() => setActive(node)}
          on:mouseleave={() => setActive(null)}
        >
          <rect
            class:bx--viz-graph__box={true}
            width={node.width}
            height={node.height}
          />
          <title>{describe(node)}</title>
          <text
            class:bx--viz-graph__label={true}
            x={node.width / 2}
            y={node.height / 2}
            dy="0.32em"
            text-anchor="middle"
          >
            {fits(node)}
          </text>
          {#if node.collapsed && node.hidden > 0}
            <g transform="translate({node.width} 0)">
              <rect
                class:bx--viz-graph__badge={true}
                x="-14"
                y="-8"
                width="28"
                height="16"
                rx="8"
              />
              <text
                class:bx--viz-graph__badge-text={true}
                x="0"
                y="0"
                dy="0.32em"
                text-anchor="middle"
              >
                +{node.hidden}
              </text>
            </g>
          {/if}
        </g>
      {/each}
    </g>
  </svg>
  <!-- The nodes in reading order and every edge, for assistive technology. -->
  <ul class:bx--visually-hidden={true}>
    {#each layout.nodes as node (node.id)}
      <li>{text.node}: {describe(node)}</li>
    {/each}
    {#each layout.edges as entry (entry.id)}
      <li>
        {text.edge}: {labelFor.get(entry.source)}
        {text.to}
        {labelFor.get(entry.target)}{entry.reversed ? `, ${text.back}` : ""}
      </li>
    {/each}
  </ul>
  <div class:bx--visually-hidden={true} aria-live="polite">{announcement}</div>
</figure>
