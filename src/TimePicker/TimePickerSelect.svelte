<script>
  /**
   * Specify the select value
   * @type {string} [value=""]
   */
  export let value = "";

  /**
   * Set to `true` to disable the select
   * @type {boolean} [disabled=false]
   */
  export let disabled = false;

  /**
   * Specify the ARIA label for the chevron icon
   * @type {string} [iconDescription="Expand/Collapse"]
   */
  export let iconDescription = "Open list of options";

  /**
   * Specify the label text
   * @type {string} [labelText=""]
   */
  export let labelText = "";

  /**
   * @deprecated The `hideLabel` prop for `TimePickerSelect` is no longer needed and has been deprecated. It will be removed in the next major release.
   * Set to `false` to show the label text
   * @type {boolean} [hideLabel=true]
   */
  export let hideLabel = true;

  /**
   * Set an id for the select element
   * @type {string} [id]
   */
  export let id = "ccs-" + Math.random().toString(36);

  /**
   * Specify a name attribute for the select element
   * @type {string} [name]
   */
  export let name = undefined;

  /**
   * Obtain a reference to the select HTML element
   * @type {null | HTMLSelectElement} [ref=null]
   */
  export let ref = null;

  import { setContext } from "svelte";
  import { writable } from "svelte/store";
  import ChevronDownGlyph from "carbon-icons-svelte/lib/ChevronDownGlyph";

  const selectedValue = writable(value);

  setContext("TimePickerSelect", { selectedValue });

  $: selectedValue.set(value);
  $: value = $selectedValue;
</script>

<div
  class:bx--select="{true}"
  class:bx--time-picker__select="{true}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  {#if labelText}
    <label
      for="{id}"
      class:bx--label="{true}"
      class:bx--visually-hidden="{hideLabel}"
    >
      <!-- TODO: set to always be `true` after `hideLabel` is deprecated -->
      {labelText}
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
  <ChevronDownGlyph
    aria-label="{iconDescription}"
    title="{iconDescription}"
    class="bx--select__arrow"
  />
</div>
