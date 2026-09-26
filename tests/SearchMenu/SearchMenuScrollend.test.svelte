<script lang="ts">
  import SearchMenu from "carbon-components-svelte/SearchMenu/SearchMenu.svelte";
  import SearchMenuItem from "carbon-components-svelte/SearchMenu/SearchMenuItem.svelte";

  export let items: string[] = [];
  export let onScrollend: (
    e: CustomEvent<{
      scrollTop: number;
      scrollHeight: number;
      clientHeight: number;
    }>,
  ) => void = () => {};
</script>

<SearchMenu
  portal={false}
  placeholder="Search..."
  labelText="Search"
  on:scrollend={onScrollend}
>
  {#each items as text (text)}
    <SearchMenuItem {text} />
  {/each}
</SearchMenu>
