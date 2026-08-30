<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";
  import { Japanese } from "flatpickr/dist/l10n/ja";
</script>

<DatePicker datePickerType="single" locale={Japanese} on:change>
  <DatePickerInput labelText="日付" placeholder="yyyy/mm/dd" />
</DatePicker>
