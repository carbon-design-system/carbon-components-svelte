<script lang="ts">
  import CopyInput from "carbon-components-svelte/CopyInput/CopyInput.svelte";

  export let onMouseEnterCopyButton = (_event: MouseEvent) => {};
</script>

<CopyInput
  labelText="API token"
  value="secret-token-123"
  on:mouseenter:copy-button={(event) => onMouseEnterCopyButton(event.detail)}
/>
