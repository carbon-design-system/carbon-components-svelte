<script lang="ts">
  import FileDownloadItem from "carbon-components-svelte/FileUploader/FileDownloadItem.svelte";

  export let href: string | undefined = undefined;
  export let download: boolean | string = true;
  export let disabled = false;
  export let onclick: (() => void) | undefined = undefined;
</script>

<FileDownloadItem
  {href}
  {download}
  {disabled}
  name="report.pdf"
  fileSize={2_400_000}
  on:click={() => onclick?.()}
/>
