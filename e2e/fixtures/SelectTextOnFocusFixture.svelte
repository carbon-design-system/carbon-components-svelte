<script>
  import {
    CopyInput,
    PasswordInput,
    TextInput,
  } from "carbon-components-svelte";
</script>

<div style="display: grid; gap: 1rem; max-width: 24rem; padding: 1rem">
  <CopyInput
    data-testid="copy-input"
    labelText="Copy input"
    selectTextOnFocus
    value="abcdef"
  />
  <TextInput
    data-testid="text-input"
    labelText="Text input"
    selectTextOnFocus
    value="abcdef"
  />
  <PasswordInput
    data-testid="password-input"
    labelText="Password input"
    selectTextOnFocus
    value="abcdef"
  />
</div>
