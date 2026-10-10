<svelte:options immutable />

<script>
  /**
   * @template [T=any]
   */

  /**
   * @event {{ node: { id: string; label: string; lane: string | undefined; group: string | undefined; rank: number; children: number; parents: number; collapsed: boolean; hidden: number; datum: T }; originalEvent: Event }} select Fires when a node is activated by click, Enter, or Space.
   * @event {{ id: string; collapsed: boolean }} toggle Fires when a node's descendants are folded away or shown.
   * @event {{ id: string; label: string; lane: string | undefined; group: string | undefined; rank: number; children: number; parents: number; collapsed: boolean; hidden: number; datum: T } | null} hover Fires when the pointer or focus moves to another node, and with `null` when it leaves.
   * @event {{ k: number; tx: number; ty: number }} transform Fires when the view pans or zooms.
   * @slot {{ node: { id: string; label: string; lane: string | undefined; group: string | undefined; rank: number; children: number; parents: number; collapsed: boolean; hidden: number; datum: T } }} node
   */

  /** @restProps {figure} */

  /**
   * Specify the nodes, one row each.
   * @type {ReadonlyArray<T>}
   */
  export let nodes = [];

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
   * Specify how to read a node's group, which colors its edge.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let group = undefined;

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
   * Specify the direction ranks run.
   * @type {"TB" | "LR"}
   */
  export let rankDir = "TB";

  /**
   * Specify how edges are drawn.
   * @type {"straight" | "orthogonal"}
   */
  export let edge = "orthogonal";

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

  /**
   * Specify the selected node, as its id.
   * @type {string | null}
   */
  export let selected = null;

  /**
   * Specify the view: a scale and a translation in pixels. Leave `null`
   * to fit the whole graph, and bind it to keep the view across renders.
   * @type {{ k: number; tx: number; ty: number } | null}
   */
  export let transform = null;

  /** Specify the smallest scale */
  export let minZoom = 0.25;

  /** Specify the largest scale */
  export let maxZoom = 4;

  /** Specify the height of the stage, in pixels */
  export let height = 400;

  /** Specify the width of a node, in pixels */
  export let nodeWidth = 160;

  /** Specify the height of a node, in pixels */
  export let nodeHeight = 48;

  /** Specify the space between ranks, in pixels */
  export let rankGap = 56;

  /** Specify the space between nodes in a rank, in pixels */
  export let nodeGap = 24;

  /** Set to `false` to hide the zoom controls */
  export let controls = true;

  /** Set to `false` to hide the minimap */
  export let minimap = true;

  /**
   * Specify a fixed color per group.
   * @type {Record<string, import("../utils/tokens.js").VizColor>}
   */
  export let colors = {};

  /**
   * Specify which of Carbon's prescribed color groups to use (1-based).
   */
  export let palette = 1;

  /**
   * Override the words used for the controls and assistive technology.
   * @type {{ zoomIn?: string; zoomOut?: string; fit?: string; node?: string; edge?: string; to?: string; rank?: string; lane?: string; expanded?: string; collapsed?: string; folded?: string; back?: string }}
   */
  export let words = {};

  /**
   * Obtain a reference to the figure element.
   * @bindable readonly
   * @type {null | HTMLElement}
   */
  export let ref = null;

  import { createEventDispatcher, onMount, tick } from "svelte";
  import Button from "../../Button/Button.svelte";
  import FitToScreen from "../../icons/FitToScreen.svelte";
  import ZoomIn from "../../icons/ZoomIn.svelte";
  import ZoomOut from "../../icons/ZoomOut.svelte";
  import { rovingFocus } from "../../utils/roving-focus.js";
  import {
    fit as fitView,
    identity,
    toWorld,
    viewport,
    zoomAt,
  } from "../../utils/viewport.js";
  import { toAccessor } from "../utils/accessor.js";
  import { layoutLayered } from "../utils/layout-layered.js";
  import { nextId } from "../utils/next-id.js";
  import { observeResize } from "../utils/resize-pool.js";
  import { routePolyline } from "../utils/route-edge.js";
  import { categoricalColors, vizColor } from "../utils/tokens.js";

  const dispatch = createEventDispatcher();
  const PAD = 16;
  const LANE_LABEL = 20;
  const markerId = nextId("bx-viz-canvas-arrow");

  /** @type {HTMLElement | null} */
  let stage = null;
  let stageWidth = 0;
  let stageHeight = 0;
  /** @type {string | null} */
  let activeId = null;
  let focusIndex = -1;
  // Focus that came from a press must not pan the stage under the pointer.
  let pressed = false;

  $: idOf = toAccessor(id);
  $: labelOf = label === undefined ? undefined : toAccessor(label);
  $: laneOf = lane === undefined ? undefined : toAccessor(lane);
  $: groupOf = group === undefined ? undefined : toAccessor(group);
  $: sourceOf = toAccessor(source);
  $: targetOf = toAccessor(target);
  $: vertices = nodes.map((row, i) => ({
    id: idOf(row, i),
    label: labelOf ? String(labelOf(row, i) ?? idOf(row, i)) : undefined,
    lane: laneOf ? laneOf(row, i) : undefined,
    datum: row,
  }));
  $: arcs = links.map((row, i) => ({
    source: sourceOf(row, i),
    target: targetOf(row, i),
  }));
  // Depends on the data and the options only: panning never lays out again.
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
  $: left = laned && rankDir === "LR" ? LANE_LABEL : 0;
  $: top = laned && rankDir === "TB" ? LANE_LABEL : 0;
  $: bounds = extentOf(layout, left, top);
  // The view: the caller's, or a fit of the whole graph in the stage. A fit
  // may go below the zoom floor, which only bounds the user's own zooming.
  $: view =
    transform ??
    (stageWidth > 0
      ? fitView(
          bounds,
          { width: stageWidth, height: stageHeight },
          { padding: 8, min: 0.02, max: 1 },
        )
      : identity());
  $: groupKeys = groupOf
    ? [...new Set(nodes.map((row, i) => String(groupOf(row, i))))]
    : [];
  $: groupColor = paint(groupKeys, palette, colors);
  $: colorOf = new Map(
    layout.nodes.map((node) => [
      node.id,
      groupOf
        ? groupColor.get(String(groupOf(node.datum, node.index)))
        : undefined,
    ]),
  );
  $: text = {
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    fit: "Fit to view",
    node: "Node",
    edge: "Edge",
    to: "to",
    rank: "level",
    lane: "lane",
    expanded: "expanded",
    collapsed: "collapsed",
    folded: "folded away",
    back: "back",
    ...words,
  };
  $: active = layout.nodes.find((node) => node.id === activeId) ?? null;
  $: announcement = active ? describe(active) : "";
  $: labelFor = new Map(layout.nodes.map((node) => [node.id, node.label]));
  // The stage in world coordinates, for the minimap's window.
  $: window_ = {
    a: toWorld(view, 0, 0),
    b: toWorld(view, stageWidth, stageHeight),
  };

  /**
   * The box around every node and lane, with room for the arrows and the
   * lane labels, measured rather than taken from the layout's size.
   * @param {import("../utils/layout-layered.js").LayeredLayout<T>} at
   * @param {number} leftRoom
   * @param {number} topRoom
   */
  function extentOf(at, leftRoom, topRoom) {
    let x0 = 0;
    let y0 = 0;
    let x1 = at.width;
    let y1 = at.height;
    for (const node of at.nodes) {
      x0 = Math.min(x0, node.x);
      y0 = Math.min(y0, node.y);
      x1 = Math.max(x1, node.x + node.width);
      y1 = Math.max(y1, node.y + node.height);
    }
    for (const band of at.lanes) {
      x0 = Math.min(x0, band.x0, band.x1);
      y0 = Math.min(y0, band.y0, band.y1);
      x1 = Math.max(x1, band.x0, band.x1);
      y1 = Math.max(y1, band.y0, band.y1);
    }
    return {
      x0: x0 - PAD - leftRoom,
      y0: y0 - PAD - topRoom,
      x1: x1 + PAD,
      y1: y1 + PAD,
    };
  }

  /**
   * @param {ReadonlyArray<string>} keys
   * @param {number} option
   * @param {Record<string, import("../utils/tokens.js").VizColor>} fixed
   */
  function paint(keys, option, fixed) {
    const assigned = categoricalColors(keys.length, option);
    /** @type {Map<string, string>} */
    const out = new Map();
    keys.forEach((key, i) => {
      out.set(
        key,
        fixed[key] === undefined
          ? assigned[i]
          : (vizColor(fixed[key]) ?? assigned[i]),
      );
    });
    return out;
  }

  /** @param {import("../utils/layout-layered.js").LayeredNode<T>} node */
  function describe(node) {
    return [
      node.label,
      `${text.rank} ${node.rank + 1}`,
      node.lane === undefined ? "" : `${text.lane} ${node.lane}`,
      groupOf ? String(groupOf(node.datum, node.index)) : "",
      node.children > 0
        ? node.collapsed
          ? `${text.collapsed}, ${node.hidden} ${text.folded}`
          : text.expanded
        : "",
    ]
      .filter(Boolean)
      .join(", ");
  }

  /** @param {import("../utils/layout-layered.js").LayeredNode<T>} node */
  function detail(node) {
    return {
      id: node.id,
      label: node.label,
      lane: node.lane,
      group: groupOf ? String(groupOf(node.datum, node.index)) : undefined,
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

  /** @param {{ k: number; tx: number; ty: number }} next */
  function setView(next) {
    transform = next;
    dispatch("transform", next);
  }

  /** @param {number} factor */
  function zoomBy(factor) {
    setView(
      zoomAt(view, factor, stageWidth / 2, stageHeight / 2, {
        min: minZoom,
        max: maxZoom,
      }),
    );
  }

  function fitAll() {
    transform = null;
    dispatch("transform", view);
  }

  /**
   * Bring a node into the stage when focus lands on one outside it.
   * @param {import("../utils/layout-layered.js").LayeredNode<T>} node
   */
  function reveal(node) {
    const x0 = node.x * view.k + view.tx;
    const y0 = node.y * view.k + view.ty;
    const x1 = x0 + node.width * view.k;
    const y1 = y0 + node.height * view.k;
    if (x0 >= 0 && y0 >= 0 && x1 <= stageWidth && y1 <= stageHeight) return;
    setView({
      k: view.k,
      tx: stageWidth / 2 - (node.x + node.width / 2) * view.k,
      ty: stageHeight / 2 - (node.y + node.height / 2) * view.k,
    });
  }

  /**
   * Left folds, Right unfolds, plus and minus zoom, zero fits. Arrows
   * between nodes come from the roving focus.
   * @param {KeyboardEvent} event
   * @param {import("../utils/layout-layered.js").LayeredNode<T>} node
   */
  function onNodeKeydown(event, node) {
    switch (event.key) {
      case "ArrowLeft":
        if (node.children > 0 && !node.collapsed) {
          event.preventDefault();
          event.stopPropagation();
          toggle(node);
        }
        return;
      case "ArrowRight":
        if (node.collapsed) {
          event.preventDefault();
          event.stopPropagation();
          toggle(node);
        }
        return;
      default:
        onStageKeydown(event);
    }
  }

  /** @param {KeyboardEvent} event */
  function onStageKeydown(event) {
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      zoomBy(1.25);
    } else if (event.key === "-") {
      event.preventDefault();
      zoomBy(0.8);
    } else if (event.key === "0") {
      event.preventDefault();
      fitAll();
    }
  }

  /**
   * A press on the stage floor pans; a press on a node does not.
   * @param {PointerEvent} event
   */
  function isFloor(event) {
    const hit = /** @type {Element | null} */ (event.target);
    return hit === null || hit.closest(".bx--viz-graph-canvas__node") === null;
  }

  /** @param {MouseEvent} event */
  function onMinimapClick(event) {
    const svg = /** @type {SVGSVGElement} */ (event.currentTarget);
    const rect = svg.getBoundingClientRect();
    const w = bounds.x1 - bounds.x0;
    const h = bounds.y1 - bounds.y0;
    const wx = bounds.x0 + ((event.clientX - rect.left) / rect.width) * w;
    const wy = bounds.y0 + ((event.clientY - rect.top) / rect.height) * h;
    setView({
      k: view.k,
      tx: stageWidth / 2 - wx * view.k,
      ty: stageHeight / 2 - wy * view.k,
    });
  }

  /**
   * The path of an edge: through its points, or with right angles that
   * turn halfway between ranks.
   * @param {import("../utils/layout-layered.js").LayeredEdge} entry
   */
  function pathOf(entry) {
    return routePolyline(entry.points, {
      kind: edge,
      axis: rankDir === "LR" ? "x" : "y",
    });
  }

  onMount(() => {
    if (!stage) return;
    return observeResize(stage, (w, h) => {
      stageWidth = Math.round(w);
      stageHeight = Math.round(h);
    });
  });
</script>

<figure bind:this={ref} class:bx--viz-graph-canvas={true} {...$$restProps}>
  <div class:bx--viz-graph-canvas__header={true}>
    {#if title}
      <figcaption class:bx--viz-chart__title={true}>{title}</figcaption>
    {/if}
    {#if controls}
      <div class:bx--viz-graph-canvas__controls={true}>
        <Button
          kind="ghost"
          size="small"
          icon={ZoomIn}
          iconDescription={text.zoomIn}
          tooltipPosition="bottom"
          tooltipAlignment="end"
          on:click={() => zoomBy(1.25)}
        />
        <Button
          kind="ghost"
          size="small"
          icon={ZoomOut}
          iconDescription={text.zoomOut}
          tooltipPosition="bottom"
          tooltipAlignment="end"
          on:click={() => zoomBy(0.8)}
        />
        <Button
          kind="ghost"
          size="small"
          icon={FitToScreen}
          iconDescription={text.fit}
          tooltipPosition="bottom"
          tooltipAlignment="end"
          on:click={fitAll}
        />
      </div>
    {/if}
  </div>
  <!-- The stage pans and zooms; the nodes inside are buttons, one tab stop
       with the arrow keys moving between them. -->
  <div
    bind:this={stage}
    class:bx--viz-graph-canvas__stage={true}
    style:height="{height}px"
    use:viewport={{
      get: () => view,
      set: setView,
      min: minZoom,
      max: maxZoom,
      accept: isFloor,
    }}
  >
    <svg
      class:bx--viz-graph-canvas__edges={true}
      aria-hidden="true"
      focusable="false"
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
          <path class:bx--viz-graph-canvas__arrow={true} d="M0,0L10,5L0,10Z" />
        </marker>
      </defs>
      <g transform="translate({view.tx} {view.ty}) scale({view.k})">
        {#each layout.lanes as band (band.key)}
          <rect
            class:bx--viz-graph-canvas__lane={true}
            class:bx--viz-graph-canvas__lane--tinted={groupColor.has(band.key)}
            style:--bx-viz-color={groupColor.get(band.key)}
            x={Math.min(band.x0, band.x1) - PAD / 2}
            y={Math.min(band.y0, band.y1) - PAD / 2}
            width={Math.abs(band.x1 - band.x0) + PAD}
            height={Math.abs(band.y1 - band.y0) + PAD}
          />
          <text
            class:bx--viz-graph-canvas__lane-label={true}
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
            class:bx--viz-graph-canvas__edge={true}
            class:bx--viz-graph-canvas__edge--back={entry.reversed}
            class:bx--viz-graph-canvas__edge--active={activeId !== null &&
              (entry.source === activeId || entry.target === activeId)}
            style:--bx-viz-color={colorOf.get(entry.source)}
            d={pathOf(entry)}
            marker-end="url(#{markerId})"
          />
        {/each}
      </g>
    </svg>
    <div
      class:bx--viz-graph-canvas__nodes={true}
      style:transform="translate({view.tx}px, {view.ty}px) scale({view.k})"
      role="group"
      aria-label={title || undefined}
      use:rovingFocus={{
        selector: ".bx--viz-graph-canvas__node",
        orientation: "both",
        focusOnMove: true,
        getActiveIndex: () => Math.max(focusIndex, 0),
        onMove: (index) => {
          focusIndex = index;
        },
      }}
    >
      {#each layout.nodes as node, i (node.id)}
        <!-- svelte-ignore a11y-mouse-events-have-key-events -->
        <button
          type="button"
          class:bx--viz-graph-canvas__node={true}
          class:bx--viz-graph-canvas__node--active={node.id === activeId}
          class:bx--viz-graph-canvas__node--selected={node.id === selected}
          class:bx--viz-graph-canvas__node--collapsed={node.collapsed}
          class:bx--viz-graph-canvas__node--grouped={colorOf.get(node.id) !==
            undefined}
          style:--bx-viz-color={colorOf.get(node.id)}
          style:left="{node.x}px"
          style:top="{node.y}px"
          style:width="{node.width}px"
          style:height="{node.height}px"
          tabindex={i === Math.max(focusIndex, 0) ? 0 : -1}
          aria-pressed={node.id === selected}
          aria-label={describe(node)}
          on:pointerdown={() => {
            pressed = true;
          }}
          on:click={(event) => select(node, event)}
          on:dblclick={() => toggle(node)}
          on:focus={() => {
            focusIndex = i;
            setActive(node);
            const byKeyboard = !pressed;
            pressed = false;
            if (byKeyboard) tick().then(() => reveal(node));
          }}
          on:blur={() => setActive(null)}
          on:mouseenter={() => setActive(node)}
          on:mouseleave={() => setActive(null)}
          on:keydown={(event) => onNodeKeydown(event, node)}
        >
          <slot name="node" node={detail(node)}>
            <span class:bx--viz-graph-canvas__label={true}>{node.label}</span>
          </slot>
          {#if node.collapsed && node.hidden > 0}
            <span class:bx--viz-graph-canvas__badge={true}>+{node.hidden}</span>
          {/if}
        </button>
      {/each}
    </div>
    {#if minimap && layout.nodes.length > 0}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <svg
        class:bx--viz-graph-canvas__minimap={true}
        viewBox="{bounds.x0} {bounds.y0} {bounds.x1 - bounds.x0} {bounds.y1 -
          bounds.y0}"
        aria-hidden="true"
        focusable="false"
        on:click={onMinimapClick}
      >
        {#each layout.nodes as node (node.id)}
          <rect
            class:bx--viz-graph-canvas__minimap-node={true}
            x={node.x}
            y={node.y}
            width={node.width}
            height={node.height}
          />
        {/each}
        {#if stageWidth > 0}
          <rect
            class:bx--viz-graph-canvas__minimap-window={true}
            x={window_.a.x}
            y={window_.a.y}
            width={Math.max(window_.b.x - window_.a.x, 0)}
            height={Math.max(window_.b.y - window_.a.y, 0)}
          />
        {/if}
      </svg>
    {/if}
  </div>
  <!-- Every node in reading order and every edge, for assistive technology. -->
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
