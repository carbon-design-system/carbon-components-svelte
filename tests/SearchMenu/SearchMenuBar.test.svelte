<script lang="ts">
  import SearchMenu from "carbon-components-svelte/SearchMenu/SearchMenu.svelte";
  import SearchMenuItem from "carbon-components-svelte/SearchMenu/SearchMenuItem.svelte";

  export let open = false;

  const items = [
    { id: "gw-01", name: "Edge gateway 01" },
    { id: "gw-02", name: "Edge gateway 02" },
  ];
</script>

<SearchMenu bind:open labelText="Search" placeholder="Search...">
  <button slot="before" type="button" data-testid="scope">Scope</button>
  {#each items as item (item.id)}
    <SearchMenuItem text={item.name} value={item.id} />
  {/each}
</SearchMenu>
