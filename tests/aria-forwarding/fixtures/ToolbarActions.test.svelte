<script lang="ts">
  import Toolbar from "carbon-components-svelte/DataTable/Toolbar.svelte";
  import ToolbarColumnVisibility from "carbon-components-svelte/DataTable/ToolbarColumnVisibility.svelte";
  import ToolbarContent from "carbon-components-svelte/DataTable/ToolbarContent.svelte";
  import ToolbarDensity from "carbon-components-svelte/DataTable/ToolbarDensity.svelte";
  import ToolbarSortBy from "carbon-components-svelte/DataTable/ToolbarSortBy.svelte";

  /** Which component gets the rest props. */
  export let under: "columns" | "density" | "sortBy" = "columns";

  const headers = [
    { key: "name", value: "Name" },
    { key: "role", value: "Role" },
  ];
</script>

<Toolbar>
  <ToolbarContent>
    {#if under === "columns"}
      <ToolbarColumnVisibility {headers} {...$$restProps} />
    {:else if under === "sortBy"}
      <ToolbarSortBy {...$$restProps} />
    {:else}
      <ToolbarDensity {...$$restProps} />
    {/if}
  </ToolbarContent>
</Toolbar>
