<script>
  /**
   * Specify the value of the radio button
   * @type {string} [value=""]
   */
  export let value = "";

  /**
   * Set to `true` to check the radio button
   * @type {boolean} [checked=false]
   */
  export let checked = false;

  /**
   * Set to `true` to disable the radio button
   * @type {boolean} [disabled=false]
   */
  export let disabled = false;

  /**
   * Specify the label position
   * @type {"right" | "left"} [labelPosition="right"]
   */
  export let labelPosition = "right";

  /**
   * Specify the label text
   * @type {string} [labelText=""]
   */
  export let labelText = "";

  /**
   * Set to `true` to visually hide the label text
   * @type {boolean} [hideLabel=false]
   */
  export let hideLabel = false;

  /**
   * Set an id for the input element
   * @type {string} [id]
   */
  export let id = "ccs-" + Math.random().toString(36);

  /**
   * Specify a name attribute for the checkbox input
   * @type {string} [name=""]
   */
  export let name = "";

  /**
   * Obtain a reference to the input HTML element
   * @type {null | HTMLInputElement} [ref=null]
   */
  export let ref = null;

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
    bind:this={ref}
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
