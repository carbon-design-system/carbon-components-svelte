<script lang="ts">
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";

  export let fluid = true;
</script>

<DatePicker {fluid} datePickerType="single">
  <DatePickerInput labelText="Date" placeholder="mm/dd/yyyy">
    <svelte:fragment slot="labelChildren">Custom label content</svelte:fragment>
  </DatePickerInput>
</DatePicker>
