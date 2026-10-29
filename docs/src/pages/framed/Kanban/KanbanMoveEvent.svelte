<script>
  import {
    applyKanbanMove,
    Box,
    Kanban,
    Stack,
    Text,
  } from "carbon-components-svelte";

  const columns = [
    { id: "queued", title: "Queued" },
    { id: "running", title: "Running" },
    { id: "released", title: "Released" },
  ];

  let items = [
    { id: "web", column: "queued", title: "Deploy web-frontend 4.2.0" },
    { id: "api", column: "queued", title: "Deploy billing-api 2.8.1" },
    { id: "worker", column: "running", title: "Deploy export-worker 1.9.4" },
    { id: "docs", column: "released", title: "Deploy docs-site 3.0.0" },
  ];
  let log = "Move a card to see its details.";

  // Hold each move until a simulated server call settles. Cancelling the
  // event keeps the board as it is; assigning `items` applies the move.
  async function handleMove(event) {
    const move = event.detail;
    event.preventDefault();
    log = `Saving ${move.id} to ${move.to} at ${move.index}...`;
    await new Promise((resolve) => setTimeout(resolve, 400));
    if (move.to === "released" && move.from !== "running") {
      log = `Refused: ${move.id} must run before it is released.`;
      return;
    }
    items = applyKanbanMove(items, move);
    log = `Saved ${move.id} in ${move.to} (${move.source}).`;
  }
</script>

<Stack gap={5}>
  <Box height="18rem">
    <Kanban aria-label="Release board" {columns} {items} on:move={handleMove} />
  </Box>
  <Text>{log}</Text>
</Stack>
