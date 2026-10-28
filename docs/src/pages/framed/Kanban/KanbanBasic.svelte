<script>
  import { Box, Kanban } from "carbon-components-svelte";

  const columns = [
    { id: "backlog", title: "Backlog" },
    { id: "progress", title: "In progress" },
    { id: "review", title: "In review" },
    { id: "done", title: "Done" },
  ];

  let items = [
    {
      id: "INC-412",
      column: "backlog",
      title: "Rotate the billing-api signing key",
      tags: [{ text: "Security", type: "red" }],
      assignee: "Ada Lovelace",
    },
    {
      id: "INC-409",
      column: "backlog",
      title: "Add a retry budget to the export job",
      description: "Failed exports retry without limit.",
    },
    {
      id: "INC-415",
      column: "progress",
      title: "Move the audit log to cold storage",
      tags: [{ text: "Platform", type: "blue" }],
      assignee: "Grace Hopper",
    },
    {
      id: "INC-401",
      column: "review",
      title: "Fix the stale cache on region failover",
      assignee: "Alan Turing",
    },
    {
      id: "INC-398",
      column: "done",
      title: "Document the on-call handoff",
    },
  ];
</script>

<Box height="26rem">
  <Kanban aria-label="Incident board" {columns} bind:items />
</Box>
