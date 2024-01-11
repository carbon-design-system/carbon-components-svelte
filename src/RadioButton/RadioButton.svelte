<script>
  /**
   * Specify the value of the radio button
   * @type {string | number}
   */
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

  /**
   * Specify a name attribute for the radio button input
   * @type {string}
   */
  export let name = undefined;

  /** Obtain a reference to the input HTML element */
  export let ref = null;

  import { getContext } from "svelte";
  import { readable } from "svelte/store";

  const { add, update, selectedValue, groupName, groupRequired } = getContext(
    "RadioButtonGroup"
  ) ?? {
    groupName: readable(undefined),
    groupRequired: readable(undefined),
    selectedValue: readable(checked ? value : undefined),
  };

  if (add) {
    add({ id, checked, disabled, value });
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
    name="{$groupName ?? name}"
    checked="{checked}"
    disabled="{disabled}"
    required="{$groupRequired ?? required}"
    value="{value}"
    class:bx--radio-button="{true}"
    on:change
    on:change="{() => {
      if (update) {
        update(value);
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
