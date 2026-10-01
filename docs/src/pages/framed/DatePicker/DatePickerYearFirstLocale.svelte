<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";
</script>

<DatePicker datePickerType="single" locale="ja" on:change>
  <DatePickerInput labelText="日付" placeholder="yyyy/mm/dd" />
</DatePicker>
