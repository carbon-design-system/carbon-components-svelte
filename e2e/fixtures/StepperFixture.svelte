<script lang="ts">
  import { Stepper, TextInput } from "carbon-components-svelte";

  let name = "";
  let touched = false;
  let finish: () => void = () => {};

  $: invalid = touched && !name.trim();
</script>

<Stepper
  steps={["Details", "Review"]}
  validate={(index) => {
    if (index !== 0) return true;
    touched = true;
    return Boolean(name.trim());
  }}
  submit={() => new Promise<void>((resolve) => (finish = resolve))}
  submitText="Create account"
  submittingDescription="Creating account"
  let:currentIndex
  let:submitted
>
  {#if submitted}
    <p>Your account is ready.</p>
  {:else if currentIndex === 0}
    <TextInput
      labelText="Name"
      bind:value={name}
      {invalid}
      invalidText="Enter your name"
    />
  {:else}
    <p>Review your details.</p>
  {/if}
</Stepper>

<!-- Settles the pending submit, so the test controls the loading state. -->
<button type="button" on:click={() => finish()}>Finish request</button>
