<script lang="ts">
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";
</script>

<DatePicker datePickerType="single">
  <DatePickerInput
    labelText="Date"
    helperText="mm/dd/yyyy"
    aria-describedby="extra-help"
  />
</DatePicker>
