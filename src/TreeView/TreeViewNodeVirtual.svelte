<script>
  /**
   * Flat-row renderer used by `<TreeView virtualize>`. Consumes the same
   * `carbon:TreeView` context as TreeViewNode / TreeViewNodeList so all
   * selection / expansion / focus callbacks behave identically.
   *
   * @typedef {object} Row
   * @property {{ id: string | number; text?: any; icon?: any; disabled?: boolean; nodes?: any[] }} node
   * @property {number} depth
   * @property {string | number | null} parentId
   * @property {number} posInSet
   * @property {number} setSize
   * @property {boolean} hasChildren
   */

  /** @type {Row} */
  export let item;

  /** @type {number} */
  export let itemHeight;

  /** Whether this row owns tabindex=0 (one focusable row at a time). */
  export let isTabAnchor = false;

  import { getContext } from "svelte";
  import CaretDown from "../icons/CaretDown.svelte";

  const {
    activeNodeId,
    selectedIdsSetStore,
    expandedIdsSetStore,
    clickNode,
    expandNode,
    focusNode,
    toggleNode,
  } = getContext("carbon:TreeView");

  $: ({ node, depth, posInSet, setSize, hasChildren } = item);
  $: id = node.id;
  $: disabled = node.disabled === true;
  $: expanded = hasChildren && $expandedIdsSetStore.has(id);
  $: selected = $selectedIdsSetStore.has(id);
  $: icon = node.icon;

  // Flattened-row indent that matches what the recursive TreeViewNodeList
  // produces visually. In the recursive tree, each ancestor `<li>` contributes
  // its `.bx--tree-node` `padding-left: $spacing-05` (1rem) through nesting.
  // The leaf class adds `padding-left: $spacing-08` (2.5rem) or `$spacing-07`
  // (2rem) with an icon. We bake the same totals into a single inline value.
  $: leafBase = icon ? 2 : 2.5;
  $: indentRem = hasChildren ? depth + 1 : depth + leafBase;

  $: mergedNode = {
    ...node,
    expanded: hasChildren ? expanded : false,
    leaf: !hasChildren,
    selected,
  };
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<li
  data-tree-row-id={id}
  role="treeitem"
  {id}
  style:height="{itemHeight}px"
  style:padding-left="{indentRem}rem"
  tabindex={disabled ? undefined : isTabAnchor ? 0 : -1}
  aria-level={depth + 1}
  aria-posinset={posInSet}
  aria-setsize={setSize}
  aria-expanded={hasChildren ? expanded : undefined}
  aria-current={id === $activeNodeId || undefined}
  aria-selected={disabled ? undefined : selected}
  aria-disabled={disabled}
  class:bx--tree-node={true}
  class:bx--tree-parent-node={hasChildren}
  class:bx--tree-node--active={id === $activeNodeId}
  class:bx--tree-node--selected={selected}
  class:bx--tree-node--disabled={disabled}
  class:bx--tree-node--with-icon={icon}
  on:click|stopPropagation={(e) => {
    if (disabled) return;
    clickNode(mergedNode, e);
  }}
  on:focus={() => focusNode(mergedNode)}
>
  <div
    class:bx--tree-node__label={true}
    style:margin-left="-{indentRem}rem"
    style:padding-left="{indentRem}rem"
  >
    {#if hasChildren}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <span
        class:bx--tree-parent-node__toggle={true}
        {disabled}
        on:click={() => {
          if (disabled) return;
          expandNode(mergedNode, !expanded);
          toggleNode(mergedNode);
        }}
      >
        <CaretDown
          class={[
            "bx--tree-parent-node__toggle-icon",
            expanded && "bx--tree-parent-node__toggle-icon--expanded",
          ]
            .filter(Boolean)
            .join(" ")}
        />
      </span>
      <span class:bx--tree-node__label__details={true}>
        <svelte:component this={icon} class="bx--tree-node__icon" />
        <slot node={mergedNode}>{node.text}</slot>
      </span>
    {:else}
      <svelte:component this={icon} class="bx--tree-node__icon" />
      <slot node={mergedNode}>{node.text}</slot>
    {/if}
  </div>
</li>
