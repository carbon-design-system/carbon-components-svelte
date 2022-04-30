<script>
  import { DataTable } from "carbon-components-svelte";
</script>

<DataTable
  batchSelection
  headers="{[
    { key: 'name', value: 'Name' },
    { key: 'port', value: 'Port' },
    { key: 'rule', value: 'Rule' },
  ]}"
  rows="{Array.from({ length: 6 }).map((_, i) => ({
    id: i,
    name: 'Load Balancer ' + (i + 1),
    protocol: 'HTTP',
    port: i % 3 ? (i % 2 ? 3000 : 80) : 443,
    rule: i % 3 ? 'Round robin' : 'DNS delegation',
  }))}"
/>
