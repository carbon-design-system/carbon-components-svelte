<script lang="ts">
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";

  let preset: HTMLButtonElement | null = null;
</script>

<button type="button" bind:this={preset}>Preset</button>
<button type="button">Elsewhere</button>

<!-- `preset` binds after the first render, so the option arrives late. -->
<DatePicker
  datePickerType="single"
  flatpickrProps={{ ignoredFocusElements: preset ? [preset] : [] }}
>
  <DatePickerInput labelText="Date" placeholder="mm/dd/yyyy" />
</DatePicker>
