<script>
  import {
    RadioButton,
    RadioButtonGroup,
    SessionStorage,
    Stack,
  } from "carbon-components-svelte";

  let step = "details";
  let events = [];
</script>

<SessionStorage
  key="wizard-step-tabs"
  bind:value={step}
  sync="tabs"
  on:update={({ detail }) => {
    events = [...events, { event: "on:update", detail }];
  }}
/>

<Stack gap={5}>
  <RadioButtonGroup
    legendText="Wizard step"
    name="wizard-step"
    bind:selected={step}
  >
    <RadioButton labelText="Details" value="details" />
    <RadioButton labelText="Review" value="review" />
    <RadioButton labelText="Confirm" value="confirm" />
  </RadioButtonGroup>

  <pre>{JSON.stringify(events, null, 2)}</pre>
</Stack>
