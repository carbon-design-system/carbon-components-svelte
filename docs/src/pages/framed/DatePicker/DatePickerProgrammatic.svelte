<script>
  import {
    Button,
    DatePicker,
    DatePickerInput,
    Stack,
  } from "carbon-components-svelte";

  let valueFrom = "01/01/2024";
  let valueTo = "01/31/2024";

  function advanceMonth(value) {
    var d = new Date(value);
    var month = d.getMonth() + 1;
    var year = d.getFullYear() + (month > 11 ? 1 : 0);
    month = month % 12;
    var lastDay = new Date(year, month + 1, 0).getDate();
    var day = Math.min(d.getDate(), lastDay);
    var mm = String(month + 1).padStart(2, "0");
    var dd = String(day).padStart(2, "0");
    return mm + "/" + dd + "/" + year;
  }

  function nextMonth() {
    valueFrom = advanceMonth(valueFrom);
    valueTo = advanceMonth(valueTo);
  }
</script>

<Stack gap={4}>
  <DatePicker datePickerType="range" bind:valueFrom bind:valueTo on:change>
    <DatePickerInput labelText="Start date" placeholder="mm/dd/yyyy" />
    <DatePickerInput labelText="End date" placeholder="mm/dd/yyyy" />
  </DatePicker>
  <Button on:click={nextMonth}>Next month</Button>
</Stack>
