<script lang="ts">
  import FileUploader from "carbon-components-svelte/FileUploader/FileUploader.svelte";
  import FileUploaderButton from "carbon-components-svelte/FileUploader/FileUploaderButton.svelte";
  import FileUploaderDropContainer from "carbon-components-svelte/FileUploader/FileUploaderDropContainer.svelte";

  export let onChange: (event: CustomEvent) => void = () => {};

  let buttonFiles: File[] = [];
  let dropFiles: File[] = [];
  let uploaderFiles: File[] = [];
</script>

<form data-testid="form">
  <div data-testid="button">
    <FileUploaderButton
      multiple
      name="button"
      labelText="Add files"
      bind:files={buttonFiles}
      on:change={onChange}
    />
  </div>
  <div data-testid="drop">
    <FileUploaderDropContainer
      multiple
      name="drop"
      labelText="Drop files"
      bind:files={dropFiles}
      on:change={onChange}
    />
  </div>
  <div data-testid="uploader">
    <FileUploader
      multiple
      name="uploader"
      buttonLabel="Add receipts"
      status="edit"
      bind:files={uploaderFiles}
    />
  </div>
</form>
<p data-testid="bound-button">{buttonFiles.length}</p>
<p data-testid="bound-drop">{dropFiles.length}</p>
<p data-testid="bound-uploader">{uploaderFiles.length}</p>
