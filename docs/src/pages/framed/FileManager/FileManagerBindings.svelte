<script>
  import {
    createMemoryFileSystem,
    FileManager,
    Stack,
  } from "carbon-components-svelte";

  const adapter = createMemoryFileSystem({
    entries: [
      { path: "/Projects/alpha/plan.md", size: 900, type: "text/markdown" },
      { path: "/Projects/alpha/budget.csv", size: 4_200, type: "text/csv" },
      { path: "/Projects/beta", kind: "folder" },
      { path: "/Inbox/scan.pdf", size: 220_000, type: "application/pdf" },
      { path: "/todo.txt", size: 64, type: "text/plain" },
    ],
  });

  let path = "/Projects";
  let view = "list";
  let selectedIds = [];
  let sortKey = "name";
  let sortDirection = "ascending";
  let events = [];
</script>

<Stack gap={5}>
  <FileManager
    {adapter}
    height="18rem"
    bind:path
    bind:view
    bind:selectedIds
    bind:sortKey
    bind:sortDirection
    on:navigate={(event) =>
      (events = [...events, `navigate ${event.detail.path}`])}
    on:open={(event) =>
      (events = [...events, `open ${event.detail.entry.path}`])}
    on:move={(event) =>
      (events = [
        ...events,
        `move ${event.detail.paths.length} to ${event.detail.destination}`,
      ])}
  />
  <p>Open: {path}, shown as a {view}, sorted by {sortKey} {sortDirection}</p>
  <p>Selected: {selectedIds.length === 0 ? "none" : selectedIds.join(", ")}</p>
  <p>Last events: {events.slice(-3).join("; ") || "none"}</p>
</Stack>
