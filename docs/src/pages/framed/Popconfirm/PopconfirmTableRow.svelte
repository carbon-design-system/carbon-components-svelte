<script>
  import { Button, DataTable, Popconfirm } from "carbon-components-svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";

  const headers = [
    { key: "name", value: "Name" },
    { key: "region", value: "Region" },
    { key: "actions", empty: true, value: "Actions", width: "72px" },
  ];

  let rows = [
    { id: "a", name: "Load Balancer 3", region: "us-south" },
    { id: "b", name: "Load Balancer 1", region: "eu-de" },
    { id: "c", name: "Load Balancer 2", region: "us-south" },
    { id: "d", name: "Load Balancer 6", region: "jp-tok" },
  ];
</script>

<DataTable stickyHeader {headers} {rows}>
  <svelte:fragment slot="cell" let:row let:cell>
    {#if cell.key === "actions"}
      <Popconfirm
        title="Delete {row.name}?"
        description="Traffic to it stops right away."
        confirmText="Delete"
        direction="top"
        align="end"
        on:confirm={() => (rows = rows.filter((r) => r.id !== row.id))}
      >
        <Button
          kind="danger-ghost"
          size="small"
          icon={TrashCan}
          iconDescription="Delete {row.name}"
          iconOnly
        />
      </Popconfirm>
    {:else}
      {cell.value}
    {/if}
  </svelte:fragment>
</DataTable>
