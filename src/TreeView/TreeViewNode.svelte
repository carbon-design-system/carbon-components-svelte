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
   * @param {HTMLElement | null} node
   * @returns {null | HTMLElement}
   */
  function findParentTreeNode(node) {
    if (node == null || !(node instanceof HTMLElement)) return null;
    if (node.classList.contains("bx--tree-parent-node")) return node;
    if (node.classList.contains("bx--tree")) return null;
    if (node.parentNode instanceof HTMLElement) {
      return findParentTreeNode(node.parentNode);
    }
    return null;
  }
</script>

<script>
  /**
   * @generics {Node extends TreeNode<any> = TreeNode<any>} Node
   * @template {TreeNode<any>} Node
   * @typedef {import('./TreeView.svelte').TreeNode<Id>} TreeNode<Id=(string|number)>
   * @slot {{ node: Node & { expanded: false; leaf: boolean; selected: boolean; } }}
   */

  export let leaf = false;

  /** @type {Node["id"]} */
  export let id = "";
  export let text = "";
  export let disabled = false;

  /**
   * Specify the icon to render.
   * @type {any}
   */
  export let icon = undefined;

  import { afterUpdate, getContext } from "svelte";

  let ref = null;
  let refLabel = null;
  let prevActiveId = undefined;

  const {
    activeNodeId,
    selectedIdsSetStore,
    clickNode,
    selectNode,
    focusNode,
  } = getContext("carbon:TreeView");
  const offset = () =>
    computeTreeLeafDepth(refLabel) + (leaf && icon ? 2 : 2.5);

  afterUpdate(() => {
    if (id === $activeNodeId && prevActiveId !== $activeNodeId) {
      if (!$selectedIdsSetStore.has(id)) selectNode(node);
    }

    prevActiveId = $activeNodeId;
  });

  $: selected = $selectedIdsSetStore.has(id);
  // Merge all props (including custom properties) with computed properties
  // Explicitly include disabled to ensure it's always present (has default value)
  $: node = {
    ...$$props,
    disabled, // Ensure disabled is always included (has default value)
    expanded: false, // A node cannot be expanded.
    leaf,
    selected,
  };
  $: if (refLabel) {
    refLabel.style.marginLeft = `-${offset()}rem`;
    refLabel.style.paddingLeft = `${offset()}rem`;
  }
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
<li
  bind:this={ref}
  role="treeitem"
  {id}
  tabindex={disabled ? undefined : -1}
  aria-current={id === $activeNodeId || undefined}
  aria-selected={disabled ? undefined : selected}
  aria-disabled={disabled}
  class:bx--tree-node={true}
  class:bx--tree-leaf-node={true}
  class:bx--tree-node--active={id === $activeNodeId}
  class:bx--tree-node--selected={selected}
  class:bx--tree-node--disabled={disabled}
  class:bx--tree-node--with-icon={icon}
  on:click|stopPropagation={() => {
    if (disabled) return;
    clickNode(node);
  }}
  on:keydown={(e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "Enter") {
      e.stopPropagation();
    }

    if (e.key === "ArrowLeft") {
      const parentNode = findParentTreeNode(ref.parentNode);
      if (parentNode) parentNode.focus();
    }

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (disabled) return;
      clickNode(node);
    }
  }}
  on:focus={() => {
    focusNode(node);
  }}
>
  <div bind:this={refLabel} class:bx--tree-node__label={true}>
    <svelte:component this={icon} class="bx--tree-node__icon" />
    <slot {node}>
      {text}
    </slot>
  </div>
</li>
