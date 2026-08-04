<script lang="ts">
  import LinkDownload from "carbon-components-svelte/Link/LinkDownload.svelte";
  import type { ComponentProps } from "svelte";

  export let data: ComponentProps<LinkDownload>["data"] = "id,name\n1,Alpha";
  export let filename = "load-balancers.csv";
  export let type = "text/csv;charset=utf-8";
  export let disabled = false;
  export let download: ComponentProps<LinkDownload>["download"] = undefined;
  export let onDownload = () => {};
  export let onDownloadError = (_detail: { error: unknown }) => {};
</script>

<LinkDownload
  {data}
  {filename}
  {type}
  {disabled}
  {download}
  on:download={onDownload}
  on:download:error={(event) => onDownloadError(event.detail)}
>
  Download CSV
</LinkDownload>
