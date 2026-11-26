<script>
  import {
    PasswordInput,
    PasswordRequirements,
    passwordRules,
    Stack,
  } from "carbon-components-svelte";

  const TRIPLE = /(.)\1\1/u;

  // A rule is an object: an id, the text to show, and a test.
  const noTriples = {
    id: "triples",
    text: "No character three times in a row",
    test: (password) => !TRIPLE.test(password),
  };

  const requirements = [passwordRules.minLength(12), noTriples];

  let value = "";
</script>

<Stack gap={3}>
  <PasswordInput
    labelText="Password"
    aria-describedby="custom-requirements"
    bind:value
  />
  <PasswordRequirements id="custom-requirements" {value} {requirements} />
</Stack>
