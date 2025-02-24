<script lang="ts">
  import { DataTable } from "carbon-components-svelte";

  const headers = [
    { key: "id", value: "id" },
    { key: "contact.company", value: "Company name" },
  ] as const;

  const rows = [
    { id: "1", contact: { company: "Company 1" } },
    { id: "2", contact: { company: "Company 2" } },
  ];
</script>

<DataTable inputName="radio-select" radio {headers} {rows} />
<DataTable inputName="radio-select" radio {headers} {rows} />

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
