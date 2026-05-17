<script lang="ts">
  import Toolbar from "carbon-components-svelte/DataTable/Toolbar.svelte";
  import ToolbarContent from "carbon-components-svelte/DataTable/ToolbarContent.svelte";
  import ToolbarMenu from "carbon-components-svelte/DataTable/ToolbarMenu.svelte";
  import ToolbarMenuItem from "carbon-components-svelte/DataTable/ToolbarMenuItem.svelte";

  export let showMenu = true;
</script>

<Toolbar>
  <ToolbarContent>
    {#if showMenu}
      <ToolbarMenu>
        <ToolbarMenuItem>Item</ToolbarMenuItem>
      </ToolbarMenu>
    {/if}
  </ToolbarContent>
</Toolbar>
