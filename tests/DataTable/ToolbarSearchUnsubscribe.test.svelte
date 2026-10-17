<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import Toolbar from "carbon-components-svelte/DataTable/Toolbar.svelte";
  import ToolbarContent from "carbon-components-svelte/DataTable/ToolbarContent.svelte";
  import ToolbarSearch from "carbon-components-svelte/DataTable/ToolbarSearch.svelte";
  import ContextSpy from "./ContextSpy.svelte";

  export let onTableRows: (() => void) | undefined = undefined;

  let rows = Array.from({ length: 5 }).map((_, i) => ({
    id: i,
    name: `Row ${i + 1}`,
  }));

  // Starts `true` so mount creates the first live subscription.
  let shouldFilterRows = true;
</script>

<Button on:click={() => (shouldFilterRows = !shouldFilterRows)}>
  Toggle filter
</Button>
<Button
  on:click={() =>
    (rows = rows.map((row) => ({ ...row, name: `${row.name}!` })))}
>
  Change rows
</Button>

<DataTable headers={[{ key: "name", value: "Name" }]} {rows}>
  <Toolbar>
    <ToolbarContent>
      <ContextSpy ontablerows={onTableRows}>
        <ToolbarSearch {shouldFilterRows} />
      </ContextSpy>
    </ToolbarContent>
  </Toolbar>
</DataTable>
