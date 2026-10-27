<script>
  import {
    Button,
    DatePicker,
    DatePickerInput,
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
    <DatePicker datePickerType="single">
      <DatePickerInput
        required
        labelText="Contract start date"
        placeholder="mm/dd/yyyy"
      />
    </DatePicker>
    <div>
      <Button type="submit">Submit</Button>
    </div>
    {#if submitted}
      <p>Submitted.</p>
    {/if}
  </Stack>
</Form>
