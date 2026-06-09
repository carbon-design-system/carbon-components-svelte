<script lang="ts">
  import SelectItem from "carbon-components-svelte/Select/SelectItem.svelte";
  import TimePickerSelect from "carbon-components-svelte/TimePicker/TimePickerSelect.svelte";

  export let selectChange: () => void = () => {};
  export let selectInput: () => void = () => {};
  export let selectFocus: () => void = () => {};
  export let selectBlur: () => void = () => {};
</script>

<TimePickerSelect
  value="am"
  labelText="Period"
  on:change={selectChange}
  on:input={selectInput}
  on:focus={selectFocus}
  on:blur={selectBlur}
>
  <SelectItem value="am" text="AM" />
  <SelectItem value="pm" text="PM" />
</TimePickerSelect>
