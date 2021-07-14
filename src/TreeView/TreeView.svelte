<script>
  /**
   * @typedef {string | number} TreeNodeId
   * @typedef {{ id: TreeNodeId; text: string; icon?: typeof import("carbon-icons-svelte").CarbonIcon; disabled?: boolean; expanded?: boolean; }} TreeNode
   * @event {TreeNode & { expanded: boolean; leaf: boolean; }} select
   * @event {TreeNode & { expanded: boolean; leaf: boolean; }} toggle
   * @event {TreeNode & { expanded: boolean; leaf: boolean; }} focus
   */

  /**
   * Provide an array of children nodes to render
   * @type {Array<TreeNode & { children?: TreeNode[] }>}
   */
  export let children = [];

  /**
   * Set the current active node id
   * Only one node can be active
   * @type {TreeNodeId}
   */
  export let activeId = "";

  /**
   * Set the node ids to be selected
   * @type {TreeNodeId[]}
   */
  export let selectedIds = [];

  /**
   * Specify the TreeView size
   * @type {"default" | "compact"}
   */
  export let size = "default";

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  import { createEventDispatcher, setContext, onMount } from "svelte";
  import { writable } from "svelte/store";
  import TreeViewNodeList from "./TreeViewNodeList.svelte";

  const dispatch = createEventDispatcher();
  const labelId = `label-${Math.random().toString(36)}`;
  const activeNodeId = writable(activeId);
  const selectedNodeIds = writable(selectedIds);

  let ref = null;
  let treeWalker = null;

  setContext("TreeView", {
    activeNodeId,
    selectedNodeIds,
    clickNode: (node) => {
      activeId = node.id;
      selectedIds = [node.id];
      dispatch("select", node);
    },
    selectNode: (node) => {
      selectedIds = [node.id];
    },
    focusNode: (node) => dispatch("focus", node),
    toggleNode: (node) => dispatch("toggle", node),
  });

  function handleKeyDown(e) {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault();

    treeWalker.currentNode = e.target;

    let node = null;

    if (e.key === "ArrowUp") node = treeWalker.previousNode();
    if (e.key === "ArrowDown") node = treeWalker.nextNode();
    if (node && node !== e.target) {
      node.tabIndex = "0";
      node.focus();
    }
  }

  onMount(() => {
    if ($activeNodeId === "") {
      const firstFocusableNode = ref.querySelector(
        "li.bx--tree-node:not(.bx--tree-node--disabled)"
      );

      if (firstFocusableNode != null) {
        firstFocusableNode.tabIndex = "0";
      }
    }
  });

  $: activeNodeId.set(activeId);
  $: selectedNodeIds.set(selectedIds);
  $: if (ref) {
    treeWalker = document.createTreeWalker(ref, NodeFilter.SHOW_ELEMENT, {
      acceptNode: (node) => {
        if (node.classList.contains("bx--tree-node--disabled"))
          return NodeFilter.FILTER_REJECT;
        if (node.matches("li.bx--tree-node")) return NodeFilter.FILTER_ACCEPT;
        return NodeFilter.FILTER_SKIP;
      },
    });
  }
</script>

{#if !hideLabel}
  <!-- svelte-ignore a11y-label-has-associated-control -->
  <label id="{labelId}" class:bx--label="{true}">
    <slot name="labelText">{labelText}</slot>
  </label>
{/if}

<ul
  {...$$restProps}
  role="tree"
  bind:this="{ref}"
  class:bx--tree="{true}"
  class:bx--tree--default="{size === 'default'}"
  class:bx--tree--compact="{size === 'compact'}"
  aria-label="{hideLabel ? labelText : undefined}"
  aria-labelledby="{!hideLabel ? labelId : undefined}"
  aria-multiselectable="{selectedIds.length > 1 || undefined}"
  on:keydown
  on:keydown|stopPropagation="{handleKeyDown}"
>
  <TreeViewNodeList root children="{children}" />
</ul>
