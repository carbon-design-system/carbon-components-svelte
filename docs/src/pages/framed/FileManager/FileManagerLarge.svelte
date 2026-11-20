<script>
  import {
    createMemoryFileSystem,
    FileManager,
  } from "carbon-components-svelte";

  const owners = ["Ada", "Grace", "Linus", "Margaret"];
  const entries = Array.from({ length: 10_000 }, (_, index) => ({
    path: `/Exports/report-${String(index).padStart(5, "0")}.csv`,
    size: (index * 7_919) % 250_000,
    type: "text/csv",
    owner: owners[index % owners.length],
    modified: Date.UTC(2026, 0, 1) + (index % 300) * 86_400_000,
  }));

  const adapter = createMemoryFileSystem({ entries });
</script>

<FileManager {adapter} path="/Exports" height="18rem" />
