<script>
  /** Specify the value of the radio button */
  export let value = "";

  /** Set to `true` to check the radio button */
  export let checked = false;

  /** Set to `true` to disable the radio button */
  export let disabled = false;

  /** Set to `true` to mark the field as required */
  export let required = false;

  /**
   * Specify the label position
   * @type {"right" | "left"}
   */
  export let labelPosition = "right";

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /** Set an id for the input element */
  export let id = "ccs-" + Math.random().toString(36);

  /** Specify a name attribute for the radio button input */
  export let name = "";

  /** Obtain a reference to the input HTML element */
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
  class:bx--radio-button-wrapper="{true}"
  class:bx--radio-button-wrapper--label-left="{labelPosition === 'left'}"
  {...$$restProps}
>
  <input
    bind:this="{ref}"
    type="radio"
    id="{id}"
    name="{name}"
    checked="{checked}"
    disabled="{disabled}"
    required="{required}"
    value="{value}"
    class:bx--radio-button="{true}"
    on:change
    on:change="{() => {
      if (ctx) {
        ctx.update(value);
      }
    }}"
  />
  <label class:bx--radio-button__label="{true}" for="{id}">
    <span class:bx--radio-button__appearance="{true}"></span>
    {#if labelText || $$slots.labelText}
      <span class:bx--visually-hidden="{hideLabel}">
        <slot name="labelText">
          {labelText}
        </slot>
      </span>
    {/if}
  </label>
</div>
