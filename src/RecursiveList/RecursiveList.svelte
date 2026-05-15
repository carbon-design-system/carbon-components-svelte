<script>
  /**
   * @template {RecursiveListNode} [Node=RecursiveListNode]
   * @typedef {object} RecursiveListNode
   * @property {string} [text] - Node text content
   * @property {string} [href] - Node link URL
   * @property {string} [html] - Node HTML content
   * @property {RecursiveListNode[]} [nodes] - Child nodes
   * @restProps {ul | ol}
   */

  /**
   * Specify the nodes to render.
   * @type {ReadonlyArray<Node & { nodes?: Node[] }>}
   */
  export let nodes = [];

  /**
   * Specify the type of list to render.
   * @type {"unordered" | "ordered" | "ordered-native"}
   */
  export let type = "unordered";

  /** Set to `true` to use Carbon's expressive typesetting */
  export let expressive = false;

  import OrderedList from "../OrderedList/OrderedList.svelte";
  import UnorderedList from "../UnorderedList/UnorderedList.svelte";
  import RecursiveListItem from "./RecursiveListItem.svelte";
</script>

<svelte:component
  this={type === "unordered" ? UnorderedList : OrderedList}
  native={type === "ordered-native"}
  {expressive}
  {...$$restProps}
>
  {#each nodes as child}
    {#if Array.isArray(child.nodes)}
      <RecursiveListItem {...child}>
        <svelte:self {...child} {type} {expressive} nested />
      </RecursiveListItem>
    {:else}
      <RecursiveListItem {...child} />
    {/if}
  {/each}
</svelte:component>
