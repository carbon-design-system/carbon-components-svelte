<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import Toolbar from "carbon-components-svelte/DataTable/Toolbar.svelte";
  import ToolbarContent from "carbon-components-svelte/DataTable/ToolbarContent.svelte";
  import ToolbarSearch from "carbon-components-svelte/DataTable/ToolbarSearch.svelte";
  import ContextSpy from "./ContextSpy.svelte";

  export let onFilterRows: (() => void) | undefined = undefined;

  const rows = Array.from({ length: 10 }).map((_, i) => ({
    id: i,
    name: `Load Balancer ${i + 1}`,
    rule: i % 2 ? "Round robin" : "DNS delegation",
  }));

  // Unrelated reactive state that should NOT cause re-filtering when toggled.
  let unrelated = 0;
</script>

<Button on:click={() => (unrelated += 1)}>Bump unrelated</Button>

<DataTable
  headers={[
    { key: "name", value: "Name" },
    { key: "rule", value: "Rule" },
  ]}
  {rows}
>
  <Toolbar>
    <ToolbarContent>
      <ContextSpy onfilterrows={onFilterRows}>
        <ToolbarSearch shouldFilterRows value="round" tabindex={unrelated} />
      </ContextSpy>
    </ToolbarContent>
  </Toolbar>
</DataTable>
