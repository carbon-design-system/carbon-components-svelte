<script>
  import {
    Button,
    DatePicker,
    DatePickerInput,
    Stack,
  } from "carbon-components-svelte";

  let value = "";
  let submittedValue = "";
</script>

<form on:submit|preventDefault={() => (submittedValue = value)}>
  <Stack inline gap={4}>
    <DatePicker bind:value datePickerType="single" dateFormat="Y-m-d">
      <DatePickerInput
        labelText="Date of birth"
        placeholder="yyyy-mm-dd"
        helperText={submittedValue ? `Submitted: ${submittedValue}` : ""}
      />
    </DatePicker>
    <Button type="submit" disabled={!value}>Submit</Button>
  </Stack>
</form>
