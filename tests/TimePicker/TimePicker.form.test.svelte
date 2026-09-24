<script lang="ts">
  import SelectItem from "carbon-components-svelte/Select/SelectItem.svelte";
  import TimePicker from "carbon-components-svelte/TimePicker/TimePicker.svelte";
  import TimePickerSelect from "carbon-components-svelte/TimePicker/TimePickerSelect.svelte";
  import type { ComponentProps } from "svelte";

  export let value: ComponentProps<TimePicker>["value"] = "10:30";
  export let ampm = "pm";
  export let disabled: ComponentProps<TimePicker>["disabled"] = false;
  export let readonly: ComponentProps<TimePicker>["readonly"] = false;
  export let onInput: (event: Event) => void = () => {};
  export let onChange: (event: Event) => void = () => {};
</script>

<form data-testid="form">
  <TimePicker
    labelText="Time"
    name="time"
    bind:value
    {disabled}
    {readonly}
    on:input={onInput}
    on:change={onChange}
  >
    <TimePickerSelect name="am-pm" bind:value={ampm}>
      <SelectItem value="am" text="AM" />
      <SelectItem value="pm" text="PM" />
    </TimePickerSelect>
  </TimePicker>
</form>
<p data-testid="value">{value}</p>
<p data-testid="ampm">{ampm}</p>
