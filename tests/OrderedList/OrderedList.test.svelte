<script lang="ts">
  import { ListItem, OrderedList } from "carbon-components-svelte";

  export let nested = false;
  export let native = false;
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

<div data-testid="list-wrapper">
  <OrderedList
    {nested}
    {native}
    {expressive}
    on:click={(e) => onclick?.(e)}
    on:mouseover={(e) => onmouseover?.(e)}
    on:mouseenter={(e) => onmouseenter?.(e)}
    on:mouseleave={(e) => onmouseleave?.(e)}
  >
    {#each items as item}
      <ListItem>
        {item}
        {#if nested && nestedItems.length > 0}
          <OrderedList nested>
            {#each nestedItems as nestedItem}
              <ListItem>{nestedItem}</ListItem>
            {/each}
          </OrderedList>
        {/if}
      </ListItem>
    {/each}
  </OrderedList>
</div>
