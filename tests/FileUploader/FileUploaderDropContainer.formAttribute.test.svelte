<script lang="ts">
  import FileUploaderDropContainer from "carbon-components-svelte/FileUploader/FileUploaderDropContainer.svelte";
</script>

<form id="outer-form" data-testid="form"></form>
<FileUploaderDropContainer form="outer-form" name="files" />
