<script>
  import {
    DataTable,
    Select,
    SelectItem,
    Stack,
  } from "carbon-components-svelte";

  // Mock data from the server.
  const allFromServer = [
    { id: "1", name: "Load Balancer 1", protocol: "HTTP" },
    { id: "2", name: "Load Balancer 2", protocol: "FTP" },
    { id: "3", name: "Load Balancer 3", protocol: "HTTP" },
  ];

  let rows = [...allFromServer];
  let filters = {};

  // Simulate fetching filtered data from a remote server.
  function fakeServerFilter(nextFilters) {
    return new Promise((resolve) => {
      const { protocol } = nextFilters;
      setTimeout(() => {
        resolve(
          protocol
            ? allFromServer.filter((row) => row.protocol === protocol)
            : [...allFromServer],
        );
      }, 250);
    });
  }
</script>

<Stack gap={6}>
  <Select labelText="Protocol" bind:selected={filters.protocol}>
    <SelectItem value="" text="All" />
    <SelectItem value="HTTP" text="HTTP" />
    <SelectItem value="FTP" text="FTP" />
  </Select>
  <DataTable
    headers={[
      { key: "name", value: "Name" },
      { key: "protocol", value: "Protocol" },
    ]}
    {rows}
    bind:filters
    on:filter={async (e) => {
      e.preventDefault();
      rows = await fakeServerFilter(e.detail.filters);
    }}
  />
</Stack>
