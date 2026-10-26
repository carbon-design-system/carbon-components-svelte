<svelte:options accessors />

<script lang="ts">
  import Stepper from "carbon-components-svelte/Stepper/Stepper.svelte";
  import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";
  import type { ComponentProps } from "svelte";

  export let steps = ["Cart", "Delivery", "Payment"];
  export let currentIndex = 0;
  export let submitted = false;
  export let validate: ComponentProps<Stepper>["validate"] = () => true;
  export let submit: ComponentProps<Stepper>["submit"] = undefined;
  export let nextDisabled = false;
  export let submitting = false;
  export let addressInvalid = false;
  export let wrapperInvalid = false;
  export let changes: number[] = [];
  export let submits = 0;
  export let errors: unknown[] = [];
  export let validateErrors: { error: unknown; index: number }[] = [];
</script>

<Stepper
  {steps}
  bind:currentIndex
  bind:submitted
  {validate}
  {submit}
  {nextDisabled}
  {submitting}
  submitText="Place order"
  submittingDescription="Placing order"
  validatingDescription="Checking address"
  on:change={(event) => (changes = [...changes, event.detail])}
  on:submit={() => (submits += 1)}
  on:submit:error={(event) => (errors = [...errors, event.detail.error])}
  on:validate:error={(event) =>
    (validateErrors = [...validateErrors, event.detail])}
  let:currentIndex={current}
  let:submitted={done}
>
  {#if done}
    <p>Order placed</p>
  {:else}
    <p>Step {current + 1} content</p>
    {#if current === 1}
      <TextInput labelText="Address" invalid={addressInvalid} />
      <div aria-invalid={wrapperInvalid ? "true" : undefined}>
        <input aria-label="Wrapped" />
      </div>
    {/if}
  {/if}
</Stepper>
