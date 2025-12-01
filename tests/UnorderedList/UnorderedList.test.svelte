<script lang="ts">
  import { ListItem, UnorderedList } from "carbon-components-svelte";

  export let nested = false;
  export let expressive = false;
  export let items: string[] = ["Item 1", "Item 2", "Item 3"];
  export let nestedItems: string[] = [];
  export let onclick: ((event: MouseEvent) => void) | undefined = undefined;
  export let onmouseover: ((event: MouseEvent) => void) | undefined = undefined;
  export let onmouseenter: ((event: MouseEvent) => void) | undefined =
    undefined;
  export let onmouseleave: ((event: MouseEvent) => void) | undefined =
    undefined;
</script>

<UnorderedList
  {nested}
  {expressive}
  on:click={onclick}
  on:mouseover={onmouseover}
  on:mouseenter={onmouseenter}
  on:mouseleave={onmouseleave}
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
