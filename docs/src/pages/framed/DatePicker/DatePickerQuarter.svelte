<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";

  let value = "Q2 2026";
</script>

<DatePicker datePickerType="quarter" dateFormat="\QQ Y" bind:value on:change>
  <DatePickerInput labelText="Fiscal quarter" placeholder="Q1 2026" />
</DatePicker>
