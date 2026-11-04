<script lang="ts">
  import Toolbar from "carbon-components-svelte/DataTable/Toolbar.svelte";
  import ToolbarColumnVisibility from "carbon-components-svelte/DataTable/ToolbarColumnVisibility.svelte";
  import ToolbarContent from "carbon-components-svelte/DataTable/ToolbarContent.svelte";
  import ToolbarDensity from "carbon-components-svelte/DataTable/ToolbarDensity.svelte";
  import ToolbarExport from "carbon-components-svelte/DataTable/ToolbarExport.svelte";

  /** Which component gets the rest props. */
  export let under: "columns" | "density" | "export" = "columns";

  const headers = [
    { key: "name", value: "Name" },
    { key: "role", value: "Role" },
  ];
  const rows: Array<{ id: string; [key: string]: string }> = [
    { id: "a", name: "Ada", role: "Engineer" },
  ];
</script>

<Toolbar>
  <ToolbarContent>
    {#if under === "columns"}
      <ToolbarColumnVisibility {headers} {...$$restProps} />
    {:else if under === "export"}
      <ToolbarExport {rows} {headers} {...$$restProps} />
    {:else}
      <ToolbarDensity {...$$restProps} />
    {/if}
  </ToolbarContent>
</Toolbar>
