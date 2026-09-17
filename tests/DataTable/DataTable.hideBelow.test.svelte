<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
</script>

<DataTable
  headers={[
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol", hideBelow: "md" },
    { key: "rule", value: "Rule", hideAbove: "md" },
    { key: "port", value: "Port" },
  ]}
  rows={[
    { id: "a", name: "Load Balancer 3", protocol: "HTTP", rule: "Round robin", port: "443" },
    { id: "b", name: "Load Balancer 1", protocol: "HTTP", rule: "DNS delegation", port: "80" },
  ]}
/>
