<script>
  import {
    PasswordInput,
    PasswordRequirements,
    Stack,
  } from "carbon-components-svelte";

  let value = "";
</script>

<Stack gap={3}>
  <PasswordInput
    labelText="Password"
    aria-describedby="basic-requirements"
    bind:value
  />
  <PasswordRequirements id="basic-requirements" {value} />
</Stack>
