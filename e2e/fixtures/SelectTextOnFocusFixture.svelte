<script>
  import { CopyInput } from "carbon-components-svelte";
</script>

<div style="display: grid; gap: 1rem; max-width: 24rem; padding: 1rem">
  <CopyInput
    data-testid="copy-input"
    labelText="Copy input"
    selectTextOnFocus
    value="abcdef"
  />
</div>
