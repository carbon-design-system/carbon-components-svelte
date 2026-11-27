<script>
  import { CopyInput } from "carbon-components-svelte";

  let revealed = false;
</script>

<CopyInput
  labelText="API token (revealed: {revealed ? 'true' : 'false'})"
  type="password"
  revealMode="toggle"
  value="sk-1234567890abcdef"
  bind:revealed
/>
