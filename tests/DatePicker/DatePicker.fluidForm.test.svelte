<script lang="ts">
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";
  import FluidForm from "carbon-components-svelte/FluidForm/FluidForm.svelte";
</script>

<FluidForm>
  <DatePicker datePickerType="single">
    <DatePickerInput labelText="Date" placeholder="mm/dd/yyyy" />
  </DatePicker>
</FluidForm>
