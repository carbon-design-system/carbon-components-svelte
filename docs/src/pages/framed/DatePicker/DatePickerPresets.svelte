<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";

  let valueFrom = "";
  let valueTo = "";

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function daysAgo(n) {
    const d = startOfDay(new Date());
    d.setDate(d.getDate() - n);
    return d;
  }

  const presets = [
    {
      label: "Today",
      range: () => {
        const d = startOfDay(new Date());
        return [d, d];
      },
    },
    {
      label: "Last 7 days",
      range: () => [daysAgo(6), startOfDay(new Date())],
    },
    {
      label: "Last 30 days",
      range: () => [daysAgo(29), startOfDay(new Date())],
    },
    {
      label: "This month",
      range: () => {
        const now = new Date();
        return [
          new Date(now.getFullYear(), now.getMonth(), 1),
          startOfDay(now),
        ];
      },
    },
  ];
</script>

<DatePicker
  datePickerType="range"
  bind:valueFrom
  bind:valueTo
  {presets}
  on:change
>
  <DatePickerInput labelText="Start date" placeholder="mm/dd/yyyy" />
  <DatePickerInput labelText="End date" placeholder="mm/dd/yyyy" />
</DatePicker>
