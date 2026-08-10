<script>
  /**
   * Flat-row renderer used by `<TreeView virtualize>`. Consumes the same
   * `carbon:TreeView` context as TreeViewNode / TreeViewNodeList so all
   * selection / expansion / focus / checkbox callbacks behave identically.
   *
   * @typedef {object} Row
   * @property {{ id: string | number; text?: any; icon?: any; disabled?: boolean; href?: string; target?: string; nodes?: any[] }} node
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
  import Checkbox from "../Checkbox/Checkbox.svelte";
  import CaretDown from "../icons/CaretDown.svelte";

  const {
    activeNodeId,
    selectedIdsSetStore,
    checkedIdsSetStore,
    expandedIdsSetStore,
    indeterminateIdsSetStore,
    selectionModeStore,
    clickNode,
    selectNode,
    expandNode,
    focusNode,
    toggleNode,
  } = getContext("carbon:TreeView");

  /**
   * Tri-state value for `aria-checked` on the row.
   * @returns {"true" | "false" | "mixed"}
   */
  function toAriaChecked(isSelected, isIndeterminate) {
    if (isIndeterminate) return "mixed";
    return isSelected ? "true" : "false";
  }

  let prevActiveId = undefined;

  $: ({ node, depth, posInSet, setSize, hasChildren } = item);
  $: id = node.id;
  $: disabled = node.disabled === true;
  $: href = node.href;
  $: target = node.target;
  $: expanded = hasChildren && $expandedIdsSetStore.has(id);
  $: selected = $selectedIdsSetStore.has(id);
  $: checked = $checkedIdsSetStore.has(id);
  // Link rows navigate; they render no checkbox (same as TreeViewNode).
  $: isCheckboxMode =
    $selectionModeStore === "checkbox" && node.href === undefined;
  $: indeterminate = isCheckboxMode && $indeterminateIdsSetStore.has(id);
  $: icon = node.icon;
  $: isLinkLeaf = href !== undefined && !hasChildren;

  // Flattened-row indent that matches what the recursive TreeViewNodeList
  // produces visually. In the recursive tree, each ancestor `<li>` contributes
  // its `.bx--tree-node` `padding-left: $spacing-05` (1rem) through nesting.
  // The leaf class adds `padding-left: $spacing-08` (2.5rem) or `$spacing-07`
  // (2rem) with an icon. Checkbox mode uses one inset per depth so the
  // leading control lines up across parents and leaves.
  $: leafBase = icon ? 2 : 2.5;
  $: indentRem = isCheckboxMode || hasChildren ? depth + 1 : depth + leafBase;

  $: mergedNode = {
    ...node,
    expanded: hasChildren ? expanded : false,
    leaf: !hasChildren,
    selected,
    checked,
    indeterminate,
  };

  // Match TreeViewNode: externally-set activeId auto-selects the row.
  $: {
    if (
      id === $activeNodeId &&
      prevActiveId !== $activeNodeId &&
      !$selectedIdsSetStore.has(id)
    )
      selectNode(mergedNode);

    prevActiveId = $activeNodeId;
  }
</script>

{#if isLinkLeaf}
  <li role="none" style:height="{itemHeight}px">
    <!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role a11y-role-has-required-aria-props -->
    <a
      data-tree-row-id={id}
      role="treeitem"
      {id}
      href={disabled ? undefined : href}
      target={disabled ? undefined : target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      style:padding-left="{indentRem}rem"
      tabindex={disabled ? undefined : isTabAnchor ? 0 : -1}
      aria-level={depth + 1}
      aria-posinset={posInSet}
      aria-setsize={setSize}
      aria-current={id === $activeNodeId ? "page" : undefined}
      aria-selected={disabled ? undefined : selected}
      aria-disabled={disabled}
      class:bx--tree-node={true}
      class:bx--tree-leaf-node={true}
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
        <svelte:component this={icon} class="bx--tree-node__icon" />
        <slot node={mergedNode}>{node.text}</slot>
      </div>
    </a>
  </li>
{:else}
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
    aria-selected={isCheckboxMode || disabled ? undefined : selected}
    aria-checked={isCheckboxMode
      ? toAriaChecked(checked, indeterminate)
      : undefined}
    aria-disabled={disabled}
    class:bx--tree-node={true}
    class:bx--tree-parent-node={hasChildren}
    class:bx--tree-leaf-node={!hasChildren}
    class:bx--tree-node--active={id === $activeNodeId}
    class:bx--tree-node--selected={isCheckboxMode ? checked : selected}
    class:bx--tree-node--disabled={disabled}
    class:bx--tree-node--with-icon={icon}
    on:click|stopPropagation={(e) => {
      if (disabled) return;
      // Stop the label from toggling the decorative input; `clickNode`
      // owns checked state.
      if (isCheckboxMode) e.preventDefault();
      clickNode(mergedNode, e);
    }}
    on:focus={() => focusNode(mergedNode)}
  >
    <div
      class:bx--tree-node__label={true}
      style:margin-left="-{indentRem}rem"
      style:padding-left="{indentRem}rem"
    >
      {#if isCheckboxMode}
        <!-- Decorative input; empty label keeps row textContent stable for type-ahead. -->
        <Checkbox
          decorative
          hideLabel
          labelText=""
          {disabled}
          {indeterminate}
          {checked}
        />
      {/if}
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
{/if}
