<script lang="ts">
  import {
    DataTable,
    DataTableSkeleton,
    Toolbar,
    ToolbarContent,
    ToolbarSearch,
    ToolbarMenu,
    ToolbarMenuItem,
    Button,
    Link,
  } from "../types";
  import type { DataTableHeader } from "../types/DataTable/DataTable.svelte";
  import Launch from "carbon-icons-svelte/lib/Launch.svelte";

  const headers: DataTableHeader[] = [
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol", width: "400px", minWidth: "40%" },
    { key: "port", value: "Port" },
    { key: "rule", value: "Rule", sort: false },
  ];
  const rows = [
    {
      id: "a",
      name: "Load Balancer 3",
      protocol: "HTTP",
      port: 3000,
      rule: "Round robin",
    },
    {
      id: "b",
      name: "Load Balancer 1",
      protocol: "HTTP",
      port: 443,
      rule: "Round robin",
    },
    {
      id: "c",
      name: "Load Balancer 2",
      protocol: "HTTP",
      port: 80,
      rule: "DNS delegation",
    },
    {
      id: "d",
      name: "Load Balancer 6",
      protocol: "HTTP",
      port: 3000,
      rule: "Round robin",
    },
    {
      id: "e",
      name: "Load Balancer 4",
      protocol: "HTTP",
      port: 443,
      rule: "Round robin",
    },
    {
      id: "f",
      name: "Load Balancer 5",
      protocol: "HTTP",
      port: 80,
      rule: "DNS delegation",
    },
  ];

  function sort(a: any, b: any) {
    if (new Date(a) > new Date(b)) return 1;
    return 0;
  }

  let filteredRowIds = [];
</script>

<DataTable
  headers="{headers}"
  rows="{rows}"
  style=""
  sortKey="name"
  sortDirection="descending"
  class="class"
/>

<DataTable headers="{headers}" rows="{rows}">
  <span slot="cell-header" let:header>
    {#if header.key === "port"}
      {header.value}
      (network)
    {:else}{header.value}{/if}
  </span>
  <span slot="cell" let:cell>
    {#if cell.key === "rule" && cell.value === "Round robin"}
      <Link
        inline
        href="https://en.wikipedia.org/wiki/Round-robin_DNS"
        target="_blank"
      >
        {cell.value}
        <Launch />
      </Link>
    {:else}{cell.value}{/if}
  </span>
</DataTable>

<DataTable
  title="Load balancers"
  description="Your organization's active load balancers."
  headers="{headers}"
  rows="{rows}"
  useStaticWidth
/>

<DataTable
  title="Load balancers"
  description="Your organization's active load balancers."
  headers="{headers}"
  rows="{rows}"
>
  <Toolbar>
    <ToolbarContent>
      <ToolbarSearch
        bind:filteredRowIds
        shouldFilterRows="{(row, value) => {
          return row.name.includes(value);
        }}"
      />
      <ToolbarMenu>
        <ToolbarMenuItem primaryFocus>Restart all</ToolbarMenuItem>
        <ToolbarMenuItem href="https://cloud.ibm.com/docs/loadbalancer-service">
          API documentation
        </ToolbarMenuItem>
        <ToolbarMenuItem danger>Stop all</ToolbarMenuItem>
      </ToolbarMenu>
      <Button>Create balancer</Button>
    </ToolbarContent>
  </Toolbar>
</DataTable>

<DataTable
  size="short"
  title="Load balancers"
  description="Your organization's active load balancers."
  headers="{headers}"
  rows="{rows}"
>
  <Toolbar size="sm">
    <ToolbarContent>
      <ToolbarSearch />
      <ToolbarMenu>
        <ToolbarMenuItem primaryFocus>Restart all</ToolbarMenuItem>
        <ToolbarMenuItem href="https://cloud.ibm.com/docs/loadbalancer-service">
          API documentation
        </ToolbarMenuItem>
        <ToolbarMenuItem danger>Stop all</ToolbarMenuItem>
      </ToolbarMenu>
      <Button>Create balancer</Button>
    </ToolbarContent>
  </Toolbar>
</DataTable>

<DataTable zebra headers="{headers}" rows="{rows}" />

<DataTable size="tall" headers="{headers}" rows="{rows}" />

<DataTable size="short" headers="{headers}" rows="{rows}" />

<DataTable size="compact" headers="{headers}" rows="{rows}" />

<DataTable sortable headers="{headers}" rows="{rows}" />

<DataTable
  sortable
  title="Load balancers"
  description="Your organization's active load balancers."
  headers="{[
    { key: 'name', value: 'Name' },
    { key: 'protocol', value: 'Protocol' },
    { key: 'port', value: 'Port' },
    { key: 'cost', value: 'Cost', display: (cost) => cost + ' €' },
    {
      key: 'expireDate',
      value: 'Expire date',
      display: (date) => new Date(date).toLocaleString(),
      sort,
    },
  ]}"
  rows="{[
    {
      id: 0,
      name: 'Load Balancer 3',
      protocol: 'HTTP',
      port: 3000,
      cost: 100,
      expireDate: '2020-10-21',
    },
    {
      id: 'b',
      name: 'Load Balancer 1',
      protocol: 'HTTP',
      port: 443,
      cost: 200,
      expireDate: '2020-09-10',
    },
    {
      id: 'c',
      name: 'Load Balancer 2',
      protocol: 'HTTP',
      port: 80,
      cost: 150,
      expireDate: '2020-11-24',
    },
    {
      id: 'd',
      name: 'Load Balancer 6',
      protocol: 'HTTP',
      port: 3000,
      cost: 250,
      expireDate: '2020-12-01',
    },
    {
      id: 'e',
      name: 'Load Balancer 4',
      protocol: 'HTTP',
      port: 443,
      cost: 550,
      expireDate: '2021-03-21',
    },
    {
      id: 'f',
      name: 'Load Balancer 5',
      protocol: 'HTTP',
      port: 80,
      cost: 400,
      expireDate: '2020-11-14',
    },
  ]}"
/>

<DataTable
  expandable
  nonExpandableRowIds="{['a', 'b']}"
  headers="{headers}"
  rows="{rows}"
>
  <div slot="expanded-row" let:row>
    <pre>
      {JSON.stringify(row, null, 2)}
    </pre>
  </div>
</DataTable>

<DataTable batchExpansion headers="{headers}" rows="{rows}">
  <div slot="expanded-row" let:row>
    <pre>
      {JSON.stringify(row, null, 2)}
    </pre>
  </div>
</DataTable>

<DataTableSkeleton />

<DataTableSkeleton
  headers="{['Name', 'Protocol', 'Port', 'Rule']}"
  rows="{10}"
/>

<DataTableSkeleton
  headers="{[
    { value: 'Name' },
    { value: 'Protocol' },
    { value: 'Port' },
    { value: 'Rule' },
    { empty: true },
  ]}"
  rows="{10}"
/>

<DataTableSkeleton headers="{headers}" rows="{10}" />

<DataTableSkeleton showHeader="{false}" showToolbar="{false}" />

<DataTableSkeleton showHeader="{false}" showToolbar="{false}" size="tall" />

<DataTableSkeleton showHeader="{false}" showToolbar="{false}" size="short" />

<DataTableSkeleton showHeader="{false}" showToolbar="{false}" size="compact" />
