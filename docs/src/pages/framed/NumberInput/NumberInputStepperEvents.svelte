<script>
  import { NumberInput } from "carbon-components-svelte";

  let value = 0;
  let clickStepperEvents = [];
  let blurEvents = [];
  let blurStepperEvents = [];
</script>

<NumberInput
  bind:value
  labelText="Clusters"
  on:click:stepper={(e) => {
    clickStepperEvents = [...clickStepperEvents, "value: " + e.detail.value + ", direction: " + e.detail.direction];
  }}
  on:blur={(e) => {
    blurEvents = [...blurEvents, "value: " + e.detail.value];
  }}
  on:blur:stepper={(e) => {
    blurStepperEvents = [...blurStepperEvents, "value: " + e.detail.value + ", direction: " + e.detail.direction];
  }}
/>

<div style="margin-top: var(--cds-layout-01)">
  <strong>click:stepper events:</strong>
  <pre>{clickStepperEvents.join("\n") || "(none)"}</pre>
</div>

<div style="margin-top: var(--cds-layout-01)">
  <strong>blur events:</strong>
  <pre>{blurEvents.join("\n") || "(none)"}</pre>
</div>

<div style="margin-top: var(--cds-layout-01)">
  <strong>blur:stepper events:</strong>
  <pre>{blurStepperEvents.join("\n") || "(none)"}</pre>
</div>
