<script lang="ts">
  import FileUploaderButton from "carbon-components-svelte/FileUploader/FileUploaderButton.svelte";
  import Upload from "carbon-icons-svelte/lib/Upload.svelte";

  export let onParentKeydown: (event: KeyboardEvent) => void = () => {};
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div on:keydown={onParentKeydown}>
  <FileUploaderButton
    labelText=""
    icon={Upload}
    iconDescription="Upload files"
  />
  <input aria-label="Other control" />
</div>
