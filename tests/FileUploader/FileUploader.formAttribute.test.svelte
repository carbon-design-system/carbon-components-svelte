<script lang="ts">
  import FileUploader from "carbon-components-svelte/FileUploader/FileUploader.svelte";
</script>

<form id="outer-form" data-testid="form"></form>
<FileUploader form="outer-form" name="files" />
