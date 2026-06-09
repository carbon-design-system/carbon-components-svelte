<script lang="ts">
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";
</script>

<DatePicker datePickerType="simple">
  <DatePickerInput labelText="Default label">
    <span slot="labelChildren">Custom label content</span>
  </DatePickerInput>
</DatePicker>
