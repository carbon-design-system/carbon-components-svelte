<script lang="ts">
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";
</script>

<DatePicker datePickerType="simple">
  <DatePickerInput labelText="Default label">
    <span slot="labelChildren">Custom label content</span>
  </DatePickerInput>
</DatePicker>
