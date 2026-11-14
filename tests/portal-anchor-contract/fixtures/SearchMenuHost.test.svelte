<script lang="ts">
  import SearchMenu from "carbon-components-svelte/SearchMenu/SearchMenu.svelte";
  import SearchMenuItem from "carbon-components-svelte/SearchMenu/SearchMenuItem.svelte";

  /** Render the `before` slot, which moves the menu's anchor. */
  export let before = false;
</script>

<!-- A `slot` attribute can't sit inside `{#if}`, so each branch renders its
     own SearchMenu. -->
{#if before}
  <SearchMenu portal labelText="Search">
    <button slot="before" type="button">Scope</button>
    <SearchMenuItem text="Edge gateway" value="gw" />
  </SearchMenu>
{:else}
  <SearchMenu portal labelText="Search">
    <SearchMenuItem text="Edge gateway" value="gw" />
  </SearchMenu>
{/if}
