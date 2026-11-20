<script lang="ts">
  import FileUploaderItem from "carbon-components-svelte/FileUploader/FileUploaderItem.svelte";
  import Form from "carbon-components-svelte/Form/Form.svelte";
  import type { ComponentProps } from "svelte";

  export let formSize: ComponentProps<Form>["size"] = undefined;
  export let size: ComponentProps<FileUploaderItem>["size"] = undefined;
  export let inForm = true;
</script>

{#if inForm}
  <Form size={formSize}>
    <FileUploaderItem id="item" name="report.pdf" status="edit" {size} />
  </Form>
{:else}
  <FileUploaderItem id="item" name="report.pdf" status="edit" {size} />
{/if}
