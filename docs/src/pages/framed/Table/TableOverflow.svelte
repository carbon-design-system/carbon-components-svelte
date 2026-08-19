<script>
  import { Table } from "carbon-components-svelte";

  const headers = Array.from({ length: 10 }).map((_, i) => ({
    key: `col-${i}`,
    value: `Column ${i + 1}`,
    minWidth: "10rem",
  }));

  const rows = Array.from({ length: 4 }).map((_, rowIndex) => {
    const row = { id: rowIndex };
    headers.forEach((header, i) => {
      row[header.key] = `Row ${rowIndex + 1}, Col ${i + 1}`;
    });
    return row;
  });
</script>

<Table {headers} {rows} />
