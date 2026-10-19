<script>
  import { FileDownloadItem } from "carbon-components-svelte";
  import Document from "carbon-icons-svelte/lib/Document.svelte";

  // For demo purposes only: stands in for `fetch(url, { headers })` and
  // `response.blob()`.
  function fetchFile() {
    return Promise.resolve(
      new Blob(["Quarterly notes\n"], { type: "text/plain" }),
    );
  }

  async function download() {
    const url = URL.createObjectURL(await fetchFile());
    const link = document.createElement("a");
    link.href = url;
    link.download = "Q3-notes.txt";
    link.click();
    URL.revokeObjectURL(url);
  }
</script>

<FileDownloadItem
  icon={Document}
  name="Q3-notes.txt"
  fileSize={16}
  on:click={download}
/>
