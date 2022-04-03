<script>
  /**
   * Specify the select value
   * @type {number | string}
   */
  export let value = "";

  /** Set to `true` to disable the select */
  export let disabled = false;

  /** Specify the ARIA label for the chevron icon */
  export let iconDescription = "Open list of options";

  /** Specify the label text */
  export let labelText = "";

  /** Set an id for the select element */
  export let id = "ccs-" + Math.random().toString(36);

  /**
   * Specify a name attribute for the select element
   * @type {string}
   */
  export let name = undefined;

  /** Obtain a reference to the select HTML element */
  export let ref = null;

  import { setContext } from "svelte";
  import { writable } from "svelte/store";
  import ChevronDown from "../icons/ChevronDown.svelte";

  const selectedValue = writable(value);

  setContext("TimePickerSelect", { selectedValue });

  $: selectedValue.set(value);
  $: value = $selectedValue;
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div
  class:bx--select="{true}"
  class:bx--time-picker__select="{true}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  {#if labelText || $$slots.labelText}
    <label
      for="{id}"
      class:bx--label="{true}"
      class:bx--visually-hidden="{true}"
    >
      <slot name="labelText">
        {labelText}
      </slot>
    </label>
  {/if}
  <!-- svelte-ignore a11y-no-onchange -->
  <select
    bind:this="{ref}"
    id="{id}"
    name="{name}"
    disabled="{disabled}"
    value="{value}"
    class:bx--select-input="{true}"
    on:change="{({ target }) => {
      selectedValue.set(target.value);
    }}"
  >
    <slot />
  </select>
  <ChevronDown
    aria-label="{iconDescription}"
    title="{iconDescription}"
    class="bx--select__arrow"
  />
</div>
