<script>
  import { FileUploader } from "carbon-components-svelte";

  let files = [];
</script>

<FileUploader
  data-testid="file-uploader"
  labelTitle="Upload files"
  buttonLabel="Add file"
  status="edit"
  iconDescription="Remove file"
  bind:files
/>
