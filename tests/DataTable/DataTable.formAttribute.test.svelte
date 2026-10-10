<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
</script>

<form id="outer-form" data-testid="form"></form>
<DataTable
  radio
  inputName="row"
  inputForm="outer-form"
  selectedRowIds={["b"]}
  headers={[{ key: "name", value: "Name" }]}
  rows={[
    { id: "a", name: "Alpha" },
    { id: "b", name: "Beta" },
  ]}
/>
