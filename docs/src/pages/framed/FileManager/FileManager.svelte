<script>
  import {
    createMemoryFileSystem,
    FileManager,
  } from "carbon-components-svelte";

  const swatch = (color) =>
    `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120"><rect width="160" height="120" fill="${color}"/></svg>`,
    )}`;

  const adapter = createMemoryFileSystem({
    latency: 120,
    entries: [
      {
        path: "/Documents/notes.txt",
        size: 1_204,
        type: "text/plain",
        owner: "You",
        modified: Date.UTC(2026, 9, 28),
        content: "Notes for the quarterly review.",
      },
      {
        path: "/Documents/budget.csv",
        size: 18_340,
        type: "text/csv",
        owner: "Grace",
        modified: Date.UTC(2026, 9, 12),
        content: "item,cost\nservers,1200",
      },
      { path: "/Documents/Reports", kind: "folder" },
      {
        path: "/Photos/harbor.svg",
        size: 40_210,
        type: "image/svg+xml",
        owner: "Ada",
        modified: Date.UTC(2026, 8, 3),
        url: swatch("#0f62fe"),
      },
      {
        path: "/Photos/forest.svg",
        size: 38_877,
        type: "image/svg+xml",
        owner: "Ada",
        modified: Date.UTC(2026, 8, 5),
        url: swatch("#198038"),
      },
      { path: "/Archive", kind: "folder" },
      {
        path: "/README.md",
        size: 312,
        type: "text/markdown",
        owner: "You",
        modified: Date.UTC(2026, 6, 1),
        content: "# Files",
      },
    ],
  });
</script>

<FileManager {adapter} height="18rem" />
