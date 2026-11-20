<script>
  import {
    PasswordInput,
    PasswordStrength,
    Stack,
  } from "carbon-components-svelte";

  let value = "";
  let strength;
</script>

<Stack gap={3}>
  <PasswordInput
    labelText="Password"
    aria-describedby="basic-strength"
    bind:value
    on:blur={() => strength.flush()}
  />
  <PasswordStrength bind:this={strength} id="basic-strength" {value} />
</Stack>
