<script>
  import {
    DataTable,
    OverflowMenu,
    OverflowMenuItem,
  } from "carbon-components-svelte";

  const headers = [
    { key: "name", value: "Name" },
    { key: "port", value: "Port" },
    { key: "rule", value: "Rule" },
    { key: "overflow", empty: true, width: "72px" },
  ];

  const rows = [
    { id: "a", name: "Load Balancer 3", port: 3000, rule: "Round robin" },
    { id: "b", name: "Load Balancer 1", port: 443, rule: "Round robin" },
    { id: "c", name: "Load Balancer 2", port: 80, rule: "DNS delegation" },
    { id: "d", name: "Load Balancer 6", port: 3000, rule: "Round robin" },
    { id: "e", name: "Load Balancer 4", port: 443, rule: "Round robin" },
    { id: "f", name: "Load Balancer 5", port: 80, rule: "DNS delegation" },
  ];
</script>

<DataTable sortable {headers} {rows}>
  <svelte:fragment slot="cell" let:cell>
    {#if cell.key === "overflow"}
      <OverflowMenu portalMenu flipped>
        <OverflowMenuItem text="Restart" />
        <OverflowMenuItem
          href="https://cloud.ibm.com/docs/loadbalancer-service"
          text="API documentation"
        />
        <OverflowMenuItem danger text="Stop" />
      </OverflowMenu>
    {:else}{cell.value}{/if}
  </svelte:fragment>
</DataTable>
