<script>
  import {
    Button,
    Form,
    RadioButton,
    RadioButtonGroup,
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
    <RadioButtonGroup
      required
      legendText="Storage tier (disk)"
      name="plan-required"
    >
      <RadioButton labelText="Free (1 GB)" value="free" />
      <RadioButton labelText="Standard (10 GB)" value="standard" />
    </RadioButtonGroup>
    <div>
      <Button type="submit">Submit</Button>
    </div>
    {#if submitted}
      <p>Submitted.</p>
    {/if}
  </Stack>
</Form>
