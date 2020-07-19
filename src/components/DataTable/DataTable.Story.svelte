<script>
  export let story = undefined;

  import Layout from "../../internal/ui/Layout.svelte";
  import DataTable from "./DataTable.svelte";
  import Table from "./Table.svelte";
  import TableBody from "./TableBody.svelte";
  import TableCell from "./TableCell.svelte";
  import TableContainer from "./TableContainer.svelte";
  import TableHead from "./TableHead.svelte";
  import TableHeader from "./TableHeader.svelte";
  import TableRow from "./TableRow.svelte";

  const rows = [
    {
      id: "a",
      name: "Load Balancer 3",
      protocol: "HTTP",
      port: 3000,
      rule: "Round robin",
      attached_groups: "Kevins VM Groups",
      status: "Disabled"
    },
    {
      id: "b",
      name: "Load Balancer 1",
      protocol: "HTTP",
      port: 443,
      rule: "Round robin",
      attached_groups: "Maureens VM Groups",
      status: "Starting"
    },
    {
      id: "c",
      name: "Load Balancer 2",
      protocol: "HTTP",
      port: 80,
      rule: "DNS delegation",
      attached_groups: "Andrews VM Groups",
      status: "Active"
    },
    {
      id: "d",
      name: "Load Balancer 6",
      protocol: "HTTP",
      port: 3000,
      rule: "Round robin",
      attached_groups: "Marcs VM Groups",
      status: "Disabled"
    },
    {
      id: "e",
      name: "Load Balancer 4",
      protocol: "HTTP",
      port: 443,
      rule: "Round robin",
      attached_groups: "Mels VM Groups",
      status: "Starting"
    },
    {
      id: "f",
      name: "Load Balancer 5",
      protocol: "HTTP",
      port: 80,
      rule: "DNS delegation",
      attached_groups: "Ronjas VM Groups",
      status: "Active"
    }
  ];
  const headers = [
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
    { key: "port", value: "Port" },
    { key: "rule", value: "Rule" },
    { key: "attached_groups", value: "Attached Groups" },
    { key: "status", value: "Status" }
  ];
  $: sortable = true;
</script>

<Layout>
  {#if story === 'composed'}
    <DataTable {...$$props} {rows} {headers} let:props>
      <TableContainer
        title="DataTable"
        description="With default options"
        {...props.getTableContainerProps()}>
        <Table {...props.getTableProps()}>
          <TableHead>
            <TableRow>
              {#each props.headers as header, i (header.key)}
                <TableHeader {...props.getHeaderProps({ header })}>
                  {header.header}
                </TableHeader>
              {/each}
            </TableRow>
          </TableHead>
          <TableBody>
            {#each props.rows as row, i}
              <TableRow {...props.getRowProps({ row })}>
                {#each row.cells as cell, j}
                  <TableCell>{cell.value}</TableCell>
                {/each}
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      </TableContainer>
    </DataTable>
  {:else if story === 'sortable'}
    <DataTable
      bind:sortable
      title={$$props.title}
      description={$$props.description}
      zebra={$$props.zebra}
      size={$$props.size}
      stickyHeader={$$props.stickyHeader}
      on:click={({ detail }) => {
        console.log('on:click', detail);
      }}
      on:click:header={({ detail }) => {
        console.log('on:click:header', detail);
      }}
      on:click:row={({ detail }) => {
        console.log('on:click:row', detail);
      }}
      on:click:cell={({ detail }) => {
        console.log('on:click:cell', detail);
      }}
      {rows}
      {headers} />
  {:else}
    <DataTable
      title={$$props.title}
      description={$$props.description}
      zebra={$$props.zebra}
      size={$$props.size}
      stickyHeader={$$props.stickyHeader}
      on:click={({ detail }) => {
        console.log('on:click', detail);
      }}
      on:click:header={({ detail }) => {
        console.log('on:click:header', detail);
      }}
      on:click:row={({ detail }) => {
        console.log('on:click:row', detail);
      }}
      on:click:cell={({ detail }) => {
        console.log('on:click:cell', detail);
      }}
      {rows}
      {headers} />
  {/if}
</Layout>
