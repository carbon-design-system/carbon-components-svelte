<script lang="ts">
  import {
    Toolbar,
    ToolbarContent,
    ToolbarMenu,
    ToolbarMenuItem,
  } from "carbon-components-svelte";

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
