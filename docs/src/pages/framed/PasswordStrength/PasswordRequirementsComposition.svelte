<script>
  import {
    PasswordInput,
    PasswordRequirements,
    passwordRules,
    Stack,
  } from "carbon-components-svelte";

  const requirements = [
    passwordRules.minLength(12),
    passwordRules.hasNumber(),
    passwordRules.hasSymbol(),
    passwordRules.noSpaces(),
    passwordRules.notCommon(),
  ];

  let value = "";
</script>

<Stack gap={3}>
  <PasswordInput
    labelText="Password"
    aria-describedby="composition-requirements"
    bind:value
  />
  <PasswordRequirements id="composition-requirements" {value} {requirements} />
</Stack>
