<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
  import type { ComponentProps } from "svelte";

  export let portalMenu: ComponentProps<Dropdown>["portalMenu"] = undefined;

  const headers = [
    { key: "name", value: "Name" },
    { key: "region", value: "Region" },
  ] as const;
  const rows = [{ id: "a", name: "api-gateway", region: "us-east" }];
  const items = [
    { id: "0", text: "us-east" },
    { id: "1", text: "eu-de" },
  ];
</script>

<DataTable {headers} {rows}>
  <svelte:fragment slot="cell" let:cell>
    {#if cell.key === "region"}
      <Dropdown
        labelText="Region"
        hideLabel
        selectedId="0"
        {items}
        {portalMenu}
      />
    {:else}
      {cell.value}
    {/if}
  </svelte:fragment>
</DataTable>
