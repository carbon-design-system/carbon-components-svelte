<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";

  const headers = [
    { key: "name", value: "Name" },
    { key: "port", value: "Port" },
  ] as const;

  // Overlapping row ids across both tables (very common when ids are user data).
  const rows = [
    { id: "0", name: "Row 0", port: 3000 },
    { id: "1", name: "Row 1", port: 443 },
  ];
</script>

<DataTable expandable {headers} {rows} />
<DataTable expandable {headers} {rows} />
