<script lang="ts">
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";
</script>

<DatePicker>
  <DatePickerInput labelText="Date" helperText="mm/dd/yyyy" {...$$restProps} />
</DatePicker>
