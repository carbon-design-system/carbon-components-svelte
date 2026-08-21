<script>
  import {
    DataTable,
    NumberInput,
    Pagination,
    Select,
    SelectItem,
    Stack,
    TextInput,
  } from "carbon-components-svelte";

  const rows = Array.from({ length: 10 }).map((_, i) => ({
    id: i,
    name: `Load Balancer ${i + 1}`,
    protocol: i % 3 ? "HTTP" : "FTP",
    port: 3000 + i * 10,
    rule: i % 2 ? "Round robin" : "DNS delegation",
  }));

  const headers = [
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
    {
      key: "port",
      value: "Port",
      filter: (value, filterValue) => value >= filterValue,
    },
    { key: "rule", value: "Rule" },
  ];

  let filters = {};
  let filteredRowIds = [];
  let pageSize = 5;
  let page = 1;
</script>

<Stack gap={6}>
  <Select labelText="Protocol" bind:selected={filters.protocol}>
    <SelectItem value="" text="All" />
    <SelectItem value="HTTP" text="HTTP" />
    <SelectItem value="FTP" text="FTP" />
  </Select>
  <TextInput
    labelText="Name"
    placeholder="Filter by name"
    bind:value={filters.name}
  />
  <NumberInput
    label="Minimum port"
    min={3000}
    step={10}
    bind:value={filters.port}
  />
  <DataTable
    {headers}
    {rows}
    {pageSize}
    {page}
    bind:filters
    bind:filteredRowIds
  />
  <Pagination
    bind:pageSize
    bind:page
    totalItems={filteredRowIds.length}
    pageSizeInputDisabled
  />
</Stack>
