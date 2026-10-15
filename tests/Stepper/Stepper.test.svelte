<svelte:options accessors />

<script lang="ts">
  import Stepper from "carbon-components-svelte/Stepper/Stepper.svelte";
  import type { ComponentProps } from "svelte";

  export let step = 0;
  export let submitted = false;
  export let validate: ComponentProps<Stepper>["validate"] = () => true;
  export let nextDisabled = false;
  export let submitting = false;
  export let changes: number[] = [];
  export let submits = 0;
</script>

<Stepper
  steps={["Cart", "Delivery", "Payment"]}
  bind:step
  bind:submitted
  {validate}
  {nextDisabled}
  {submitting}
  submitText="Place order"
  submittingDescription="Placing order"
  on:change={(event) => (changes = [...changes, event.detail])}
  on:submit={() => (submits += 1)}
  let:step={current}
  let:submitted={done}
>
  {#if done}
    <p>Order placed</p>
  {:else}
    <p>Step {current + 1} content</p>
  {/if}
</Stepper>
