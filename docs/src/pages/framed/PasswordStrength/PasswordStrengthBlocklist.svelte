<script>
  import {
    Button,
    decodeBlocklist,
    PasswordInput,
    PasswordStrength,
    Stack,
  } from "carbon-components-svelte";

  let value = "";
  let blocklist;
  let loading = false;

  // Load the 10,000-word list (about 23 kB gzipped) only when asked.
  async function load() {
    loading = true;
    const { commonPasswords10k } =
      await import("carbon-components-svelte/src/PasswordStrength/common-passwords-10k.js");
    blocklist = decodeBlocklist(commonPasswords10k);
    loading = false;
  }
</script>

<Stack gap={3}>
  <PasswordInput
    labelText="Password"
    helperText="Try hercules, a word past the top 1,000."
    aria-describedby="blocklist-strength"
    bind:value
  />
  <PasswordStrength id="blocklist-strength" {value} {blocklist} />
  <Button kind="tertiary" disabled={loading || !!blocklist} on:click={load}>
    {blocklist ? "10,000 passwords loaded" : "Load the 10,000 list"}
  </Button>
</Stack>
