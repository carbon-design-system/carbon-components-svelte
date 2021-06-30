<script>
  /**
   * @typedef {{ text?: string; href?: string; html?: string; }} Item
   * @type {Array<Item & { items?: Item[]; }>}
   */

  /**
   * Specify the items to render
   * @type {Array<Item & { items?: Item[]; }>}
   */
  export let items = [];

  /**
   * Specify the type of list to render
   * @type {"unordered" | "ordered" | "ordered-native"}
   */
  export let type = "unordered";

  /** Set to `true` to use the nested variant */
  export let nested = false;

  import UnorderedList from "../UnorderedList/UnorderedList.svelte";
  import OrderedList from "../OrderedList/OrderedList.svelte";
  import ListItem from "./RecursiveListItem.svelte";
</script>

<svelte:component
  this="{type === 'unordered' ? UnorderedList : OrderedList}"
  native="{type === 'ordered-native'}"
  nested="{nested}"
  {...$$restProps}
>
  {#each items as item}
    {#if Array.isArray(item.items)}
      <ListItem {...item}>
        <svelte:self {...item} type="{type}" nested />
      </ListItem>
    {:else}
      <ListItem {...item} />
    {/if}
  {/each}
</svelte:component>
