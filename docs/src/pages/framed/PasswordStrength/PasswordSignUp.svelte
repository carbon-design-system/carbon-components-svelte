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

  let email = "";
  let password = "";
  let confirm = "";
  let valid = false;
  let unmet = [];
  let submitted = false;
  let created = false;
  let strength;

  // Strength is advice. The requirements are the policy that blocks submit.
  $: requirements = [
    passwordRules.minLength(12),
    passwordRules.notCommon(),
    passwordRules.notContainingUserInput(),
  ];
  $: userInputs = [email];
  $: invalidText = unmet.length
    ? `Password needs: ${unmet.map((r) => r.text.toLowerCase()).join("; ")}`
    : "";
  $: mismatch = submitted && confirm !== password;

  function submit() {
    submitted = true;
    created = valid && confirm === password;
  }
</script>

<form on:submit|preventDefault={submit}>
  <Stack gap={5}>
    <TextInput labelText="Work email" type="email" bind:value={email} />
    <PasswordInput
      labelText="Password"
      autocomplete="new-password"
      aria-describedby="signup-requirements signup-strength"
      invalid={submitted && !valid}
      {invalidText}
      bind:value={password}
      on:blur={() => strength.flush()}
    />
    <PasswordStrength
      bind:this={strength}
      id="signup-strength"
      value={password}
      {userInputs}
    />
    <PasswordRequirements
      id="signup-requirements"
      value={password}
      {requirements}
      {userInputs}
      invalid={submitted}
      bind:valid
      bind:unmet
    />
    <PasswordInput
      labelText="Confirm password"
      autocomplete="new-password"
      aria-describedby="signup-match"
      invalid={mismatch}
      invalidText="Passwords do not match."
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
      <p>Account created.</p>
    {/if}
  </Stack>
</form>
