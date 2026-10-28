<script>
  import { Box, Kanban } from "carbon-components-svelte";

  const columns = [
    { id: "open", title: "Open" },
    { id: "triaged", title: "Triaged" },
    { id: "closed", title: "Closed", collapsible: false },
  ];

  let items = [
    { id: "1", column: "open", title: "Login fails behind the proxy" },
    { id: "2", column: "open", title: "Export drops the last row" },
    { id: "3", column: "triaged", title: "Dark theme loses focus rings" },
    { id: "4", column: "closed", title: "Typo in the invoice footer" },
  ];
  let collapsedColumns = ["triaged"];
</script>

<Box height="18rem">
  <Kanban
    aria-label="Issue board"
    {columns}
    bind:items
    bind:collapsedColumns
    collapsible
  />
</Box>
