<script context="module">
  /**
   * Computes the depth of a tree leaf node relative to <ul role="tree" />.
   * Returns the depth of the node (0-based, where 0 is the root level).
   * @type {(node: HTMLLIElement | null) => number}
   * @example
   * ```svelte
   * import { computeTreeLeafDepth } from 'carbon-components-svelte/TreeView/TreeViewNode.svelte';
   * let nodeElement;
   * $: depth = computeTreeLeafDepth(nodeElement);
   *
   * <li bind:this={nodeElement}>Node at depth {depth}</li>
   * ```
   */
  export function computeTreeLeafDepth(node) {
    let depth = 0;

    if (node == null) return depth;

    // Count the node itself if it's an LI
    if (node instanceof HTMLElement && node.tagName === "LI") {
      depth++;
    }

    let parentNode = node.parentNode;

    while (
      parentNode != null &&
      parentNode instanceof HTMLElement &&
      parentNode.getAttribute("role") !== "tree"
    ) {
      if (parentNode.tagName === "LI") depth++;
      parentNode = parentNode.parentNode;
    }

    return depth;
  }

  /**
   * Finds the nearest parent tree node
   * @type {(node: HTMLElement | null) => null | HTMLElement}
   */
  export function findParentTreeNode(node) {
    if (node == null || !(node instanceof HTMLElement)) return null;
    if (node.classList.contains("bx--tree-parent-node")) return node;
    if (node.classList.contains("bx--tree-node-link-parent")) {
      return node.firstElementChild;
    }
    if (node.classList.contains("bx--tree")) return null;
    if (node.parentNode instanceof HTMLElement) {
      return findParentTreeNode(node.parentNode);
    }
    return null;
  }
</script>

<script>
  /**
   * @generics {Node extends TreeNode<any> = TreeNode<any>, Icon = any} Node,Icon
   * @typedef {import('./TreeView.svelte').TreeNode<Id>} TreeNode<Id=(string|number)>
   * @slot {{ node: Node & { expanded: false; leaf: boolean; selected: boolean; } }}
   */

  export let leaf = false;

  /** @type {Node["id"]} */
  export let id = "";
  export let text = "";
  export let disabled = false;

  /** 1-based `aria-level` of this node within the tree. */
  export let level = 1;
  /** 1-based `aria-posinset` of this node among its siblings. */
  export let posinset = 1;
  /** `aria-setsize` — the number of siblings (including this node). */
  export let setsize = 1;

  /**
   * Specify the URL the TreeNode links to.
   * @type {string | undefined}
   */
  export let href = undefined;

  /**
   * Specify the link target.
   * @type {string | undefined}
   */
  export let target = undefined;

  /**
   * Specify the icon to render.
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (undefined);

  import { getContext } from "svelte";
  import Checkbox from "../Checkbox/Checkbox.svelte";

  let ref = null;
  let refLabel = null;
  let prevActiveId = undefined;

  const {
    activeNodeId,
    selectedIdsSetStore,
    indeterminateIdsSetStore,
    selectionModeStore,
    clickNode,
    selectNode,
    focusNode,
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
    return computeTreeLeafDepth(refLabel) - 1 + (leaf && icon ? 2 : 2.5);
  }

  $: selected = $selectedIdsSetStore.has(id);
  // Link rows navigate instead of selecting, so they render no checkbox.
  $: isCheckboxMode = $selectionModeStore === "checkbox" && href === undefined;
  $: indeterminate = isCheckboxMode && $indeterminateIdsSetStore.has(id);
  // Merge all props (including custom properties) with computed properties
  // Explicitly include disabled to ensure it's always present (has default value)
  // `level`/`posinset`/`setsize` are layout-only (drive `aria-*` attributes) and excluded from `node`.
  $: ({
    level: _level,
    posinset: _posinset,
    setsize: _setsize,
    ...restProps
  } = $$props);
  $: node = {
    ...restProps,
    disabled, // Ensure disabled is always included (has default value)
    expanded: false, // A node cannot be expanded.
    leaf,
    selected,
  };
  $: {
    if (
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

{#if href}
  <li role="none">
    <!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role a11y-role-has-required-aria-props -->
    <a
      bind:this={ref}
      role="treeitem"
      {id}
      href={disabled ? undefined : href}
      target={disabled ? undefined : target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      tabindex={disabled ? undefined : -1}
      aria-current={id === $activeNodeId ? "page" : undefined}
      aria-disabled={disabled}
      aria-level={level}
      aria-posinset={posinset}
      aria-setsize={setsize}
      class:bx--tree-node={true}
      class:bx--tree-leaf-node={true}
      class:bx--tree-node--active={id === $activeNodeId}
      class:bx--tree-node--selected={selected}
      class:bx--tree-node--disabled={disabled}
      class:bx--tree-node--with-icon={icon}
      on:click|stopPropagation={(event) => {
        if (disabled) return;
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

        if (event.key === "ArrowLeft") {
          const parentNode = findParentTreeNode(ref.parentNode?.parentNode);
          if (parentNode) parentNode.focus();
        }

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          if (disabled) return;
          clickNode(node, event);
        }
      }}
      on:focus={() => {
        focusNode(node);
      }}
    >
      <div bind:this={refLabel} class:bx--tree-node__label={true}>
        <svelte:component this={icon} class="bx--tree-node__icon" />
        <slot {node}> {text} </slot>
      </div>
    </a>
  </li>
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
      ? toAriaChecked(selected, indeterminate)
      : undefined}
    aria-disabled={disabled}
    aria-level={level}
    aria-posinset={posinset}
    aria-setsize={setsize}
    class:bx--tree-node={true}
    class:bx--tree-leaf-node={true}
    class:bx--tree-node--active={id === $activeNodeId}
    class:bx--tree-node--selected={selected}
    class:bx--tree-node--disabled={disabled}
    class:bx--tree-node--with-icon={icon}
    on:click|stopPropagation={(event) => {
      if (disabled) return;
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

      if (event.key === "ArrowLeft") {
        const parentNode = findParentTreeNode(ref.parentNode);
        if (parentNode) parentNode.focus();
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (disabled) return;
        clickNode(node, event);
      }
    }}
    on:focus={() => {
      focusNode(node);
    }}
  >
    <div bind:this={refLabel} class:bx--tree-node__label={true}>
      {#if isCheckboxMode}
        <!-- The row owns the checked-state semantics, so the input is
             decorative and its label is empty to keep `textContent` (used by
             type-ahead and accessible names) unchanged. -->
        <Checkbox
          decorative
          hideLabel
          labelText=""
          {disabled}
          {indeterminate}
          checked={selected}
        />
      {/if}
      <svelte:component this={icon} class="bx--tree-node__icon" />
      <slot {node}> {text} </slot>
    </div>
  </li>
{/if}
