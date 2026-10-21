<script lang="ts">
  import CopyButton from "carbon-components-svelte/CopyButton/CopyButton.svelte";

  export let copy: (text: string) => void | Promise<void> = async () => {};
  export let onCopy = () => {};
  export let onMouseEnter = () => {};
  export let onCopyError = (_detail: { error: unknown }) => {};
</script>

<CopyButton
  iconDescription="Async copy"
  {copy}
  on:copy={onCopy}
  on:mouseenter={onMouseEnter}
  on:copy:error={(event) => onCopyError(event.detail)}
/>
