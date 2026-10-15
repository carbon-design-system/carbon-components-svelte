<script lang="ts">
  import Toolbar from "carbon-components-svelte/DataTable/Toolbar.svelte";
  import ToolbarContent from "carbon-components-svelte/DataTable/ToolbarContent.svelte";
  import ToolbarMenu from "carbon-components-svelte/DataTable/ToolbarMenu.svelte";
  import ToolbarMenuItem from "carbon-components-svelte/DataTable/ToolbarMenuItem.svelte";

  /** Which component gets the rest props. */
  export let under: "menu" | "item" = "menu";
</script>

<Toolbar>
  <ToolbarContent>
    <ToolbarMenu
      open={under === "item"}
      {...under === "menu" ? $$restProps : {}}
    >
      <ToolbarMenuItem
        text="Restart"
        {...under === "item" ? $$restProps : {}}
      />
    </ToolbarMenu>
  </ToolbarContent>
</Toolbar>
