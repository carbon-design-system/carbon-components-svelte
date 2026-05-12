<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";
  import { German } from "flatpickr/dist/l10n/de";
</script>

<DatePicker datePickerType="single" locale={German} on:change>
  <DatePickerInput labelText="Termin" placeholder="tt.mm.jjjj" />
</DatePicker>
