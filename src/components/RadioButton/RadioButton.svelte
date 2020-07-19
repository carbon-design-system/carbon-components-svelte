<script>
  export let value = "";
  export let checked = false;
  export let disabled = false;
  export let id = "ccs-" + Math.random().toString(36);
  export let labelPosition = "right"; // "left" | "right"
  export let labelText = "";
  export let hideLabel = false;
  export let name = "";

  import { getContext } from "svelte";
  import { writable } from "svelte/store";

  const ctx = getContext("RadioButtonGroup");
  const selectedValue = ctx
    ? ctx.selectedValue
    : writable(checked ? value : undefined);

  if (ctx) {
    ctx.add({ id, checked, disabled, value });
  }

  $: checked = $selectedValue === value;
</script>

<div
  class:bx--radio-button-wrapper={true}
  class:bx--radio-button-wrapper--label-left={labelPosition === 'left'}
  {...$$restProps}>
  <input
    type="radio"
    {id}
    {name}
    {checked}
    {disabled}
    {value}
    class:bx--radio-button={true}
    on:change
    on:change={() => {
      if (ctx) {
        ctx.update(value);
      }
    }} />
  <label class:bx--radio-button__label={true} for={id}>
    <span class:bx--radio-button__appearance={true} />
    <span class:bx--visually-hidden={hideLabel}>{labelText}</span>
  </label>
</div>
