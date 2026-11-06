<script>
  import {
    Button,
    PasswordInput,
    PasswordRequirements,
    passwordRules,
    PasswordStrength,
    Stack,
    TextInput,
  } from "carbon-components-svelte";

  let email = "alice@example.com";
  let password = "";
  let confirm = "";
  let valid = false;
  let unmet = [];
  let submitted = false;
  let strength;
  let created = false;

  $: requirements = [
    passwordRules.minLength(12),
    passwordRules.hasNumber(),
    passwordRules.hasSymbol(),
    passwordRules.noSpaces(),
    passwordRules.notCommon(),
    passwordRules.notContainingUserInput(),
  ];
  $: invalidText = unmet.length
    ? `Password needs: ${unmet.map((r) => r.text.toLowerCase()).join("; ")}`
    : "";

  function submit() {
    submitted = true;
    created = valid && confirm === password;
  }
</script>

<form data-testid="signup" on:submit|preventDefault={submit}>
  <Stack gap={5}>
    <TextInput labelText="Email" bind:value={email} />
    <PasswordInput
      labelText="Password"
      data-testid="password"
      bind:value={password}
      invalid={submitted && !valid}
      {invalidText}
      aria-describedby="signup-requirements signup-strength"
      on:blur={() => strength.flush()}
    />
    <PasswordStrength
      bind:this={strength}
      id="signup-strength"
      value={password}
      userInputs={[email]}
    />
    <PasswordRequirements
      id="signup-requirements"
      value={password}
      {requirements}
      userInputs={[email]}
      invalid={submitted}
      bind:valid
      bind:unmet
    />
    <PasswordInput
      labelText="Confirm password"
      data-testid="confirm"
      bind:value={confirm}
    />
    <PasswordRequirements
      id="signup-match"
      hideLabel
      labelText="Confirmation"
      value={confirm}
      requirements={[passwordRules.matches(password)]}
    />
    <Button type="submit">Create account</Button>
    {#if created}
      <p data-testid="created">Account created</p>
    {/if}
  </Stack>
</form>
