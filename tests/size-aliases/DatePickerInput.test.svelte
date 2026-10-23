<script lang="ts">
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";
  import type { ComponentProps } from "svelte";

  export let size: ComponentProps<DatePickerInput>["size"] = undefined;
</script>

<DatePicker>
  <DatePickerInput labelText="Start date" {size} />
</DatePicker>
