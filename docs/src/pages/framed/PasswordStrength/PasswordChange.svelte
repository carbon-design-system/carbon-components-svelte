<script>
  import {
    Button,
    PasswordInput,
    PasswordRequirements,
    passwordRules,
    PasswordStrength,
    Stack,
  } from "carbon-components-svelte";

  // For demo purposes only: verify the current password on the server.
  const currentPassword = "correct-horse-battery";

  let current = "";
  let password = "";
  let confirm = "";
  let valid = false;
  let unmet = [];
  let submitted = false;
  let changed = false;
  let strength;

  $: requirements = [
    passwordRules.minLength(12),
    passwordRules.notCommon(),
    {
      id: "different",
      text: "Different from your current password",
      test: (value) => value !== current,
    },
  ];
  $: invalidText = unmet.length
    ? `Password needs: ${unmet.map((r) => r.text.toLowerCase()).join("; ")}`
    : "";
  $: wrongCurrent = submitted && current !== currentPassword;

  function submit() {
    submitted = true;
    changed = !wrongCurrent && valid && confirm === password;
  }
</script>

<form on:submit|preventDefault={submit}>
  <Stack gap={5}>
    <PasswordInput
      labelText="Current password"
      autocomplete="current-password"
      invalid={wrongCurrent}
      invalidText="The current password is not correct."
      helperText="The demo accepts correct-horse-battery."
      bind:value={current}
    />
    <PasswordInput
      labelText="New password"
      autocomplete="new-password"
      aria-describedby="change-requirements change-strength"
      invalid={submitted && !valid}
      {invalidText}
      bind:value={password}
      on:blur={() => strength.flush()}
    />
    <PasswordStrength
      bind:this={strength}
      id="change-strength"
      value={password}
      userInputs={[current]}
    />
    <PasswordRequirements
      id="change-requirements"
      value={password}
      {requirements}
      invalid={submitted}
      bind:valid
      bind:unmet
    />
    <PasswordInput
      labelText="Confirm new password"
      autocomplete="new-password"
      aria-describedby="change-match"
      bind:value={confirm}
    />
    <PasswordRequirements
      id="change-match"
      hideLabel
      labelText="Confirmation"
      value={confirm}
      requirements={[passwordRules.matches(password)]}
    />
    <Button type="submit">Change password</Button>
    {#if changed}
      <p>Password changed.</p>
    {/if}
  </Stack>
</form>
