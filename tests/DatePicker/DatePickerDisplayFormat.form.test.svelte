<script lang="ts">
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";

  export let value = "2024-03-15";
</script>

<form data-testid="form">
  <DatePicker
    datePickerType="single"
    dateFormat="Y-m-d"
    displayFormat="F j, Y"
    bind:value
  >
    <DatePickerInput labelText="Date" name="meeting" />
  </DatePicker>
</form>
<p data-testid="value">{value}</p>
