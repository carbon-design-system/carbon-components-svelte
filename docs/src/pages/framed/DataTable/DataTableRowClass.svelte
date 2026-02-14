<script>
  import { DataTable } from "carbon-components-svelte";

  let selectedRowIds = [];
  let expandedRowIds = [];
</script>

<DataTable
  selectable
  expandable
  bind:selectedRowIds
  bind:expandedRowIds
  headers={[
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
    { key: "port", value: "Port" },
    { key: "rule", value: "Rule" },
  ]}
  rows={[
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
      protocol: "HTTPS",
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
      protocol: "HTTPS",
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
  ]}
  rowClass={({ row, selected, expanded }) => {
    const classes = [];
    if (row.protocol === "HTTPS") classes.push("secure");
    if (selected) classes.push("selected");
    if (expanded) classes.push("expanded");
    return classes.join(" ") || undefined;
  }}
>
  <svelte:fragment slot="expanded-row" let:row>
    <pre>{JSON.stringify(row, null, 2)}</pre>
  </svelte:fragment>
</DataTable>

<style>
  :global(.selected) {
    outline: 2px solid var(--cds-focus);
  }

  :global(:not(.bx--data-table--selected) .expanded) {
    border-left: 3px solid var(--cds-interactive-01);
  }
</style>
