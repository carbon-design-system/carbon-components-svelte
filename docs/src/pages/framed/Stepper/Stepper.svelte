<script>
  import {
    Button,
    InlineNotification,
    Stack,
    Stepper,
    TextInput,
    Toggle,
  } from "carbon-components-svelte";

  let currentIndex = 0;
  let submitted = false;
  let error = "";
  let fail = false;
  let name = "";
  let email = "";
  let touched = false;

  $: nameInvalid = touched && !name.trim();
  $: emailInvalid = touched && !email.includes("@");

  function validate(index) {
    if (index !== 0) return true;
    touched = true;
    return Boolean(name.trim()) && email.includes("@");
  }

  // For demo purposes only: stands in for the request that creates the account.
  async function createAccount() {
    error = "";
    await new Promise((resolve) => setTimeout(resolve, 900));
    if (fail) throw new Error("That email already has an account.");
  }
</script>

<Stack gap={6}>
  <Toggle labelText="Make the request fail" bind:toggled={fail} />
  <Stepper
    steps={["Details", "Plan", "Review"]}
    bind:currentIndex
    bind:submitted
    {validate}
    submit={createAccount}
    submitText="Create account"
    submittingDescription="Creating account"
    on:submit:error={(event) => {
      // The rejection can be any value; show its message when it's an Error.
      const reason = event.detail.error;
      error = reason instanceof Error ? reason.message : String(reason);
    }}
    let:currentIndex={current}
    let:submitted={done}
  >
    {#if done}
      <Stack gap={5}>
        <p>Welcome, {name}. Your account is ready.</p>
        <div>
          <Button
            kind="tertiary"
            on:click={() => {
              currentIndex = 0;
              submitted = false;
            }}
          >
            Start again
          </Button>
        </div>
      </Stack>
    {:else if current === 0}
      <Stack gap={5}>
        <TextInput
          labelText="Name"
          bind:value={name}
          invalid={nameInvalid}
          invalidText="Enter your name"
        />
        <TextInput
          labelText="Email"
          bind:value={email}
          invalid={emailInvalid}
          invalidText="Enter an email address"
        />
      </Stack>
    {:else if current === 1}
      <p>Free plan: three projects and five collaborators.</p>
    {:else}
      <Stack gap={5}>
        <p>{name} ({email}), on the free plan.</p>
        {#if error}
          <InlineNotification
            lowContrast
            hideCloseButton
            kind="error"
            title={error}
          />
        {/if}
      </Stack>
    {/if}
  </Stepper>
</Stack>
