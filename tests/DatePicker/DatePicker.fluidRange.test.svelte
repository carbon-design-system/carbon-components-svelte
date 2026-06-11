<script lang="ts">
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";

  export let fluid = true;
  export let invalidFrom = false;
  export let invalidText = "";
</script>

<DatePicker {fluid} datePickerType="range">
  <DatePickerInput
    labelText="Start date"
    placeholder="mm/dd/yyyy"
    invalid={invalidFrom}
    {invalidText}
  />
  <DatePickerInput labelText="End date" placeholder="mm/dd/yyyy" />
</DatePicker>
