<script>
  import { FileUploader } from "carbon-components-svelte";
</script>

<FileUploader
  multiple
  orderFiles={(existing, added) => {
    return [...existing, ...added].sort(
      (a, b) => b.lastModified - a.lastModified,
    );
  }}
  labelTitle="Upload files"
  buttonLabel="Add files"
  labelDescription="Files are sorted by last modified (newest first)."
  status="edit"
/>
