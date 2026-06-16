<script lang="ts">
  import SearchMenu from "carbon-components-svelte/SearchMenu/SearchMenu.svelte";
  import SearchMenuItem from "carbon-components-svelte/SearchMenu/SearchMenuItem.svelte";

  export let value = "";

  const items = ["Databases for TestSQL", "Data Store for Memcache"];
</script>

<SearchMenu bind:value labelText="Search" placeholder="Search...">
  {#each items as text (text)}
    <SearchMenuItem {text} let:segments>
      {#each segments as segment}
        {#if segment.match}
          <mark data-testid="mark">{segment.text}</mark>
        {:else}
          {segment.text}
        {/if}
      {/each}
    </SearchMenuItem>
  {/each}
</SearchMenu>
