<script>
  import { Box, Kanban, Stack } from "carbon-components-svelte";

  const columns = [
    { id: "todo", title: "To do" },
    { id: "doing", title: "In progress", limit: 2 },
    { id: "done", title: "Done" },
  ];

  const cards = [
    { id: "1", column: "todo", title: "Triage the paging alerts" },
    { id: "2", column: "todo", title: "Patch the ingress controller" },
    { id: "3", column: "doing", title: "Upgrade the Postgres replica" },
    { id: "4", column: "doing", title: "Rebuild the staging cluster" },
    { id: "5", column: "done", title: "Renew the TLS certificates" },
  ];

  let warnItems = cards;
  let blockItems = cards;
</script>

<Stack gap={7}>
  <Box height="20rem">
    <Kanban aria-label="Warn board" {columns} bind:items={warnItems} />
  </Box>
  <Box height="20rem">
    <Kanban
      aria-label="Block board"
      {columns}
      bind:items={blockItems}
      limitMode="block"
    />
  </Box>
</Stack>
