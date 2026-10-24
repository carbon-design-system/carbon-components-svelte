<script lang="ts">
  import DateCalendar from "carbon-components-svelte/DatePicker/DateCalendar.svelte";
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";
  import LayoutDirection from "carbon-components-svelte/LayoutDirection/LayoutDirection.svelte";

  export let dir: "ltr" | "rtl" = "rtl";
  /** `DateCalendar` instead of an inline `DatePicker`. */
  export let standalone = false;
</script>

<LayoutDirection {dir}>
  {#if standalone}
    <DateCalendar value={new Date(2024, 2, 15)} today={new Date(2024, 2, 9)} />
  {:else}
    <DatePicker datePickerType="single" inline value="03/15/2024">
      <DatePickerInput labelText="Date" />
    </DatePicker>
  {/if}
</LayoutDirection>
