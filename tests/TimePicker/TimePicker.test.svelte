<script lang="ts">
  import {
    SelectItem,
    TimePicker,
    TimePickerSelect,
  } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let size: ComponentProps<TimePicker>["size"] = undefined;
  export let value: ComponentProps<TimePicker>["value"] = "";
  export let placeholder: ComponentProps<TimePicker>["placeholder"] = "hh:mm";
  export let pattern: ComponentProps<TimePicker>["pattern"] =
    "(1[012]|[1-9]):[0-5][0-9](\\s)?";
  export let maxlength: ComponentProps<TimePicker>["maxlength"] = 5;
  export let light: ComponentProps<TimePicker>["light"] = false;
  export let disabled: ComponentProps<TimePicker>["disabled"] = false;
  export let labelText: ComponentProps<TimePicker>["labelText"] = "Time";
  export let hideLabel: ComponentProps<TimePicker>["hideLabel"] = false;
  export let invalid: ComponentProps<TimePicker>["invalid"] = false;
  export let invalidText: ComponentProps<TimePicker>["invalidText"] = "";
  export let id: ComponentProps<TimePicker>["id"] = "ccs-test";
  export let name: ComponentProps<TimePicker>["name"] = "test-time";
  export let ref: ComponentProps<TimePicker>["ref"] = null;
</script>

<TimePicker
  {size}
  bind:value
  {placeholder}
  {pattern}
  {maxlength}
  {light}
  {disabled}
  {labelText}
  {hideLabel}
  {invalid}
  {invalidText}
  {id}
  {name}
  {ref}
  on:change={() => {
    console.log("change");
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
