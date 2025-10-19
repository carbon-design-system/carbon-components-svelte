<script lang="ts">
  import { UnorderedList, ListItem } from "carbon-components-svelte";

  export let nested = false;
  export let expressive = false;
  export let items: string[] = ["Item 1", "Item 2", "Item 3"];
  export let nestedItems: string[] = [];
  export let onclick: ((e: MouseEvent) => void) | undefined = undefined;
  export let onmouseover: ((e: MouseEvent) => void) | undefined = undefined;
  export let onmouseenter: ((e: MouseEvent) => void) | undefined = undefined;
  export let onmouseleave: ((e: MouseEvent) => void) | undefined = undefined;
</script>

<UnorderedList
  {nested}
  {expressive}
  {onclick}
  {onmouseover}
  {onmouseenter}
  {onmouseleave}
>
  {#each items as item}
    <ListItem>
      {item}
      {#if nested && nestedItems.length > 0}
        <UnorderedList nested>
          {#each nestedItems as nestedItem}
            <ListItem>{nestedItem}</ListItem>
          {/each}
        </UnorderedList>
      {/if}
    </ListItem>
  {/each}
</UnorderedList>
