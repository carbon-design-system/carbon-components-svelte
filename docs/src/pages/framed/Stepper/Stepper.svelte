<script>
  import {
    Button,
    InlineNotification,
    Stepper,
    TextInput,
    Toggle,
  } from "carbon-components-svelte";

  let step = 0;
  let submitting = false;
  let submitted = false;
  let error = "";
  let fail = false;
  let name = "";
  let email = "";
  let touched = false;

  $: nameInvalid = touched && !name.trim();
  $: emailInvalid = touched && !email.includes("@");

  function validate(current) {
    if (current !== 0) return true;
    touched = true;
    return Boolean(name.trim()) && email.includes("@");
  }

  function createAccount() {
    submitting = true;
    error = "";
    setTimeout(() => {
      submitting = false;
      if (fail) error = "That email already has an account.";
      else submitted = true;
    }, 900);
  }
</script>

<Toggle labelText="Make the request fail" bind:toggled={fail} />

<br>

<Stepper
  steps={["Details", "Plan", "Review"]}
  bind:step
  bind:submitted
  {submitting}
  {validate}
  submitText="Create account"
  submittingDescription="Creating account"
  on:submit={createAccount}
  let:step={current}
  let:submitted={done}
>
  {#if done}
    <p>Welcome, {name}. Your account is ready.</p>
    <br>
    <Button
      kind="tertiary"
      on:click={() => {
        step = 0;
        submitted = false;
      }}
    >
      Start again
    </Button>
  {:else if current === 0}
    <TextInput
      labelText="Name"
      bind:value={name}
      invalid={nameInvalid}
      invalidText="Enter your name"
    />
    <br>
    <TextInput
      labelText="Email"
      bind:value={email}
      invalid={emailInvalid}
      invalidText="Enter an email address"
    />
  {:else if current === 1}
    <p>Free plan: three projects and five collaborators.</p>
  {:else}
    <p>{name} ({email}), on the free plan.</p>
    {#if error}
      <InlineNotification
        lowContrast
        hideCloseButton
        kind="error"
        title={error}
      />
    {/if}
  {/if}
</Stepper>
