<script>
  import { Button, FileUploader } from "carbon-components-svelte";

  let fileUploader;
  let files = [];
</script>

<FileUploader
  bind:this={fileUploader}
  multiple
  labelTitle="Upload files"
  buttonLabel="Add files"
  status="complete"
  bind:files
  on:change={(e) => {
    console.log("change", e.detail);
  }}
  on:clear={() => {
    console.log("clear");
  }}
/>

<br>

<Button
  kind="tertiary"
  disabled={!files.length}
  on:click={fileUploader.clearFiles}
>
  Clear (programmatic)
</Button>
<Button kind="tertiary" disabled={!files.length} on:click={() => (files = [])}>
  Clear (two-way binding)
</Button>
