<svelte:options immutable />

<script>
  /**
   * @template T
   */

  /**
   * @event {{ node: { id: string; label: string; sublabel: string; group: string | undefined; depth: number; parentId: string | null; children: number; collapsed: boolean; hidden: number; datum: T }; originalEvent: Event }} select Fires when the focused card is activated by click, Enter, or Space.
   * @event {{ id: string; collapsed: boolean }} toggle Fires when a node's reports are folded away or shown.
   * @event {{ id: string; label: string; sublabel: string; group: string | undefined; depth: number; parentId: string | null; children: number; collapsed: boolean; hidden: number; datum: T } | null} hover Fires when the pointer or keyboard focus moves to another card, and with `null` when it leaves.
   */

  /** @restProps {figure} */

  /**
   * Specify the rows, one per person or unit.
   * @type {ReadonlyArray<T>}
   */
  export let data = [];

  /**
   * Specify how to read a row's id: a key or a function.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let id;

  /**
   * Specify how to read a row's parent id. A row whose parent is missing
   * or not in the data is a root.
   * @type {import("../utils/accessor.js").Accessor<T, string | number | null | undefined>}
   */
  export let parent;

  /**
   * Specify how to read the first line of a card. Defaults to the id.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let label = undefined;

  /**
   * Specify how to read the second line of a card, such as a title.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let sublabel = undefined;

  /**
   * Specify how to read a row's group, which colors the card's edge: a
   * key or a function. Groups take the categorical colors in first-seen
   * order.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let group = undefined;

  /**
   * Specify a fixed color per group: a semantic name, a categorical index,
   * a viz token name, or any CSS color.
   * @type {Record<string, import("../utils/tokens.js").VizColor>}
   */
  export let colors = {};

  /**
   * Specify which of Carbon's prescribed color groups to use (1-based).
   */
  export let palette = 1;

  /** Set to `false` to hide the legend, which names the groups */
  export let legend = true;

  /** Specify the title, shown as the caption and used as the accessible name */
  export let title = "";

  /**
   * Specify the ids whose reports are folded away.
   * @type {ReadonlyArray<string | number>}
   */
  export let collapsed = [];

  /**
   * Specify the selected node, as its id.
   * @type {string | null}
   */
  export let selected = null;

  /** Specify the width of a card, in pixels */
  export let nodeWidth = 152;

  /** Specify the height of a card, in pixels */
  export let nodeHeight = 52;

  /** Specify the space between levels, in pixels */
  export let rankGap = 40;

  /** Specify the space between cards in a level, in pixels */
  export let nodeGap = 16;

  /**
   * Override the words used for assistive technology.
   * @type {{ node?: string; level?: string; reportsTo?: string; expanded?: string; collapsed?: string; folded?: string; reports?: string }}
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
  import { buildOrg } from "./org-geometry.js";

  const dispatch = createEventDispatcher();
  const PAD = 8;
  const TOGGLE = 8;

  /** @type {string | null} */
  let activeId = null;

  $: idOf = toAccessor(id);
  $: parentOf = toAccessor(parent);
  $: labelOf = label === undefined ? undefined : toAccessor(label);
  $: sublabelOf = sublabel === undefined ? undefined : toAccessor(sublabel);
  $: groupOf = group === undefined ? undefined : toAccessor(group);
  // Depends on the data and the options only, so hover never lays out again.
  $: org = buildOrg(data, {
    id: idOf,
    parent: parentOf,
    label: labelOf,
    sublabel: sublabelOf,
    group: groupOf,
    collapsed,
    nodeWidth,
    nodeHeight,
    rankGap,
    nodeGap,
    palette,
    colors,
  });
  $: width = org.width + PAD * 2;
  $: height =
    org.height + PAD * 2 + (org.nodes.some((n) => n.branch) ? TOGGLE : 0);
  $: text = {
    node: "Node",
    level: "level",
    reportsTo: "reports to",
    expanded: "expanded",
    collapsed: "collapsed",
    folded: "folded away",
    reports: "reports",
    ...words,
  };
  $: labelFor = new Map(org.nodes.map((node) => [node.id, node.label]));
  $: active = org.nodes.find((node) => node.id === activeId) ?? null;
  $: describe = (/** @type {import("./org-geometry.js").OrgNode<T>} */ node) =>
    [
      node.label,
      node.sublabel,
      `${text.level} ${node.depth + 1}`,
      node.group ?? "",
      node.parentId === null
        ? ""
        : `${text.reportsTo} ${labelFor.get(node.parentId)}`,
      node.branch
        ? node.collapsed
          ? `${text.collapsed}, ${node.hidden} ${text.folded}`
          : `${node.childCount} ${text.reports}, ${text.expanded}`
        : "",
    ]
      .filter(Boolean)
      .join(", ");
  $: announcement = active ? describe(active) : "";

  /** @param {import("./org-geometry.js").OrgNode<T>} node */
  function detail(node) {
    return {
      id: node.id,
      label: node.label,
      sublabel: node.sublabel,
      group: node.group,
      depth: node.depth,
      parentId: node.parentId,
      children: node.childCount,
      collapsed: node.collapsed,
      hidden: node.hidden,
      datum: node.row,
    };
  }

  /** @param {import("./org-geometry.js").OrgNode<T> | null} node */
  function setActive(node) {
    const next = node ? node.id : null;
    if (next === activeId) return;
    activeId = next;
    dispatch("hover", node ? detail(node) : null);
  }

  /** @param {import("./org-geometry.js").OrgNode<T>} node */
  function toggle(node) {
    if (!node.branch) return;
    const closed = collapsed.map(String).includes(node.id);
    collapsed = closed
      ? collapsed.filter((entry) => String(entry) !== node.id)
      : [...collapsed, node.id];
    dispatch("toggle", { id: node.id, collapsed: !closed });
  }

  /**
   * @param {import("./org-geometry.js").OrgNode<T>} node
   * @param {Event} originalEvent
   */
  function select(node, originalEvent) {
    setActive(node);
    selected = selected === node.id ? null : node.id;
    dispatch("select", { node: detail(node), originalEvent });
  }

  /**
   * Up and Down walk the cards in reading order, top down and left to
   * right within a branch. Right unfolds a folded card, else steps to its
   * first report; Left folds an open card, else steps up to its manager.
   * Enter selects.
   * @param {KeyboardEvent} event
   */
  function onKeydown(event) {
    const nodes = org.nodes;
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
        else if (at.branch) next = nodes[index + 1];
        break;
      case "ArrowLeft":
        if (!at) next = nodes[0];
        else if (at.branch && !at.collapsed) toggle(at);
        else if (at.parentId !== null)
          next = nodes.find((node) => node.id === at.parentId) ?? null;
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

  /**
   * Cut a line that would run past the card, at about the width of a
   * character for its size.
   * @param {string} value
   * @param {number} perChar
   */
  function fits(value, perChar) {
    const room = Math.floor((nodeWidth - 20) / perChar);
    return value.length <= room
      ? value
      : `${value.slice(0, Math.max(room - 1, 1))}…`;
  }
</script>

<figure
  bind:this={ref}
  class:bx--viz-org={true}
  class:bx--viz-org--emphasis={activeId !== null}
  {...$$restProps}
>
  {#if title}
    <figcaption class:bx--viz-chart__title={true}>{title}</figcaption>
  {/if}
  <!-- A chart is one tab stop. Arrow keys walk the cards in reading order. -->
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <svg
    class:bx--viz-org__svg={true}
    viewBox="0 0 {width} {height}"
    style:max-width="{width}px"
    role="application"
    aria-roledescription="chart"
    aria-label={title || undefined}
    tabindex="0"
    on:keydown={onKeydown}
    on:blur={() => setActive(null)}
  >
    <g aria-hidden="true" transform="translate({PAD} {PAD})">
      {#each org.links as link (link.id)}
        <path
          class:bx--viz-org__link={true}
          class:bx--viz-org__link--active={activeId !== null &&
            link.id.split("/").includes(activeId)}
          d={link.d}
        />
      {/each}
      {#each org.nodes as node (node.id)}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-mouse-events-have-key-events -->
        <g
          class:bx--viz-org__node={true}
          class:bx--viz-org__node--branch={node.branch}
          class:bx--viz-org__node--collapsed={node.collapsed}
          class:bx--viz-org__node--active={node.id === activeId}
          class:bx--viz-org__node--selected={node.id === selected}
          class:bx--viz-org__node--grouped={node.color !== undefined}
          style:--bx-viz-color={node.color}
          transform="translate({node.x} {node.y})"
          on:click={(event) => select(node, event)}
          on:dblclick={() => toggle(node)}
          on:mouseenter={() => setActive(node)}
          on:mouseleave={() => setActive(null)}
        >
          <rect
            class:bx--viz-org__card={true}
            width={nodeWidth}
            height={nodeHeight}
          />
          <title>{describe(node)}</title>
          {#if node.color !== undefined}
            <!-- The group's color is a bar down the card's start edge. -->
            <rect
              class:bx--viz-org__accent={true}
              width="4"
              height={nodeHeight}
            />
          {/if}
          <text
            class:bx--viz-org__label={true}
            x="12"
            y={node.sublabel ? nodeHeight / 2 - 8 : nodeHeight / 2}
            dy="0.32em"
          >
            {fits(node.label, 7.2)}
          </text>
          {#if node.sublabel}
            <text
              class:bx--viz-org__sublabel={true}
              x="12"
              y={nodeHeight / 2 + 9}
              dy="0.32em"
            >
              {fits(node.sublabel, 6.4)}
            </text>
          {/if}
          {#if node.branch}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <g
              class:bx--viz-org__toggle={true}
              transform="translate({nodeWidth / 2} {nodeHeight})"
              on:click|stopPropagation={() => toggle(node)}
              on:dblclick|stopPropagation
            >
              {#if node.collapsed}
                <rect
                  class:bx--viz-org__toggle-box={true}
                  x="-16"
                  y={-TOGGLE}
                  width="32"
                  height={TOGGLE * 2}
                  rx={TOGGLE}
                />
                <text
                  class:bx--viz-org__toggle-text={true}
                  dy="0.32em"
                  text-anchor="middle"
                >
                  +{node.hidden}
                </text>
              {:else}
                <circle class:bx--viz-org__toggle-box={true} r={TOGGLE} />
                <path class:bx--viz-org__toggle-mark={true} d="M-3.5,0H3.5" />
              {/if}
            </g>
          {/if}
        </g>
      {/each}
    </g>
  </svg>
  {#if legend && org.groups.length > 0}
    <ul class:bx--viz-treemap__legend={true} aria-hidden="true">
      {#each org.groups as entry (entry.key)}
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
  <!-- Every card in reading order, with its manager, for assistive technology. -->
  <ul class:bx--visually-hidden={true}>
    {#each org.nodes as node (node.id)}
      <li>{text.node}: {describe(node)}</li>
    {/each}
  </ul>
  <div class:bx--visually-hidden={true} aria-live="polite">{announcement}</div>
</figure>
