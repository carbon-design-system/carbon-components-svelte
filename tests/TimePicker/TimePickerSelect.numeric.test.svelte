<script lang="ts">
  import SelectItem from "carbon-components-svelte/Select/SelectItem.svelte";
  import TimePickerSelect from "carbon-components-svelte/TimePicker/TimePickerSelect.svelte";

  export let value: number | string = 0;
</script>

<TimePickerSelect bind:value labelText="UTC offset">
  <SelectItem value={0} text="UTC" />
  <SelectItem value={-7} text="PDT" />
</TimePickerSelect>
<span data-testid="bound">{JSON.stringify(value)}</span>
