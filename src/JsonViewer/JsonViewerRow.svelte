<script>
  /**
   * Internal. One row of `JsonViewer`: a node's key, value and toggle. The
   * node's data lives in the tree's columns, so the row reads it by id.
   * @event {null} toggle
   * @event {null} activate
   */

  /**
   * The tree that holds the node.
   * @type {import("../utils/json-tree.js").JsonTree}
   */
  export let tree;

  /**
   * The node's id.
   * @type {number}
   */
  export let id;

  /** Changes whenever a node's expansion or match flags do. */
  export let rev = 0;

  /**
   * The prefix of the row's element id.
   * @type {string}
   */
  export let treeId;

  /** Whether the row owns the tab stop. */
  export let tabbable = false;

  /** Whether the row is the one the path bar describes. */
  export let active = false;

  /** Whether the row holds the current search match. */
  export let current = false;

  /** The active search, which the row highlights. */
  export let query = "";

  /** Set to `true` to show each value's type after it. */
  export let showTypes = false;

  /** The label of the root row. */
  export let rootLabel = "$";

  import { createEventDispatcher } from "svelte";
  import CaretDown from "../icons/CaretDown.svelte";
  import { keyText, splitMatches, valueText } from "../utils/json-format.js";
  import {
    FLAG_MATCH_KEY,
    FLAG_MATCH_VALUE,
    KIND_NAMES,
  } from "../utils/json-tree.js";

  const dispatch = createEventDispatcher();

  /**
   * @param {import("../utils/json-tree.js").JsonTree} tree
   * @param {number} id
   * @param {string} query
   * @param {string} rootLabel
   * @param {number} _rev
   */
  function describe(tree, id, query, rootLabel, _rev) {
    const flags = tree.flags[id];
    const key = keyText(tree, id, rootLabel);
    const value = valueText(
      tree,
      id,
      (flags & FLAG_MATCH_VALUE) === 0 ? "" : query,
    );
    return {
      type: KIND_NAMES[tree.kinds[id]],
      depth: tree.depths[id],
      position: tree.indexOf(id) + 1,
      size: tree.siblingCount(id),
      expandable: tree.canExpand(id),
      expanded: tree.isExpanded(id),
      key,
      value,
      keyParts:
        (flags & FLAG_MATCH_KEY) === 0 ? null : splitMatches(key.text, query),
      valueParts:
        (flags & FLAG_MATCH_VALUE) === 0
          ? null
          : splitMatches(value.text, query),
    };
  }

  $: row = describe(tree, id, query, rootLabel, rev);
</script>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions a11y-role-has-required-aria-props -->
<div
  role="treeitem"
  id="{treeId}-{id}"
  data-json-id={id}
  data-json-type={row.type}
  class:bx--json-viewer__row={true}
  class:bx--json-viewer__row--active={active}
  class:bx--json-viewer__row--current={current}
  style:--ccs-json-depth={row.depth}
  tabindex={tabbable ? 0 : -1}
  aria-level={row.depth + 1}
  aria-posinset={row.position}
  aria-setsize={row.size}
  aria-expanded={row.expandable ? row.expanded : undefined}
  aria-current={current ? "true" : undefined}
  on:focus={() => dispatch("activate")}
  on:dblclick={() => {
    if (row.expandable) dispatch("toggle");
  }}
>
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <span
    class:bx--json-viewer__toggle={true}
    aria-hidden="true"
    on:click={() => {
      if (row.expandable) dispatch("toggle");
    }}
  >
    {#if row.expandable}
      <CaretDown
        class={row.expanded
          ? "bx--json-viewer__caret bx--json-viewer__caret--expanded"
          : "bx--json-viewer__caret"}
      />
    {/if}
  </span>
  <!-- Code reads left to right in any page direction, as one unit. -->
  <span class:bx--json-viewer__content={true} dir="ltr">
    {#if row.key.role !== "none"}
      <span
        class:bx--json-viewer__key={true}
        class:bx--json-viewer__key--index={row.key.role === "index"}
        class:bx--json-viewer__key--root={row.key.role === "root"}
        >{#if row.keyParts}{#each row.keyParts as part, index (index)}{#if part.match}<mark
                class:bx--json-viewer__mark={true}>{part.text}</mark
              >{:else}{part.text}{/if}{/each}{:else}{row.key.text}{/if}</span
      ><span class:bx--json-viewer__colon={true} aria-hidden="true">:</span>
    {/if}
    <span class:bx--json-viewer__value={true}
      >{#if row.valueParts}{#each row.valueParts as part, index (index)}{#if part.match}<mark
              class:bx--json-viewer__mark={true}>{part.text}</mark
            >{:else}{part.text}{/if}{/each}{:else}{row.value.text}{/if}</span
    >
    {#if row.value.hint}
      <span class:bx--json-viewer__hint={true}>{row.value.hint}</span>
    {/if}
    {#if showTypes}
      <span class:bx--json-viewer__type={true}>{row.type}</span>
    {:else}
      <span class:bx--visually-hidden={true}>, {row.type}</span>
    {/if}
  </span>
</div>
