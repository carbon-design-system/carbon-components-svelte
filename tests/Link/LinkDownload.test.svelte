<script lang="ts">
  import LinkDownload from "carbon-components-svelte/Link/LinkDownload.svelte";
  import type { ComponentProps } from "svelte";

  // `null` leaves `data` unset (an `undefined` prop would fall back to the default).
  export let data: ComponentProps<LinkDownload>["data"] | null =
    "id,name\n1,Alpha";
  export let filename = "load-balancers.csv";
  export let type = "text/csv;charset=utf-8";
  export let disabled = false;
  export let download: ComponentProps<LinkDownload>["download"] = undefined;
  export let onDownload = () => {};
  export let onDownloadError = (_detail: { error: unknown }) => {};
  export let onFocus: () => void = () => {};
  export let onBlur: () => void = () => {};
  export let onKeydown: () => void = () => {};
  export let onKeyup: () => void = () => {};
</script>

<LinkDownload
  data={data ?? undefined}
  {filename}
  {type}
  {disabled}
  {download}
  on:download={onDownload}
  on:download:error={(event) => onDownloadError(event.detail)}
  on:focus={() => onFocus()}
  on:blur={() => onBlur()}
  on:keydown={() => onKeydown()}
  on:keyup={() => onKeyup()}
>
  Download CSV
</LinkDownload>
