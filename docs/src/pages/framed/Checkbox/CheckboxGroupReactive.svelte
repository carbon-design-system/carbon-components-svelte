<script>
  import {
    Button,
    Checkbox,
    CheckboxGroup,
    Stack,
  } from "carbon-components-svelte";

  let selected = ["email"];
</script>

<Stack inline gap={4}>
  <CheckboxGroup
    legendText="Notification preferences"
    name="prefs"
    bind:selected
  >
    <Checkbox value="email" labelText="Email" />
    <Checkbox value="sms" labelText="SMS" />
    <Checkbox value="push" labelText="Push notifications" />
  </CheckboxGroup>

  <Button on:click={() => (selected = ["email", "push"])}>
    Select Email + Push
  </Button>

  <div>
    <strong>selected:</strong>
    {JSON.stringify(selected)}
  </div>
</Stack>
