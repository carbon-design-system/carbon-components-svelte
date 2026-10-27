<script>
  import {
    Box,
    DataTable,
    OverflowMenu,
    OverflowMenuItem,
  } from "carbon-components-svelte";
</script>

<Box maxWidth="40rem">
  <DataTable
    fixedLayout
    batchSelection
    headers={[
      { key: "name", value: "Name", columnPinned: "start", width: "12rem" },
      { key: "region", value: "Region", width: "10rem" },
      { key: "protocol", value: "Protocol", width: "8rem" },
      { key: "port", value: "Port", width: "6rem" },
      { key: "rule", value: "Rule", width: "12rem" },
      { key: "owner", value: "Owner", width: "10rem" },
      {
        key: "actions",
        empty: true,
        columnMenu: true,
        columnPinned: "end",
        width: "4rem",
      },
    ]}
    rows={Array.from({ length: 6 }).map((_, i) => ({
      id: i,
      name: `Load Balancer ${i + 1}`,
      region: i % 2 ? "eu-de" : "us-east",
      protocol: "HTTP",
      port: i % 3 ? (i % 2 ? 3000 : 80) : 443,
      rule: i % 3 ? "Round robin" : "DNS delegation",
      owner: "Platform team",
    }))}
  >
    <svelte:fragment slot="cell" let:cell let:row>
      {#if cell.key === "actions"}
        <OverflowMenu flipped aria-label="Actions for {row.name}">
          <OverflowMenuItem text="Restart" />
          <OverflowMenuItem danger text="Delete" />
        </OverflowMenu>
      {:else}
        {cell.value}
      {/if}
    </svelte:fragment>
  </DataTable>
</Box>
