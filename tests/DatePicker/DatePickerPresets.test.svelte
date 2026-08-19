<script lang="ts">
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";
  import type { ComponentProps } from "svelte";

  export let datePickerType: ComponentProps<DatePicker>["datePickerType"] =
    "range";
  export let valueFrom = "";
  export let valueTo = "";
  export let presets: ComponentProps<DatePicker>["presets"] = [
    {
      label: "Today",
      range: () => {
        const d = new Date(2024, 0, 15);
        return [d, d];
      },
    },
    {
      label: "Last 7 days",
      range: () => {
        const to = new Date(2024, 0, 15);
        const from = new Date(2024, 0, 9);
        return [from, to];
      },
    },
  ];
  export let onchange: ((event: CustomEvent) => void) | undefined = undefined;
</script>

<DatePicker
  {datePickerType}
  {valueFrom}
  {valueTo}
  {presets}
  on:change={(e) => onchange?.(e)}
>
  {#if datePickerType === "range"}
    <DatePickerInput labelText="Start date" placeholder="mm/dd/yyyy" />
    <DatePickerInput labelText="End date" placeholder="mm/dd/yyyy" />
  {:else}
    <DatePickerInput labelText="Date" placeholder="mm/dd/yyyy" />
  {/if}
</DatePicker>
