<script>
  import {
    Button,
    PasswordInput,
    PasswordRequirements,
    passwordRules,
    PasswordStrength,
    Stack,
  } from "carbon-components-svelte";

  // A secret ends up in headers and env files: no spaces, and long.
  // Composition rules stay off; length and entropy do the work.
  const requirements = [
    passwordRules.minLength(32, "At least 32 characters"),
    passwordRules.noSpaces("No spaces, so it can be pasted into a header"),
    passwordRules.notCommon(),
  ];

  let secret = "";
  let valid = false;
  let saved = false;
  let strength;
</script>

<form on:submit|preventDefault={() => (saved = valid)}>
  <Stack gap={5}>
    <PasswordInput
      labelText="Webhook signing secret"
      autocomplete="off"
      aria-describedby="secret-requirements secret-strength"
      bind:value={secret}
      on:blur={() => strength.flush()}
    />
    <PasswordStrength
      bind:this={strength}
      id="secret-strength"
      size="sm"
      labelText="Secret strength"
      value={secret}
    />
    <PasswordRequirements
      id="secret-requirements"
      labelText="Secret policy"
      value={secret}
      {requirements}
      bind:valid
    />
    <Button type="submit" disabled={!valid}>Save secret</Button>
    {#if saved}
      <p>Secret saved.</p>
    {/if}
  </Stack>
</form>
