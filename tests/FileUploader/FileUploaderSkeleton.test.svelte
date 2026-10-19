<script lang="ts">
  import FileUploaderSkeleton from "carbon-components-svelte/FileUploader/FileUploaderSkeleton.svelte";
  import Form from "carbon-components-svelte/Form/Form.svelte";
  import type { ComponentProps } from "svelte";

  export let formSize: ComponentProps<Form>["size"] = undefined;
  export let size: ComponentProps<FileUploaderSkeleton>["size"] = undefined;
  export let hideLabelTitle = false;
  export let hideLabelDescription = false;
</script>

<Form size={formSize}>
  <FileUploaderSkeleton {size} {hideLabelTitle} {hideLabelDescription} />
</Form>
