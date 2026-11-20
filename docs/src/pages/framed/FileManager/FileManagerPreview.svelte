<script>
  import {
    createMemoryFileSystem,
    FileManager,
  } from "carbon-components-svelte";

  const swatch = (color) =>
    `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><rect width="320" height="200" fill="${color}"/></svg>`,
    )}`;

  const adapter = createMemoryFileSystem({
    entries: [
      {
        path: "/Photos/harbor.svg",
        size: 40_210,
        type: "image/svg+xml",
        url: swatch("#0f62fe"),
      },
      {
        path: "/Photos/forest.svg",
        size: 38_877,
        type: "image/svg+xml",
        url: swatch("#198038"),
      },
      {
        path: "/Photos/notes.txt",
        size: 80,
        type: "text/plain",
        content: "A plain text file shows in a sandboxed frame.",
      },
      { path: "/Photos/archive.zip", size: 2_000_000, type: "application/zip" },
    ],
  });
</script>

<FileManager {adapter} path="/Photos" detailsOpen height="18rem">
  <svelte:fragment slot="preview" let:entry let:url>
    <p>Your own viewer for {entry.name} goes here.</p>
  </svelte:fragment>
</FileManager>
