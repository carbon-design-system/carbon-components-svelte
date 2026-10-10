<svelte:options accessors />

<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";

  export let rows = [];
  export let virtualize = false;

  const headers = [
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
    { key: "port", value: "Port" },
    { key: "rule", value: "Rule" },
  ];
</script>

<DataTable sortable size="short" {headers} {rows} {virtualize} />
