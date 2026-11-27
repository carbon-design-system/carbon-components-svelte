<script lang="ts">
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";
  import type { ComponentProps } from "svelte";

  export let datePickerType: ComponentProps<DatePicker>["datePickerType"] =
    "single";
  export let invalid: ComponentProps<DatePickerInput>["invalid"] = false;
  export let invalidText: ComponentProps<DatePickerInput>["invalidText"] = "";
</script>

<form data-testid="form">
  <DatePicker {datePickerType} dateFormat="m/d/Y">
    <DatePickerInput required labelText="Date" {invalid} {invalidText} />
  </DatePicker>
</form>
