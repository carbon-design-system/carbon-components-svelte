<script>
  import {
    DataTable,
    OverflowMenu,
    OverflowMenuItem,
    Tag,
  } from "carbon-components-svelte";
</script>

<DataTable
  stacked="always"
  title="Load balancers"
  headers={[
    { key: "name", value: "Name", primary: true },
    { key: "status", value: "Status" },
    { key: "port", value: "Port", stackedLabel: "Listening on" },
    { key: "rule", value: "Rule", stackedHidden: true },
    { key: "overflow", empty: true, columnMenu: true, value: "Actions" },
  ]}
  rows={[
    {
      id: "a",
      name: "Load Balancer 3",
      status: "Active",
      port: 3000,
      rule: "Round robin",
    },
    {
      id: "b",
      name: "Load Balancer 1",
      status: "Disabled",
      port: 443,
      rule: "Round robin",
    },
    {
      id: "c",
      name: "Load Balancer 2",
      status: "Active",
      port: 80,
      rule: "DNS delegation",
    },
  ]}
>
  <svelte:fragment slot="cell" let:cell>
    {#if cell.key === "overflow"}
      <OverflowMenu flipped>
        <OverflowMenuItem text="Edit" />
        <OverflowMenuItem text="Delete" danger />
      </OverflowMenu>
    {:else if cell.key === "status"}
      <Tag type={cell.value === "Active" ? "green" : "gray"}>{cell.value}</Tag>
    {:else}
      {cell.value}
    {/if}
  </svelte:fragment>
</DataTable>
