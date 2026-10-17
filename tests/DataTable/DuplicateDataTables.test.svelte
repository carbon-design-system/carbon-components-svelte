<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";

  const headers = [
    { key: "id", value: "id" },
    { key: "contact.company", value: "Company name" },
  ] as const;

  const rows = [
    { id: "1", contact: { company: "Company 1" } },
    { id: "2", contact: { company: "Company 2" } },
  ];

  let selectedA: ReadonlyArray<string> = [];
  let selectedB: ReadonlyArray<string> = [];
</script>

<DataTable radio {headers} {rows} bind:selectedRowIds={selectedA} />
<DataTable radio {headers} {rows} bind:selectedRowIds={selectedB} />
<output data-testid="selected-a">{JSON.stringify(selectedA)}</output>
<output data-testid="selected-b">{JSON.stringify(selectedB)}</output>

<DataTable
  inputName="checkbox-select"
  batchSelection
  selectable
  {headers}
  {rows}
/>
<DataTable
  inputName="checkbox-select"
  batchSelection
  selectable
  {headers}
  {rows}
/>
