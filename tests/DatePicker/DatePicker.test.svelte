<script lang="ts">
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";
  import type { ComponentProps } from "svelte";

  export let datePickerType: ComponentProps<DatePicker>["datePickerType"] =
    "simple";
  export let value = "";
  export let valueFrom = "";
  export let valueTo = "";
  export let dateFormat = "m/d/Y";
  export let maxDate: ComponentProps<DatePicker>["maxDate"] = null;
  export let minDate: ComponentProps<DatePicker>["minDate"] = null;
  export let locale: ComponentProps<DatePicker>["locale"] = "en";
  export let short = false;
  export let light = false;
  export let fluid = false;
  export let flatpickrProps: ComponentProps<DatePicker>["flatpickrProps"] = {
    static: true,
  };
  export let disabled = false;
  export let readonly = false;
  export let invalid = false;
  export let invalidText = "";
  export let warn = false;
  export let warnText = "";
  export let helperText = "";
  export let hideLabel = false;
  export let portalMenu = false;
  export let pattern: ComponentProps<DatePickerInput>["pattern"] = undefined;
  export let onchange: ((event: CustomEvent) => void) | undefined = undefined;
  export let onfocus: ((event: FocusEvent) => void) | undefined = undefined;
</script>

<DatePicker
  {datePickerType}
  {value}
  {valueFrom}
  {valueTo}
  {dateFormat}
  {maxDate}
  {minDate}
  {locale}
  {short}
  {light}
  {fluid}
  {flatpickrProps}
  {portalMenu}
  on:change={(e) => onchange?.(e)}
>
  <DatePickerInput
    labelText="Date"
    placeholder="mm/dd/yyyy"
    {disabled}
    {readonly}
    {invalid}
    {invalidText}
    {warn}
    {warnText}
    {helperText}
    {hideLabel}
    {pattern}
    on:focus={(e) => onfocus?.(e)}
  />
</DatePicker>
