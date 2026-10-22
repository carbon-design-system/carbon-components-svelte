<script>
  import { Button, FileUploaderItem } from "carbon-components-svelte";

  let invalid = false;
</script>

<Button size="small" on:click={() => (invalid = true)}>Reject file</Button>
<FileUploaderItem
  name="report.pdf"
  status="edit"
  {invalid}
  errorSubject="File size exceeds limit"
  errorBody="500 KB max file size. Select a new file and try again."
/>
