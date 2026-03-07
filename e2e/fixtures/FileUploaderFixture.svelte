<script>
  import { FileUploader } from "carbon-components-svelte";

  let files = [];
</script>

<div class="fixture-container">
  <FileUploader
    data-testid="file-uploader"
    labelTitle="Upload files"
    buttonLabel="Add file"
    status="edit"
    iconDescription="Remove file"
    bind:files
  />
</div>

<style>
  .fixture-container {
    padding: 2rem;
  }
</style>
