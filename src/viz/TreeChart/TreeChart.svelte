<svelte:options immutable />

<script>
  /**
   * @template T
   */

  /**
   * @event {{ node: import("./tree-geometry.js").TreeChartNode<T>; originalEvent: Event }} select Fires when a node is activated by click, Enter, or Space.
   * @event {{ id: string; collapsed: boolean }} toggle Fires when a node's children are folded away or shown.
   */

  /** @restProps {figure} */

  /**
   * Specify the rows: one for each node, naming its parent.
   * @type {ReadonlyArray<T>}
   */
  export let data = [];

  /**
   * Specify how to read a node's id from a row: a key or a function.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let id;

  /**
   * Specify how to read the id of a node's parent: a key or a function.
   * A row with no parent, or one that is not in the data, is a root.
   * @type {import("../utils/accessor.js").Accessor<T, string | number | null | undefined>}
   */
  export let parent;

  /**
   * Specify how to read a node's label: a key or a function.
   * Defaults to the id.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let label = undefined;

  /** Specify the title, shown as the caption and used as the accessible name */
  export let title = "";

  /**
   * Specify the shape. `"dendrogram"` lines every leaf up in the last column.
   * @type {"tree" | "dendrogram"}
   */
  export let type = "tree";

  /** Specify the width the layout is drawn at. The chart scales to its container. */
  export let width = 720;

  /** Specify the height the layout is drawn at */
  export let height = 360;

  /** Specify the room kept on either side for labels, in pixels */
  export let labelSpace = 96;

  /**
   * Specify the ids of the nodes whose children are folded away.
   * @type {ReadonlyArray<string>}
   */
  export let collapsed = [];

  /**
   * Override the words read to assistive technology.
   * @type {{ expanded?: string; collapsed?: string; level?: string }}
   */
  export let translations = {};

  /**
   * Obtain a reference to the HTML element.
   * @bindable readonly
   * @type {null | HTMLElement}
   */
  export let ref = null;

  import { createEventDispatcher } from "svelte";
  import { toAccessor } from "../utils/accessor.js";
  import { buildTree } from "./tree-geometry.js";

  const dispatch = createEventDispatcher();

  /** @type {string | null} */
  let activeId = null;

  $: idOf = toAccessor(id);
  $: parentOf = toAccessor(parent);
  $: labelOf = toAccessor(label ?? id);
  // Depends on the data, the size, and what is folded, so hover and focus
  // never rebuild it.
  $: tree = buildTree(data, {
    id: idOf,
    parent: parentOf,
    label: labelOf,
    collapsed,
    width,
    height,
    labelSpace,
    align: type === "dendrogram" ? "leaves" : "depth",
  });
  $: words = {
    expanded: "expanded",
    collapsed: "collapsed",
    level: "level",
    ...translations,
  };
  $: active = tree.nodes.find((node) => node.id === activeId) ?? null;
  $: describe = (
    /** @type {import("./tree-geometry.js").TreeChartNode<T>} */ node,
  ) =>
    [
      node.label,
      `${words.level} ${node.depth + 1}`,
      node.branch ? (node.collapsed ? words.collapsed : words.expanded) : "",
    ]
      .filter(Boolean)
      .join(", ");
  $: announcement = active ? describe(active) : "";

  /** @param {import("./tree-geometry.js").TreeChartNode<T>} node */
  function toggle(node) {
    if (!node.branch) return;
    const closed = collapsed.includes(node.id);
    collapsed = closed
      ? collapsed.filter((entry) => entry !== node.id)
      : [...collapsed, node.id];
    dispatch("toggle", { id: node.id, collapsed: !closed });
  }

  /**
   * @param {import("./tree-geometry.js").TreeChartNode<T>} node
   * @param {Event} originalEvent
   */
  function activate(node, originalEvent) {
    activeId = node.id;
    toggle(node);
    dispatch("select", { node, originalEvent });
  }

  /**
   * The keyboard model of a tree view: Up and Down walk the visible nodes,
   * Right opens a branch or steps into it, Left closes it or steps out.
   * @param {KeyboardEvent} event
   */
  function onKeydown(event) {
    const nodes = tree.nodes;
    if (nodes.length === 0) return;
    const at = active ?? null;
    /** @type {typeof at} */
    let next = null;
    switch (event.key) {
      case "ArrowDown":
        next = at ? (nodes[at.index + 1] ?? at) : nodes[0];
        break;
      case "ArrowUp":
        next = at ? (nodes[at.index - 1] ?? at) : nodes[0];
        break;
      case "ArrowRight":
        if (!at) next = nodes[0];
        else if (at.collapsed) toggle(at);
        else if (at.branch) next = nodes[at.index + 1] ?? at;
        break;
      case "ArrowLeft":
        if (!at) next = nodes[0];
        else if (at.branch && !at.collapsed) toggle(at);
        else next = nodes.find((node) => node.id === at.parentId) ?? at;
        break;
      case "Home":
        next = nodes[0];
        break;
      case "End":
        next = nodes[nodes.length - 1];
        break;
      case "Enter":
      case " ":
        if (at) activate(at, event);
        break;
      case "Escape":
        activeId = null;
        return;
      default:
        return;
    }
    event.preventDefault();
    if (next) activeId = next.id;
  }
</script>

<figure bind:this={ref} class:bx--viz-tree={true} {...$$restProps}>
  {#if title}
    <figcaption class:bx--viz-chart__title={true}>{title}</figcaption>
  {/if}
  <!-- A chart is one tab stop. Arrow keys walk the tree. -->
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <svg
    class:bx--viz-tree__svg={true}
    viewBox="0 0 {width} {height}"
    style:max-width="{width}px"
    role="application"
    aria-roledescription="chart"
    aria-label={title || undefined}
    tabindex="0"
    on:keydown={onKeydown}
    on:blur={() => (activeId = null)}
  >
    <g aria-hidden="true">
      {#each tree.links as link (link.id)}
        <path class:bx--viz-tree__link={true} d={link.path} />
      {/each}
      {#each tree.nodes as node (node.id)}
        <g
          class:bx--viz-tree__node={true}
          class:bx--viz-tree__node--branch={node.branch}
          class:bx--viz-tree__node--collapsed={node.collapsed}
          class:bx--viz-tree__node--active={node.id === activeId}
          on:click={(event) => activate(node, event)}
        >
          <!-- A wide, invisible target: the dot alone is too small to hit. -->
          <circle
            class:bx--viz-tree__target={true}
            cx={node.x}
            cy={node.y}
            r="12"
          />
          <circle
            class:bx--viz-tree__dot={true}
            cx={node.x}
            cy={node.y}
            r="5"
          />
          <!-- A branch has a link on either side, so its label goes above. -->
          <text
            class:bx--viz-tree__label={true}
            x={node.branch ? node.x : node.x + 10}
            y={node.branch ? node.y - 12 : node.y}
            dy={node.branch ? undefined : "0.32em"}
            text-anchor={node.branch ? "middle" : "start"}
          >
            {node.label}
          </text>
        </g>
      {/each}
    </g>
  </svg>
  <!-- The visible nodes in reading order, for assistive technology. -->
  <ul class:bx--visually-hidden={true}>
    {#each tree.nodes as node (node.id)}
      <li>{describe(node)}</li>
    {/each}
  </ul>
  <div class:bx--visually-hidden={true} aria-live="polite">{announcement}</div>
</figure>
