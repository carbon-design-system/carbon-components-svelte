<svelte:options immutable />

<script>
  /**
   * @template T
   */

  /**
   * The node type is written inline: a typedef cannot carry the generic
   * into the generated declarations.
   * @event {{ id: string; parent: string | null; label: string; depth: number; value: number; own: number; share: number; leaf: boolean; datum: T; index: number } | null} hover Fires when the pointer or focus enters a node, and with `null` when it leaves.
   * @event {{ node: { id: string; parent: string | null; label: string; depth: number; value: number; own: number; share: number; leaf: boolean; datum: T; index: number }; originalEvent: Event }} select Fires when a node is activated by click or keyboard. Requires `selectable`.
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
   * color of its ancestor just under the root, so each branch has a hue.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let group = undefined;

  /** Specify the title, shown as the caption and used as the accessible name */
  export let title = "";

  /**
   * Specify where the root sits. `"top"` hangs children below it, as an
   * icicle. `"bottom"` stacks them upward, as a flame graph.
   * @type {"top" | "bottom"}
   */
  export let orientation = "top";

  /**
   * Specify the node to show from. Its ancestors stay above it at full
   * width, as steps back up. Bind it to drill in from `select`.
   * @type {string | number | null}
   */
  export let root = null;

  /**
   * Specify how many levels below the root to draw.
   * @type {number}
   */
  export let maxDepth = undefined;

  /**
   * Specify the order of siblings: as given, or largest first.
   * @type {"none" | "value"}
   */
  export let sort = "none";

  /** Specify the height of one level, in pixels */
  export let rowHeight = 28;

  /**
   * Specify what is written after each label.
   * @type {"value" | "percent" | "none"}
   */
  export let valueType = "value";

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

  /** Set to `false` to hide the legend, which lists the groups */
  export let legend = true;

  /** Set to `true` to make nodes selectable */
  export let selectable = false;

  /**
   * Specify the selected node, as its id.
   * @type {string | null}
   */
  export let selected = null;

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
  import { rovingFocus } from "../../utils/roving-focus.js";
  import { toAccessor } from "../utils/accessor.js";
  import { formatPercent, resolveFormat } from "../utils/format-compact.js";
  import { partition } from "../utils/partition.js";
  import { categoricalColors, vizColor } from "../utils/tokens.js";

  const dispatch = createEventDispatcher();
  // Shares of the width: a slice narrower than the first holds no text, and
  // one narrower than the second holds only its label.
  const MIN_WIDTH = 5;
  const MIN_WIDTH_FOR_VALUE = 14;

  let focusedIndex = 0;
  /** @type {string | null} */
  let activeId = null;

  $: idOf = toAccessor(id);
  $: parentOf = toAccessor(parent);
  $: valueOf = toAccessor(value);
  $: labelOf = label === undefined ? undefined : toAccessor(label);
  $: groupOf = group === undefined ? undefined : toAccessor(group);
  // Depends on the data and the options only, so hover never rebuilds it.
  $: tree = partition(data, {
    id: idOf,
    parent: parentOf,
    value: valueOf,
    label: labelOf,
    sort,
    root: root ?? undefined,
    maxDepth,
  });
  $: keyed = paint(tree, groupOf, palette, colors);
  $: formatValue = resolveFormat(format, locale);
  $: write = (
    /** @type {import("../utils/partition.js").PartitionNode<T>} */ node,
  ) =>
    valueType === "percent"
      ? formatPercent(node.share, { locale, digits: 0 })
      : formatValue(node.value);
  $: headers = {
    node: "Node",
    level: "Level",
    value: "Value",
    share: "Share",
    ...headerLabels,
  };
  $: levels = tree.depth + 1;
  $: tabStopIndex = Math.min(focusedIndex, Math.max(tree.nodes.length - 1, 0));

  /**
   * Color per node: by the group accessor, or by the branch under the root.
   * @param {typeof tree} laid
   * @param {((row: T, index: number) => unknown) | undefined} readGroup
   * @param {number} option
   * @param {Record<string, import("../utils/tokens.js").VizColor>} fixed
   */
  function paint(laid, readGroup, option, fixed) {
    /** @type {Map<string, string>} */
    const groupOfNode = new Map();
    /** @type {string[]} */
    const keys = [];
    // A lone node at the top is the whole, not a branch: it stays neutral
    // and its children are the branches. Several at the top are branches.
    const tops = laid.nodes.filter((node) => node.depth === laid.ancestors);
    for (const node of laid.nodes) {
      let key;
      if (readGroup) {
        key = String(readGroup(node.datum, node.index));
      } else if (node.ancestor || (tops.length === 1 && node === tops[0])) {
        key = "";
      } else {
        // The branch: the ancestor just under the top, or the node itself.
        const up =
          node.parent === null ? undefined : groupOfNode.get(node.parent);
        key = up === undefined || up === "" ? node.id : up;
      }
      groupOfNode.set(node.id, key);
      if (key !== "" && !keys.includes(key)) keys.push(key);
    }
    const assigned = categoricalColors(keys.length, option);
    /** @type {Map<string, string>} */
    const colorOf = new Map();
    keys.forEach((key, i) => {
      colorOf.set(
        key,
        fixed[key] === undefined
          ? assigned[i]
          : (vizColor(fixed[key]) ?? assigned[i]),
      );
    });
    return {
      groups: keys.map((key) => ({
        key,
        label: readGroup
          ? key
          : (laid.nodes.find((node) => node.id === key)?.label ?? key),
        color: /** @type {string} */ (colorOf.get(key)),
      })),
      colorOf: (/** @type {string} */ nodeId) =>
        colorOf.get(groupOfNode.get(nodeId) ?? ""),
    };
  }

  /** @param {import("../utils/partition.js").PartitionNode<T>} node */
  function detail(node) {
    return {
      id: node.id,
      parent: node.parent,
      label: node.label,
      depth: node.depth,
      value: node.value,
      own: node.own,
      share: node.share,
      leaf: node.leaf,
      datum: node.datum,
      index: node.index,
    };
  }

  /** @param {import("../utils/partition.js").PartitionNode<T> | null} node */
  function setActive(node) {
    const next = node ? node.id : null;
    if (next === activeId) return;
    activeId = next;
    dispatch("hover", node ? detail(node) : null);
  }

  /**
   * @param {import("../utils/partition.js").PartitionNode<T>} node
   * @param {Event} originalEvent
   */
  function select(node, originalEvent) {
    selected = selected === node.id ? null : node.id;
    focusedIndex = tree.nodes.indexOf(node);
    dispatch("select", { node: detail(node), originalEvent });
  }

  /**
   * Roving focus across the node buttons, attached only while `selectable`,
   * so a static chart adds no listeners.
   *
   * @param {HTMLElement} node
   * @param {boolean} enabled
   */
  function rovingNodes(node, enabled) {
    /** @type {ReturnType<typeof rovingFocus> | undefined} */
    let roving;
    /** @param {boolean} on */
    function sync(on) {
      if (on && !roving) {
        roving = rovingFocus(node, {
          selector: ".bx--viz-icicle__button",
          orientation: "both",
          focusOnMove: true,
          getActiveIndex: () => tabStopIndex,
          onMove: (index, event) => {
            event.preventDefault();
            focusedIndex = index;
          },
        });
      } else if (!on && roving) {
        roving.destroy();
        roving = undefined;
      }
    }
    sync(enabled);
    return { update: sync, destroy: () => sync(false) };
  }

  /** @param {import("../utils/partition.js").PartitionNode<T>} node */
  function rowOf(node) {
    return orientation === "bottom" ? tree.depth - node.depth : node.depth;
  }
</script>

<figure
  bind:this={ref}
  class:bx--viz-icicle={true}
  class:bx--viz-icicle--flame={orientation === "bottom"}
  class:bx--viz-icicle--selectable={selectable}
  class:bx--viz-icicle--emphasis={activeId !== null}
  {...$$restProps}
>
  {#if title}
    <figcaption class:bx--viz-chart__title={true}>{title}</figcaption>
  {/if}
  <ul
    class:bx--viz-icicle__plot={true}
    style:--bx-viz-row={`${rowHeight}px`}
    style:height="{levels * rowHeight}px"
    aria-hidden={selectable ? undefined : "true"}
    aria-label={selectable ? title || undefined : undefined}
    use:rovingNodes={selectable}
  >
    {#each tree.nodes as node, i (node.id)}
      <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
      <!-- svelte-ignore a11y-mouse-events-have-key-events -->
      <li
        class:bx--viz-icicle__node={true}
        class:bx--viz-icicle__node--ancestor={node.ancestor}
        class:bx--viz-icicle__node--narrow={node.x1 - node.x0 < MIN_WIDTH}
        class:bx--viz-icicle__node--short={node.x1 - node.x0 <
          MIN_WIDTH_FOR_VALUE}
        class:bx--viz-icicle__node--active={node.id === activeId}
        class:bx--viz-icicle__node--selected={selectable && node.id === selected}
        style:left="{node.x0}%"
        style:width="{node.x1 - node.x0}%"
        style:top="{rowOf(node) * rowHeight}px"
        style:--bx-viz-color={keyed.colorOf(node.id) ??
          "var(--cds-viz-neutral)"}
        title="{node.label}: {write(node)}"
        on:mouseenter={() => setActive(node)}
        on:mouseleave={() => setActive(null)}
      >
        {#if selectable}
          <button
            type="button"
            class:bx--viz-icicle__button={true}
            tabindex={i === tabStopIndex ? 0 : -1}
            aria-pressed={node.id === selected}
            aria-label="{node.label}, {write(node)}"
            on:click={(event) => select(node, event)}
            on:focus={() => {
              focusedIndex = i;
              setActive(node);
            }}
            on:blur={() => setActive(null)}
          >
            <span class:bx--viz-icicle__label={true}>{node.label}</span>
            {#if valueType !== "none"}
              <span class:bx--viz-icicle__value={true}>{write(node)}</span>
            {/if}
          </button>
        {:else}
          <span class:bx--viz-icicle__cell={true}>
            <span class:bx--viz-icicle__label={true}>{node.label}</span>
            {#if valueType !== "none"}
              <span class:bx--viz-icicle__value={true}>{write(node)}</span>
            {/if}
          </span>
        {/if}
      </li>
    {/each}
  </ul>
  <!-- Every node, for assistive technology: a slice says nothing to it. -->
  <table
    class:bx--visually-hidden={true}
    aria-hidden={selectable ? "true" : undefined}
  >
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
      {#each tree.nodes as node (node.id)}
        <tr>
          <th scope="row">{node.label}</th>
          <td>{node.depth + 1}</td>
          <td>{formatValue(node.value)}</td>
          <td>{formatPercent(node.share, { locale, digits: 0 })}</td>
        </tr>
      {/each}
    </tbody>
  </table>
  {#if legend && keyed.groups.length > 1}
    <ul class:bx--viz-treemap__legend={true} aria-hidden="true">
      {#each keyed.groups as entry (entry.key)}
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
