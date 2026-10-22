<script>
  import {
    Button,
    Checkbox,
    CheckboxGroup,
    Form,
    Stack,
  } from "carbon-components-svelte";

  let submitted = false;
</script>

<Form
  on:submit={(e) => {
    e.preventDefault();
    submitted = true;
  }}
>
  <Stack gap={5}>
    <Checkbox required labelText="I agree to the terms and conditions" />
    <CheckboxGroup required legendText="Notification channels">
      <Checkbox value="email" labelText="Email" />
      <Checkbox value="sms" labelText="SMS" />
    </CheckboxGroup>
    <div>
      <Button type="submit">Submit</Button>
    </div>
    {#if submitted}
      <p>Submitted.</p>
    {/if}
  </Stack>
</Form>
