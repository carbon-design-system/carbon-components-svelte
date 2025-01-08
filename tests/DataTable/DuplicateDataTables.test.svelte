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

<DataTable radio {headers} {rows} />
<DataTable radio {headers} {rows} />
