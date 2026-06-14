<script lang="ts">
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";

  export let onClose: (e: CustomEvent<{ trigger: string }>) => void = () => {};
  export let datePickerType: "single" | "range" = "single";
  export let value = "";
  export let valueFrom = "";
  export let valueTo = "";
</script>

<DatePicker {datePickerType} {value} {valueFrom} {valueTo} on:close={onClose}>
  {#if datePickerType === "range"}
    <DatePickerInput labelText="Start date" placeholder="mm/dd/yyyy" />
    <DatePickerInput labelText="End date" placeholder="mm/dd/yyyy" />
  {:else}
    <DatePickerInput labelText="Date" placeholder="mm/dd/yyyy" />
  {/if}
</DatePicker>
