<script lang="ts">
  import PasswordRequirements from "carbon-components-svelte/PasswordStrength/PasswordRequirements.svelte";
  import PasswordStrength from "carbon-components-svelte/PasswordStrength/PasswordStrength.svelte";
  import { passwordRules } from "carbon-components-svelte/PasswordStrength/rules.js";
  import PasswordInput from "carbon-components-svelte/TextInput/PasswordInput.svelte";

  export let email = "alice@example.com";

  let password = "";
  let confirm = "";
  let valid = false;
  let unmet: { id: string; text: string }[] = [];
  let submitted = false;
  let strength: PasswordStrength;
  let sent = 0;

  $: requirements = [
    passwordRules.minLength(12),
    passwordRules.hasNumber(),
    passwordRules.notCommon(),
    passwordRules.notContainingUserInput(),
  ];
  $: invalidText = unmet.length
    ? `Password needs: ${unmet.map((r) => r.text.toLowerCase()).join("; ")}`
    : "";

  function submit() {
    submitted = true;
    if (valid) sent += 1;
  }
</script>

<form on:submit|preventDefault={submit}>
  <PasswordInput
    labelText="Password"
    bind:value={password}
    invalid={submitted && !valid}
    {invalidText}
    aria-describedby="pw-requirements pw-strength"
    on:blur={() => strength.flush()}
  />
  <PasswordStrength
    bind:this={strength}
    id="pw-strength"
    value={password}
    userInputs={[email]}
  />
  <PasswordRequirements
    id="pw-requirements"
    value={password}
    {requirements}
    userInputs={[email]}
    invalid={submitted}
    bind:valid
    bind:unmet
  />
  <PasswordInput labelText="Confirm password" bind:value={confirm} />
  <PasswordRequirements
    id="pw-match"
    hideLabel
    labelText="Confirmation"
    value={confirm}
    requirements={[passwordRules.matches(password)]}
  />
  <button type="submit">Create account</button>
  <p data-testid="sent">{sent}</p>
</form>
