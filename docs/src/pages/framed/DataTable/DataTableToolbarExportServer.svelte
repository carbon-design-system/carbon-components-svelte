<script>
  import {
    DataTable,
    downloadFile,
    toCsv,
    Toolbar,
    ToolbarContent,
    ToolbarExport,
  } from "carbon-components-svelte";

  const headers = [
    { key: "name", value: "Name" },
    { key: "port", value: "Port" },
  ];

  // The first page of a much larger result set.
  const rows = [
    { id: "1", name: "Load Balancer 1", port: 3000 },
    { id: "2", name: "Load Balancer 2", port: 443 },
    { id: "3", name: "Load Balancer 3", port: 80 },
  ];

  // Simulate asking the server for every row.
  async function fetchAllRows() {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return Array.from({ length: 1000 }).map((_, i) => ({
      id: String(i),
      name: `Load Balancer ${i + 1}`,
      port: 3000 + i,
    }));
  }

  async function handleExport(event) {
    // The table only holds one page. Skip the built-in file.
    event.preventDefault();

    const { format } = event.detail;
    if (format !== "csv") return;
    downloadFile(
      toCsv(headers, await fetchAllRows()),
      "load-balancers.csv",
      "text/csv;charset=utf-8",
    );
  }
</script>

<DataTable {headers} {rows}>
  <Toolbar>
    <ToolbarContent>
      <ToolbarExport formats={["csv"]} on:export={handleExport} />
    </ToolbarContent>
  </Toolbar>
</DataTable>
