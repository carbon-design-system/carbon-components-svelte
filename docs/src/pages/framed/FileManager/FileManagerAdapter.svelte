<script>
  import {
    createMemoryFileSystem,
    FileManager,
    FileSystemError,
  } from "carbon-components-svelte";

  // A FileSystemAdapter is any object with these methods. This one wraps the
  // in-memory file system to show where a request to a server goes, and fails
  // one folder to show the error state.
  const store = createMemoryFileSystem({
    latency: 400,
    entries: [
      { path: "/Public/logo.svg", size: 2_048, type: "image/svg+xml" },
      { path: "/Public/terms.txt", size: 512, type: "text/plain" },
      { path: "/Private/keys.txt", size: 64, type: "text/plain" },
      { path: "/Team/roadmap.md", size: 4_096, type: "text/markdown" },
    ],
  });

  const adapter = {
    ...store,
    async list(path, options) {
      if (path === "/Private") {
        await new Promise((resolve) => setTimeout(resolve, 300));
        throw new FileSystemError(
          "failed",
          "You do not have access to this folder.",
        );
      }
      return store.list(path, options);
    },
  };
</script>

<FileManager {adapter} height="18rem" />
