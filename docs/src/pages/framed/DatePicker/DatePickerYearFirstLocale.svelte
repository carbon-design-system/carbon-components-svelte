<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";
  import flatpickr from "flatpickr";
  import { Japanese } from "flatpickr/dist/l10n/ja";

  flatpickr.l10ns.ja = Japanese;
</script>

<DatePicker datePickerType="single" locale="ja" on:change>
  <DatePickerInput labelText="日付" placeholder="yyyy/mm/dd" />
</DatePicker>
