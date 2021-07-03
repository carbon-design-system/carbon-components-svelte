<script>
  /**
   * @typedef {{ text?: string; href?: string; html?: string; }} RecursiveListNode
   * @restProps {ul | ol}
   */

  /**
   * Specify the children to render
   * @type {Array<RecursiveListNode & { children?: RecursiveListNode[]; }>}
   */
  export let children = [];

  /**
   * Specify the type of list to render
   * @type {"unordered" | "ordered" | "ordered-native"}
   */
  export let type = "unordered";

  import UnorderedList from "../UnorderedList/UnorderedList.svelte";
  import OrderedList from "../OrderedList/OrderedList.svelte";
  import RecursiveListItem from "./RecursiveListItem.svelte";
</script>

<svelte:component
  this="{type === 'unordered' ? UnorderedList : OrderedList}"
  native="{type === 'ordered-native'}"
  {...$$restProps}
>
  {#each children as child}
    {#if Array.isArray(child.children)}
      <RecursiveListItem {...child}>
        <svelte:self {...child} type="{type}" nested />
      </RecursiveListItem>
    {:else}
      <RecursiveListItem {...child} />
    {/if}
  {/each}
</svelte:component>
