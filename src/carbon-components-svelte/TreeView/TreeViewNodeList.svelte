<script>
  /**
   * @typedef {string | number} TreeNodeId
   * @typedef {{ id: TreeNodeId; text: string; disabled?: boolean; expanded?: boolean; }} TreeNode
   */

  /** @type {Array<TreeNode & { children?: TreeNode[] }>} */
  export let children = [];
  export let root = false;

  /** @type {string | number} */
  export let id = "";
  export let text = "";
  export let disabled = false;

  /**
   * Specify the icon to render
   * @type {typeof import("svelte").SvelteComponent}
   */
  export let icon = undefined;

  import { afterUpdate, getContext } from "svelte";
  import CaretDown from "../icons/CaretDown.svelte";
  import TreeViewNode, { computeTreeLeafDepth } from "./TreeViewNode.svelte";

  let ref = null;
  let refLabel = null;
  let prevActiveId = undefined;

  const {
    activeNodeId,
    selectedNodeIds,
    expandedNodeIds,
    clickNode,
    selectNode,
    expandNode,
    focusNode,
    toggleNode,
  } = getContext("TreeView");

  const offset = () => {
    const depth = computeTreeLeafDepth(refLabel);

    if (parent) return depth + 1;
    if (icon) return depth + 2;
    return depth + 2.5;
  };

  afterUpdate(() => {
    if (id === $activeNodeId && prevActiveId !== $activeNodeId) {
      if (!$selectedNodeIds.includes(id)) selectNode(node);
    }

    prevActiveId = $activeNodeId;
  });

  $: parent = Array.isArray(children);
  $: node = { id, text, expanded, leaf: !parent };
  $: if (refLabel) {
    refLabel.style.marginLeft = `-${offset()}rem`;
    refLabel.style.paddingLeft = `${offset()}rem`;
  }
  $: expanded = $expandedNodeIds.includes(id);
</script>

{#if root}
  {#each children as child (child.id)}
    {#if Array.isArray(child.children)}
      <svelte:self {...child} />
    {:else}
      <TreeViewNode leaf {...child} />
    {/if}
  {/each}
{:else}
  <li
    bind:this="{ref}"
    role="treeitem"
    id="{id}"
    tabindex="{disabled ? undefined : -1}"
    aria-current="{id === $activeNodeId || undefined}"
    aria-selected="{disabled ? undefined : $selectedNodeIds.includes(id)}"
    aria-disabled="{disabled}"
    class:bx--tree-node="{true}"
    class:bx--tree-parent-node="{true}"
    class:bx--tree-node--active="{id === $activeNodeId}"
    class:bx--tree-node--selected="{$selectedNodeIds.includes(id)}"
    class:bx--tree-node--disabled="{disabled}"
    class:bx--tree-node--with-icon="{icon}"
    aria-expanded="{expanded}"
    on:click|stopPropagation="{() => {
      if (disabled) return;
      clickNode(node);
    }}"
    on:keydown="{(e) => {
      if (
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight' ||
        e.key === 'Enter'
      ) {
        e.stopPropagation();
      }

      if (parent && e.key === 'ArrowLeft') {
        expanded = false;
        expandNode(node, false);
        toggleNode(node);
      }

      if (parent && e.key === 'ArrowRight') {
        if (expanded) {
          ref.lastChild.firstElementChild?.focus();
        } else {
          expanded = true;
          expandNode(node, true);
          toggleNode(node);
        }
      }

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (disabled) return;
        expanded = !expanded;
        toggleNode(node);
        clickNode(node);
        expandNode(node, expanded);
        ref.focus();
      }
    }}"
    on:focus="{() => {
      focusNode(node);
    }}"
  >
    <div class:bx--tree-node__label="{true}" bind:this="{refLabel}">
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <span
        class:bx--tree-parent-node__toggle="{true}"
        disabled="{disabled}"
        on:click="{() => {
          if (disabled) return;
          expanded = !expanded;
          expandNode(node, expanded);
          toggleNode(node);
        }}"
      >
        <CaretDown
          class="bx--tree-parent-node__toggle-icon {expanded &&
            'bx--tree-parent-node__toggle-icon--expanded'}"
        />
      </span>
      <span class:bx--tree-node__label__details="{true}">
        <svelte:component this="{icon}" class="bx--tree-node__icon" />
        {text}
      </span>
    </div>
    {#if expanded}
      <ul role="group" class:bx--tree-node__children="{true}">
        {#each children as child (child.id)}
          {#if Array.isArray(child.children)}
            <svelte:self {...child} />
          {:else}
            <TreeViewNode leaf {...child} />
          {/if}
        {/each}
      </ul>
    {/if}
  </li>
{/if}
