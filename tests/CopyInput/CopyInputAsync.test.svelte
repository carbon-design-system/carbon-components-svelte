<script lang="ts">
  import CopyInput from "carbon-components-svelte/CopyInput/CopyInput.svelte";

  export let copy: (text: string) => void | Promise<void> = async () => {};
  export let onCopy = () => {};
  export let onCopyError = (_detail: { error: unknown }) => {};
</script>

<CopyInput
  labelText="API token"
  value="secret-token-123"
  iconDescription="Async copy"
  {copy}
  on:copy={onCopy}
  on:copy:error={(event) => onCopyError(event.detail)}
/>
