<script lang="ts">
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";
  import type { ComponentProps } from "svelte";

  export let datePickerType: ComponentProps<DatePicker>["datePickerType"] =
    "single";
  export let open = false;
  export let readonly = false;
  export let onopen: (event: CustomEvent) => void = () => {};
  export let onclose: (event: CustomEvent) => void = () => {};
</script>

<DatePicker {datePickerType} bind:open on:open={onopen} on:close={onclose}>
  <DatePickerInput labelText="Date" placeholder="mm/dd/yyyy" {readonly} />
</DatePicker>
<p data-testid="open">{open}</p>
