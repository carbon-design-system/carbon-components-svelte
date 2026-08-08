<script lang="ts">
  import SelectItem from "carbon-components-svelte/Select/SelectItem.svelte";
  import TimePicker from "carbon-components-svelte/TimePicker/TimePicker.svelte";
  import TimePickerSelect from "carbon-components-svelte/TimePicker/TimePickerSelect.svelte";
  import type { ComponentProps } from "svelte";

  export let size: ComponentProps<TimePicker>["size"] = undefined;
  export let value: ComponentProps<TimePicker>["value"] = "";
  export let format: ComponentProps<TimePicker>["format"] = "12";
  export let seconds: ComponentProps<TimePicker>["seconds"] = false;
  export let normalize: ComponentProps<TimePicker>["normalize"] = false;
  export let placeholder: ComponentProps<TimePicker>["placeholder"] = undefined;
  export let pattern: ComponentProps<TimePicker>["pattern"] = undefined;
  export let maxlength: ComponentProps<TimePicker>["maxlength"] = undefined;
  export let light: ComponentProps<TimePicker>["light"] = false;
  export let disabled: ComponentProps<TimePicker>["disabled"] = false;
  export let readonly: ComponentProps<TimePicker>["readonly"] = false;
  export let labelText: ComponentProps<TimePicker>["labelText"] = "Time";
  export let hideLabel: ComponentProps<TimePicker>["hideLabel"] = false;
  export let invalid: ComponentProps<TimePicker>["invalid"] = false;
  export let invalidText: ComponentProps<TimePicker>["invalidText"] = "";
  export let warn: ComponentProps<TimePicker>["warn"] = false;
  export let warnText: ComponentProps<TimePicker>["warnText"] = "";
  export let helperText: ComponentProps<TimePicker>["helperText"] = "";
  export let id: ComponentProps<TimePicker>["id"] = "ccs-test";
  export let name: ComponentProps<TimePicker>["name"] = "test-time";
  export let ref: ComponentProps<TimePicker>["ref"] = null;
  export let fluid: ComponentProps<TimePicker>["fluid"] = false;
</script>

<TimePicker
  {size}
  bind:value
  {format}
  {seconds}
  {normalize}
  {placeholder}
  {pattern}
  {maxlength}
  {light}
  {disabled}
  {readonly}
  {labelText}
  {hideLabel}
  {invalid}
  {invalidText}
  {warn}
  {warnText}
  {helperText}
  {id}
  {name}
  {ref}
  {fluid}
  on:change={(e) => {
    console.log("change", e.detail);
  }}
  on:input={() => {
    console.log("input");
  }}
  on:keydown={() => {
    console.log("keydown");
  }}
  on:keyup={() => {
    console.log("keyup");
  }}
  on:focus={() => {
    console.log("focus");
  }}
  on:blur={() => {
    console.log("blur");
  }}
>
  <TimePickerSelect value="pm">
    <SelectItem value="am" text="AM" />
    <SelectItem value="pm" text="PM" />
  </TimePickerSelect>
  <TimePickerSelect value="pdt">
    <SelectItem value="pdt" text="PDT" />
    <SelectItem value="gmt" text="GMT" />
  </TimePickerSelect>
</TimePicker>
