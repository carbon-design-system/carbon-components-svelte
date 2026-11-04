<script>
  /**
   * A `SchemaForm` widget. Gets the field state as props and reports a
   * new value with a `change` event.
   */

  /** @type {any} */
  export let value = "";
  /** @type {import("../field-config.js").FieldNode} */
  export let field;
  /** @type {string | undefined} */
  export let id = undefined;
  /** @type {string | undefined} */
  export let name = undefined;
  /** @type {string} */
  export let label = "";
  /** @type {string} */
  export let helperText = "";
  /** @type {string} */
  export let placeholder = "";
  /** @type {boolean} */
  export let invalid = false;
  /** @type {string} */
  export let invalidText = "";
  /** @type {boolean} */
  export let warn = false;
  /** @type {string} */
  export let warnText = "";
  /** @type {boolean} */
  export let disabled = false;
  /** @type {boolean} */
  export let readonly = false;
  /** @type {boolean} */
  export let required = false;

  import { createEventDispatcher } from "svelte";
  import DatePicker from "../../DatePicker/DatePicker.svelte";
  import DatePickerInput from "../../DatePicker/DatePickerInput.svelte";

  const dispatch = createEventDispatcher();
  /** @type {Record<string, any>} */
  const extra = field.config.props ?? {};
  const range = field.type === "daterange";
  let single = range ? "" : (value ?? "");
  let from = range ? (value?.[0] ?? "") : "";
  let to = range ? (value?.[1] ?? "") : "";
  $: pull(value);
  $: push(single, from, to);

  /** @param {any} next */
  function pull(next) {
    if (range) {
      const [a, b] = Array.isArray(next) ? next : ["", ""];
      if (a !== from) from = a;
      if (b !== to) to = b;
    } else if ((next ?? "") !== single) {
      single = next ?? "";
    }
  }

  /**
   * @param {string} one
   * @param {string} a
   * @param {string} b
   */
  function push(one, a, b) {
    if (range) {
      if (a !== (value?.[0] ?? "") || b !== (value?.[1] ?? "")) {
        dispatch("change", [a, b]);
      }
    } else if (one !== (value ?? "")) {
      dispatch("change", one);
    }
  }
</script>

{#if range}
  <DatePicker
    datePickerType="range"
    dateFormat={field.config.dateFormat ?? "Y-m-d"}
    bind:valueFrom={from}
    bind:valueTo={to}
    minDate={extra.minDate}
    maxDate={extra.maxDate}
  >
    <DatePickerInput
      {id}
      name={name ? `${name}[0]` : undefined}
      labelText={label}
      {placeholder}
      {helperText}
      {invalid}
      {invalidText}
      {warn}
      {warnText}
      {disabled}
      {readonly}
      {required}
    />
    <DatePickerInput
      id="{id}-to"
      name={name ? `${name}[1]` : undefined}
      labelText={extra.endLabel ?? `${label} end`}
      {placeholder}
      {invalid}
      {disabled}
      {readonly}
      {required}
    />
  </DatePicker>
{:else}
  <DatePicker
    datePickerType="single"
    dateFormat={field.config.dateFormat ?? "Y-m-d"}
    bind:value={single}
    minDate={extra.minDate}
    maxDate={extra.maxDate}
  >
    <DatePickerInput
      {id}
      {name}
      labelText={label}
      {placeholder}
      {helperText}
      {invalid}
      {invalidText}
      {warn}
      {warnText}
      {disabled}
      {readonly}
      {required}
    />
  </DatePicker>
{/if}
