<script lang="ts">
  import { DataTable } from "../types";
</script>

<DataTable
  headers="{[
    { key: 'name', value: 'Name' },
    { key: 'protocol', value: 'Protocol', width: '400px', minWidth: '40%' },
    { key: 'port', value: 'Port' },
    { key: 'rule.name', value: 'Rule', sort: false },
  ]}"
  rows="{[
    {
      id: 'a',
      name: 'Load Balancer 3',
      protocol: 'HTTP',
      port: 3000,
      'rule.name': 'Round robin',
    },
  ]}"
>
  <span slot="cell" let:cell let:row>
    {cell.key === "rule.name"}
    {#if cell.key === "name"}
      {row.name} {row.id}
    {:else}
      {cell.value}
    {/if}
  </span>
</DataTable>
