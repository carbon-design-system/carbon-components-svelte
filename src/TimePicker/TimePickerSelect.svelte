<script>
  export let value = "";
  export let name = undefined;
  export let disabled = false;
  export let iconDescription = "Open list of options";

  /**
   * Set an id for the select element
   * @type {string} [id]
   */
  export let id = "ccs-" + Math.random().toString(36);
  export let labelText = "";
  export let hideLabel = true;

  import { setContext } from "svelte";
  import { writable } from "svelte/store";
  import ChevronDownGlyph from "carbon-icons-svelte/lib/ChevronDownGlyph";

  const selectedValue = writable(value);

  setContext("TimePickerSelect", { selectedValue });

  $: selectedValue.set(value);
  $: value = $selectedValue;
</script>

<div
  class:bx--select={true}
  class:bx--time-picker__select={true}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave>
  {#if labelText}
    <label
      for={id}
      class:bx--label={true}
      class:bx--visually-hidden={hideLabel}>
      {labelText}
    </label>
  {/if}
  <!-- svelte-ignore a11y-no-onchange -->
  <select
    class:bx--select-input={true}
    on:change={({ target }) => {
      selectedValue.set(target.value);
    }}
    {id}
    {name}
    {disabled}
    {value}>
    <slot />
  </select>
  <ChevronDownGlyph
    aria-label={iconDescription}
    title={iconDescription}
    class="bx--select__arrow" />
</div>
