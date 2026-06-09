<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import Toolbar from "carbon-components-svelte/DataTable/Toolbar.svelte";
  import ToolbarContent from "carbon-components-svelte/DataTable/ToolbarContent.svelte";
  import type { ComponentProps } from "svelte";

  export let tableSize: ComponentProps<DataTable>["size"] = undefined;
  export let toolbarSize: ComponentProps<Toolbar>["size"] = undefined;
  export let standalone = false;
</script>

{#if standalone}
  <Toolbar size={toolbarSize}>
    <ToolbarContent />
  </Toolbar>
{:else}
  <DataTable
    size={tableSize}
    headers={[{ key: "name", value: "Name" }]}
    rows={[{ id: "a", name: "Row A" }]}
  >
    <Toolbar size={toolbarSize}>
      <ToolbarContent />
    </Toolbar>
  </DataTable>
{/if}
