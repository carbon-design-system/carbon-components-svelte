<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";
</script>

<DatePicker datePickerType="single" locale="de" on:change>
  <DatePickerInput labelText="Termin" placeholder="tt.mm.jjjj" />
</DatePicker>
