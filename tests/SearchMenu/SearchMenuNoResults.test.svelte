<script lang="ts">
  import SearchMenu from "carbon-components-svelte/SearchMenu/SearchMenu.svelte";
  import SearchMenuItem from "carbon-components-svelte/SearchMenu/SearchMenuItem.svelte";

  export let value = "";
</script>

<SearchMenu bind:value placeholder="Search..." labelText="Search">
  <SearchMenuItem text="Databases for TestSQL" />
  <SearchMenuItem text="Data Store for Memcache" />
  <svelte:fragment slot="noResults">Nothing matches</svelte:fragment>
</SearchMenu>
