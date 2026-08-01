<script>
  /**
   * @generics {Id extends string | number = string | number, Icon = any} Id,Icon
   * @typedef {{ id: Id; text: string; disabled?: boolean; expanded?: boolean; }} TreeNode<Id>
   * @slot {{ node: TreeNode<Id> & { expanded: boolean; leaf: boolean; selected: boolean; checked: boolean; indeterminate: boolean; } }}
   * @slot {{ node: TreeNode<Id> & { expanded: boolean; leaf: boolean; selected: boolean; checked: boolean; indeterminate: boolean; } }} childNodes
   */

  /** @type {ReadonlyArray<TreeNode<Id> & { nodes?: TreeNode<Id>[] }>} */
  export let nodes = [];
  export let root = false;

  /** @type {Id} */
  export let id = "";
  export let text = "";
  export let disabled = false;

  /** 1-based `aria-level` of this node within the tree. */
  export let level = 1;
  /** 1-based `aria-posinset` of this node among its siblings. */
  export let posinset = 1;
  /** `aria-setsize` — the number of siblings (including this node). */
  export let setsize = 1;

  /** Whether this node has children that have not been loaded yet. */
  export let hasChildren = false;

  /**
   * Specify the icon to render.
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (undefined);

  import { getContext } from "svelte";
  import Checkbox from "../Checkbox/Checkbox.svelte";
  import CaretDown from "../icons/CaretDown.svelte";
  import TreeViewNode, {
    computeTreeLeafDepth,
    findParentTreeNode,
  } from "./TreeViewNode.svelte";
  // `<svelte:fragment>` (used to forward the `childNodes` slot without adding
  // a DOM wrapper) can only target a `Component`, not `<svelte:self>` — so
  // this recurses via a self-import instead.
  import Self from "./TreeViewNodeList.svelte";

  /**
   * First focusable tree item in a subtree `ul` — handles both bare
   * `li.bx--tree-node` rows and the link variant (`li[role="none"] > a`).
   * @returns {HTMLElement | null}
   */
  function firstTreeItemInGroup(groupUl) {
    const row = groupUl.firstElementChild;
    if (!(row instanceof HTMLElement)) return null;
    if (row.classList.contains("bx--tree-node")) return row;
    const nested = row.querySelector(".bx--tree-node");
    return nested instanceof HTMLElement ? nested : null;
  }

  let ref = null;
  let refLabel = null;
  let prevActiveId = undefined;

  const {
    treeId,
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

  function offset() {
    const depth = computeTreeLeafDepth(refLabel) - 1;

    // Checkbox is the leading element; use one inset per depth. The
    // leaf/icon offsets below align text with a parent's caret and would
    // shift the checkboxes instead.
    if (isCheckboxMode) return depth + 1;
    if (parent) return depth + 1;
    if (icon) return depth + 2;
    return depth + 2.5;
  }

  $: parent = Array.isArray(nodes);
  $: expanded = $expandedIdsSetStore.has(id);
  $: selected = $selectedIdsSetStore.has(id);
  $: checked = $checkedIdsSetStore.has(id);
  $: isCheckboxMode = $selectionModeStore === "checkbox";
  $: indeterminate = isCheckboxMode && $indeterminateIdsSetStore.has(id);
  // Merge all props (including custom properties) with computed properties
  // Explicitly reference text and disabled to avoid Svelte warning and ensure they're included
  // `level`/`posinset`/`setsize` are layout-only (drive `aria-*` attributes) and excluded from `node`.
  $: ({
    level: _level,
    posinset: _posinset,
    setsize: _setsize,
    ...restProps
  } = $$props);
  $: node = {
    ...restProps,
    text, // Ensure text is included and marked as used
    disabled, // Ensure disabled is always included (has default value)
    hasChildren, // Ensure hasChildren is always included (has default value)
    expanded,
    leaf: !parent,
    selected,
    checked,
    indeterminate,
  };
  $: {
    // The root list is a non-selectable wrapper; its default empty `id` would
    // otherwise match the default empty `activeId` and select a phantom node.
    if (
      !root &&
      id === $activeNodeId &&
      prevActiveId !== $activeNodeId &&
      !$selectedIdsSetStore.has(id)
    )
      selectNode(node);

    prevActiveId = $activeNodeId;
  }
  $: if (refLabel) {
    refLabel.style.marginLeft = `-${offset()}rem`;
    refLabel.style.paddingLeft = `${offset()}rem`;
  }
</script>

{#if root}
  {#each nodes as child, index (child.id)}
    {#if Array.isArray(child.nodes) || child.hasChildren}
      <Self
        {...child}
        level={1}
        posinset={index + 1}
        setsize={nodes.length}
        let:node
      >
        <slot {node} />
        <svelte:fragment slot="childNodes" let:node>
          <slot name="childNodes" {node} />
        </svelte:fragment>
      </Self>
    {:else}
      <TreeViewNode
        leaf
        {...child}
        level={1}
        posinset={index + 1}
        setsize={nodes.length}
        let:node
      >
        <slot {node} />
      </TreeViewNode>
    {/if}
  {/each}
{:else}
  <!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
  <li
    bind:this={ref}
    role="treeitem"
    {id}
    tabindex={disabled ? undefined : -1}
    aria-current={id === $activeNodeId || undefined}
    aria-selected={isCheckboxMode || disabled ? undefined : selected}
    aria-checked={isCheckboxMode
      ? toAriaChecked(checked, indeterminate)
      : undefined}
    aria-disabled={disabled}
    class:bx--tree-node={true}
    class:bx--tree-parent-node={true}
    class:bx--tree-node--active={id === $activeNodeId}
    class:bx--tree-node--selected={isCheckboxMode ? checked : selected}
    class:bx--tree-node--disabled={disabled}
    class:bx--tree-node--with-icon={icon}
    aria-expanded={expanded}
    aria-owns="{treeId}-{id}-subtree"
    aria-level={level}
    aria-posinset={posinset}
    aria-setsize={setsize}
    on:click|stopPropagation={(event) => {
      if (disabled) return;
      // Stop the label from toggling the decorative input; `clickNode`
      // owns checked state.
      if (isCheckboxMode) event.preventDefault();
      clickNode(node, event);
    }}
    on:keydown={(event) => {
      if (
        event.key === "ArrowUp" ||
        event.key === "ArrowDown" ||
        event.key === "Home" ||
        event.key === "End"
      ) {
        event.preventDefault();
      }

      if (
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight" ||
        event.key === "Enter"
      ) {
        event.preventDefault();
        event.stopPropagation();
      }

      if (parent && event.key === "ArrowLeft") {
        if (expanded) {
          expandNode(node, false);
          toggleNode(node);
        } else {
          const parentNode = findParentTreeNode(ref.parentElement);
          if (parentNode instanceof HTMLElement) parentNode.focus();
        }
      }

      if (parent && event.key === "ArrowRight") {
        if (expanded) {
          const groupUl = ref.lastElementChild;
          if (groupUl instanceof HTMLElement) {
            const next = firstTreeItemInGroup(groupUl);
            next?.focus();
          }
        } else {
          expandNode(node, true);
          toggleNode(node);
        }
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (disabled) return;
        if (event.key === "Enter" && parent) {
          const nextExpanded = !expanded;
          expandNode(node, nextExpanded);
          toggleNode(node);
        }
        clickNode(node, event);
        ref.focus();
      }
    }}
    on:focus={() => {
      focusNode(node);
    }}
  >
    <div class:bx--tree-node__label={true} bind:this={refLabel}>
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
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <span
        class:bx--tree-parent-node__toggle={true}
        {disabled}
        on:click={() => {
          if (disabled) return;
          const nextExpanded = !expanded;
          expandNode(node, nextExpanded);
          toggleNode(node);
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
        <span id="{treeId}-{id}__label" class:bx--tree-node__label__text={true}>
          <slot {node} />
        </span>
      </span>
    </div>
    <ul
      id="{treeId}-{id}-subtree"
      role="group"
      aria-labelledby="{treeId}-{id}__label"
      class:bx--tree-node__children={true}
      class:bx--tree-node--hidden={!expanded}
    >
      {#if hasChildren && nodes.length === 0}
        <slot name="childNodes" {node} />
      {:else}
        {#each nodes as child, index (child.id)}
          {#if Array.isArray(child.nodes) || child.hasChildren}
            <Self
              {...child}
              level={level + 1}
              posinset={index + 1}
              setsize={nodes.length}
              let:node
            >
              <slot {node} />
              <svelte:fragment slot="childNodes" let:node>
                <slot name="childNodes" {node} />
              </svelte:fragment>
            </Self>
          {:else}
            <TreeViewNode
              leaf
              {...child}
              level={level + 1}
              posinset={index + 1}
              setsize={nodes.length}
              let:node
            >
              <slot {node}>{node.text}</slot>
            </TreeViewNode>
          {/if}
        {/each}
      {/if}
    </ul>
  </li>
{/if}
