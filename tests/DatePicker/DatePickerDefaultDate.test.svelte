<script lang="ts">
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";

  let value = "";
</script>

<DatePicker
  datePickerType="single"
  bind:value
  flatpickrProps={{ defaultDate: "03/12/2024" }}
>
  <DatePickerInput labelText="Date" placeholder="mm/dd/yyyy" />
</DatePicker>

<p data-testid="value">{value}</p>
