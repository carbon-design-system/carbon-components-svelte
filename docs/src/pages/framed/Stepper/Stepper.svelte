<script>
  import { Button, Stepper, TextInput } from "carbon-components-svelte";

  let step = 0;
  let submitted = false;
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

  const createAccount = () =>
    new Promise((resolve) => setTimeout(resolve, 900));
</script>

<Stepper
  steps={["Details", "Plan", "Review"]}
  bind:step
  bind:submitted
  {validate}
  submitText="Create account"
  submittingDescription="Creating account"
  onSubmit={createAccount}
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
  {/if}
</Stepper>
